import { useMemo, useState } from 'react';
import {
  DEPTH,
  GENERATOR,
  HINTS,
  RECORD_CORE,
  type DabingliRecord,
  type DocumentStateResult,
  type DocumentWarning,
  type SoapBasisRow,
  type SoapDiffRow,
  type SoapPlanRow,
} from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt, useStableListKeys } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

const DOC_LABEL: Record<string, string> = {
  empty: '留空（实时自动生成）',
  fresh: '与最新资料同步',
  reviewed: '已核对',
  manual: '手工修改（已保留）',
  stale: '已过期（原始资料有更新）',
  'manual-stale': '手工文字未同步更新',
  legacy: '旧存档迁移（来源待核对）',
};

const GROUP_NAME: Record<string, string> = {
  identity: '身份与主诉',
  hpi: '现病史',
  pe: '体格检查',
  aux: '辅助检查',
  diagnoses: '诊断',
};

function docTone(st: DocumentStateResult | null): string {
  if (!st) return 'muted';
  if (/(^|-)stale$/.test(st.state)) return 'stale';
  if (st.state === 'reviewed' || st.state === 'fresh') return 'ok';
  if (st.state === 'manual') return 'manual';
  return 'muted';
}

function changedGroupsText(st: DocumentStateResult | null): string {
  return (st?.changed ?? []).map((k) => GROUP_NAME[k] ?? k).join('、');
}

function safeDocState(record: DabingliRecord, kind: string, section?: string): DocumentStateResult | null {
  try {
    return RECORD_CORE.documentState(record, kind, section);
  } catch {
    return null;
  }
}

