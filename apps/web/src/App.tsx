import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  GENERATOR,
  RECORD_CORE,
  type AppSettings,
  type DabingliRecord,
  type DocumentWarning,
  type RecordListItem,
} from '@dabingli/domain';
import {
  AndroidBridgeTransport,
  WebFetchTransport,
  confirmAiField,
  getAndroidAiBridge,
  type AiTransport,
  type AiTransportFactory,
  type AiTransportStatus,
} from '@dabingli/ai';
import {
  createIndexedDbRepository,
  serializeBackup,
  type RecoveryCopySummary,
  type RecordRepository,
} from '@dabingli/storage';
import { Notice } from './components/Notice';
import { StepDirectory } from './components/StepDirectory';
import { AuxStep } from './pages/AuxStep';
import { BasicStep } from './pages/BasicStep';
import { FamilyStep } from './pages/FamilyStep';
import { HpiStep } from './pages/HpiStep';
import { MarriageStep } from './pages/MarriageStep';
import { PeStep } from './pages/PeStep';
import { PersonalStep } from './pages/PersonalStep';
import { PmhStep } from './pages/PmhStep';
import { RosStep } from './pages/RosStep';
import { SummaryStep } from './pages/SummaryStep';
import { STEPS, stepIndexOf, stepKeyForPath, type StepKey } from './steps';
import type { StepComponentProps } from './editor-types';

