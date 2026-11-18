import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RECORD_CORE,
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type RecordListItem,
} from '@dabingli/domain';
import type {
  CorruptLegacyEntry,
  RecordRepository,
  RecoveryCopySummary,
  StorageQuotaInfo,
} from '@dabingli/storage';
import type { ConfirmFn, UpdateField } from '../editor-types';
import { markFieldManualImmutable, setPathImmutable } from '../form-utils';
import { nativeExportFile } from '../native-host';

export interface ToastState {
  message: string;
  tone: 'info' | 'success' | 'error';
  key: number;
}

export interface InitialSessionState {
  record: DabingliRecord;
  list: RecordListItem[];
  settings: AppSettings;
  recovery: RecoveryCopySummary | null;
  corruptEntries: CorruptLegacyEntry[];
  quotaInfo: StorageQuotaInfo | null;
  stepIndex: number;
  alert: string;
}

const DEPT_KEYS = SCHEMA.DEPARTMENTS.map((department) => department.key);

function mergeRevisionMeta(
  current: DabingliRecord,
  revision: number | undefined,
  updatedAt: string | undefined,
): DabingliRecord {
  return {
    ...current,
    ...(updatedAt ? { updatedAt } : {}),
    meta: {
      ...current.meta,
      ...(revision !== undefined ? { revision } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    },
  };
}

export function useRecordSession({
  repo,
  initial,
  onResetValidation,
  onAfterRecordSwitch,
  confirmAction,
}: {
  repo: RecordRepository;
  initial: InitialSessionState;
  onResetValidation: () => void;
  onAfterRecordSwitch: () => void;
  confirmAction: ConfirmFn;
}) {
  const [record, setRecord] = useState<DabingliRecord>(initial.record);
  const [list, setList] = useState<RecordListItem[]>(initial.list);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);
  const [recovery, setRecovery] = useState<RecoveryCopySummary | null>(initial.recovery);
  const [corruptEntries, setCorruptEntries] = useState<CorruptLegacyEntry[]>(initial.corruptEntries);
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo | null>(initial.quotaInfo);
  const [storageAlert, setStorageAlert] = useState(initial.alert);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [undoVersion, setUndoVersion] = useState(0);

  const toastTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const mutationSeqRef = useRef(0);
  const recordRef = useRef(record);
  const dirtyRef = useRef(dirty);
  const historyRef = useRef(RECORD_CORE.createHistory(20));
  const lastEditPathRef = useRef('');
  const lastEditAtRef = useRef(0);

  const notify = useCallback((message: string, tone: ToastState['tone'] = 'info') => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone, key: Date.now() });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const cancelSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const enqueueSave = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = saveQueueRef.current.then(task, task);
    saveQueueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  const refreshQuota = useCallback(async () => {
    const info = await repo.estimateStorageQuota?.().catch(() => null);
    if (info) {
      setQuotaInfo(info);
      if (info.lowSpace) {
        setStorageAlert((previous) =>
          previous.includes('存储空间')
            ? previous
            : [previous, '浏览器本机存储空间接近上限，建议及时导出 JSON 备份。'].filter(Boolean).join(' '),
        );
      }
    }
  }, [repo]);

  const pushUndoSnapshot = useCallback((label: string) => {
    if (historyRef.current.push(recordRef.current, label)) {
      setUndoVersion((v) => v + 1);
    }
  }, []);

  const maybePushBurstSnapshot = useCallback(
    (path: string, explicitLabel?: string) => {
      if (explicitLabel) {
        pushUndoSnapshot(explicitLabel);
        lastEditPathRef.current = path;
        lastEditAtRef.current = Date.now();
        return;
      }
      const now = Date.now();
      if (path !== lastEditPathRef.current || now - lastEditAtRef.current > 1500) {
        pushUndoSnapshot(`修改 ${path}`);
      }
      lastEditPathRef.current = path;
      lastEditAtRef.current = now;
    },
    [pushUndoSnapshot],
  );

  const persistRecord = useCallback(
    async (showToast = true): Promise<boolean> =>
      enqueueSave(async () => {
        const snapshot = recordRef.current;
        const targetSeq = mutationSeqRef.current;
        const revision = Number(snapshot.meta.revision) || 0;
        const saved = await repo.saveToLibrary(snapshot, revision);
        if (!saved.ok) {
          const reason = saved.reason ?? '保存失败，请先导出备份。';
          setStorageAlert(reason);
          notify(reason, 'error');
          return false;
        }
        const nextRevision = saved.revision ?? saved.record?.meta?.revision;
        const nextUpdatedAt = saved.record?.meta?.updatedAt ?? saved.record?.updatedAt;
        const merged = mergeRevisionMeta(recordRef.current, nextRevision, nextUpdatedAt);
        recordRef.current = merged;
        setRecord((previous) => mergeRevisionMeta(previous, nextRevision, nextUpdatedAt));

        if (mutationSeqRef.current === targetSeq) {
          dirtyRef.current = false;
          setDirty(false);
        }

        const loaded = await repo.loadList();
        if (loaded.ok) setList(loaded.list);
        void refreshQuota();
        if (showToast) notify('已保存到本机', 'success');
        return true;
      }),
    [enqueueSave, notify, refreshQuota, repo],
  );

  const flushPendingSave = useCallback(() => {
    if (!dirtyRef.current) return;
    cancelSaveTimer();
    void persistRecord(false);
  }, [cancelSaveTimer, persistRecord]);

  const saveAiMutation = useCallback(
    async (nextRecord: DabingliRecord, message: string): Promise<boolean> => {
      cancelSaveTimer();
      return enqueueSave(async () => {
        const currentRevision = Number(recordRef.current.meta.revision) || 0;
        const payload = mergeRevisionMeta(nextRecord, currentRevision, nextRecord.updatedAt);
        historyRef.current.push(recordRef.current, message);
        setUndoVersion((v) => v + 1);
        mutationSeqRef.current += 1;
        const targetSeq = mutationSeqRef.current;

        const saved = await repo.saveToLibrary(payload, currentRevision);
        if (!saved.ok) {
          const reason = saved.reason ?? 'AI 内容保存失败，请先导出备份。';
          setStorageAlert(reason);
          notify(reason, 'error');
          return false;
        }

        const persisted = saved.record ?? payload;
        recordRef.current = persisted;
        dirtyRef.current = false;
        setRecord(persisted);
        setDirty(false);

        const loaded = await repo.loadList();
        if (loaded.ok) setList(loaded.list);
        if (mutationSeqRef.current !== targetSeq) {
          dirtyRef.current = true;
          setDirty(true);
        }
        notify(message, 'success');
        return true;
      });
    },
    [cancelSaveTimer, enqueueSave, notify, repo],
  );

  const update: UpdateField = useCallback(
    (path, value, options) => {
      maybePushBurstSnapshot(path, options?.snapshotLabel);
      mutationSeqRef.current += 1;
      let next = setPathImmutable(recordRef.current, path, value);
      next = markFieldManualImmutable(next, path);
      recordRef.current = next;
      dirtyRef.current = true;
      setRecord(next);
      setDirty(true);
    },
    [maybePushBurstSnapshot],
  );

  const updateRawNotes = useCallback(
    (value: string) => {
      maybePushBurstSnapshot('rawNotes');
      mutationSeqRef.current += 1;
      const next: DabingliRecord = {
        ...recordRef.current,
        rawNotes: String(value).slice(0, 16000),
      };
      recordRef.current = next;
      dirtyRef.current = true;
      setRecord(next);
      setDirty(true);
    },
    [maybePushBurstSnapshot],
  );

  const replaceRecord = useCallback(
    (next: DabingliRecord, options?: { snapshotLabel?: string }) => {
      pushUndoSnapshot(options?.snapshotLabel ?? '更新病历');
      mutationSeqRef.current += 1;
      const cloned = RECORD_CORE.cloneValue(next);
      recordRef.current = cloned;
      dirtyRef.current = true;
      setRecord(cloned);
      setDirty(true);
    },
    [pushUndoSnapshot],
  );

  const undoLast = useCallback(async (): Promise<boolean> => {
    const active = recordRef.current;
    const item = historyRef.current.pop(active.id ?? '');
    setUndoVersion((v) => v + 1);
    if (!item) {
      notify('没有可撤销的操作');
      return false;
    }
    let restored: DabingliRecord;
    try {
      restored = RECORD_CORE.normalizeRecord(item.snapshot, SCHEMA.emptyRecord, DEPT_KEYS);
    } catch {
      notify('撤销失败：快照无法读取', 'error');
      return false;
    }
    const keepRev = Number(active.meta.revision) || 0;
    restored = mergeRevisionMeta(restored, keepRev, restored.updatedAt);
    cancelSaveTimer();
    mutationSeqRef.current += 1;
    recordRef.current = restored;
    dirtyRef.current = true;
    setRecord(restored);
    setDirty(true);
    const saved = await persistRecord(false);
    notify(
      saved ? `已撤销：${item.label}` : `已撤销：${item.label}（尚未写入本机）`,
      saved ? 'success' : 'info',
    );
    return true;
  }, [cancelSaveTimer, notify, persistRecord]);

  const ensureCurrentSavedBeforeSwitch = useCallback(async (): Promise<boolean> => {
    cancelSaveTimer();
    if (!dirtyRef.current) {
      await saveQueueRef.current;
      return true;
    }
    const saved = await persistRecord(false);
    if (!saved) {
      const msg = '当前病历保存失败，已阻止切换；请先导出 JSON 备份。';
      setStorageAlert(msg);
      notify(msg, 'error');
      return false;
    }
    return true;
  }, [cancelSaveTimer, notify, persistRecord]);

  const saveSettings = useCallback(
    async (next: AppSettings) => {
      const normalized = RECORD_CORE.normalizeSettings(next);
      setSettings(normalized);
      const result = await repo.saveSettings(normalized);
      if (!result.ok) notify(result.reason ?? '设置保存失败', 'error');
    },
    [notify, repo],
  );

  const createNewRecord = useCallback(async (): Promise<boolean> => {
    if (!(await ensureCurrentSavedBeforeSwitch())) return false;
    return enqueueSave(async () => {
      const next = repo.newRecord();
      const saved = await repo.saveToLibrary(next, 0);
      if (!saved.ok) {
        notify(saved.reason ?? '新建病历保存失败', 'error');
        return false;
      }
      const persisted = saved.record ?? next;
      mutationSeqRef.current += 1;
      recordRef.current = persisted;
      dirtyRef.current = false;
      setRecord(persisted);
      setDirty(false);
      onResetValidation();
      onAfterRecordSwitch();
      const loaded = await repo.loadList();
      if (loaded.ok) setList(loaded.list);
      notify('已新建空白病历', 'success');
      return true;
    });
  }, [enqueueSave, ensureCurrentSavedBeforeSwitch, notify, onAfterRecordSwitch, onResetValidation, repo]);

  const openRecord = useCallback(
    async (item: RecordListItem): Promise<boolean> => {
      if (!(await ensureCurrentSavedBeforeSwitch())) return false;
      return enqueueSave(async () => {
        const stored = await repo.loadCurrent(item.id);
        const next = RECORD_CORE.cloneValue(stored.ok && stored.record ? stored.record : item.data);
        mutationSeqRef.current += 1;
        recordRef.current = next;
        dirtyRef.current = false;
        setRecord(next);
        setDirty(false);
        onResetValidation();
        onAfterRecordSwitch();
        const saved = await repo.saveToLibrary(next, Number(next.meta.revision) || 0);
        if (saved.ok) {
          const persisted = saved.record ?? next;
          recordRef.current = persisted;
          setRecord(persisted);
        }
        notify(`已打开 ${item.basic?.name || RECORD_CORE.summarize(item).name}`);
        return true;
      });
    },
    [enqueueSave, ensureCurrentSavedBeforeSwitch, notify, onAfterRecordSwitch, onResetValidation, repo],
  );

  const copyRecord = useCallback(
    async (item: RecordListItem): Promise<boolean> => {
      if (!(await ensureCurrentSavedBeforeSwitch())) return false;
      return enqueueSave(async () => {
        const stored = await repo.loadCurrent(item.id);
        const source = stored.ok && stored.record ? stored.record : item.data;
        const copy = RECORD_CORE.copyRecordAsNew(source);
        const saved = await repo.saveToLibrary(copy, 0);
        if (!saved.ok) {
          notify(saved.reason ?? '复制病历保存失败', 'error');
          return false;
        }
        const persisted = saved.record ?? copy;
        mutationSeqRef.current += 1;
        recordRef.current = persisted;
        dirtyRef.current = false;
        setRecord(persisted);
        setDirty(false);
        onResetValidation();
        onAfterRecordSwitch();
        const loaded = await repo.loadList();
        if (loaded.ok) setList(loaded.list);
        notify('已复制为新病历；身份信息、生命体征数值、日期和号码已清空', 'success');
        return true;
      });
    },
    [enqueueSave, ensureCurrentSavedBeforeSwitch, notify, onAfterRecordSwitch, onResetValidation, repo],
  );

  const deleteRecord = useCallback(
    async (item: RecordListItem) => {
      if (recordRef.current.id === item.id) cancelSaveTimer();
      await enqueueSave(async () => {
        const nextList = RECORD_CORE.removeRecord(list, item.id);
        const result = await repo.deleteRecord(item.id);
        if (!result.ok) {
          notify(result.reason ?? '删除失败', 'error');
          return;
        }
        historyRef.current.clear(item.id);
        setList(nextList);
        if (recordRef.current.id === item.id) {
          const next = repo.newRecord();
          mutationSeqRef.current += 1;
          recordRef.current = next;
          dirtyRef.current = false;
          setRecord(next);
          setDirty(false);
          onResetValidation();
          onAfterRecordSwitch();
        }
        notify('病历已删除', 'success');
      });
    },
    [cancelSaveTimer, enqueueSave, list, notify, onAfterRecordSwitch, onResetValidation, repo],
  );

  const importJson = useCallback(
    async (raw: string, mode: 'merge' | 'replace'): Promise<boolean> => {
      cancelSaveTimer();
      return enqueueSave(async () => {
        try {
          const summary = await repo.importBackup(raw, mode);
          const loaded = await repo.loadList();
          const nextList = loaded.ok ? loaded.list : [];
          setList(nextList);

          const preferred = summary.firstRecordId
            ? await repo.loadCurrent(summary.firstRecordId)
            : await repo.loadCurrent();
          if (preferred.ok && preferred.record) {
            mutationSeqRef.current += 1;
            recordRef.current = preferred.record;
            dirtyRef.current = false;
            setRecord(preferred.record);
            setDirty(false);
            onResetValidation();
            onAfterRecordSwitch();
          }
          const recoveries = await repo.listRecoveryCopies().catch(() => []);
          setRecovery(recoveries[0] ?? null);
          const recoveryMsg = summary.recoveryId ? '；已生成替换前恢复副本' : '';
          notify(`导入完成：${summary.recordCount} 份病历${recoveryMsg}`, 'success');
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          notify(`导入失败：${message}`, 'error');
          return false;
        }
      });
    },
    [cancelSaveTimer, enqueueSave, notify, onAfterRecordSwitch, onResetValidation, repo],
  );

  const restoreRecovery = useCallback(async (): Promise<boolean> => {
    if (!recovery) return false;
    const confirmed = await confirmAction({
      title: '恢复替换前备份',
      message: `确定恢复替换导入前的 ${recovery.recordCount} 份病历吗？当前列表将被替换为备份内容。`,
      confirmLabel: '确认恢复',
      danger: true,
    });
    if (!confirmed) return false;

    cancelSaveTimer();
    return enqueueSave(async () => {
      try {
        await repo.restoreRecovery(recovery.id);
        const [loaded, current, loadedSettings] = await Promise.all([
          repo.loadList(),
          repo.loadCurrent(),
          repo.loadSettings(),
        ]);
        const nextList = loaded.ok ? loaded.list : [];
        const nextRecord = current.ok && current.record ? current.record : repo.newRecord();
        historyRef.current.clear(recordRef.current.id ?? '');
        historyRef.current.clear(nextRecord.id ?? '');
        mutationSeqRef.current += 1;
        recordRef.current = nextRecord;
        dirtyRef.current = false;
        setList(nextList);
        setRecord(nextRecord);
        setDirty(false);
        if (loadedSettings.ok) setSettings(loadedSettings.settings);
        onResetValidation();
        onAfterRecordSwitch();
        setUndoVersion((v) => v + 1);
        notify('已恢复替换前病历', 'success');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        notify(`恢复失败：${message}`, 'error');
        return false;
      }
    });
  }, [cancelSaveTimer, confirmAction, enqueueSave, notify, onAfterRecordSwitch, onResetValidation, recovery, repo]);

  const mergeLegacy = useCallback(async () => {
    if (!repo.mergeLegacyLocalStorage) {
      notify('当前存储模式不支持合并旧本地数据');
      return;
    }
    try {
      const result = await repo.mergeLegacyLocalStorage();
      const [loaded, entries] = await Promise.all([
        repo.loadList(),
        repo.exportCorruptLegacyEntries?.().catch(() => []) ?? Promise.resolve([]),
      ]);
      if (loaded.ok) setList(loaded.list);
      setCorruptEntries(entries);
      if (result.status === 'no-legacy-data') {
        notify('未检测到可合并的旧 localStorage 数据');
        return;
      }
      if (!result.ok) {
        notify(result.reason ?? '合并旧本地数据失败', 'error');
        return;
      }
      const parts = [
        result.added ? `新增 ${result.added} 份` : '',
        result.updated ? `更新 ${result.updated} 份` : '',
        result.skipped ? `跳过 ${result.skipped} 份` : '',
        result.corruptCount ? `隔离损坏 ${result.corruptCount} 条` : '',
      ].filter(Boolean);
      notify(`旧数据合并完成${parts.length ? `（${parts.join('，')}）` : ''}`, 'success');
    } catch (error) {
      notify(`合并失败：${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [notify, repo]);

  const exportCorruptLegacy = useCallback(async () => {
    try {
      const entries = (await repo.exportCorruptLegacyEntries?.()) ?? corruptEntries;
      setCorruptEntries(entries);
      if (!entries.length) {
        notify('当前没有隔离的损坏旧数据');
        return;
      }
      nativeExportFile(JSON.stringify(entries, null, 2), 'dabingli-corrupt-legacy.json', 'application/json');
      notify(`已导出 ${entries.length} 条隔离损坏旧数据`, 'success');
    } catch (error) {
      notify(`导出损坏数据失败：${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [corruptEntries, notify, repo]);

  const buildExportJson = useCallback(
    (includeNotes: boolean) =>
      JSON.stringify(
        RECORD_CORE.buildExport(list, undefined, {
          includeDraft: true,
          draft: recordRef.current,
          includeNotes,
        }),
        null,
        2,
      ),
    [list],
  );

  // Debounced autosave
  useEffect(() => {
    if (!dirty) return;
    cancelSaveTimer();
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void persistRecord(false);
    }, 900);
    return cancelSaveTimer;
  }, [cancelSaveTimer, dirty, persistRecord, record]);

  // Lifecycle pagehide/visibilitychange flush
  useEffect(() => {
    function handlePageHide() {
      flushPendingSave();
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') flushPendingSave();
    }
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushPendingSave]);

  // BroadcastChannel multi-tab sync notification
  useEffect(() => {
    if (!repo.onChange) return;
    return repo.onChange((event) => {
      void repo.loadList().then((loaded) => {
        if (loaded.ok) setList(loaded.list);
      });
      if (event.recordId && event.recordId === recordRef.current.id) {
        setStorageAlert('检测到其他标签页已修改当前病历，请注意避免覆盖最新内容。');
      }
    });
  }, [repo]);

  const undoPeek = useMemo(() => {
    void undoVersion;
    return historyRef.current.peek(record.id ?? '');
  }, [record.id, undoVersion]);

  return {
    record,
    recordRef,
    dirty,
    dirtyRef,
    list,
    settings,
    recovery,
    corruptEntries,
    quotaInfo,
    storageAlert,
    setStorageAlert,
    toast,
    notify,
    persistRecord,
    flushPendingSave,
    saveAiMutation,
    update,
    updateRawNotes,
    replaceRecord,
    pushUndoSnapshot,
    undoLast,
    canUndo: Boolean(undoPeek),
    undoLabel: undoPeek?.label ?? '',
    saveSettings,
    createNewRecord,
    openRecord,
    copyRecord,
    deleteRecord,
    importJson,
    restoreRecovery,
    mergeLegacy,
    exportCorruptLegacy,
    buildExportJson,
  };
}
