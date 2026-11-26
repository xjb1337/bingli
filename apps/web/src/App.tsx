import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  RECORD_CORE,
  type DabingliRecord,
} from '@dabingli/domain';
import {
  AI_FIELDS,
  AndroidBridgeTransport,
  WebFetchTransport,
  confirmAiField,
  createAiAdoptionUndo,
  getAndroidAiBridge,
  undoAiAdoption,
  type AiAdoptionUndo,
  type AiTransport,
  type AiTransportFactory,
  type AiTransportStatus,
} from '@dabingli/ai';
import {
  createIndexedDbRepository,
  importStagedLegacy,
  serializeBackup,
  StagedImportConflictError,
  type CorruptLegacyEntry,
  type RecordRepository,
} from '@dabingli/storage';
import { ConfirmModal, type ConfirmDialogOptions } from './components/ConfirmModal';
import { Notice } from './components/Notice';
import { StepDirectory } from './components/StepDirectory';
import type { StepComponentProps } from './editor-types';
import { stepState, type StepCompletionState } from './form-utils';
import { useAiSession } from './hooks/useAiSession';
import { useMobileViewport } from './hooks/useMobileViewport';
import { useRecordSession, type InitialSessionState } from './hooks/useRecordSession';
import { useValidation } from './hooks/useValidation';
import {
  getNativeAndroidBridge,
  nativeExportFile,
  notifyNativeLegacyImportFailed,
  notifyNativeLegacyImported,
  notifyNativeLegacyLaunched,
  readNativeStagedLegacy,
  registerBingliWebHost,
} from './native-host';
import type { ThemePreference } from './pages/SettingsPage';
import { watchWaitingUpdate } from './pwa/register';
import { STEPS, stepIndexOf, stepKeyForPath, type StepKey } from './steps';