const OutputStep = lazy(() =>
  import('./pages/OutputStep').then((module) => ({ default: module.OutputStep })),
);
const RecordsPage = lazy(() =>
  import('./pages/RecordsPage').then((module) => ({ default: module.RecordsPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);

function LazyContentFallback() {
  return <p className="lazy-content-status" role="status">正在加载页面，请稍候。</p>;
}

type AppView = 'editor' | 'records' | 'settings';

interface InitialState {
  record: DabingliRecord;
  list: RecordListItem[];
  settings: AppSettings;
  recovery: RecoveryCopySummary | null;
  stepIndex: number;
  alert: string;
}

interface ToastState {
  message: string;
  tone: 'info' | 'success' | 'error';
  key: number;
}

async function initialize(repository: RecordRepository): Promise<InitialState> {
  const [current, listResult, settingsResult, recoveries] = await Promise.all([
    repository.loadCurrent(),
    repository.loadList(),
    repository.loadSettings(),
    repository.listRecoveryCopies().catch(() => []),
  ]);
  const settings = settingsResult.settings;
  const alerts: string[] = [];

  if (!settingsResult.ok) alerts.push('设置读取失败，已使用默认设置；原始设置数据未被覆盖。');
  if (!listResult.ok) alerts.push(listResult.reason ?? '病历列表读取失败，原始数据未被覆盖。');

  let record = current.record;
  if (!record && listResult.list.length) {
    record = RECORD_CORE.cloneValue(listResult.list[0]?.data ?? repository.newRecord());
  }
  if (!record) record = repository.newRecord();
  if (!current.ok) alerts.push(current.reason ?? '当前病历读取失败，原始数据未被覆盖。');

  return {
    record,
    list: listResult.list,
    settings,
    recovery: recoveries[0] ?? null,
    stepIndex: stepIndexOf(settings.lastStep),
    alert: alerts.join(' '),
  };
}

function validationMap(warnings: readonly DocumentWarning[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  warnings.forEach((warning) => {
    warning.paths?.forEach((path) => {
      if (!mapped[path]) mapped[path] = warning.message;
    });
  });
  return mapped;
}

function validationMapForTouched(
  warnings: readonly DocumentWarning[],
  touchedPaths: ReadonlySet<string>,
): Record<string, string> {
  const mapped = validationMap(warnings);
  const visible: Record<string, string> = {};

  Object.entries(mapped).forEach(([errorPath, message]) => {
    for (const touchedPath of touchedPaths) {
      if (
        errorPath === touchedPath
        || errorPath.startsWith(`${touchedPath}.`)
        || touchedPath.startsWith(`${errorPath}.`)
      ) {
        visible[errorPath] = message;
        break;
      }
    }
  });

  return visible;
}

function downloadJson(text: string, filename: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function App({
  repository,
  aiTransportFactory,
}: {
  repository?: RecordRepository;
  aiTransportFactory?: AiTransportFactory;
}) {
  const repositoryRef = useRef<RecordRepository | null>(repository ?? null);
  if (!repositoryRef.current) repositoryRef.current = createIndexedDbRepository();
  const repo = repositoryRef.current;
  const [initial, setInitial] = useState<InitialState | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const init = await repo.initialize();
        const loaded = await initialize(repo);
        const alerts: string[] = [];
        if (!init.ok) {
          alerts.push(
            `本地数据迁移未完成：${init.migration?.reason ?? init.reason ?? '未知错误'}。旧 localStorage 保持原样。`,
          );
        } else if (init.migration?.status === 'migrated') {
          alerts.push(
            `已从 localStorage 迁移 ${init.migration.recordCount} 份病历到 IndexedDB；旧数据仍保留。`,
          );
        }
        if (loaded.alert) alerts.push(loaded.alert);
        if (active) setInitial({ ...loaded, alert: alerts.join(' ') });
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      active = false;
    };
  }, [repo]);

  if (loadError) {
    return (
      <main className="app-main">
        <section className="workspace-page" role="alert">
          <h2>无法读取本机病历</h2>
          <p>{loadError}</p>
          <button type="button" className="button primary" onClick={() => window.location.reload()}>
            重新加载
          </button>
        </section>
      </main>
    );
  }

  if (!initial) {
    return (
      <main className="app-main">
        <section className="workspace-page" aria-busy="true">
          <p role="status">正在读取本机病历…</p>
        </section>
      </main>
    );
  }

  return <EditorApp repository={repo} initial={initial} aiTransportFactory={aiTransportFactory} />;
}

function EditorApp({
  repository: repo,
  initial,
  aiTransportFactory,
}: {
  repository: RecordRepository;
  initial: InitialState;
  aiTransportFactory?: AiTransportFactory;
}) {
  const [record, setRecord] = useState<DabingliRecord>(initial.record);
  const [list, setList] = useState<RecordListItem[]>(initial.list);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);
  const [recovery, setRecovery] = useState<RecoveryCopySummary | null>(initial.recovery);
  const [stepIndex, setStepIndex] = useState(initial.stepIndex);
  const [view, setView] = useState<AppView>('editor');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [storageAlert, setStorageAlert] = useState(initial.alert);
  const [dirty, setDirty] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [touchedPaths, setTouchedPaths] = useState<ReadonlySet<string>>(() => new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [exportText, setExportText] = useState(() =>
    JSON.stringify(RECORD_CORE.buildExport(initial.list, undefined, { includeDraft: true, draft: initial.record }), null, 2),
  );
  const [apiKey, setApiKey] = useState('');
  const androidBridge = useMemo(() => getAndroidAiBridge(), []);
  const [androidStatus, setAndroidStatus] = useState<AiTransportStatus | null>(null);
  const [androidStatusLoading, setAndroidStatusLoading] = useState(Boolean(androidBridge));
  const toastTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  function refreshAndroidAiStatus() {
    if (!androidBridge) return;
    setAndroidStatusLoading(true);
    void new AndroidBridgeTransport({ bridge: androidBridge }).status().then((status) => {
      setAndroidStatus(status);
      setAndroidStatusLoading(false);
    });
  }

  useEffect(() => {
    if (!androidBridge) return;
    let active = true;
    setAndroidStatusLoading(true);
    void new AndroidBridgeTransport({ bridge: androidBridge }).status().then((status) => {
      if (!active) return;
      setAndroidStatus(status);
      setAndroidStatusLoading(false);
    });
    return () => {
      active = false;
    };
  }, [androidBridge]);

  const warnings = useMemo(() => GENERATOR.validateStructured(record), [record]);
  const errors = useMemo(
    () => (validationAttempted ? validationMap(warnings) : validationMapForTouched(warnings, touchedPaths)),
    [validationAttempted, touchedPaths, warnings],
  );

  function resetValidationState() {
    setValidationAttempted(false);
    setTouchedPaths(new Set());
  }

  function markFieldTouched(path: string) {
    setTouchedPaths((previous) => {
      if (previous.has(path)) return previous;
      const next = new Set(previous);
      next.add(path);
      return next;
    });
  }

  function handleFieldBlur(event: FocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const field = target.closest<HTMLElement>('[data-field-path]');
    const path = field?.dataset.fieldPath;
    if (path) markFieldTouched(path);
  }

  function notify(message: string, tone: ToastState['tone'] = 'info') {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast({ message, tone, key: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function refreshExportPreview(nextRecord = record, nextList = list) {
    const bundle = RECORD_CORE.buildExport(nextList, undefined, {
      includeDraft: true,
      draft: nextRecord,
    });
    setExportText(JSON.stringify(bundle, null, 2));
  }

  async function saveAiMutation(nextRecord: DabingliRecord, message: string): Promise<boolean> {
    const revision = Number(record.meta.revision) || 0;
    const saved = await repo.saveToLibrary(nextRecord, revision);
    if (!saved.ok) {
      setStorageAlert(saved.reason ?? 'AI 内容保存失败，请先导出备份。');
      notify(saved.reason ?? 'AI 内容保存失败', 'error');
      return false;
    }
    const persisted = saved.record ?? nextRecord;
    setRecord(persisted);
    setDirty(false);
    const loaded = await repo.loadList();
    if (loaded.ok) {
      setList(loaded.list);
      refreshExportPreview(persisted, loaded.list);
    }
    notify(message, 'success');
    return true;
  }

  async function adoptAiRecord(nextRecord: DabingliRecord): Promise<boolean> {
    return saveAiMutation(nextRecord, 'AI 建议已采纳，仍需逐项核对');
  }

  async function confirmAiContent(path: string): Promise<boolean> {
    const next = confirmAiField(record, path);
    return saveAiMutation(next, '已标记为已核对');
  }

  function createAiTransport(): AiTransport {
    if (aiTransportFactory) return aiTransportFactory(apiKey);
    if (androidBridge) return new AndroidBridgeTransport({ bridge: androidBridge });
    return new WebFetchTransport({ apiKey });
  }

  async function persistRecord(showToast = true): Promise<boolean> {
    const revision = Number(record.meta.revision) || 0;
    const saved = await repo.saveToLibrary(record, revision);
    if (!saved.ok) {
      setStorageAlert(saved.reason ?? '保存失败，请先导出备份。');
      notify(saved.reason ?? '保存失败', 'error');
      return false;
    }
    const nextRecord = saved.record ?? record;
    setRecord(nextRecord);
    setDirty(false);
    const loaded = await repo.loadList();
    if (loaded.ok) {
      setList(loaded.list);
      refreshExportPreview(nextRecord, loaded.list);
    }
    if (showToast) notify('已保存到本机', 'success');
    return true;
  }

  async function attemptSave(showToast = true): Promise<boolean> {
    setValidationAttempted(true);
    const saved = await persistRecord(showToast);
    if (warnings.some((warning) => warning.paths?.length)) jumpToFirstInvalid();
    return saved;
  }

  function update(path: string, value: unknown) {
    setRecord((previous) => {
      const next = RECORD_CORE.cloneValue(previous);
      RECORD_CORE.setPath(next, path, value);
      RECORD_CORE.markFieldManual(next, path);
      return next;
    });
    setDirty(true);
  }

  function replaceRecord(next: DabingliRecord) {
    setRecord(RECORD_CORE.cloneValue(next));
    setDirty(true);
  }

  async function saveSettings(next: AppSettings) {
    const normalized = RECORD_CORE.normalizeSettings(next);
    setSettings(normalized);
    const result = await repo.saveSettings(normalized);
    if (!result.ok) notify(result.reason ?? '设置保存失败', 'error');
  }

  function goToStep(index: number) {
    const safeIndex = Math.max(0, Math.min(STEPS.length - 1, index));
    if (STEPS[safeIndex]?.key === 'output') setValidationAttempted(true);
    setView('editor');
    setStepIndex(safeIndex);
    setMobileNavOpen(false);
    const nextSettings = { ...settings, lastStep: STEPS[safeIndex]?.key ?? 'basic' };
    setSettings(nextSettings);
    void repo.saveSettings(nextSettings);
  }

  function jumpToPath(path: string) {
    if (!path) return;
    setValidationAttempted(true);
    goToStep(stepIndexOf(stepKeyForPath(path)));
    setPendingFocus(path);
  }

  function jumpToFirstInvalid() {
    setValidationAttempted(true);
    const ordered = [
      ...warnings.filter((warning) => warning.severity === 'error'),
      ...warnings.filter((warning) => warning.severity !== 'error'),
    ];
    const first = ordered.find((warning) => warning.paths?.length);
    const path = first?.paths?.[0];
    if (path) {
      jumpToPath(path);
      return;
    }
    notify(first?.message ?? '没有可定位的提醒，请人工核对', first ? 'info' : 'success');
  }

  async function createNewRecord() {
    const next = repo.newRecord();
    const saved = await repo.saveToLibrary(next, 0);
    if (!saved.ok) {
      notify(saved.reason ?? '新建病历保存失败', 'error');
      return;
    }
    const persisted = saved.record ?? next;
    setRecord(persisted);
    setView('editor');
    setStepIndex(0);
    setDirty(false);
    resetValidationState();
    const loaded = await repo.loadList();
    if (loaded.ok) setList(loaded.list);
    refreshExportPreview(persisted, loaded.ok ? loaded.list : list);
    notify('已新建空白病历', 'success');
  }

  async function openRecord(item: RecordListItem) {
    const stored = await repo.loadCurrent(item.id);
    const next = RECORD_CORE.cloneValue(stored.ok && stored.record ? stored.record : item.data);
    setRecord(next);
    setView('editor');
    setStepIndex(0);
    setDirty(false);
    resetValidationState();
    const saved = await repo.saveToLibrary(next, Number(next.meta.revision) || 0);
    if (saved.ok) {
      setRecord(saved.record ?? next);
      refreshExportPreview(saved.record ?? next, list);
    }
    notify(`已打开 ${item.basic?.name || RECORD_CORE.summarize(item).name}`);
  }

  async function deleteRecord(item: RecordListItem) {
    const nextList = RECORD_CORE.removeRecord(list, item.id);
    const result = await repo.deleteRecord(item.id);
    if (!result.ok) {
      notify(result.reason ?? '删除失败', 'error');
      return;
    }
    setList(nextList);
    if (record.id === item.id) {
      const next = repo.newRecord();
      setRecord(next);
      setDirty(false);
      resetValidationState();
      refreshExportPreview(next, nextList);
    }
    notify('病历已删除', 'success');
  }

  async function importJson(raw: string, mode: 'merge' | 'replace') {
    try {
      const summary = await repo.importBackup(raw, mode);
      const loaded = await repo.loadList();
      const nextList = loaded.ok ? loaded.list : [];
      setList(nextList);

      const preferred = summary.firstRecordId
        ? await repo.loadCurrent(summary.firstRecordId)
        : await repo.loadCurrent();
      if (preferred.ok && preferred.record) {
        setRecord(preferred.record);
        refreshExportPreview(preferred.record, nextList);
      }
      const recoveries = await repo.listRecoveryCopies().catch(() => []);
      setRecovery(recoveries[0] ?? null);
      setView('records');
      const recovery = summary.recoveryId ? '；已生成替换前恢复副本' : '';
      notify(`导入完成：${summary.recordCount} 份病历${recovery}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notify(`导入失败：${message}`, 'error');
    }
  }

  async function restoreRecovery() {
    if (!recovery) return;
    if (!window.confirm(`恢复替换导入前的 ${recovery.recordCount} 份病历吗？`)) return;
    try {
      await repo.restoreRecovery(recovery.id);
      const [loaded, current, loadedSettings] = await Promise.all([
        repo.loadList(),
        repo.loadCurrent(),
        repo.loadSettings(),
      ]);
      const nextList = loaded.ok ? loaded.list : [];
      const nextRecord = current.ok && current.record ? current.record : repo.newRecord();
      setList(nextList);
      setRecord(nextRecord);
      if (loadedSettings.ok) setSettings(loadedSettings.settings);
      setDirty(false);
      setView('records');
      resetValidationState();
      refreshExportPreview(nextRecord, nextList);
      notify('已恢复替换前病历', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notify(`恢复失败：${message}`, 'error');
    }
  }

  async function exportJson(scope: 'current' | 'all') {
    try {
      const bundle = await repo.exportBackup(scope);
      const text = serializeBackup(bundle);
      setExportText(text);
      downloadJson(text, scope === 'all' ? 'dabingli-records.json' : `dabingli-${record.id ?? 'record'}.json`);
      notify('已下载 JSON 备份', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notify(`导出失败：${message}`, 'error');
    }
  }

  const aiSecurityContext = androidBridge ? 'android' as const : 'web' as const;
  const aiConfigured = androidBridge ? androidStatus?.configured === true : apiKey.trim().length > 0;
  const aiModel = androidBridge ? androidStatus?.model ?? 'deepseek-flash' : 'deepseek-flash';
  const step = STEPS[stepIndex] ?? STEPS[0];
  const stepKey: StepKey = step.key;
  const stepProps: StepComponentProps = {
    record,
    update,
    replaceRecord,
    errors,
    onJump: jumpToPath,
    notify,
  };

  let stepContent: ReactNode;
  switch (stepKey) {
    case 'basic':
      stepContent = <BasicStep {...stepProps} />;
      break;
    case 'hpi':
      stepContent = <HpiStep {...stepProps} />;
      break;
    case 'pmh':
      stepContent = <PmhStep {...stepProps} />;
      break;
    case 'ros':
      stepContent = <RosStep {...stepProps} />;
      break;
    case 'personal':
      stepContent = <PersonalStep {...stepProps} />;
      break;
    case 'marriage':
      stepContent = <MarriageStep {...stepProps} />;
      break;
    case 'family':
      stepContent = <FamilyStep {...stepProps} />;
      break;
    case 'pe':
      stepContent = <PeStep {...stepProps} />;
      break;
    case 'aux':
      stepContent = <AuxStep {...stepProps} />;
      break;
    case 'summary':
      stepContent = <SummaryStep {...stepProps} />;
      break;
    case 'output':
      stepContent = (
        <OutputStep
          {...stepProps}
          settings={settings}
          ai={{
            record,
            configured: aiConfigured,
            securityContext: aiSecurityContext,
            model: aiModel,
            loadingAndroidStatus: androidBridge ? androidStatusLoading : false,
            createTransport: createAiTransport,
            onOpenSettings: () => setView('settings'),
            onAdoptRecord: adoptAiRecord,
            onConfirmField: confirmAiContent,
          }}
        />
      );
      break;
  }

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persistRecord(false);
    }, 900);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-scale', String(settings.fontScale));
  }, [settings.fontScale]);

  useEffect(() => {
    if (!pendingFocus) return;
    const frame = window.requestAnimationFrame(() => {
      const fields = [...document.querySelectorAll<HTMLElement>('[data-field-path]')];
      const field = fields.find((element) => element.dataset.fieldPath === pendingFocus)
        ?? fields.find((element) => element.dataset.fieldPath?.startsWith(`${pendingFocus}.`));
      if (field) {
        let parent = field.parentElement;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
        field.scrollIntoView?.({ block: 'center' });
        field.focus();
      } else {
        document.getElementById('step-heading')?.focus();
      }
      setPendingFocus(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingFocus, stepIndex, view]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (mobileNavOpen) {
          setMobileNavOpen(false);
          return;
        }
        const active = document.activeElement;
        if (active instanceof HTMLElement) {
          const details = active.closest('details');
          if (details?.open) {
            details.open = false;
            details.querySelector<HTMLElement>('summary')?.focus();
            return;
          }
        }
        if (view !== 'editor') setView('editor');
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void attemptSave(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function submitStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1);
    } else {
      void attemptSave(true);
    }
  }

  const alertNode = storageAlert ? (
    <Notice tone="warning" title="存储提示">
      {storageAlert}
      <button type="button" className="button ghost compact-button" onClick={() => setStorageAlert('')}>
        知道了
      </button>
    </Notice>
  ) : null;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">病</div>
          <div>
            <div className="brand-title">大病历生成器</div>
            <div className="brand-subtitle">Web UI · {record.basic.name || '未命名病历'}</div>
          </div>
        </div>
        <nav className="header-actions" aria-label="全局操作">
          {view !== 'editor' ? (
            <button type="button" className="button ghost" onClick={() => setView('editor')}>
              返回编辑
            </button>
          ) : null}
          <button
            type="button"
            className={`button ghost${view === 'records' ? ' is-active' : ''}`}
            onClick={() => setView('records')}
          >
            病历列表
          </button>
          <button
            type="button"
            className={`button ghost${view === 'settings' ? ' is-active' : ''}`}
            onClick={() => setView('settings')}
          >
            设置
          </button>
          <button type="button" className="button primary" onClick={() => attemptSave(true)}>
            {dirty ? '保存病历 *' : '保存病历'}
          </button>
        </nav>
      </header>

      {alertNode ? <div className="global-notice">{alertNode}</div> : null}

      <main id="main-content" className="app-main">
        {view === 'records' ? (
          <Suspense fallback={<LazyContentFallback />}>
            <RecordsPage
              list={list}
              activeId={record.id}
              exportText={exportText}
              recovery={recovery}
              onNew={createNewRecord}
              onOpen={openRecord}
              onDelete={deleteRecord}
              onImport={importJson}
              onDownload={exportJson}
              onRestoreRecovery={restoreRecovery}
            />
          </Suspense>
        ) : view === 'settings' ? (
          <Suspense fallback={<LazyContentFallback />}>
            <SettingsPage
              settings={settings}
              exportText={exportText}
              recovery={recovery}
              apiKey={apiKey}
              androidConfigured={androidStatus?.configured}
              androidModel={androidStatus?.model}
              androidStatusLoading={androidStatusLoading}
              onChange={saveSettings}
              onApiKeyChange={setApiKey}
              onOpenAndroidAiSettings={androidBridge ? () => androidBridge.aiSettings?.() : undefined}
              onRefreshAndroidStatus={androidBridge ? refreshAndroidAiStatus : undefined}
              onImport={importJson}
              onDownload={exportJson}
              onRestoreRecovery={restoreRecovery}
            />
          </Suspense>
        ) : (
          <div className="editor-workspace">
            <aside className="desktop-step-directory" aria-label="步骤目录">
              <div className="directory-heading">
                <div className="eyebrow">病历目录</div>
                <strong>{stepIndex + 1} / {STEPS.length}</strong>
              </div>
              <StepDirectory steps={STEPS} activeIndex={stepIndex} onSelect={goToStep} />
              <div className="directory-note">任何步骤都可以直接跳转，内容会保留。</div>
            </aside>

            <div className="editor-main">
              <button
                type="button"
                className="mobile-step-button"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-step-nav"
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <span>步骤 {stepIndex + 1}/{STEPS.length} · {step.name}</span>
                <span>打开目录</span>
              </button>
              {mobileNavOpen ? (
                <div className="mobile-step-panel" id="mobile-step-nav">
                  <div className="mobile-step-panel-head">
                    <strong>病历目录</strong>
                    <button type="button" className="button ghost compact-button" onClick={() => setMobileNavOpen(false)}>
                      关闭
                    </button>
                  </div>
                  <StepDirectory steps={STEPS} activeIndex={stepIndex} onSelect={goToStep} />
                </div>
              ) : null}

              <form className="editor-form" onSubmit={submitStep} onBlur={handleFieldBlur} noValidate>
                <Suspense fallback={<LazyContentFallback />}>
                  {stepContent}
                </Suspense>
                <footer className="editor-footer">
                  <button
                    type="button"
                    className="button ghost"
                    disabled={stepIndex === 0}
                    onClick={() => goToStep(stepIndex - 1)}
                  >
                    上一步
                  </button>
                  <div className="footer-secondary-actions">
                    <button type="button" className="button ghost" onClick={jumpToFirstInvalid}>
                      检查并定位
                    </button>
                    <button type="button" className="button secondary" onClick={() => attemptSave(true)}>
                      保存
                    </button>
                  </div>
                  <button type="submit" className="button primary">
                    {stepIndex === STEPS.length - 1 ? '保存病历' : '下一步'}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </main>

      <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast?.message}
      </div>
    </div>
  );
}
