import { useRef, useState } from 'react';

export interface DataTransferPanelProps {
  exportText: string;
  onImport: (raw: string, mode: 'merge' | 'replace') => void;
  onDownload: (scope: 'current' | 'all') => void;
}

export function DataTransferPanel({ exportText, onImport, onDownload }: DataTransferPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="data-transfer">
      <div className="button-row">
        <button type="button" className="button secondary" onClick={() => onDownload('all')}>
          下载全部 JSON
        </button>
        <button type="button" className="button ghost" onClick={() => onDownload('current')}>
          下载当前病历
        </button>
        <button type="button" className="button ghost" onClick={() => setShowExport((value) => !value)}>
          {showExport ? '隐藏 JSON 预览' : '查看导出 JSON'}
        </button>
      </div>
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
      <p className="muted">
        导入兼容现有备份包和单份病历；替换前请先下载备份。旧的 localStorage 键名保持不变。
      </p>
      {showExport ? (
        <label className="export-preview">
          <span>当前导出快照（JSON）</span>
          <textarea readOnly value={exportText} rows={10} />
        </label>
      ) : null}
    </div>
  );
}
