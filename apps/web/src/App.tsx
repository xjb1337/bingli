import {
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
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type DocumentWarning,
  type RecordListItem,
} from '@dabingli/domain';
import { Notice } from './components/Notice';
import { StepDirectory } from './components/StepDirectory';
import { AuxStep } from './pages/AuxStep';
import { BasicStep } from './pages/BasicStep';
import { FamilyStep } from './pages/FamilyStep';
import { HpiStep } from './pages/HpiStep';
import { MarriageStep } from './pages/MarriageStep';
import { OutputStep } from './pages/OutputStep';
import { PeStep } from './pages/PeStep';
import { PersonalStep } from './pages/PersonalStep';
import { PmhStep } from './pages/PmhStep';
import { RecordsPage } from './pages/RecordsPage';
import { RosStep } from './pages/RosStep';
import { SettingsPage } from './pages/SettingsPage';
import { SummaryStep } from './pages/SummaryStep';
import {
  createLocalStorageRepository,
  type RecordRepository,
} from './repository';
import { STEPS, stepIndexOf, stepKeyForPath, type StepKey } from './steps';
import type { StepComponentProps } from './editor-types';

type AppView = 'editor' | 'records' | 'settings';

interface InitialState {
  record: DabingliRecord;
  list: RecordListItem[];
  settings: AppSettings;
  stepIndex: number;
  alert: string;
}

interface ToastState {
  message: string;
  tone: 'info' | 'success' | 'error';
  key: number;
}

function initialize(repository: RecordRepository): InitialState {
  const current = repository.loadCurrent();
  const listResult = repository.loadList();
  const settingsResult = repository.loadSettings();
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

export function App({ repository }: { repository?: RecordRepository }) {
  const repositoryRef = useRef<RecordRepository | null>(repository ?? null);
  if (!repositoryRef.current) repositoryRef.current = createLocalStorageRepository();
  const repo = repositoryRef.current;
  const [initial] = useState<InitialState>(() => initialize(repo));
  const [record, setRecord] = useState<DabingliRecord>(initial.record);
  const [list, setList] = useState<RecordListItem[]>(initial.list);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);
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
  const toastTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

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

  function persistRecord(showToast = true): boolean {
    const revision = Number(record.meta.revision) || 0;
    const saved = repo.saveToLibrary(record, revision);
    if (!saved.ok) {
      setStorageAlert(saved.reason ?? '保存失败，请先导出备份。');
      notify(saved.reason ?? '保存失败', 'error');
      return false;
    }
    const nextRecord = saved.record ?? record;
    setRecord(nextRecord);
    setDirty(false);
    const loaded = repo.loadList();
    if (loaded.ok) {
      setList(loaded.list);
      refreshExportPreview(nextRecord, loaded.list);
    }
    if (showToast) notify('已保存到本机', 'success');
    return true;
  }

  function attemptSave(showToast = true) {
    setValidationAttempted(true);
    const saved = persistRecord(showToast);
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

  function saveSettings(next: AppSettings) {
    const normalized = RECORD_CORE.normalizeSettings(next);
    setSettings(normalized);
    const result = repo.saveSettings(normalized);
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
    repo.saveSettings(nextSettings);
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

  function createNewRecord() {
    const next = repo.newRecord();
    const saved = repo.saveToLibrary(next, 0);
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
    const loaded = repo.loadList();
    if (loaded.ok) setList(loaded.list);
    refreshExportPreview(persisted, loaded.ok ? loaded.list : list);
    notify('已新建空白病历', 'success');
  }

  function openRecord(item: RecordListItem) {
    const next = RECORD_CORE.cloneValue(item.data);
    setRecord(next);
    setView('editor');
    setStepIndex(0);
    setDirty(false);
    resetValidationState();
    const saved = repo.saveToLibrary(next, Number(next.meta.revision) || 0);
    if (saved.ok) {
      setRecord(saved.record ?? next);
      refreshExportPreview(saved.record ?? next, list);
    }
    notify(`已打开 ${item.basic?.name || RECORD_CORE.summarize(item).name}`);
  }

  function deleteRecord(item: RecordListItem) {
    const nextList = RECORD_CORE.removeRecord(list, item.id);
    const result = repo.saveList(nextList);
    if (!result.ok) {
      notify(result.reason ?? '删除失败', 'error');
      return;
    }
    repo.remove(`${repo.keys.draftPrefix}${item.id}`);
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

  function importJson(raw: string, mode: 'merge' | 'replace') {
    try {
      const parsed = RECORD_CORE.parseImport(raw, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map((item) => item.key));
      const nextList =
        mode === 'replace'
          ? RECORD_CORE.replaceImport(parsed.records)
          : RECORD_CORE.mergeImport(list, parsed.records).list;
      const result = repo.saveList(nextList);
      if (!result.ok) throw new Error(result.reason ?? '写入病历列表失败');
      setList(nextList);
      const first = parsed.records[0];
      if (first) {
        const next = RECORD_CORE.cloneValue(first.data);
        const saved = repo.saveToLibrary(next, Number(next.meta.revision) || 0);
        if (saved.ok && saved.record) {
          setRecord(saved.record);
          refreshExportPreview(saved.record, nextList);
        }
      }
      setView('records');
      notify(`导入完成：${parsed.records.length} 份病历`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      notify(`导入失败：${message}`, 'error');
    }
  }

  function exportJson(scope: 'current' | 'all') {
    const bundle =
      scope === 'all'
        ? RECORD_CORE.buildExport(list, undefined, { includeDraft: true, draft: record })
        : RECORD_CORE.buildExport([], undefined, { includeDraft: true, draft: record });
    const text = JSON.stringify(bundle, null, 2);
    setExportText(text);
    downloadJson(text, scope === 'all' ? 'dabingli-records.json' : `dabingli-${record.id ?? 'record'}.json`);
    notify('已下载 JSON 备份', 'success');
  }

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
      stepContent = <OutputStep {...stepProps} settings={settings} />;
      break;
  }

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistRecord(false);
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
        attemptSave(true);
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
      attemptSave(true);
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
          <RecordsPage
            list={list}
            activeId={record.id}
            exportText={exportText}
            onNew={createNewRecord}
            onOpen={openRecord}
            onDelete={deleteRecord}
            onImport={importJson}
            onDownload={exportJson}
          />
        ) : view === 'settings' ? (
          <SettingsPage
            settings={settings}
            exportText={exportText}
            onChange={saveSettings}
            onImport={importJson}
            onDownload={exportJson}
          />
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
                {stepContent}
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
