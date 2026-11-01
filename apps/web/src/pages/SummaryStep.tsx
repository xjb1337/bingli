import { useState } from 'react';
import {
  DEPTH,
  GENERATOR,
  HINTS,
  RECORD_CORE,
  type DocumentWarning,
  type SoapBasisRow,
  type SoapDiffRow,
  type SoapPlanRow,
} from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

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

export function SummaryStep({ record, update, errors, onJump }: StepComponentProps) {
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const warnings = GENERATOR.validateStructured(record);
  const hints = HINTS.analyze(record);
  const depth = DEPTH.check(record);
  const diagnoses = record.diagnosis.confirmed;
  const basisRows = record.soap.a.basisDetail;
  const diffRows = record.soap.a.diff;
  const planRows = record.soap.p.perDiagnosis;
  const draftSummary = GENERATOR.draftSummary(record);

  function addDiagnosis(value: string) {
    const diagnosis = value.trim();
    if (!diagnosis || diagnoses.includes(diagnosis)) return;
    update('diagnosis.confirmed', [...diagnoses, diagnosis]);
    setNewDiagnosis('');
  }

  function updateArray<T>(path: string, rows: readonly T[], index: number, patch: Partial<T>) {
    update(path, rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  return (
    <StepShell
      eyebrow="第 10 / 11 步"
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
              <div className="inline-row" key={`${diagnosis}-${index}`}>
                <span className="diagnosis-number">{index + 1}.</span>
                <input
                  type="text"
                  value={diagnosis}
                  aria-label={`诊断 ${index + 1}`}
                  data-field-path={index === 0 ? 'diagnosis.confirmed' : undefined}
                  onChange={(event) => {
                    const next = [...diagnoses];
                    next[index] = event.target.value;
                    update('diagnosis.confirmed', next);
                  }}
                />
                <button
                  type="button"
                  className="button ghost compact-button"
                  onClick={() => update('diagnosis.confirmed', diagnoses.filter((_, row) => row !== index))}
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
          <div className="field-error">{errors['diagnosis.confirmed']}</div>
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
        <div className="button-row compact">
          <button
            type="button"
            className="button secondary"
            onClick={() => update('summary', draftSummary)}
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
          <Collapsible title="查看当前自动摘要草稿">
            <pre className="document-preview small">{draftSummary}</pre>
          </Collapsible>
        ) : null}
      </Card>

      <Collapsible
        title="首次病程录（SOAP）"
        className="major-collapsible"
        defaultOpen={Boolean(record.soap.s.summary || record.soap.a.basis)}
      >
        <FieldRenderer
          path="soap.recordTime"
          label="首次病程录记录时间"
          value={stringAt(record, 'soap.recordTime')}
          onChange={update}
          placeholder="如：2026-10-18 09:30"
          error={errors['soap.recordTime']}
        />

        <Collapsible title="S 主观资料" defaultOpen>
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

        <Collapsible title="O 客观资料">
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

        <Collapsible title="A 评估与鉴别" defaultOpen={Boolean(record.soap.a.basis)}>
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
              <div className="soap-row" key={index}>
                <div className="array-card-head">
                  <strong>诊断依据 {index + 1}</strong>
                  <button type="button" className="button ghost compact-button" onClick={() => update('soap.a.basisDetail', basisRows.filter((_, rowIndex) => rowIndex !== index))}>删除</button>
                </div>
                <input type="text" aria-label={`依据诊断 ${index + 1}`} data-field-path={index === 0 ? 'soap.a.basisDetail' : undefined} value={row.diagnosis ?? ''} placeholder="诊断名称" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { diagnosis: event.target.value })} />
                <input type="text" aria-label={`依据病史 ${index + 1}`} value={row.history ?? ''} placeholder="① 病史依据" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { history: event.target.value })} />
                <input type="text" aria-label={`依据体检 ${index + 1}`} value={row.pe ?? ''} placeholder="② 体检依据" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { pe: event.target.value })} />
                <input type="text" aria-label={`依据检查 ${index + 1}`} value={row.aux ?? ''} placeholder="③ 辅助检查依据" onChange={(event) => updateArray('soap.a.basisDetail', basisRows, index, { aux: event.target.value })} />
              </div>
            ))}
          </div>
          <button type="button" className="button secondary" data-field-path={basisRows.length === 0 ? 'soap.a.basisDetail' : undefined} onClick={() => update('soap.a.basisDetail', [...basisRows, { diagnosis: '', history: '', pe: '', aux: '' }])}>+ 添加诊断依据</button>

          <div className="array-list compact-list">
            {diffRows.map((row: SoapDiffRow, index) => (
              <div className="soap-row" key={index}>
                <div className="array-card-head">
                  <strong>鉴别诊断 {index + 1}</strong>
                  <button type="button" className="button ghost compact-button" onClick={() => update('soap.a.diff', diffRows.filter((_, rowIndex) => rowIndex !== index))}>删除</button>
                </div>
                <input type="text" aria-label={`鉴别诊断 ${index + 1}`} data-field-path={index === 0 ? 'soap.a.diff' : undefined} value={row.diagnosis ?? ''} placeholder="需要鉴别的疾病" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { diagnosis: event.target.value })} />
                <input type="text" aria-label={`鉴别支持点 ${index + 1}`} value={row.why ?? ''} placeholder="支持点" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { why: event.target.value })} />
                <input type="text" aria-label={`鉴别不支持点 ${index + 1}`} value={row.against ?? ''} placeholder="不支持点" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { against: event.target.value })} />
                <input type="text" aria-label={`鉴别要点 ${index + 1}`} value={row.points ?? ''} placeholder="鉴别要点（可留空）" onChange={(event) => updateArray('soap.a.diff', diffRows, index, { points: event.target.value })} />
              </div>
            ))}
          </div>
          <button type="button" className="button secondary" data-field-path={diffRows.length === 0 ? 'soap.a.diff' : undefined} onClick={() => update('soap.a.diff', [...diffRows, { diagnosis: '', why: '', against: '', points: '' }])}>+ 添加鉴别诊断</button>
          {errors['soap.a.diff'] ? <div className="field-error">{errors['soap.a.diff']}</div> : null}
          <FormGrid>
            <FieldRenderer path="soap.a.ranking" label="诊断主次排序说明" value={stringAt(record, 'soap.a.ranking')} onChange={update} error={errors['soap.a.ranking']} />
            <FieldRenderer path="soap.a.diffNote" label="鉴别诊断补充说明" value={stringAt(record, 'soap.a.diffNote')} onChange={update} kind="textarea" rows={2} error={errors['soap.a.diffNote']} />
          </FormGrid>
        </Collapsible>

        <Collapsible title="P 诊疗计划" defaultOpen={Boolean(record.soap.p.principle)}>
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
              <div className="soap-row" key={index}>
                <div className="array-card-head">
                  <strong>诊疗计划 {index + 1}</strong>
                  <button type="button" className="button ghost compact-button" onClick={() => update('soap.p.perDiagnosis', planRows.filter((_, rowIndex) => rowIndex !== index))}>删除</button>
                </div>
                <input type="text" aria-label={`计划诊断 ${index + 1}`} data-field-path={index === 0 ? 'soap.p.perDiagnosis' : undefined} value={row.diagnosis ?? ''} placeholder="诊断名称" onChange={(event) => updateArray('soap.p.perDiagnosis', planRows, index, { diagnosis: event.target.value })} />
                <input type="text" aria-label={`计划检查 ${index + 1}`} value={row.exam ?? ''} placeholder="拟完善的检查" onChange={(event) => updateArray('soap.p.perDiagnosis', planRows, index, { exam: event.target.value })} />
                <input type="text" aria-label={`计划治疗 ${index + 1}`} value={row.treatment ?? ''} placeholder="治疗措施" onChange={(event) => updateArray('soap.p.perDiagnosis', planRows, index, { treatment: event.target.value })} />
              </div>
            ))}
          </div>
          <button type="button" className="button secondary" data-field-path={planRows.length === 0 ? 'soap.p.perDiagnosis' : undefined} onClick={() => update('soap.p.perDiagnosis', [...planRows, { diagnosis: '', exam: '', treatment: '' }])}>+ 添加诊疗计划</button>
          {errors['soap.p.perDiagnosis'] ? <div className="field-error">{errors['soap.p.perDiagnosis']}</div> : null}
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
      >
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
              update('discharge.diagnoses', diagnoses.slice());
              update('discharge.diagnosesConfirmed', false);
            }}
          >
            从初步诊断带入
          </button>
        </div>
        <div className="diagnosis-list">
          {record.discharge.diagnoses.map((diagnosis, index) => (
            <div className="inline-row" key={index}>
              <input
                type="text"
                value={diagnosis}
                aria-label={`出院诊断 ${index + 1}`}
                data-field-path={index === 0 ? 'discharge.diagnoses' : undefined}
                onChange={(event) => {
                  const next = [...record.discharge.diagnoses];
                  next[index] = event.target.value;
                  update('discharge.diagnoses', next);
                  update('discharge.diagnosesConfirmed', false);
                }}
              />
              <button
                type="button"
                className="button ghost compact-button"
                onClick={() => {
                  update('discharge.diagnoses', record.discharge.diagnoses.filter((_, row) => row !== index));
                  update('discharge.diagnosesConfirmed', false);
                }}
              >
                删除
              </button>
            </div>
          ))}
          {record.discharge.diagnoses.length ? null : <p className="muted">尚未填写出院诊断。</p>}
        </div>
        <button
          type="button"
          className="button secondary"
          data-field-path={record.discharge.diagnoses.length === 0 ? 'discharge.diagnoses' : undefined}
          onClick={() => update('discharge.diagnoses', [...record.discharge.diagnoses, ''])}
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
        {errors['discharge.diagnoses'] ? <div className="field-error">{errors['discharge.diagnoses']}</div> : null}

        <div className="subsection-heading"><h4>出院医嘱</h4></div>
        <FormGrid>
          <FieldRenderer path="discharge.advice.drug" label="药物" value={stringAt(record, 'discharge.advice.drug')} onChange={update} kind="textarea" rows={2} error={errors['discharge.advice.drug']} />
          <FieldRenderer path="discharge.advice.nonDrug" label="非药物治疗" value={stringAt(record, 'discharge.advice.nonDrug')} onChange={update} kind="textarea" rows={2} error={errors['discharge.advice.nonDrug']} />
          <FieldRenderer path="discharge.advice.lifestyle" label="生活指导" value={stringAt(record, 'discharge.advice.lifestyle')} onChange={update} kind="textarea" rows={2} error={errors['discharge.advice.lifestyle']} />
          <FieldRenderer path="discharge.advice.followUp" label="复诊时间" value={stringAt(record, 'discharge.advice.followUp')} onChange={update} error={errors['discharge.advice.followUp']} />
        </FormGrid>
      </Collapsible>

      <Collapsible title="问诊补充提示" badge={`${depth.length} 条`}>
        {depth.length ? (
          <ul className="depth-list">
            {depth.map((item) => (
              <li key={item.id} className={`depth-${item.level}`}>
                <span>{item.label}</span>
                <div>
                  <p>{item.message}</p>
                  <small>{item.section}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">当前规则未发现需要补充的追问。</p>
        )}
      </Collapsible>

      <p className="muted">记录结构版本 {RECORD_CORE.SCHEMA_VERSION}。提醒只用于核对，不替代临床判断。</p>
    </StepShell>
  );
}