function WarningList({
  warnings,
  onJump,
}: {
  warnings: readonly DocumentWarning[];
  onJump: (path: string) => void;
}) {
  if (!warnings.length) {
    return <p className="muted">当前规则未发现提醒，仍请逐项人工核对。</p>;
  }
  return (
    <ul className="warning-list">
      {warnings.map((warning, index) => {
        const path = warning.paths?.[0];
        return (
          <li key={`${warning.code}-${index}`} className={`warning-item severity-${warning.severity}`}>
            <div>
              <span className="warning-code">{warning.code}</span>
              <p>{warning.message}</p>
            </div>
            {path ? (
              <button type="button" className="button ghost compact-button" onClick={() => onJump(path)}>
                定位
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

type SoapSegmentKey = 's' | 'oPe' | 'oAux' | 'basis';

function soapDraftFor(record: DabingliRecord, seg: SoapSegmentKey): string {
  switch (seg) {
    case 's':
      return GENERATOR.draftCaseSummary(record);
    case 'oPe':
      return GENERATOR.draftObjectivePE(record);
    case 'oAux':
      return GENERATOR.draftObjectiveAux(record);
    case 'basis':
      return GENERATOR.buildBasisSection(record, { fresh: true });
  }
}

export function SummaryStep({
  record,
  update,
  replaceRecord,
  errors,
  onJump,
  notify,
  warnings: warningsProp,
  onUndo,
  canUndo,
}: StepComponentProps) {
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const warnings = useMemo(
    () => warningsProp ?? GENERATOR.validateStructured(record),
    [record, warningsProp],
  );
  const hints = useMemo(() => HINTS.analyze(record), [record]);
  const depth = useMemo(() => DEPTH.check(record), [record]);
  const draftSummary = useMemo(() => GENERATOR.draftSummary(record), [record]);

  const diagnoses = record.diagnosis.confirmed;
  const basisRows = record.soap.a.basisDetail;
  const diffRows = record.soap.a.diff;
  const planRows = record.soap.p.perDiagnosis;
  const dischargeDiagnoses = record.discharge.diagnoses;

  const diagKeys = useStableListKeys(diagnoses.length, record.id);
  const basisKeys = useStableListKeys(basisRows.length, record.id);
  const diffKeys = useStableListKeys(diffRows.length, record.id);
  const planKeys = useStableListKeys(planRows.length, record.id);
  const dischargeDxKeys = useStableListKeys(dischargeDiagnoses.length, record.id);

  const summaryState = useMemo(() => safeDocState(record, 'summary'), [record]);
  const soapStates = useMemo(
    () => ({
      s: safeDocState(record, 'firstCourse', 's'),
      oPe: safeDocState(record, 'firstCourse', 'oPe'),
      oAux: safeDocState(record, 'firstCourse', 'oAux'),
      basis: safeDocState(record, 'firstCourse', 'basis'),
    }),
    [record],
  );
  const admitState = useMemo(() => safeDocState(record, 'discharge', 'admitCondition'), [record]);
  const dischargeDxState = useMemo(() => safeDocState(record, 'discharge', 'diagnoses'), [record]);

  function addDiagnosis(value: string) {
    const diagnosis = value.trim();
    if (!diagnosis || diagnoses.includes(diagnosis)) return;
    update('diagnosis.confirmed', [...diagnoses, diagnosis], { snapshotLabel: `添加诊断：${diagnosis}` });
    setNewDiagnosis('');
  }

  function updateArray<T>(path: string, rows: readonly T[], index: number, patch: Partial<T>) {
    update(path, rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function adoptDraftSummary() {
    const next = RECORD_CORE.cloneValue(record);
    next.summary = GENERATOR.draftSummary(next);
    RECORD_CORE.markDocumentGenerated(next, 'summary');
    replaceRecord(next, { snapshotLabel: '更新摘要草稿' });
    notify('已采用最新摘要草稿；旧摘要可通过撤销恢复', 'success');
  }

  function keepSummaryReviewed() {
    const next = RECORD_CORE.cloneValue(record);
    RECORD_CORE.markDocumentReviewed(next, 'summary');
    replaceRecord(next, { snapshotLabel: '标记摘要已核对' });
    notify('已按当前摘要文字标记核对；资料再变化时会重新提示', 'success');
  }

  function draftAllBlankSoap() {
    const next = RECORD_CORE.cloneValue(record);
    const fillSeg = (seg: SoapSegmentKey, path: string, current: string, text: string) => {
      if (current.trim() || !text) return;
      RECORD_CORE.setPath(next, path, text);
      RECORD_CORE.markDocumentGenerated(next, 'firstCourse', seg);
    };
    fillSeg('s', 'soap.s.summary', next.soap.s.summary, GENERATOR.draftCaseSummary(next));
    fillSeg('oPe', 'soap.o.pe', next.soap.o.pe, GENERATOR.draftObjectivePE(next));
    fillSeg('oAux', 'soap.o.aux', next.soap.o.aux, GENERATOR.draftObjectiveAux(next));
    fillSeg('basis', 'soap.a.basis', next.soap.a.basis, GENERATOR.buildBasisSection(next));
    if (!next.soap.a.basisDetail.length) {
      next.soap.a.basisDetail = GENERATOR.draftBasisDetail(next);
      RECORD_CORE.markDocumentGenerated(next, 'firstCourse', 'basis');
    }
    replaceRecord(next, { snapshotLabel: '补全首次病程录空白段落' });
    notify('已补全空白段落，已有手写内容未改动', 'success');
  }

  function updateSoapSeg(seg: SoapSegmentKey) {
    const next = RECORD_CORE.cloneValue(record);
    if (seg === 'basis') {
      next.soap.a.basisDetail = GENERATOR.draftBasisDetail(next, { fresh: true });
      next.soap.a.basis = '';
    } else {
      const pathMap: Record<Exclude<SoapSegmentKey, 'basis'>, string> = {
        s: 'soap.s.summary',
        oPe: 'soap.o.pe',
        oAux: 'soap.o.aux',
      };
      RECORD_CORE.setPath(next, pathMap[seg], soapDraftFor(next, seg));
    }
    RECORD_CORE.markDocumentGenerated(next, 'firstCourse', seg);
    replaceRecord(next, { snapshotLabel: `更新 SOAP ${seg} 段` });
    notify('已更新该段，其他段落未改动', 'success');
  }

  function reviewSoapSeg(seg: SoapSegmentKey) {
    const next = RECORD_CORE.cloneValue(record);
    RECORD_CORE.markDocumentReviewed(next, 'firstCourse', seg);
    replaceRecord(next, { snapshotLabel: `标记 SOAP ${seg} 已核对` });
    notify('已按当前文字标记核对', 'success');
  }

  function updateAdmitCondition() {
    const next = RECORD_CORE.cloneValue(record);
    next.discharge.admitCondition = GENERATOR.draftAdmitCondition(next);
    RECORD_CORE.markDocumentGenerated(next, 'discharge', 'admitCondition');
    replaceRecord(next, { snapshotLabel: '更新入院情况' });
    notify('已按当前资料重写入院情况；旧文字可通过撤销恢复', 'success');
  }

  function confirmDischargeDiagnoses() {
    const valid = dischargeDiagnoses.map((x) => x.trim()).filter(Boolean);
    if (!valid.length) {
      notify('出院诊断还没有内容');
      return;
    }
    const next = RECORD_CORE.cloneValue(record);
    next.discharge.diagnosesConfirmed = true;
    RECORD_CORE.markDocumentReviewed(next, 'discharge', 'diagnoses');
    replaceRecord(next, { snapshotLabel: '确认出院诊断' });
    notify('出院诊断已确认；初步诊断再变化时会提示差异', 'success');
  }

  function renderSoapStateBar(seg: SoapSegmentKey, title: string) {
    const st = soapStates[seg];
    if (!st) return null;
    if (st.state === 'empty') {
      return (
        <div className="doc-state doc-state-muted" data-doc-state={`fc-${seg}`}>
          <div className="doc-state-title">{title}：留空时按当前资料自动生成，未写入存档。</div>
        </div>
      );
    }
    const stale = /(^|-)stale$/.test(st.state);
    const changed = changedGroupsText(st);
    const draft = stale ? soapDraftFor(record, seg) : '';
    return (
      <div className={`doc-state doc-state-${docTone(st)}`} data-doc-state={`fc-${seg}`}>
        <div className="doc-state-title">
          {title}：{DOC_LABEL[st.state] ?? st.state}
          {stale && changed ? `（${changed}已变化）` : ''}
        </div>
        {stale ? (
          <details className="doc-diff">
            <summary>对比最新草稿</summary>
            <div className="doc-diff-label">现有文字</div>
            <pre className="document-preview small">{st.text}</pre>
            <div className="doc-diff-label">最新草稿</div>
            <pre className="document-preview small">{draft}</pre>
          </details>
        ) : null}
        <div className="button-row compact">
          <button type="button" className="button secondary compact-button" onClick={() => updateSoapSeg(seg)}>
            更新此段
          </button>
          <button type="button" className="button ghost compact-button" onClick={() => reviewSoapSeg(seg)}>
            标记已核对
          </button>
        </div>
      </div>
    );
  }

  return (
    <StepShell
      eyebrow="第 9 / 10 步"
      title="摘要与诊断"
      description={STEP_DESCRIPTIONS.summary}
    >
      <Card title="核对提醒">
        <WarningList warnings={warnings} onJump={onJump} />
      </Card>

      <Card title="初步诊断" description="按主次顺序排列；尚未确定的诊断可在病名后加“？”。">
        <div className="diagnosis-list">
          {diagnoses.length ? (
            diagnoses.map((diagnosis, index) => (
              <div className="inline-row" key={diagKeys.keys[index]}>
                <span className="diagnosis-number">{index + 1}.</span>
                <input
                  type="text"
                  value={diagnosis}
                  aria-label={`诊断 ${index + 1}`}
                  data-field-path="diagnosis.confirmed"
                  onChange={(event) => {
                    const next = [...diagnoses];
                    next[index] = event.target.value;
                    update('diagnosis.confirmed', next);
                  }}
                />
                <button
                  type="button"
                  className="button ghost compact-button"
                  onClick={() => {
                    diagKeys.removeKeyAt(index);
                    update(
                      'diagnosis.confirmed',
                      diagnoses.filter((_, row) => row !== index),
                      { snapshotLabel: `删除诊断 ${index + 1}` },
                    );
                  }}
                >
                  删除
                </button>
              </div>
            ))
          ) : (
            <p className="muted">尚未添加初步诊断。</p>
          )}
        </div>
        <div className="inline-row add-diagnosis">
          <input
            type="text"
            value={newDiagnosis}
            aria-label="新诊断"
            data-field-path="diagnosis.confirmed"
            placeholder="输入诊断后添加"
            onChange={(event) => setNewDiagnosis(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addDiagnosis(newDiagnosis);
              }
            }}
          />
          <button type="button" className="button primary" onClick={() => addDiagnosis(newDiagnosis)}>
            添加
          </button>
        </div>
        {errors['diagnosis.confirmed'] ? (
          <div className="field-error" role="alert">{errors['diagnosis.confirmed']}</div>
        ) : null}
        <FieldRenderer
          path="diagnosis.signature"
          label="医师签名"
          value={stringAt(record, 'diagnosis.signature')}
          onChange={update}
          placeholder="签全名"
          error={errors['diagnosis.signature']}
        />
      </Card>

      <Card title="诊断参考提示" description="由域规则根据阳性发现匹配，仅供参考，不会自动写入诊断。">
        {hints.length ? (
          <div className="hint-list">
            {hints.map((hint) => (
              <article className="hint-card" key={hint.id}>
                <h4>{hint.name}</h4>
                <p>{hint.hint}</p>
                <p className="muted">{hint.note}</p>
                <p className="muted">依据：{hint.matched.join('、')}</p>
                <button
                  type="button"
                  className="button secondary compact-button"
                  disabled={diagnoses.includes(hint.name)}
                  onClick={() => addDiagnosis(hint.name)}
                >
                  {diagnoses.includes(hint.name) ? '已加入诊断' : '加入诊断'}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">暂无匹配提示；记录足够的阳性发现后才会出现。</p>
        )}
      </Card>

      <Card title="病历摘要">
        {summaryState ? (
          summaryState.state === 'empty' ? (
            <div className="doc-state doc-state-muted" data-doc-state="summary">
              <div className="doc-state-title">摘要为空：生成时实时使用自动草稿，未写入存档。</div>
            </div>
          ) : (
            <div className={`doc-state doc-state-${docTone(summaryState)}`} data-doc-state="summary">
              <div className="doc-state-title">
                摘要状态：{DOC_LABEL[summaryState.state] ?? summaryState.state}
                {/(^|-)stale$/.test(summaryState.state) && changedGroupsText(summaryState)
                  ? `（${changedGroupsText(summaryState)}已变化）`
                  : ''}
              </div>
              {/(^|-)stale$/.test(summaryState.state) ? (
                <details className="doc-diff">
                  <summary>对比最新自动草稿</summary>
                  <div className="doc-diff-label">现有摘要</div>
                  <pre className="document-preview small">{summaryState.text}</pre>
                  <div className="doc-diff-label">最新自动草稿</div>
                  <pre className="document-preview small">{draftSummary}</pre>
                </details>
              ) : null}
              <div className="button-row compact">
                <button type="button" className="button secondary compact-button" onClick={adoptDraftSummary}>
                  采用新草稿
                </button>
                <button type="button" className="button ghost compact-button" onClick={keepSummaryReviewed}>
                  保留原文并标记已核对
                </button>
                {onUndo && canUndo ? (
                  <button type="button" className="button ghost compact-button" onClick={() => void onUndo()}>
                    撤销上一步
                  </button>
                ) : null}
              </div>
              <p className="field-hint">「保留原文」只确认当前文字，不会因为资料变化自动改写。</p>
            </div>
          )
        ) : null}
        <div className="button-row compact">
          <button
            type="button"
            className="button secondary"
            onClick={adoptDraftSummary}
          >
            使用自动初稿
          </button>
        </div>
        <FieldRenderer
          path="summary"
          label="摘要"
          value={stringAt(record, 'summary')}
          onChange={update}
          kind="textarea"
          rows={6}
          placeholder="留空时生成器使用自动摘要"
          hint="人工修改后的摘要会按原文使用。"
          error={errors.summary}
        />
        {draftSummary ? (
          <Collapsible title="查看当前自动摘要草稿" syncKey={record.id}>
            <pre className="document-preview small">{draftSummary}</pre>
          </Collapsible>
        ) : null}
      </Card>

      <Collapsible
        title="首次病程录（SOAP）"
        className="major-collapsible"
        defaultOpen={Boolean(record.soap.s.summary || record.soap.a.basis)}
        syncKey={record.id}
      >
        <div className="button-row compact">
          <button type="button" className="button secondary" onClick={draftAllBlankSoap}>
            补全空白段落
          </button>
        </div>
        <FieldRenderer
          path="soap.recordTime"
          label="首次病程录记录时间"
          value={stringAt(record, 'soap.recordTime')}
          onChange={update}
          placeholder="如：2026-10-18 09:30"
          error={errors['soap.recordTime']}
        />

        <Collapsible title="S 主观资料" defaultOpen syncKey={record.id}>
          {renderSoapStateBar('s', 'S 段')}
          <FormGrid>
            <FieldRenderer
              path="soap.s.summary"
              label="病历特点"
              value={stringAt(record, 'soap.s.summary')}
              onChange={update}
              kind="textarea"
              rows={4}
              placeholder="留空则自动归纳现病史，并标注待补充"
              error={errors['soap.s.summary']}
              className="field-wide"
            />
            <FieldRenderer
              path="soap.s.consistency"
              label="与病史采集一致性的补充说明"
              value={stringAt(record, 'soap.s.consistency')}
              onChange={update}
              error={errors['soap.s.consistency']}
              className="field-wide"
            />
          </FormGrid>
        </Collapsible>

        <Collapsible title="O 客观资料" syncKey={record.id}>
          {renderSoapStateBar('oPe', 'O 段·体格检查')}
          {renderSoapStateBar('oAux', 'O 段·辅助检查')}
          <FormGrid>
            <FieldRenderer
              path="soap.o.pe"
              label="对诊断有意义的体格检查"
              value={stringAt(record, 'soap.o.pe')}
              onChange={update}
              kind="textarea"
              rows={3}
              hint="留空时仅由阳性体征生成。"
              error={errors['soap.o.pe']}
            />
            <FieldRenderer
              path="soap.o.aux"
              label="与疾病相关的辅助检查结果"
              value={stringAt(record, 'soap.o.aux')}
              onChange={update}
              kind="textarea"
              rows={3}
              error={errors['soap.o.aux']}
            />
          </FormGrid>
        </Collapsible>

        <Collapsible title="A 评估与鉴别" defaultOpen={Boolean(record.soap.a.basis)} syncKey={record.id}>
          {renderSoapStateBar('basis', 'A 段·诊断依据')}
          <FieldRenderer
            path="soap.a.basis"
            label="诊断依据概述"
            value={stringAt(record, 'soap.a.basis')}
            onChange={update}
            kind="textarea"
            rows={3}
            error={errors['soap.a.basis']}
          />
          <div className="array-list compact-list">
            {basisRows.map((row: SoapBasisRow, index) => (
              <div className="soap-row" key={basisKeys.keys[index]}>
                <div className="array-card-head">
                  <strong>诊断依据 {index + 1}</strong>
                  <button
                    type="button"
                    className="button ghost compact-button"
                    onClick={() => {
                      basisKeys.removeKeyAt(index);
                      update(
                        'soap.a.basisDetail',
                        basisRows.filter((_, rowIndex) => rowIndex !== index),
                        { snapshotLabel: `删除诊断依据 ${index + 1}` },
                      );
                    }}
                  >
                    删除
                  </button>
                </div>
                <input type="text" aria-label={`依据诊断 ${index + 1}`} data-field-path="soap.a.basisDetail" value={row.diagnosis ?? ''} placeholder="诊断名称" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { diagnosis: event.target.value })} />
                <input type="text" aria-label={`依据病史 ${index + 1}`} data-field-path="soap.a.basisDetail" value={row.history ?? ''} placeholder="① 病史依据" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { history: event.target.value })} />
                <input type="text" aria-label={`依据体检 ${index + 1}`} data-field-path="soap.a.basisDetail" value={row.pe ?? ''} placeholder="② 体检依据" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { pe: event.target.value })} />
                <input type="text" aria-label={`依据检查 ${index + 1}`} data-field-path="soap.a.basisDetail" value={row.aux ?? ''} placeholder="③ 辅助检查依据" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { aux: event.target.value })} />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            data-field-path={basisRows.length === 0 ? 'soap.a.basisDetail' : undefined}
            onClick={() => update('soap.a.basisDetail', [...basisRows, { diagnosis: '', history: '', pe: '', aux: '' }])}
          >
            + 添加诊断依据
          </button>

          <div className="array-list compact-list">
            {diffRows.map((row: SoapDiffRow, index) => (
              <div className="soap-row" key={diffKeys.keys[index]}>
                <div className="array-card-head">
                  <strong>鉴别诊断 {index + 1}</strong>
                  <button
                    type="button"
                    className="button ghost compact-button"
                    onClick={() => {
                      diffKeys.removeKeyAt(index);
                      update(
                        'soap.a.diff',
                        diffRows.filter((_, rowIndex) => rowIndex !== index),
                        { snapshotLabel: `删除鉴别诊断 ${index + 1}` },
                      );
                    }}
                  >
                    删除
                  </button>
                </div>
                <input type="text" aria-label={`鉴别诊断 ${index + 1}`} data-field-path="soap.a.diff" value={row.diagnosis ?? ''} placeholder="需要鉴别的疾病" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { diagnosis: event.target.value })} />
                <input type="text" aria-label={`鉴别支持点 ${index + 1}`} data-field-path="soap.a.diff" value={row.why ?? ''} placeholder="支持点" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { why: event.target.value })} />
                <input type="text" aria-label={`鉴别不支持点 ${index + 1}`} data-field-path="soap.a.diff" value={row.against ?? ''} placeholder="不支持点" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { against: event.target.value })} />
                <input type="text" aria-label={`鉴别要点 ${index + 1}`} data-field-path="soap.a.diff" value={row.points ?? ''} placeholder="鉴别要点（可留空）" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { points: event.target.value })} />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            data-field-path={diffRows.length === 0 ? 'soap.a.diff' : undefined}
            onClick={() => update('soap.a.diff', [...diffRows, { diagnosis: '', why: '', against: '', points: '' }])}
          >
            + 添加鉴别诊断
          </button>
          {errors['soap.a.diff'] ? <div className="field-error" role="alert">{errors['soap.a.diff']}</div> : null}
          <FormGrid>
            <FieldRenderer path="soap.a.ranking" label="诊断主次排序说明" value={stringAt(record, 'soap.a.ranking')} onChange={update} error={errors['soap.a.ranking']} />
            <FieldRenderer path="soap.a.diffNote" label="鉴别诊断补充说明" value={stringAt(record, 'soap.a.diffNote')} onChange={update} kind="textarea" rows={2} error={errors['soap.a.diffNote']} />
          </FormGrid>
        </Collapsible>

        <Collapsible title="P 诊疗计划" defaultOpen={Boolean(record.soap.p.principle)} syncKey={record.id}>
          <FieldRenderer
            path="soap.p.principle"
            label="诊疗计划总述"
            value={stringAt(record, 'soap.p.principle')}
            onChange={update}
            kind="textarea"
            rows={3}
            error={errors['soap.p.principle']}
          />
          <div className="array-list compact-list">
            {planRows.map((row: SoapPlanRow, index) => (
              <div className="soap-row" key={planKeys.keys[index]}>
                <div className="array-card-head">
                  <strong>诊疗计划 {index + 1}</strong>
                  <button
                    type="button"
                    className="button ghost compact-button"
                    onClick={() => {
                      planKeys.removeKeyAt(index);
                      update(
                        'soap.p.perDiagnosis',
                        planRows.filter((_, rowIndex) => rowIndex !== index),
                        { snapshotLabel: `删除诊疗计划 ${index + 1}` },
                      );
                    }}
                  >
                    删除
                  </button>
                </div>
                <input type="text" aria-label={`计划诊断 ${index + 1}`} data-field-path="soap.p.perDiagnosis" value={row.diagnosis ?? ''} placeholder="诊断名称" onChange={(event) => updateArray('soap.p.perDiagnosis', planRows, index, { diagnosis: event.target.value })} />
                <input type="text" aria-label={`计划检查 ${index + 1}`} data-field-path="soap.p.perDiagnosis" value={row.exam ?? ''} placeholder="拟完善的检查" onChange={(event) => updateArray('soap.p.perDiagnosis', planRows, index, { exam: event.target.value })} />
                <input type="text" aria-label={`计划治疗 ${index + 1}`} data-field-path="soap.p.perDiagnosis" value={row.treatment ?? ''} placeholder="治疗措施" onChange={(event) => updateArray('soap.p.perDiagnosis', planRows, index, { treatment: event.target.value })} />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            data-field-path={planRows.length === 0 ? 'soap.p.perDiagnosis' : undefined}
            onClick={() => update('soap.p.perDiagnosis', [...planRows, { diagnosis: '', exam: '', treatment: '' }])}
          >
            + 添加诊疗计划
          </button>
          {errors['soap.p.perDiagnosis'] ? <div className="field-error" role="alert">{errors['soap.p.perDiagnosis']}</div> : null}
          <FieldRenderer
            path="soap.p.individual"
            label="个体化说明"
            value={stringAt(record, 'soap.p.individual')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['soap.p.individual']}
          />
        </Collapsible>
      </Collapsible>

      <Collapsible
        title="出院记录"
        className="major-collapsible"
        defaultOpen={Boolean(record.discharge.admitCondition || record.discharge.course)}
        syncKey={record.id}
      >
        {admitState && admitState.state !== 'empty' ? (
          <div className={`doc-state doc-state-${docTone(admitState)}`} data-doc-state="discharge-admit">
            <div className="doc-state-title">
              入院情况：{DOC_LABEL[admitState.state] ?? admitState.state}
              {/(^|-)stale$/.test(admitState.state) && changedGroupsText(admitState)
                ? `（${changedGroupsText(admitState)}已变化）`
                : ''}
            </div>
            {/(^|-)stale$/.test(admitState.state) ? (
              <>
                <p className="field-hint">已确认的入院情况不会被后来更新的出院查体悄悄改写；如需按当前资料重写，请点「更新入院情况」。</p>
                <div className="button-row compact">
                  <button type="button" className="button secondary compact-button" onClick={updateAdmitCondition}>
                    更新入院情况
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <FormGrid>
          <FieldRenderer path="discharge.dischargeDate" label="出院日期" value={stringAt(record, 'discharge.dischargeDate')} onChange={update} kind="date" error={errors['discharge.dischargeDate']} />
          <FieldRenderer path="discharge.course" label="诊疗经过" value={stringAt(record, 'discharge.course')} onChange={update} kind="textarea" rows={4} error={errors['discharge.course']} />
          <FieldRenderer path="discharge.dischargeStatus" label="出院情况" value={stringAt(record, 'discharge.dischargeStatus')} onChange={update} kind="textarea" rows={3} error={errors['discharge.dischargeStatus']} />
          <FieldRenderer path="discharge.admitCondition" label="入院情况" value={stringAt(record, 'discharge.admitCondition')} onChange={update} kind="textarea" rows={3} hint="留空时生成器按主诉、阳性体征与初步诊断生成。" error={errors['discharge.admitCondition']} />
        </FormGrid>

        <div className="subsection-heading">
          <h4>出院诊断</h4>
          <button
            type="button"
            className="button ghost compact-button"
            onClick={() => {
              const next = RECORD_CORE.cloneValue(record);
              next.discharge.diagnoses = diagnoses.slice();
              next.discharge.diagnosesConfirmed = false;
              replaceRecord(next, { snapshotLabel: '从初步诊断带入出院诊断' });
            }}
          >
            从初步诊断带入
          </button>
        </div>
        {dischargeDxState ? (
          !dischargeDiagnoses.length ? (
            <div className="doc-state doc-state-muted" data-doc-state="discharge-dx">
              <div className="doc-state-title">出院诊断：待填写。不会自动沿用初步诊断。</div>
            </div>
          ) : (
            <div
              className={`doc-state doc-state-${record.discharge.diagnosesConfirmed ? 'ok' : 'stale'}`}
              data-doc-state="discharge-dx"
            >
              <div className="doc-state-title">
                出院诊断：{record.discharge.diagnosesConfirmed ? '已确认' : '已填写，尚未确认'}
              </div>
              {dischargeDxState.state === 'legacy' ? (
                <p className="field-hint">这份出院诊断来自旧存档，来源无法判断，请核对。</p>
              ) : null}
              <div className="button-row compact">
                <button type="button" className="button secondary compact-button" onClick={confirmDischargeDiagnoses}>
                  确认出院诊断
                </button>
              </div>
            </div>
          )
        ) : null}
        <div className="diagnosis-list">
          {dischargeDiagnoses.map((diagnosis, index) => (
            <div className="inline-row" key={dischargeDxKeys.keys[index]}>
              <input
                type="text"
                value={diagnosis}
                aria-label={`出院诊断 ${index + 1}`}
                data-field-path="discharge.diagnoses"
                onChange={(event) => {
                  const next = RECORD_CORE.cloneValue(record);
                  next.discharge.diagnoses[index] = event.target.value;
                  next.discharge.diagnosesConfirmed = false;
                  replaceRecord(next);
                }}
              />
              <button
                type="button"
                className="button ghost compact-button"
                onClick={() => {
                  dischargeDxKeys.removeKeyAt(index);
                  const next = RECORD_CORE.cloneValue(record);
                  next.discharge.diagnoses = dischargeDiagnoses.filter((_, row) => row !== index);
                  next.discharge.diagnosesConfirmed = false;
                  replaceRecord(next, { snapshotLabel: `删除出院诊断 ${index + 1}` });
                }}
              >
                删除
              </button>
            </div>
          ))}
          {dischargeDiagnoses.length ? null : <p className="muted">尚未填写出院诊断。</p>}
        </div>
        <button
          type="button"
          className="button secondary"
          data-field-path={dischargeDiagnoses.length === 0 ? 'discharge.diagnoses' : undefined}
          onClick={() => update('discharge.diagnoses', [...dischargeDiagnoses, ''])}
        >
          + 添加出院诊断
        </button>
        <label className="check-chip confirmation-check">
          <input
            type="checkbox"
            checked={record.discharge.diagnosesConfirmed}
            onChange={(event) => update('discharge.diagnosesConfirmed', event.target.checked)}
          />
          <span>我已核对并确认以上出院诊断</span>
        </label>
        {errors['discharge.diagnoses'] ? (
          <div className="field-error" role="alert">{errors['discharge.diagnoses']}</div>
        ) : null}

        <div className="subsection-heading"><h4>出院医嘱</h4></div>
        <FormGrid>
          <FieldRenderer path="discharge.advice.drug" label="药物" value={stringAt(record, 'discharge.advice.drug')} onChange={update} kind="textarea" rows={2} error={errors['discharge.advice.drug']} />
          <FieldRenderer path="discharge.advice.nonDrug" label="非药物治疗" value={stringAt(record, 'discharge.advice.nonDrug')} onChange={update} kind="textarea" rows={2} error={errors['discharge.advice.nonDrug']} />
          <FieldRenderer path="discharge.advice.lifestyle" label="生活指导" value={stringAt(record, 'discharge.advice.lifestyle')} onChange={update} kind="textarea" rows={2} error={errors['discharge.advice.lifestyle']} />
          <FieldRenderer path="discharge.advice.followUp" label="复诊时间" value={stringAt(record, 'discharge.advice.followUp')} onChange={update} error={errors['discharge.advice.followUp']} />
        </FormGrid>
      </Collapsible>

      <Collapsible title="问诊补充提示" badge={`${depth.length} 条`} syncKey={record.id}>
        {depth.length ? (
          <ul className="depth-list">
            {depth.map((item) => {
              const locations = Array.from(new Set(item.evidence
                .map((evidence) => evidence.path)
                .filter((path): path is string => Boolean(path))));
              return (
                <li key={item.id} className={`depth-${item.level}`}>
                  <span>{item.label}</span>
                  <div>
                    <p>{item.message}</p>
                    <small className="depth-meta">
                      <code>{item.code}</code>
                      <code>{item.path}</code>
                      <span>{item.section}</span>
                      {locations.length ? <span>证据：{locations.join('、')}</span> : null}
                    </small>
                    <button
                      type="button"
                      className="button ghost compact-button depth-jump"
                      onClick={() => onJump(item.path)}
                    >
                      定位
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">当前规则未发现需要补充的追问。</p>
        )}
      </Collapsible>

      <p className="muted">记录结构版本 {RECORD_CORE.SCHEMA_VERSION}。提醒只用于核对，不替代临床判断。</p>
    </StepShell>
  );
}