const BasicStep = lazy(() => import('./pages/BasicStep').then((m) => ({ default: m.BasicStep })));
const HpiStep = lazy(() => import('./pages/HpiStep').then((m) => ({ default: m.HpiStep })));
const PmhStep = lazy(() => import('./pages/PmhStep').then((m) => ({ default: m.PmhStep })));
const PersonalStep = lazy(() => import('./pages/PersonalStep').then((m) => ({ default: m.PersonalStep })));
const MarriageStep = lazy(() => import('./pages/MarriageStep').then((m) => ({ default: m.MarriageStep })));
const FamilyStep = lazy(() => import('./pages/FamilyStep').then((m) => ({ default: m.FamilyStep })));
const PeStep = lazy(() => import('./pages/PeStep').then((m) => ({ default: m.PeStep })));
const AuxStep = lazy(() => import('./pages/AuxStep').then((m) => ({ default: m.AuxStep })));
const SummaryStep = lazy(() => import('./pages/SummaryStep').then((m) => ({ default: m.SummaryStep })));
const OutputStep = lazy(() => import('./pages/OutputStep').then((m) => ({ default: m.OutputStep })));
const RecordsPage = lazy(() => import('./pages/RecordsPage').then((m) => ({ default: m.RecordsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AiPage = lazy(() => import('./pages/AiPage').then((m) => ({ default: m.AiPage })));

const THEME_STORAGE_KEY = 'dabingli.web.theme';

function readStoredTheme(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <section
      className={`loading-state${compact ? ' is-compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-state-head">
        <span className="loading-spinner" aria-hidden="true" />
        <div>
          <strong>{label}</strong>
          <span>资料只在本机读取，请稍候。</span>
        </div>
      </div>
      <div className="skeleton-stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function LazyContentFallback() {
  return <LoadingState label="正在加载页面…" compact />;
}

function FocusStepField({
  path,
  onHandled,
}: {
  path: string | null;
  onHandled: (path: null) => void;
}) {
  useEffect(() => {
    if (!path) return;
    const frame = window.requestAnimationFrame(() => {
      const fields = [...document.querySelectorAll<HTMLElement>('.editor-form [data-field-path]')];
      const matched = fields.find((element) => element.dataset.fieldPath === path)
        ?? fields.find((element) => element.dataset.fieldPath?.startsWith(`${path}.`));
      if (matched) {
        for (let parent = matched.parentElement; parent; parent = parent.parentElement) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        }
        const target = matched.matches('input, select, textarea, button, [tabindex]')
          ? matched
          : matched.querySelector<HTMLElement>('button[tabindex="0"], input, select, textarea, button') ?? matched;
        target.scrollIntoView?.({ block: 'center' });
        target.focus();
      } else {
        document.getElementById('step-heading')?.focus();
      }
      onHandled(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [onHandled, path]);
  return null;
}

type AppView = 'editor' | 'records' | 'settings' | 'ai';

async function loadSessionState(repository: RecordRepository): Promise<InitialSessionState & { canConfirmNativeLaunch: boolean }> {
  const [current, listResult, settingsResult, recoveries, corruptEntries, quotaInfo] = await Promise.all([
    repository.loadCurrent(),
    repository.loadList(),
    repository.loadSettings(),
    repository.listRecoveryCopies().catch(() => []),
    repository.exportCorruptLegacyEntries?.().catch(() => [] as CorruptLegacyEntry[]) ?? Promise.resolve([]),
    repository.estimateStorageQuota?.().catch(() => null) ?? Promise.resolve(null),
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

  if (corruptEntries.length) {
    alerts.push(`检测到 ${corruptEntries.length} 条损坏的旧数据已安全隔离，可在「设置」或「病历列表」导出排查。`);
  }
  if (quotaInfo?.lowSpace) {
    alerts.push('本机存储空间接近上限，建议尽快导出 JSON 备份。');
  }

  return {
    record,
    list: listResult.list,
    settings,
    recovery: recoveries[0] ?? null,
    corruptEntries,
    quotaInfo,
    stepIndex: stepIndexOf(settings.lastStep),
    alert: alerts.join(' '),
    canConfirmNativeLaunch: settingsResult.ok && listResult.ok && current.ok,
  };
}

async function initializeApp(repo: RecordRepository): Promise<InitialSessionState> {
  const init = await repo.initialize();
  const alerts: string[] = [];
  if (!init.ok) {
    alerts.push(
      `本地数据迁移未完成：${init.migration?.reason ?? init.reason ?? '未知错误'}。旧 localStorage 保持原样。`,
    );
  } else if (init.migration?.status === 'migrated') {
    const corruptSuffix = init.migration.corruptCount ? `（另隔离 ${init.migration.corruptCount} 条损坏旧数据）` : '';
    alerts.push(`已从 localStorage 迁移 ${init.migration.recordCount} 份病历到 IndexedDB${corruptSuffix}；旧数据仍保留。`);
  }

  const stagedRaw = readNativeStagedLegacy();
  if (stagedRaw && init.ok) {
    try {
      const staged = await importStagedLegacy(stagedRaw, repo);
      notifyNativeLegacyImported();
      if (!staged.alreadyImported && (staged.recordCount || staged.corruptCount)) {
        const corruptSuffix = staged.corruptCount ? `；已隔离 ${staged.corruptCount} 条损坏旧数据供导出` : '';
        alerts.push(`已从 Android 旧版本迁移 ${staged.recordCount} 份病历${corruptSuffix}。`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alerts.push(`Android 旧数据导入未完成：${message}。可在设置中导出原始数据。`);
      if (!(error instanceof StagedImportConflictError)) notifyNativeLegacyImportFailed(message);
    }
  }

  const loaded = await loadSessionState(repo);
  if (loaded.alert) alerts.push(loaded.alert);
  if (init.ok && loaded.canConfirmNativeLaunch) notifyNativeLegacyLaunched();
  return { ...loaded, alert: alerts.join(' ') };
}

export function App({
  repository,
  aiTransportFactory,
}: {
  repository?: RecordRepository;
  aiTransportFactory?: AiTransportFactory;
}) {
  const repositoryRef = useRef<RecordRepository | null>(repository ?? null);
  if (!repositoryRef.current) {
    repositoryRef.current = createIndexedDbRepository({
      autoMigrate: typeof getNativeAndroidBridge()?.stagedLegacy !== 'function',
    });
  }
  const repo = repositoryRef.current;
  const initialization = useRef<Promise<InitialSessionState> | null>(null);
  const [initial, setInitial] = useState<InitialSessionState | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    initialization.current ??= initializeApp(repo);
    void initialization.current.then(
      (loaded) => { if (active) setInitial(loaded); },
      (error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : String(error));
      },
    );
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
        <LoadingState label="正在读取本机病历…" />
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
  initial: InitialSessionState;
  aiTransportFactory?: AiTransportFactory;
}) {
  useMobileViewport();

  const [stepIndex, setStepIndex] = useState(initial.stepIndex);
  const [view, setView] = useState<AppView>('editor');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [exportIncludeNotes, setExportIncludeNotes] = useState(false);
  const [aiUndo, setAiUndo] = useState<AiAdoptionUndo | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredTheme());
  const [offlineUpdateReady, setOfflineUpdateReady] = useState(false);
  useEffect(() => watchWaitingUpdate(() => setOfflineUpdateReady(true)), []);

  // Accessible inline ConfirmModal promise queue
  const [confirmState, setConfirmState] = useState<(ConfirmDialogOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirmAction = useCallback((options: ConfirmDialogOptions): Promise<boolean> => (
    new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    })
  ), []);

  const validationResetRef = useRef<() => void>(() => {});
  const onResetValidation = useCallback(() => validationResetRef.current(), []);
  const onAfterRecordSwitch = useCallback(() => {
    setView('editor');
    setStepIndex(0);
    setMobileNavOpen(false);
    setPendingFocus(null);
    setAiUndo(null);
    document.scrollingElement?.scrollTo?.(0, 0);
  }, []);

  const session = useRecordSession({
    repo,
    initial,
    onResetValidation,
    onAfterRecordSwitch,
    confirmAction,
  });
  const workspaceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    workspaceRef.current?.toggleAttribute('inert', session.changingRecord);
  }, [session.changingRecord]);

  const validation = useValidation(session.record);
  validationResetRef.current = validation.resetValidationState;

  const [apiKey, setApiKey] = useState('');
  const [webAiModel, setWebAiModel] = useState('deepseek-flash');
  const androidBridge = useMemo(() => getAndroidAiBridge(), []);
  const [androidStatus, setAndroidStatus] = useState<AiTransportStatus | null>(null);
  const [androidStatusLoading, setAndroidStatusLoading] = useState(Boolean(androidBridge));

  const step = STEPS[stepIndex] ?? STEPS[0];
  const stepKey: StepKey = step.key;
  const defaultAiTarget = step.key === 'hpi'
    ? 'hpi.symptoms'
    : Object.keys(AI_FIELDS).find((path) => path.startsWith(`${step.key}.`)) ?? 'hpi.symptoms';

  const aiSession = useAiSession(session.record.id, defaultAiTarget);
  const lastAiEditorTarget = useRef(defaultAiTarget);

  const mobileStepButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileStepPanelRef = useRef<HTMLDivElement | null>(null);

  const refreshAndroidAiStatus = useCallback(() => {
    if (!androidBridge) return;
    setAndroidStatusLoading(true);
    void new AndroidBridgeTransport({ bridge: androidBridge }).status().then((status) => {
      setAndroidStatus(status);
      setAndroidStatusLoading(false);
    });
  }, [androidBridge]);

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

  function clearKeyAndResetTransport() {
    setApiKey('');
    aiSession.resetTransportAndAbort();
  }

  function createAiTransport(): AiTransport {
    void aiSession.transportEpoch;
    if (aiTransportFactory) return aiTransportFactory(apiKey);
    if (androidBridge) return new AndroidBridgeTransport({ bridge: androidBridge });
    return new WebFetchTransport({ apiKey, model: webAiModel });
  }

  async function adoptAiRecord(nextRecord: DabingliRecord, paths: readonly string[]): Promise<boolean> {
    const undo = createAiAdoptionUndo(session.recordRef.current, nextRecord, paths);
    const saved = await session.saveAiMutation(nextRecord, 'AI 建议已采纳，仍需逐项核对');
    if (saved) setAiUndo(undo);
    return saved;
  }

  async function undoAiRecord(): Promise<boolean> {
    if (!aiUndo || aiUndo.recordId !== session.recordRef.current.id) return false;
    const undone = undoAiAdoption(session.recordRef.current, aiUndo);
    const message = `已撤销 ${undone.restored} 项${undone.kept ? `，保留 ${undone.kept} 项后来修改的内容` : ''}`;
    const saved = await session.saveAiMutation(undone.record, message);
    if (saved) setAiUndo(null);
    return saved;
  }

  async function confirmAiContent(path: string): Promise<boolean> {
    const next = confirmAiField(session.recordRef.current, path);
    return session.saveAiMutation(next, '已标记为已核对');
  }

  const goToStep = useCallback(
    (index: number) => {
      const safeIndex = Math.max(0, Math.min(STEPS.length - 1, index));
      if (STEPS[safeIndex]?.key === 'output') validation.setValidationAttempted(true);
      setView('editor');
      setStepIndex(safeIndex);
      setMobileNavOpen(false);
      document.scrollingElement?.scrollTo?.(0, 0);
      if (session.settings.lastStep !== STEPS[safeIndex]?.key) {
        const nextSettings = { ...session.settings, lastStep: STEPS[safeIndex]?.key ?? 'basic' };
        void session.saveSettings(nextSettings);
      }
    },
    [session, validation],
  );

  const navigateView = useCallback(
    async (nextView: AppView) => {
      if (nextView === view) return;
      if (view === 'ai' && aiSession.hasUnsentWork) {
        const message = aiSession.session.busy
          ? 'AI 请求正在进行中，离开当前页面后请求会继续在后台保留（不会丢失），确定切换页面吗？'
          : '当前有尚未采纳的待识别图片，确定离开 AI 助手吗？（图片会暂留在当前会话中）';
        const ok = await confirmAction({
          title: '离开 AI 助手',
          message,
          confirmLabel: '切换页面',
          cancelLabel: '留在本页',
        });
        if (!ok) return;
      }
      if (nextView === 'ai') {
        if (lastAiEditorTarget.current !== defaultAiTarget && !aiSession.session.request && !aiSession.hasUnsentWork) {
          aiSession.patchSession({ target: defaultAiTarget });
          lastAiEditorTarget.current = defaultAiTarget;
        }
        refreshAndroidAiStatus();
      }
      setMobileNavOpen(false);
      setView(nextView);
      document.scrollingElement?.scrollTo?.(0, 0);
    },
    [aiSession, confirmAction, defaultAiTarget, refreshAndroidAiStatus, view],
  );

  const jumpToPath = useCallback(
    (path: string) => {
      if (!path) return;
      validation.setValidationAttempted(true);
      goToStep(stepIndexOf(stepKeyForPath(path)));
      setPendingFocus(path);
    },
    [goToStep, validation],
  );

  const firstInvalidPath = validation.warnings.find((warning) => warning.severity === 'error' && warning.paths?.length)?.paths?.[0]
    ?? validation.warnings.find((warning) => warning.paths?.length)?.paths?.[0];
  const jumpToFirstInvalid = () => {
    validation.setValidationAttempted(true);
    if (firstInvalidPath) jumpToPath(firstInvalidPath);
    else session.notify('没有可定位的提醒，请人工核对', 'info');
  };

  const attemptSave = useCallback(
    async (showToast = true): Promise<boolean> => {
      if (session.changingRecord) return false;
      validation.setValidationAttempted(true);
      const saved = await session.persistRecord(showToast);
      if (saved && view === 'editor' && firstInvalidPath) jumpToPath(firstInvalidPath);
      return saved;
    },
    [firstInvalidPath, jumpToPath, session, validation, view],
  );

  async function handleImportJson(raw: string, mode: 'merge' | 'replace') {
    const ok = await session.importJson(raw, mode);
    if (ok) setView('records');
    return ok;
  }

  async function handleRestoreRecovery() {
    const ok = await session.restoreRecovery();
    if (ok) setView('records');
  }

  async function exportJson(scope: 'current' | 'all', options: { includeNotes?: boolean } = {}) {
    const includeNotes = options.includeNotes === true;
    try {
      const draft = session.recordRef.current;
      const bundle = await repo.exportBackup(scope, {
        includeNotes,
        ...(scope === 'current' || !session.saveConflict ? { draft } : {}),
      });
      const text = serializeBackup(bundle);
      nativeExportFile(
        text,
        scope === 'all' ? 'dabingli-records.json' : `dabingli-${draft.id ?? 'record'}.json`,
        'application/json',
      );
      session.notify(includeNotes ? '已下载 JSON 备份（含原始笔记）' : '已下载 JSON 备份（不含原始笔记）', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      session.notify(`导出失败：${message}`, 'error');
    }
  }

  function changeTheme(next: ThemePreference) {
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage write restriction.
    }
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-scale', String(session.settings.fontScale));
  }, [session.settings.fontScale]);

  useEffect(() => {
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === 'auto' ? (systemDark?.matches ? 'dark' : 'light') : theme;
    };
    applyTheme();
    if (theme === 'auto' && systemDark) {
      systemDark.addEventListener('change', applyTheme);
      return () => systemDark.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // Close mobile step panel on outside click
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mobileStepPanelRef.current?.contains(target)) return;
      if (mobileStepButtonRef.current?.contains(target)) return;
      setMobileNavOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [mobileNavOpen]);

  // Warn before closing tab/window with unsaved edits or active AI image/request
  useEffect(() => {
    if (!session.dirty && !aiSession.hasUnsentWork) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [aiSession.hasUnsentWork, session.dirty]);

  // Stable global keyboard handler via ref
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (event: KeyboardEvent) => {
    if (session.changingRecord) return;
    if (event.key === 'Escape') {
      if (confirmState) {
        confirmState.resolve(false);
        setConfirmState(null);
        return;
      }
      if (mobileNavOpen) {
        setMobileNavOpen(false);
        mobileStepButtonRef.current?.focus();
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
      if (view !== 'editor') {
        void navigateView('editor');
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void attemptSave(true);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Register unified window.BingliWebHost contract for Android native host
  const webHostRef = useRef<{ handleBack: () => boolean; flushPendingSave: () => void }>({
    handleBack: () => false,
    flushPendingSave: () => {},
  });
  webHostRef.current = {
    handleBack: () => {
      if (session.changingRecord) return true;
      if (document.querySelector('.modal-dialog[aria-modal="true"]')) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
        return true;
      }
      if (mobileNavOpen) {
        setMobileNavOpen(false);
        mobileStepButtonRef.current?.focus();
        return true;
      }
      if (view !== 'editor') {
        void navigateView('editor');
        return true;
      }
      if (stepIndex > 0) {
        session.flushPendingSave();
        goToStep(stepIndex - 1);
        return true;
      }
      return false;
    },
    flushPendingSave: session.flushPendingSave,
  };

  useEffect(() => (
    registerBingliWebHost({
      handleBack: () => webHostRef.current.handleBack(),
      flushPendingSave: () => webHostRef.current.flushPendingSave(),
    })
  ), []);

  const stepStates = useMemo<Partial<Record<StepKey, StepCompletionState>>>(() => {
    const map: Partial<Record<StepKey, StepCompletionState>> = {};
    for (const def of STEPS) {
      map[def.key] = stepState(session.record, def.key);
    }
    return map;
  }, [session.record]);

  const aiSecurityContext = androidBridge ? 'android' as const : 'web' as const;
  const aiConfigured = androidBridge ? androidStatus?.configured === true : apiKey.trim().length > 0;
  const aiModel = androidBridge ? androidStatus?.model ?? 'deepseek-flash' : webAiModel;

  const stepProps: StepComponentProps = {
    record: session.record,
    update: session.update,
    replaceRecord: session.replaceRecord,
    errors: validation.errors,
    onJump: jumpToPath,
    notify: session.notify,
    warnings: validation.warnings,
    settings: session.settings,
    pushUndoSnapshot: session.pushUndoSnapshot,
    onUndo: session.undoLast,
    canUndo: session.canUndo,
    undoLabel: session.undoLabel,
    confirmAction,
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
      stepContent = <OutputStep {...stepProps} settings={session.settings} />;
      break;
  }

  const saveStatus = session.saving ? '正在保存…'
    : session.saveError ? '保存失败'
      : session.saveConflict ? '本机版本已变更'
        : session.dirty ? '有未保存的编辑'
          : session.record.meta.revision || session.list.some(({ id }) => id === session.record.id)
            ? '已保存到本机'
            : '空白病历';

  return (
    <div className="app-shell" ref={workspaceRef}>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="currentColor" />
              <path d="M15 11h12l7 7v18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z" fill="#f7fffb" />
              <path d="M27 11v7h7" fill="#b9eadb" />
              <path d="M18 24h11M18 29h8M18 34h6" stroke="#0b6e66" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="34" cy="34" r="7" fill="#7fe0c0" />
              <path d="m31 34 2 2 4-5" stroke="#073f3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand-copy">
            <div className="brand-title">大病历生成器</div>
            <div className="brand-subtitle">{session.record.basic.name || '未命名病历'}</div>
          </div>
          <div className="save-state" data-error={Boolean(session.saveError || session.saveConflict)}>
            {saveStatus}
          </div>
        </div>
        <nav className="header-actions" aria-label="全局操作">
          {view !== 'editor' ? (
            <button type="button" className="button ghost" onClick={() => void navigateView('editor')}>
              返回编辑
            </button>
          ) : null}
          <button
            type="button"
            className={`button ghost${view === 'records' ? ' is-active' : ''}`}
            aria-current={view === 'records' ? 'page' : undefined}
            onClick={() => void navigateView('records')}
          >
            病历列表
          </button>
          <button
            type="button"
            className={`button ghost${view === 'ai' ? ' is-active' : ''}`}
            aria-current={view === 'ai' ? 'page' : undefined}
            onClick={() => void navigateView('ai')}
          >
            AI 助手
          </button>
          <button
            type="button"
            className={`button ghost${view === 'settings' ? ' is-active' : ''}`}
            aria-current={view === 'settings' ? 'page' : undefined}
            onClick={() => void navigateView('settings')}
          >
            设置
          </button>
          <button type="button" className="button primary" disabled={session.saving} onClick={() => void attemptSave(true)}>
            保存病历
          </button>
        </nav>
      </header>

      {offlineUpdateReady ? (
        <div className="global-notice">
          <Notice tone="info" title="新版已缓存">
            保存编辑后，关闭本应用的所有标签页，再打开即可更新。
          </Notice>
        </div>
      ) : null}

      {session.saveError || session.saveConflict ? (
        <div className="global-notice">
          <Notice tone="warning" title={session.saveError ? '当前编辑尚未保存' : '本机病历有新版本'}>
            <p>{session.saveError || '其他标签页已更新或删除这份病历。可先导出当前编辑，再读取本机版本。'}</p>
            <div className="button-row compact">
              <button type="button" className="button secondary" onClick={() => void exportJson('current', { includeNotes: exportIncludeNotes })}>
                导出当前编辑
              </button>
              {session.saveConflict ? (
                <button type="button" className="button ghost" onClick={() => void session.reloadFromStorage()}>
                  重新读取本机版本
                </button>
              ) : null}
            </div>
          </Notice>
        </div>
      ) : null}

      {session.storageAlert ? (
        <div className="global-notice">
          <Notice tone="warning" title="存储提示">
            <span>{session.storageAlert}</span>
            <div className="button-row compact">
              {session.corruptEntries.length ? (
                <button
                  type="button"
                  className="button secondary compact-button"
                  onClick={() => void session.exportCorruptLegacy()}
                >
                  导出损坏旧数据
                </button>
              ) : null}
              <button
                type="button"
                className="button ghost compact-button"
                onClick={() => session.setStorageAlert('')}
              >
                知道了
              </button>
            </div>
          </Notice>
        </div>
      ) : null}

      <main id="main-content" className={`app-main${view === 'editor' ? ' has-editor-footer' : ''}`}>
        {view === 'records' ? (
          <Suspense fallback={<LazyContentFallback />}>
            <RecordsPage
              list={session.list}
              activeId={session.record.id}
              getExportText={session.buildExportJson}
              recovery={session.recovery}
              corruptEntries={session.corruptEntries}
              includeNotes={exportIncludeNotes}
              onNew={() => void session.createNewRecord()}
              onOpen={(item) => void session.openRecord(item)}
              onCopy={(item) => void session.copyRecord(item)}
              onDelete={(item) => void session.deleteRecord(item)}
              onImport={(raw, mode) => void handleImportJson(raw, mode)}
              onDownload={exportJson}
              onIncludeNotesChange={setExportIncludeNotes}
              onRestoreRecovery={() => void handleRestoreRecovery()}
              onMergeLegacy={() => void session.mergeLegacy()}
              onExportCorruptLegacy={() => void session.exportCorruptLegacy()}
            />
          </Suspense>
        ) : view === 'ai' ? (
          <Suspense fallback={<LazyContentFallback />}>
            <AiPage
              record={session.record}
              configured={aiConfigured}
              securityContext={aiSecurityContext}
              model={aiModel}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              onClearApiKey={clearKeyAndResetTransport}
              onModelChange={setWebAiModel}
              loadingAndroidStatus={androidBridge ? androidStatusLoading : false}
              onOpenAndroidAiSettings={androidBridge?.aiSettings ? () => androidBridge.aiSettings?.() : undefined}
              onRefreshAndroidStatus={androidBridge ? refreshAndroidAiStatus : undefined}
              initialTarget={defaultAiTarget}
              createTransport={createAiTransport}
              onAdoptRecord={adoptAiRecord}
              onRawNotesChange={session.updateRawNotes}
              canUndoAdoption={aiUndo?.recordId === session.record.id}
              onUndoAdoption={undoAiRecord}
              onConfirmField={confirmAiContent}
              onJumpToPath={jumpToPath}
              sessionState={aiSession.session}
              onSessionPatch={aiSession.patchSession}
              sharedAbortRef={aiSession.abortRef}
            />
          </Suspense>
        ) : view === 'settings' ? (
          <Suspense fallback={<LazyContentFallback />}>
            <SettingsPage
              settings={session.settings}
              theme={theme}
              onThemeChange={changeTheme}
              getExportText={session.buildExportJson}
              recovery={session.recovery}
              corruptEntries={session.corruptEntries}
              quotaInfo={session.quotaInfo}
              includeNotes={exportIncludeNotes}
              onChange={(next) => void session.saveSettings(next)}
              onImport={(raw, mode) => void handleImportJson(raw, mode)}
              onDownload={exportJson}
              onIncludeNotesChange={setExportIncludeNotes}
              onRestoreRecovery={() => void handleRestoreRecovery()}
              onMergeLegacy={() => void session.mergeLegacy()}
              onExportCorruptLegacy={() => void session.exportCorruptLegacy()}
            />
          </Suspense>
        ) : (
          <div className="editor-workspace">
            <aside className="desktop-step-directory" aria-label="步骤目录">
              <div className="directory-heading">
                <div className="eyebrow">病历目录</div>
                <strong>{stepIndex + 1} / {STEPS.length}</strong>
              </div>
              <StepDirectory
                steps={STEPS}
                activeIndex={stepIndex}
                states={stepStates}
                onSelect={goToStep}
              />
              <div className="directory-note">任何步骤都可以直接跳转，内容会保留。</div>
            </aside>

            <div className="editor-main">
              <button
                ref={mobileStepButtonRef}
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
                <div ref={mobileStepPanelRef} className="mobile-step-panel" id="mobile-step-nav">
                  <div className="mobile-step-panel-head">
                    <strong>病历目录</strong>
                    <button
                      type="button"
                      className="button ghost compact-button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        mobileStepButtonRef.current?.focus();
                      }}
                    >
                      关闭
                    </button>
                  </div>
                  <StepDirectory
                    steps={STEPS}
                    activeIndex={stepIndex}
                    states={stepStates}
                    onSelect={goToStep}
                  />
                </div>
              ) : null}

              <form
                className="editor-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (stepIndex < STEPS.length - 1) {
                    goToStep(stepIndex + 1);
                  } else {
                    void attemptSave(true);
                  }
                }}
                onBlur={validation.handleFieldBlur}
                noValidate
              >
                <Suspense fallback={<LazyContentFallback />}>
                  {stepContent}
                  <FocusStepField key={stepKey} path={pendingFocus} onHandled={setPendingFocus} />
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
                    <button
                      type="button"
                      className="button ghost"
                      disabled={!session.canUndo}
                      title={session.undoLabel ? `撤销：${session.undoLabel}` : '没有可撤销的操作'}
                      onClick={() => void session.undoLast()}
                    >
                      撤销
                    </button>
                    <button type="button" className="button ghost" onClick={jumpToFirstInvalid}>
                      检查并定位
                    </button>
                    <button type="button" className="button secondary" disabled={session.saving} onClick={() => void attemptSave(true)}>
                      保存
                    </button>
                  </div>
                  <button type="submit" className="button primary" disabled={stepIndex === STEPS.length - 1 && session.saving}>
                    {stepIndex === STEPS.length - 1 ? '保存病历' : '下一步'}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </main>

      {createPortal(
        <div className={`toast${session.toast || session.changingRecord ? ' is-visible' : ''}`} role="status" aria-live="polite">
          {session.changingRecord ? '正在处理本机病历…' : session.toast?.message}
        </div>,
        document.body,
      )}

      <ConfirmModal
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        danger={confirmState?.danger}
        onConfirm={() => {
          const resolve = confirmState?.resolve;
          setConfirmState(null);
          resolve?.(true);
        }}
        onCancel={() => {
          const resolve = confirmState?.resolve;
          setConfirmState(null);
          resolve?.(false);
        }}
      />
    </div>
  );
}
