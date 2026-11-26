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
  const [saving, setSaving] = useState(false);
  const [changingRecord, setChangingRecord] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveConflict, setSaveConflict] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [undoVersion, setUndoVersion] = useState(0);

  const toastTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const changingRecordRef = useRef(false);
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

  const writeRecord = useCallback(
    async (showToast: boolean): Promise<boolean> => {
      if (!showToast && !dirtyRef.current) return true;
      setSaving(true);
      try {
        const snapshot = recordRef.current;
        const targetSeq = mutationSeqRef.current;
        const revision = Number(snapshot.meta.revision) || 0;
        const saved = await repo.saveToLibrary(snapshot, revision);
        if (!saved.ok) {
          const reason = saved.reason ?? '保存失败，请先导出备份。';
          setSaveError(reason);
          setSaveConflict(saved.conflict === true);
          if (showToast) notify(reason, 'error');
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
        setSaveError('');
        setSaveConflict(false);
        void refreshQuota();
        if (showToast) notify('已保存到本机', 'success');
        return true;
      } finally {
        setSaving(false);
      }
    },
    [notify, refreshQuota, repo],
  );

  const persistRecord = useCallback(
    (showToast = true) => enqueueSave(() => writeRecord(showToast)),
    [enqueueSave, writeRecord],
  );

  const flushPendingSave = useCallback(() => {
    if (!dirtyRef.current) return;
    cancelSaveTimer();
    void persistRecord(false);
  }, [cancelSaveTimer, persistRecord]);

  const saveAiMutation = useCallback(
    async (nextRecord: DabingliRecord, message: string): Promise<boolean> => {
      const expectedSequence = mutationSeqRef.current;
      return enqueueSave(async () => {
        const previous = recordRef.current;
        if (changingRecordRef.current || previous.id !== nextRecord.id || mutationSeqRef.current !== expectedSequence) {
          notify('病历已改变，请核对后重试 AI 操作', 'error');
          return false;
        }
        const currentRevision = Number(previous.meta.revision) || 0;
        const payload = mergeRevisionMeta(nextRecord, currentRevision, nextRecord.updatedAt);
        const saved = await repo.saveToLibrary(payload, currentRevision);
        if (!saved.ok) {
          const reason = saved.reason ?? 'AI 内容保存失败，请先导出备份。';
          setStorageAlert(reason);
          notify(reason, 'error');
          return false;
        }

        const persisted = saved.record ?? payload;
        if (mutationSeqRef.current !== expectedSequence) {
          const latest = mergeRevisionMeta(recordRef.current, saved.revision ?? persisted.meta.revision,
            persisted.meta.updatedAt ?? persisted.updatedAt);
          recordRef.current = latest;
          setRecord(latest);
          void persistRecord(false);
          notify('保存 AI 建议时病历有新编辑，已保留最新编辑，请核对后重试', 'info');
          return false;
        }

        cancelSaveTimer();
        historyRef.current.push(previous, message);
        setUndoVersion((v) => v + 1);
        mutationSeqRef.current += 1;
        recordRef.current = persisted;
        dirtyRef.current = false;
        setRecord(persisted);
        setDirty(false);

        const loaded = await repo.loadList();
        if (loaded.ok) setList(loaded.list);
        notify(message, 'success');
        return true;
      });
    },
    [cancelSaveTimer, enqueueSave, notify, persistRecord, repo],
  );

  const update: UpdateField = useCallback(
    (path, value, options) => {
      if (changingRecordRef.current) return;
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
      if (changingRecordRef.current) return;
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
      if (changingRecordRef.current) return;
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
    if (changingRecordRef.current) return false;
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

  const changeRecord = useCallback(
    async (task: () => Promise<boolean>, { saveFirst = true } = {}): Promise<boolean> => {
      if (changingRecordRef.current) return false;
      changingRecordRef.current = true;
      setChangingRecord(true);
      cancelSaveTimer();
      try {
        return await enqueueSave(async () => {
          if (saveFirst && !(await writeRecord(false))) {
            notify('当前编辑未能保存，请先导出当前病历', 'error');
            return false;
          }
          return task();
        });
      } finally {
        changingRecordRef.current = false;
        setChangingRecord(false);
      }
    },
    [cancelSaveTimer, enqueueSave, notify, writeRecord],
  );

  const activate = useCallback((next: DabingliRecord) => {
    mutationSeqRef.current += 1;
    recordRef.current = next;
    dirtyRef.current = false;
    lastEditPathRef.current = '';
    setRecord(next);
    setDirty(false);
    setSaveError('');
    setSaveConflict(false);
    onResetValidation();
    onAfterRecordSwitch();
  }, [onAfterRecordSwitch, onResetValidation]);

  const refreshAfterMerge = useCallback(async (firstRecordId?: string) => {
    const previous = recordRef.current;
    const current = await repo.loadCurrent(previous.id);
    if (current.record && current.record.meta.revision !== previous.meta.revision) {
      historyRef.current.clear(previous.id ?? '');
      setUndoVersion((value) => value + 1);
      activate(current.record);
    } else if (current.ok && !current.record && !previous.meta.revision && firstRecordId) {
      const first = await repo.activateRecord(firstRecordId);
      if (first.record) activate(first.record);
    }
  }, [activate, repo]);

  const saveSettings = useCallback(
    async (next: AppSettings) => {
      const normalized = RECORD_CORE.normalizeSettings(next);
      setSettings(normalized);
      const result = await repo.saveSettings(normalized);
      if (!result.ok) notify(result.reason ?? '设置保存失败', 'error');
    },
    [notify, repo],
  );

  const createNewRecord = useCallback(() => changeRecord(async () => {
    const next = repo.newRecord();
    const saved = await repo.saveToLibrary(next, 0);
    if (!saved.ok) {
      notify(saved.reason ?? '新建病历保存失败', 'error');
      return false;
    }
    activate(saved.record ?? next);
    const loaded = await repo.loadList();
    if (loaded.ok) setList(loaded.list);
    notify('已新建空白病历', 'success');
    return true;
  }), [activate, changeRecord, notify, repo]);

  const openRecord = useCallback(
    (item: RecordListItem) => changeRecord(async () => {
      const stored = await repo.activateRecord(item.id);
      if (!stored.ok || !stored.record) {
        notify(stored.reason ?? '这份病历已从本机移除，请刷新列表后重试', 'error');
        const loaded = await repo.loadList();
        if (loaded.ok) setList(loaded.list);
        return false;
      }
      if (stored.record.meta.revision !== item.data.meta.revision) historyRef.current.clear(item.id);
      activate(stored.record);
      notify(`已打开 ${stored.record.basic.name || '未命名病历'}`);
      return true;
    }),
    [activate, changeRecord, notify, repo],
  );

  const copyRecord = useCallback(
    (item: RecordListItem) => changeRecord(async () => {
      const stored = await repo.loadCurrent(item.id);
      if (!stored.ok || !stored.record) {
        notify(stored.reason ?? '这份病历已从本机移除', 'error');
        return false;
      }
      const copy = RECORD_CORE.copyRecordAsNew(stored.record);
      const saved = await repo.saveToLibrary(copy, 0);
      if (!saved.ok) {
        notify(saved.reason ?? '复制病历保存失败', 'error');
        return false;
      }
      activate(saved.record ?? copy);
      const loaded = await repo.loadList();
      if (loaded.ok) setList(loaded.list);
      notify('已复制为新病历；身份信息、生命体征数值、日期和号码已清空', 'success');
      return true;
    }),
    [activate, changeRecord, notify, repo],
  );

  const deleteRecord = useCallback(
    (item: RecordListItem) => changeRecord(async () => {
      const result = await repo.deleteRecord(item.id);
      if (!result.ok) {
        notify(result.reason ?? '删除失败', 'error');
        return false;
      }
      historyRef.current.clear(item.id);
      const loaded = await repo.loadList();
      if (loaded.ok) setList(loaded.list);
      else setList((previous) => RECORD_CORE.removeRecord(previous, item.id));
      if (recordRef.current.id === item.id) {
        activate(repo.newRecord());
      }
      notify('病历已删除', 'success');
      return true;
    }, { saveFirst: false }),
    [activate, changeRecord, notify, repo],
  );

  const importJson = useCallback(
    (raw: string, mode: 'merge' | 'replace') => changeRecord(async () => {
      try {
        const summary = await repo.importBackup(raw, mode);
        const loaded = await repo.loadList();
        if (loaded.ok) setList(loaded.list);

        if (mode === 'replace') {
          historyRef.current = RECORD_CORE.createHistory(20);
          setUndoVersion((value) => value + 1);
          const current = await repo.loadCurrent();
          activate(current.record ?? repo.newRecord());
          if (!current.ok) setStorageAlert(current.reason ?? '请从病历列表重新打开导入的病历');
        } else {
          await refreshAfterMerge(summary.firstRecordId);
        }
        const recoveries = await repo.listRecoveryCopies().catch(() => []);
        setRecovery(recoveries[0] ?? null);
        const recoveryMsg = summary.recoveryId ? '；已生成替换前恢复副本' : '';
        const details = mode === 'merge' && summary.added !== undefined
          ? `新增 ${summary.added} 份，更新 ${summary.updated ?? 0} 份，跳过 ${summary.skipped ?? 0} 份`
          : `${summary.recordCount} 份病历`;
        notify(`导入完成：${details}${recoveryMsg}`, 'success');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        notify(`导入失败：${message}`, 'error');
        return false;
      }
    }),
    [activate, changeRecord, notify, refreshAfterMerge, repo],
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

    return changeRecord(async () => {
      try {
        await repo.restoreRecovery(recovery.id);
        const [loaded, current, loadedSettings] = await Promise.all([
          repo.loadList(),
          repo.loadCurrent(),
          repo.loadSettings(),
        ]);
        historyRef.current = RECORD_CORE.createHistory(20);
        if (loaded.ok) setList(loaded.list);
        activate(current.record ?? repo.newRecord());
        if (!current.ok) setStorageAlert(current.reason ?? '请从病历列表重新打开恢复的病历');
        if (loadedSettings.ok) setSettings(loadedSettings.settings);
        setUndoVersion((v) => v + 1);
        notify('已恢复替换前病历', 'success');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        notify(`恢复失败：${message}`, 'error');
        return false;
      }
    });
  }, [activate, changeRecord, confirmAction, notify, recovery, repo]);

  const reloadFromStorage = useCallback(async () => {
    const confirmed = await confirmAction({
      title: '重新读取本机病历',
      message: '本页未保存的编辑将丢弃。请先导出当前病历，留存需要的内容。若原病历已移除，将打开空白病历。',
      confirmLabel: '丢弃编辑并读取',
      danger: true,
    });
    if (!confirmed) return;
    await changeRecord(async () => {
      const id = recordRef.current.id ?? '';
      const loaded = await repo.activateRecord(id);
      if (!loaded.ok) {
        notify(loaded.reason ?? '读取病历失败', 'error');
        return false;
      }
      historyRef.current.clear(id);
      setUndoVersion((value) => value + 1);
      activate(loaded.record ?? repo.newRecord());
      return true;
    }, { saveFirst: false });
  }, [activate, changeRecord, confirmAction, notify, repo]);

  const mergeLegacy = useCallback(() => changeRecord(async () => {
    if (!repo.mergeLegacyLocalStorage) return false;
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
        return false;
      }
      if (!result.ok) {
        notify(result.reason ?? '合并旧本地数据失败', 'error');
        return false;
      }
      await refreshAfterMerge(result.currentId ?? undefined);
      if (result.settingsMigrated) {
        const loadedSettings = await repo.loadSettings();
        if (loadedSettings.ok) setSettings(loadedSettings.settings);
      }
      const parts = [
        result.added ? `新增 ${result.added} 份` : '',
        result.updated ? `更新 ${result.updated} 份` : '',
        result.skipped ? `跳过 ${result.skipped} 份` : '',
        result.corruptCount ? `隔离损坏 ${result.corruptCount} 条` : '',
      ].filter(Boolean);
      notify(`旧数据合并完成${parts.length ? `（${parts.join('，')}）` : ''}`, 'success');
      return true;
    } catch (error) {
      notify(`合并失败：${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }), [changeRecord, notify, refreshAfterMerge, repo]);

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
          includeDraft: !saveConflict,
          draft: recordRef.current,
          includeNotes,
        }),
        null,
        2,
      ),
    [list, saveConflict],
  );

  // Debounced autosave
  useEffect(() => {
    if (!dirty || changingRecord) return;
    cancelSaveTimer();
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void persistRecord(false);
    }, 900);
    return cancelSaveTimer;
  }, [cancelSaveTimer, changingRecord, dirty, persistRecord, record]);

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
      const id = recordRef.current.id;
      if (!id) return;
      const flagConflict = () => {
        historyRef.current.clear(id);
        setUndoVersion((value) => value + 1);
        setSaveConflict(true);
      };
      if (event.recordId === id) {
        if (event.type === 'record-deleted' || (event.revision ?? 0) > (recordRef.current.meta.revision ?? 0)) {
          flagConflict();
        }
      } else if (event.type === 'backup-imported' || event.type === 'recovery-restored' || event.type === 'legacy-merged') {
        void repo.loadCurrent(id).then((loaded) => {
          const active = recordRef.current;
          if (active.id !== id || !loaded.ok) return;
          if ((loaded.record?.meta.revision ?? 0) !== (active.meta.revision ?? 0)) flagConflict();
        });
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
    saving,
    changingRecord,
    saveError,
    saveConflict,
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
    reloadFromStorage,
    mergeLegacy,
    exportCorruptLegacy,
    buildExportJson,
  };
}
