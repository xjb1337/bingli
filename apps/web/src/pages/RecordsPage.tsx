import { useMemo, useState } from 'react';
import { RECORD_CORE, SCHEMA, type RecordListItem } from '@dabingli/domain';
import type { RecoveryCopySummary } from '@dabingli/storage';
import { DataTransferPanel } from '../components/DataTransferPanel';
import { Card } from '../components/StepShell';

export function RecordsPage({
  list,
  activeId,
  exportText,
  recovery,
  includeNotes,
  onNew,
  onOpen,
  onCopy,
  onDelete,
  onImport,
  onDownload,
  onIncludeNotesChange,
  onRestoreRecovery,
}: {
  list: readonly RecordListItem[];
  activeId?: string;
  exportText: string;
  recovery?: RecoveryCopySummary | null;
  includeNotes: boolean;
  onNew: () => void;
  onOpen: (record: RecordListItem) => void;
  onCopy: (record: RecordListItem) => void;
  onDelete: (record: RecordListItem) => void;
  onImport: (raw: string, mode: 'merge' | 'replace') => void;
  onDownload: (scope: 'current' | 'all', options?: { includeNotes?: boolean }) => void;
  onIncludeNotesChange: (value: boolean) => void;
  onRestoreRecovery?: () => void;
}) {
  const [query, setQuery] = useState('');
  const departmentNames = useMemo(
    () => new Map(SCHEMA.DEPARTMENTS.map((item) => [item.key, item.name])),
    [],
  );
  const summaries = useMemo(() => {
    const matched = RECORD_CORE.searchRecords([...list], query, {
      departmentName: (key) => departmentNames.get(key) ?? key,
    });
    return RECORD_CORE.sortByUpdated(matched).map((item) => {
      const summary = RECORD_CORE.summarize(item);
      return {
        item,
        summary,
        departmentName: departmentNames.get(summary.department) ?? summary.department ?? '未选科室',
      };
    });
  }, [departmentNames, list, query]);

  return (
    <section className="workspace-page" aria-labelledby="records-heading">
      <header className="page-header">
        <div>
          <div className="eyebrow">本机病历</div>
          <h2 id="records-heading">病历列表</h2>
          <p>病历保存在本机 IndexedDB；旧 localStorage 只在首次启动时只读迁移，原数据不会删除。</p>
        </div>
        <button type="button" className="button primary" onClick={onNew}>
          + 新建病历
        </button>
      </header>

      <label className="record-search">
        <span>搜索病历</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="姓名、主诉、科室、诊断，支持部分匹配"
          autoComplete="off"
        />
      </label>

      <div className="record-grid">
        {summaries.length ? (
          summaries.map(({ item, summary, departmentName }) => (
            <article key={item.id} className={`record-card${item.id === activeId ? ' is-active' : ''}`}>
              <div className="record-card-head">
                <div>
                  <h3>{summary.name}</h3>
                  <p>{[summary.gender, summary.age].filter(Boolean).join(' · ') || '未填基本信息'}</p>
                </div>
                {item.id === activeId ? <span className="state-pill positive">当前</span> : null}
              </div>
              <dl>
                <div><dt>科室</dt><dd>{departmentName}</dd></div>
                <div><dt>主诉</dt><dd>{summary.chiefComplaint || '未填写'}</dd></div>
                <div><dt>更新时间</dt><dd>{summary.updatedAt ? new Date(summary.updatedAt).toLocaleString('zh-CN') : '—'}</dd></div>
              </dl>
              <div className="button-row compact">
                <button type="button" className="button primary" onClick={() => onOpen(item)}>
                  打开
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => {
                    if (window.confirm('复制为新病历？将保留科室和病种相关结构，清空身份信息、生命体征数值、日期和号码，且不复制原始笔记。')) onCopy(item);
                  }}
                >
                  复制为新病历
                </button>
                <button
                  type="button"
                  className="button ghost danger"
                  onClick={() => {
                    if (window.confirm(`删除“${summary.name}”及其草稿（含原始笔记）吗？`)) onDelete(item);
                  }}
                >
                  删除
                </button>
              </div>
            </article>
          ))
        ) : query.trim() ? (
          <div className="empty-state empty-state--records">
            <h3>没有匹配的病历</h3>
            <p>未找到“{query.trim()}”。可换用姓名、主诉、科室或诊断的部分文字。</p>
          </div>
        ) : (
          <div className="empty-state empty-state--records">
            <span className="empty-state-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M13 5h16l8 8v27a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" />
                <path d="M29 5v8h8M17 22h14M17 28h10M17 34h7" />
              </svg>
            </span>
            <h3>还没有保存的病历</h3>
            <p>先录入患者资料，保存后会在这里形成可按科室、主诉快速识别的档案。</p>
            <button type="button" className="button primary" onClick={onNew}>新建第一份病历</button>
            <span className="empty-state-note">也可以从下方导入 JSON 备份</span>
          </div>
        )}
      </div>

      <Card title="导入 / 导出">
        <DataTransferPanel
          exportText={exportText}
          recovery={recovery}
          includeNotes={includeNotes}
          onIncludeNotesChange={onIncludeNotesChange}
          onImport={onImport}
          onDownload={onDownload}
          onRestoreRecovery={onRestoreRecovery}
        />
      </Card>
    </section>
  );
}
