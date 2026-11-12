import { useRef, useState } from 'react';
import type { RecoveryCopySummary } from '@dabingli/storage';

export interface DataTransferPanelProps {
  exportText: string;
  recovery?: RecoveryCopySummary | null;
  includeNotes: boolean;
  onIncludeNotesChange: (value: boolean) => void;
  onImport: (raw: string, mode: 'merge' | 'replace') => void;
  onDownload: (scope: 'current' | 'all', options?: { includeNotes?: boolean }) => void;
  onRestoreRecovery?: () => void;
}

export function DataTransferPanel({
  exportText,
  recovery,
  includeNotes,
  onIncludeNotesChange,
  onImport,
  onDownload,
  onRestoreRecovery,
}: DataTransferPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [showExport, setShowExport] = useState(false);

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
        <span>备份中包含原始笔记（默认关闭；笔记可能含患者信息）</span>
      </label>
      <div className="import-row">
        <label>
          <span>导入方式</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as 'merge' | 'replace')}>
            <option value="merge">合并导入（同 ID 保留较新者）</option>
            <option value="replace">替换全部（需确认）</option>
          </select>
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (mode === 'replace' && !window.confirm('替换全部会覆盖当前病历列表，确定继续吗？')) {
              event.target.value = '';
              return;
            }
            void file.text().then((raw) => onImport(raw, mode));
            event.target.value = '';
          }}
        />
        <button type="button" className="button primary" onClick={() => inputRef.current?.click()}>
          选择 JSON 文件
        </button>
      </div>
      <p className="muted">数据仅保存在本机浏览器；替换导入前会先保存恢复副本。</p>
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
          <textarea readOnly value={exportText} rows={10} />
        </label>
      ) : null}
    </div>
  );
}
