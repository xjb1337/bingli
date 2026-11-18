import { useMemo, useState } from 'react';
import {
  GENERATOR,
  RECORD_CORE,
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type DocumentWarning,
} from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { ConfirmModal, ModalDialog } from '../components/ConfirmModal';
import { Card, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { fieldStoreAt } from '../form-utils';
import {
  nativeCopyText,
  nativeExportFile,
  nativePrintDocument,
  nativeShareText,
} from '../native-host';
import { STEP_DESCRIPTIONS } from '../steps';

export interface GeneratedDocument {
  key: 'record' | 'firstCourse' | 'discharge';
  title: string;
  text: string;
  sections?: Record<string, string>;
}

export function buildGeneratedDocuments(
  record: DabingliRecord,
  rosMode: AppSettings['rosMode'],
  firstCourseDate?: string,
): GeneratedDocument[] {
  const generated = GENERATOR.generate(record, { rosMode });
  return [
    {
      key: 'record',
      title: '大病历',
      text: generated.text,
      sections: generated.sections,
    },
    {
      key: 'firstCourse',
      title: '首次病程录',
      text: GENERATOR.buildFirstCourseRecord(
        record,
        firstCourseDate === undefined ? {} : { date: firstCourseDate },
      ),
    },
    {
      key: 'discharge',
      title: '出院记录',
      text: GENERATOR.buildDischargeRecord(record),
    },
  ];
}

function safeFilePart(value: string, fallback: string): string {
  const text = String(value ?? '').trim()
    .replace(/[\\/:*?"<>|\r\n]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return text || fallback;
}

/** 导出名不使用患者姓名：优先科室，通用科使用病历短 ID。 */
export function documentFileName(
  record: DabingliRecord,
  title: string,
  today: string = SCHEMA.todayStr(),
): string {
  const department = SCHEMA.DEPARTMENTS.find((item) => item.key === record.basic.department);
  const shortId = String(record.id ?? '').replace(/[^0-9a-z]/gi, '').slice(-6) || '病历';
  const tag = department && department.key !== 'general' ? department.name : shortId;
  return [
    safeFilePart(title || '大病历', '大病历'),
    safeFilePart(tag, shortId),
    safeFilePart(record.basic.recordDate || today, today),
  ].join('_') + '.txt';
}

interface ChecklistItem {
  text: string;
  path?: string;
}

function collectPreOutputChecklist(record: DabingliRecord): ChecklistItem[] {
  const fs = record.meta.fieldStates ?? {};
  const aiPending = Object.keys(fs).filter(
    (p) => RECORD_CORE.fieldState(record, p).source === 'ai' && !RECORD_CORE.fieldReviewValid(record, p),
  );
  const tplPending = Object.keys(fs).filter(
    (p) => RECORD_CORE.fieldState(record, p).source === 'template' && !RECORD_CORE.fieldReviewValid(record, p),
  );

  const pePending: Array<{ path: string; label: string; text: string }> = [];
  const groups = SCHEMA.PE_COMMON.map((g) => ({ key: g.key, container: g.key, items: g.items }));
  Object.keys(SCHEMA.PE_SPECIAL).forEach((k) => {
    const sp = SCHEMA.PE_SPECIAL[k];
    if (sp) groups.push({ key: `special_${k}`, container: `special_${k}`, items: sp.items });
  });
  groups.forEach((g) => {
    const store = fieldStoreAt(record, `pe.${g.container}`);
    g.items.forEach((it) => {
      const val = String(store[it.key] ?? '').trim();
      if (val) return;
      if (!SCHEMA.peChecked(record, g.key, it.key)) return;
      const text = SCHEMA.peNormalText(it);
      if (!text) return;
      const path = `pe.${g.container}.${it.key}`;
      if (!RECORD_CORE.fieldReviewValid(record, path, text)) {
        pePending.push({ path, label: it.label || it.key, text });
      }
    });
  });

  const stale: Array<{ label: string; path: string }> = [];
  try {
    if (/(^|-)stale$/.test(RECORD_CORE.documentState(record, 'summary').state)) {
      stale.push({ label: '摘要', path: 'summary' });
    }
    const segs: Array<[string, string, string]> = [
      ['s', '首次病程录 S 段', 'soap.s.summary'],
      ['oPe', '首次病程录 O 段（体检）', 'soap.o.pe'],
      ['oAux', '首次病程录 O 段（辅助检查）', 'soap.o.aux'],
      ['basis', '诊断依据', 'soap.a.basis'],
    ];
    segs.forEach(([seg, label, path]) => {
      if (/(^|-)stale$/.test(RECORD_CORE.documentState(record, 'firstCourse', seg).state)) {
        stale.push({ label, path });
      }
    });
    if (/(^|-)stale$/.test(RECORD_CORE.documentState(record, 'discharge', 'admitCondition').state)) {
      stale.push({ label: '出院记录·入院情况', path: 'discharge.admitCondition' });
    }
  } catch {
    // Ignore invalid partial meta during checklist evaluation.
  }

  const dxUnconfirmed = record.discharge.diagnoses.filter(Boolean).length > 0
    && !record.discharge.diagnosesConfirmed;

  const items: ChecklistItem[] = [];
  if (aiPending.length) {
    items.push({ text: `有 ${aiPending.length} 个字段来自 AI，尚未逐项核对`, path: aiPending[0] });
  }
  if (tplPending.length) {
    items.push({ text: `有 ${tplPending.length} 个字段来自教学模板，尚未核对`, path: tplPending[0] });
  }
  if (pePending.length) {
    items.push({
      text: `有 ${pePending.length} 项查体使用系统默认描述，尚未确认：${pePending.slice(0, 3).map((x) => `${x.label}「${x.text}」`).join('；')}`,
      path: pePending[0]?.path,
    });
  }
  stale.forEach((s) => items.push({ text: `${s.label}已过期：原始资料变过，当前文字未更新`, path: s.path }));
  if (dxUnconfirmed) items.push({ text: '出院诊断已填写，但尚未单独确认', path: 'discharge.diagnoses' });
  return items;
}

const MUST_FIELDS: Array<[string, string]> = [
  ['basic.name', '姓名'],
  ['basic.gender', '性别'],
  ['basic.age', '年龄'],
  ['basic.department', '科室'],
  ['basic.chiefComplaint', '主诉症状'],
];

const SHOULD_FIELDS: Array<[string, string]> = [
  ['basic.recordNo', '住院号'],
  ['basic.admitDate', '入院日期'],
  ['basic.informant', '病史陈述者'],
  ['hpi.onset', '起病情况'],
  ['hpi.symptoms', '症状特点'],
  ['hpi.treatment', '诊治经过'],
  ['pmh.health', '平素健康状况'],
  ['pmh.surgery', '手术史'],
  ['personal.smoking', '吸烟史'],
  ['personal.drinking', '饮酒史'],
  ['pe.vitals.temperature', '体温'],
  ['pe.vitals.pulse', '脉搏'],
  ['pe.vitals.respiration', '呼吸'],
  ['pe.vitals.sbp', '收缩压'],
  ['pe.vitals.dbp', '舒张压'],
];

function computeFillStatus(record: DabingliRecord) {
  const isBlank = (path: string) => {
    const val = RECORD_CORE.getPath(record, path);
    return val === undefined || val === null || String(val).trim() === '';
  };
  const mustMissing = MUST_FIELDS.filter(([path]) => isBlank(path)).map(([, label]) => label);
  const shouldMissing = SHOULD_FIELDS.filter(([path]) => isBlank(path)).map(([, label]) => label);

  const deptKey = record.basic.department || 'general';
  const dept = SCHEMA.DEPARTMENTS.find((d) => d.key === deptKey) ?? SCHEMA.DEPARTMENTS[0];
  let peTotal = 0;
  let peCheckedCount = 0;
  SCHEMA.PE_COMMON.forEach((g) => {
    g.items
      .filter((it) => !it.depts || it.depts.includes(deptKey))
      .forEach((it) => {
        peTotal += 1;
        if (SCHEMA.peChecked(record, g.key, it.key)) peCheckedCount += 1;
      });
  });
  (dept?.special ?? []).forEach((spKey) => {
    const sp = SCHEMA.PE_SPECIAL[spKey];
    if (!sp) return;
    sp.items.forEach((it) => {
      peTotal += 1;
      if (SCHEMA.peChecked(record, `special_${spKey}`, it.key)) peCheckedCount += 1;
    });
  });

  return { mustMissing, shouldMissing, peTotal, peCheckedCount };
}

export function GeneratedDocuments({
  record,
  rosMode = 'detail',
  firstCourseDate,
  warnings = [],
  onJump,
}: {
  record: DabingliRecord;
  rosMode?: AppSettings['rosMode'];
  firstCourseDate?: string;
  warnings?: readonly DocumentWarning[];
  onJump?: (path: string) => void;
}) {
  const [status, setStatus] = useState('');
  const [pendingAction, setPendingAction] = useState<{ count: number; run: () => void | Promise<void> } | null>(null);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);

  const documents = useMemo(
    () => buildGeneratedDocuments(record, rosMode, firstCourseDate),
    [record, rosMode, firstCourseDate],
  );
  const selfCheckNotes = useMemo(() => {
    try {
      return GENERATOR.firstCourseSelfCheck(record);
    } catch {
      return [];
    }
  }, [record]);

  const firstInvalid = warnings.find((warning) => warning.severity === 'error') ?? warnings[0];
  const recordDoc = documents.find((doc) => doc.key === 'record');
  const sectionNames = useMemo(
    () => GENERATOR.SECTION_ORDER.filter((name) => Boolean(recordDoc?.sections?.[name])),
    [recordDoc],
  );

  function sidePlaceholderCount(warning: DocumentWarning): number {
    const evidenceCount = warning.evidence?.length ?? 0;
    const pathCount = warning.paths?.length ?? 0;
    const messageCount = Number(warning.message.match(/仍有\s*(\d+)\s*处/)?.[1] ?? 0);
    return evidenceCount || pathCount || messageCount;
  }

  function runWithSideCheck(action: () => void | Promise<void>) {
    const warning = warnings.find(
      (item) => item.code === 'SIDE_PLACEHOLDER_UNFILLED' && item.severity === 'error',
    );
    if (!warning) {
      void action();
      return;
    }
    setPendingAction({ count: sidePlaceholderCount(warning), run: action });
  }

  async function doCopy(text: string, title: string) {
    if (await nativeCopyText(text)) {
      setStatus(`已复制${title}`);
    } else {
      setStatus(`复制${title}失败，请手动选择文本`);
    }
  }

  async function doShare(text: string, title: string) {
    const res = await nativeShareText(text, documentFileName(record, title), title);
    if (res === 'shared') setStatus(`已打开系统分享：${title}`);
    else if (res === 'copied') setStatus(`当前浏览器不支持直接分享，已复制${title}`);
    else if (res === 'failed') setStatus(`分享${title}失败，请手动选择文本`);
  }

  function doDownload(text: string, title: string) {
    nativeExportFile(text, documentFileName(record, title), 'text/plain');
    setStatus(`已下载${title}`);
  }

  function doPrint(text: string, title: string) {
    if (nativePrintDocument(title, text)) {
      setStatus(`已打开打印：${title}`);
    } else {
      setStatus('当前环境不支持打印');
    }
  }

  return (
    <div className="generated-documents">
      <div className="output-toolbar">
        <p role="status">{status || '三份文书各自独立，可分别复制或下载。'}</p>
        {firstInvalid?.paths?.[0] && onJump ? (
          <button
            type="button"
            className="button secondary"
            onClick={() => onJump(firstInvalid.paths?.[0] ?? '')}
          >
            定位第一处提醒
          </button>
        ) : null}
      </div>
      {documents.map((document) => (
        <Collapsible key={document.key} title={document.title} defaultOpen syncKey={record.id} className="document-card">
          <div className="button-row compact">
            <button
              type="button"
              className="button primary"
              onClick={() => runWithSideCheck(() => doCopy(document.text, document.title))}
            >
              复制本篇
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => runWithSideCheck(() => doDownload(document.text, document.title))}
            >
              下载 .txt
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => runWithSideCheck(() => doShare(document.text, document.title))}
            >
              分享
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => runWithSideCheck(() => doPrint(document.text, document.title))}
            >
              打印 / 存 PDF
            </button>
            {document.key === 'record' && sectionNames.length ? (
              <button
                type="button"
                className="button ghost"
                onClick={() => setSectionPickerOpen(true)}
              >
                复制某段
              </button>
            ) : null}
          </div>
          <pre
            className="document-preview"
            data-testid={`doc-${document.key}`}
            aria-label={`${document.title}正文`}
          >
            {document.text}
          </pre>
          {document.key === 'firstCourse' && selfCheckNotes.length ? (
            <div className="selfcheck-notes" role="note">
              <strong>自查提醒（不会写入病历正文）</strong>
              <ul>
                {selfCheckNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Collapsible>
      ))}

      <ModalDialog open={sectionPickerOpen} title="选择要复制的段落" onClose={() => setSectionPickerOpen(false)}>
        <div className="choice-cloud">
          {sectionNames.map((name) => (
            <button
              type="button"
              key={name}
              className="choice-chip"
              onClick={() => {
                const secText = `${name}：${recordDoc?.sections?.[name] ?? ''}`;
                setSectionPickerOpen(false);
                runWithSideCheck(() => doCopy(secText, `段落「${name}」`));
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </ModalDialog>

      <ConfirmModal
        open={pendingAction !== null}
        title="侧别占位符尚未替换"
        message={`病历里还有 ${pendingAction?.count ?? 0} 处（患侧/对侧/健侧）没改，确定要复制/下载吗？`}
        confirmLabel="仍要继续"
        onConfirm={() => {
          const run = pendingAction?.run;
          setPendingAction(null);
          if (run) void run();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export function OutputStep({
  record,
  errors: _errors,
  onJump,
  settings,
  warnings: warningsProp,
}: StepComponentProps & {
  settings: AppSettings;
  errors: Readonly<Record<string, string>>;
}) {
  const warnings = useMemo(
    () => warningsProp ?? GENERATOR.validateStructured(record),
    [record, warningsProp],
  );
  const checklist = useMemo(() => collectPreOutputChecklist(record), [record]);
  const fillStatus = useMemo(() => computeFillStatus(record), [record]);

  return (
    <StepShell
      eyebrow="第 10 / 10 步"
      title="生成病历"
      description={STEP_DESCRIPTIONS.output}
    >
      <Card title="输出前核对清单">
        {checklist.length ? (
          <div className="doc-state doc-state-stale" data-doc-state="output-check">
            <div className="doc-state-title">以下 {checklist.length} 类内容尚未确认（仍可复制草稿）</div>
            <ul className="outline-list">
              {checklist.map((item, idx) => (
                <li key={idx}>
                  <span>{item.text}</span>
                  {item.path ? (
                    <button
                      type="button"
                      className="button ghost compact-button"
                      onClick={() => onJump(item.path ?? '')}
                    >
                      定位
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="doc-state doc-state-ok" data-doc-state="output-check">
            <div className="doc-state-title">没有未确认的模板事实、默认查体或过期段落。</div>
            <p className="field-hint">自动检查不能替代逐字核对；复制的是草稿，不是已签发的病历。</p>
          </div>
        )}
      </Card>

      <Card title="输出核对" description="复制前请逐项核对模板来源、查体、生命体征和诊断。自动检查不能代替临床核对。">
        {warnings.length ? (
          <ul className="warning-list">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`} className={`warning-item severity-${warning.severity}`}>
                <div>
                  <span className="warning-code">{warning.code}</span>
                  <p>{warning.message}</p>
                </div>
                {warning.paths?.[0] ? (
                  <button
                    type="button"
                    className="button ghost compact-button"
                    onClick={() => onJump(warning.paths?.[0] ?? '')}
                  >
                    定位
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">当前规则未发现提醒，仍须人工核对。</p>
        )}

        <Collapsible title="填写情况总览" syncKey={record.id}>
          <div className="fill-status-grid">
            <div className="fill-status-row">
              <strong>必填项</strong>
              <span>
                {fillStatus.mustMissing.length
                  ? `还差 ${fillStatus.mustMissing.length} 项：${fillStatus.mustMissing.join('、')}`
                  : '姓名、性别、年龄、科室、主诉都已填'}
              </span>
            </div>
            <div className="fill-status-row">
              <strong>建议填写</strong>
              <span>
                {fillStatus.shouldMissing.length
                  ? `还差 ${fillStatus.shouldMissing.length} 项：${fillStatus.shouldMissing.join('、')}`
                  : '建议项都已填'}
              </span>
            </div>
            <div className="fill-status-row">
              <strong>体格检查</strong>
              <span>
                {fillStatus.peTotal} 项中 {fillStatus.peCheckedCount} 项已勾选（未勾选不写入病历）
              </span>
            </div>
          </div>
        </Collapsible>
      </Card>

      <GeneratedDocuments
        record={record}
        rosMode={settings.rosMode}
        firstCourseDate={record.soap.recordTime.trim() || undefined}
        warnings={warnings}
        onJump={onJump}
      />
    </StepShell>
  );
}
