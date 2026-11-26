import { useMemo, useRef, useState } from 'react';
import { parseBackup, type CorruptLegacyEntry, type RecoveryCopySummary } from '@dabingli/storage';
import { ConfirmModal } from './ConfirmModal';

export interface DataTransferPanelProps {
  exportText?: string;
  getExportText?: (includeNotes: boolean) => string;
  recovery?: RecoveryCopySummary | null;
  corruptEntries?: readonly CorruptLegacyEntry[];
  includeNotes: boolean;
  onIncludeNotesChange: (value: boolean) => void;
  onImport: (raw: string, mode: 'merge' | 'replace') => void;
  onDownload: (scope: 'current' | 'all', options?: { includeNotes?: boolean }) => void;
  onRestoreRecovery?: () => void;
  onMergeLegacy?: () => void;
  onExportCorruptLegacy?: () => void;
}

export function DataTransferPanel({
  exportText,
  getExportText,
  recovery,
  corruptEntries = [],
  includeNotes,
  onIncludeNotesChange,
  onImport,
  onDownload,
  onRestoreRecovery,
  onMergeLegacy,
  onExportCorruptLegacy,
}: DataTransferPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [showExport, setShowExport] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    raw: string;
    fileName: string;
    count: number;
    mode: 'merge' | 'replace';
  } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const replacing = pendingImport?.mode === 'replace';

  const previewText = useMemo(() => {
    if (!showExport) return '';
    if (getExportText) return getExportText(includeNotes);
    return exportText ?? '';
  }, [exportText, getExportText, includeNotes, showExport]);

  return (
    <div className="data-transfer">
      <div className="button-row">
        <button type="button" className="button secondary" onClick={() => onDownload('all', { includeNotes })}>
          下载全部 JSON
        </button>
        <button type="button" className="button ghost" onClick={() => onDownload('current', { includeNotes })}>
          下载当前病历
        </button>
        <button type="button" className="button ghost" onClick={() => setShowExport((value) => !value)}>
          {showExport ? '隐藏 JSON 预览' : '查看导出 JSON'}
        </button>
      </div>
      <label className="export-notes-option">
        <input
          type="checkbox"
          checked={includeNotes}
          onChange={(event) => onIncludeNotesChange(event.target.checked)}
        />
        <span>备份中包含原始笔记（可能含患者信息）</span>
      </label>
      <div className="import-row">
        <label>
          <span>导入方式</span>
          <select value={mode} disabled={readingFile} onChange={(event) => setMode(event.target.value as 'merge' | 'replace')}>
            <option value="merge">合并导入（同 ID 保留较新者）</option>
            <option value="replace">替换全部（需确认）</option>
          </select>
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setReadingFile(true);
            setFileError('');
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const raw = String(reader.result ?? '');
                const { records } = parseBackup(raw);
                setPendingImport({ raw, fileName: file.name, count: records.length, mode });
              } catch (error) {
                setFileError(error instanceof Error ? error.message : '无法读取 JSON 备份');
              }
            };
            reader.onerror = () => setFileError('无法读取 JSON 文件，请重新选择');
            reader.onloadend = () => setReadingFile(false);
            reader.readAsText(file);
            event.target.value = '';
          }}
        />
        <button type="button" className="button primary" disabled={readingFile} onClick={() => inputRef.current?.click()}>
          {readingFile ? '正在读取…' : '选择 JSON 文件'}
        </button>
      </div>
      {fileError ? <p className="field-error" role="alert">{fileError}</p> : null}
      <p className="muted">备份文件含病历资料，请妥善保管。替换导入前会先保存恢复副本。</p>
      {onMergeLegacy || (corruptEntries.length > 0 && onExportCorruptLegacy) ? (
        <div className="button-row">
          {onMergeLegacy ? (
            <button type="button" className="button ghost" onClick={onMergeLegacy}>
              合并导入旧本地数据
            </button>
          ) : null}
          {corruptEntries.length > 0 && onExportCorruptLegacy ? (
            <button type="button" className="button ghost danger" onClick={onExportCorruptLegacy}>
              导出损坏旧数据（{corruptEntries.length} 条）
            </button>
          ) : null}
        </div>
      ) : null}
      {recovery && onRestoreRecovery ? (
        <div className="button-row">
          <p className="muted">
            替换前恢复副本：{new Date(recovery.createdAt).toLocaleString('zh-CN')} · {recovery.recordCount} 份病历
          </p>
          <button type="button" className="button ghost" onClick={onRestoreRecovery}>
            恢复替换前备份
          </button>
        </div>
      ) : null}
      {showExport ? (
        <label className="export-preview">
          <span>当前导出快照（JSON）</span>
          <textarea readOnly value={previewText} rows={10} />
        </label>
      ) : null}
      <ConfirmModal
        open={pendingImport !== null}
        title={replacing ? '确认替换全部病历' : '确认合并导入'}
        message={pendingImport ? (
          <>
            <p className="import-file-summary">{pendingImport.fileName} · {pendingImport.count} 份病历</p>
            <p>{replacing
              ? '将替换当前病历列表。应用会先保存替换前的恢复副本。'
              : '同一份病历按更新时间保留较新的版本。'}</p>
          </>
        ) : ''}
        confirmLabel={replacing ? '确定替换' : '确认导入'}
        danger={replacing}
        onConfirm={() => {
          setPendingImport(null);
          if (pendingImport) onImport(pendingImport.raw, pendingImport.mode);
        }}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
}
