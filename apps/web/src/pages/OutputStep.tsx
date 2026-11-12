import { useMemo, useState } from 'react';
import {
  GENERATOR,
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type DocumentWarning,
} from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { Card, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { STEP_DESCRIPTIONS } from '../steps';

export interface GeneratedDocument {
  key: 'record' | 'firstCourse' | 'discharge';
  title: string;
  text: string;
}

export function buildGeneratedDocuments(
  record: DabingliRecord,
  rosMode: AppSettings['rosMode'],
  firstCourseDate?: string,
): GeneratedDocument[] {
  return [
    {
      key: 'record',
      title: '大病历',
      text: GENERATOR.generate(record, { rosMode }).text,
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
  const documents = useMemo(
    () => buildGeneratedDocuments(record, rosMode, firstCourseDate),
    [record, rosMode, firstCourseDate],
  );
  const firstInvalid = warnings.find((warning) => warning.severity === 'error') ?? warnings[0];

  function sidePlaceholderCount(warning: DocumentWarning): number {
    const evidenceCount = warning.evidence?.length ?? 0;
    const pathCount = warning.paths?.length ?? 0;
    const messageCount = Number(warning.message.match(/仍有\s*(\d+)\s*处/)?.[1] ?? 0);
    return evidenceCount || pathCount || messageCount;
  }

  function confirmSidePlaceholders(): boolean {
    const warning = warnings.find(
      (item) => item.code === 'SIDE_PLACEHOLDER_UNFILLED' && item.severity === 'error',
    );
    if (!warning) return true;
    const count = sidePlaceholderCount(warning);
    return window.confirm(`病历里还有 ${count} 处（患侧/对侧/健侧）没改，确定要复制/下载吗？`);
  }

  async function writeClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      return true;
    } catch {
      return false;
    }
  }

  async function copy(text: string, title: string) {
    if (!confirmSidePlaceholders()) return;
    if (await writeClipboard(text)) {
      setStatus(`已复制${title}`);
    } else {
      setStatus(`复制${title}失败，请手动选择文本`);
    }
  }

  async function share(text: string, title: string) {
    if (!confirmSidePlaceholders()) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text });
        setStatus(`已打开系统分享：${title}`);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    if (await writeClipboard(text)) {
      setStatus(`当前浏览器不支持直接分享，已复制${title}`);
    } else {
      setStatus(`分享${title}失败，请手动选择文本`);
    }
  }

  function download(text: string, title: string) {
    if (!confirmSidePlaceholders()) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = documentFileName(record, title);
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(`已下载${title}`);
  }

  function print(text: string, title: string) {
    if (!confirmSidePlaceholders()) return;
    if (typeof window.print !== 'function') {
      setStatus('当前环境不支持打印');
      return;
    }
    const node = document.createElement('article');
    node.className = 'print-document';
    const heading = document.createElement('h1');
    heading.textContent = title;
    const body = document.createElement('pre');
    body.textContent = text;
    node.append(heading, body);
    document.body.appendChild(node);
    document.body.classList.add('printing-document');
    const cleanup = () => {
      document.body.classList.remove('printing-document');
      node.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    try {
      window.print();
      setStatus(`已打开打印：${title}`);
    } catch {
      cleanup();
      setStatus('当前环境不支持打印');
      return;
    }
    window.setTimeout(cleanup, 3000);
  }

  return (
    <div className="generated-documents">
      <div className="output-toolbar">
        <p>{status || '三份文书各自独立，可分别复制或下载。'}</p>
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
        <Collapsible key={document.key} title={document.title} defaultOpen className="document-card">
          <div className="button-row compact">
            <button type="button" className="button primary" onClick={() => void copy(document.text, document.title)}>
              复制本篇
            </button>
            <button type="button" className="button ghost" onClick={() => download(document.text, document.title)}>
              下载 .txt
            </button>
            <button type="button" className="button ghost" onClick={() => void share(document.text, document.title)}>
              分享
            </button>
            <button type="button" className="button ghost" onClick={() => print(document.text, document.title)}>
              打印 / 存 PDF
            </button>
          </div>
          <pre
            className="document-preview"
            data-testid={`doc-${document.key}`}
            aria-label={`${document.title}正文`}
          >
            {document.text}
          </pre>
        </Collapsible>
      ))}
    </div>
  );
}

export function OutputStep({
  record,
  errors: _errors,
  onJump,
  settings,
}: StepComponentProps & {
  settings: AppSettings;
  errors: Readonly<Record<string, string>>;
}) {
  const warnings = GENERATOR.validateStructured(record);
  return (
    <StepShell
      eyebrow="第 10 / 10 步"
      title="生成病历"
      description={STEP_DESCRIPTIONS.output}
    >
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
