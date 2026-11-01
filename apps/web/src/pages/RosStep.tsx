import {
  RECORD_CORE,
  SCHEMA,
  type RosEntry,
  type RosStore,
  type RosSystem,
  type RosSymptom,
} from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

interface SymptomState {
  label: string;
  tone: string;
}

function symptomState(entry: RosEntry | undefined): SymptomState {
  if (entry?.checked) return { label: '阳性', tone: 'positive' };
  if (entry?.negative) return { label: '阴性', tone: 'negative' };
  return { label: '未问', tone: 'unasked' };
}

export function RosStep({ record, update, errors }: StepComponentProps) {
  const positiveCount = SCHEMA.ROS.reduce((total, system) => {
    const store = record.ros[system.key] ?? {};
    return total + system.symptoms.filter((symptom) => store[symptom.key]?.checked).length;
  }, 0);
  const negativeCount = SCHEMA.ROS.reduce((total, system) => {
    const store = record.ros[system.key] ?? {};
    return total + system.symptoms.filter((symptom) => store[symptom.key]?.negative).length;
  }, 0);

  function setSymptom(
    system: RosSystem,
    symptom: RosSymptom,
    state: 'positive' | 'negative' | 'unasked',
  ) {
    const current = record.ros[system.key]?.[symptom.key] ?? {};
    const next: RosEntry = {
      ...current,
      checked: state === 'positive',
      negative: state === 'negative',
    };
    if (state !== 'positive') {
      next.time = '';
      next.detail = '';
    }
    update(`ros.${system.key}.${symptom.key}`, next);
  }

  function markAllNegative() {
    const next: RosStore = {};
    SCHEMA.ROS.forEach((system) => {
      next[system.key] = {};
      system.symptoms.forEach((symptom) => {
        const row = next[system.key];
        if (row) row[symptom.key] = { checked: false, negative: true, time: '', detail: '' };
      });
    });
    update('ros', next);
  }

  return (
    <StepShell
      eyebrow="第 4 / 11 步"
      title="系统回顾"
      description={STEP_DESCRIPTIONS.ros}
    >
      <Card className="ros-toolbar">
        <div className="metric-strip" data-field-path="ros" tabIndex={-1}>
          <div>
            <span>阳性</span>
            <strong>{positiveCount}</strong>
          </div>
          <div>
            <span>明确阴性</span>
            <strong>{negativeCount}</strong>
          </div>
          <div>
            <span>症状总数</span>
            <strong>{SCHEMA.ROS.reduce((total, system) => total + system.symptoms.length, 0)}</strong>
          </div>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              if (window.confirm('把所有系统回顾症状标记为明确阴性吗？阳性项会被清除。')) {
                markAllNegative();
              }
            }}
          >
            全部标记为阴性
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              if (window.confirm('清空系统回顾并全部恢复为“未问”吗？')) update('ros', {});
            }}
          >
            全部恢复为未问
          </button>
        </div>
        {errors.ros ? <div className="field-error">{errors.ros}</div> : null}
      </Card>

      <div className="collapsible-stack">
        {SCHEMA.ROS.map((system) => {
          const store = record.ros[system.key] ?? {};
          const asked = system.symptoms.filter((symptom) => {
            const entry = store[symptom.key];
            return entry?.checked || entry?.negative;
          }).length;
          const positive = system.symptoms.filter((symptom) => store[symptom.key]?.checked).length;
          return (
            <Collapsible
              key={system.key}
              title={system.name}
              defaultOpen={positive > 0}
              badge={`已记录 ${asked}/${system.symptoms.length}${positive ? ` · 阳性 ${positive}` : ''}`}
              className="ros-group"
            >
              <div className="symptom-list">
                {system.symptoms.map((symptom) => {
                  const entry = store[symptom.key];
                  const state = symptomState(entry);
                  return (
                    <div className="symptom-row" key={symptom.key}>
                      <div className="symptom-label">
                        <strong>{symptom.label}</strong>
                        {symptom.detail ? <span>{symptom.detail}</span> : null}
                        <span className={`state-pill ${state.tone}`}>{state.label}</span>
                      </div>
                      <div className="tri-state" role="group" aria-label={`${symptom.label}状态`}>
                        <button
                          type="button"
                          className={state.tone === 'unasked' ? 'is-selected' : ''}
                          aria-pressed={state.tone === 'unasked'}
                          onClick={() => setSymptom(system, symptom, 'unasked')}
                        >
                          未问
                        </button>
                        <button
                          type="button"
                          className={state.tone === 'positive' ? 'is-selected positive' : ''}
                          aria-pressed={state.tone === 'positive'}
                          onClick={() => setSymptom(system, symptom, 'positive')}
                        >
                          阳性
                        </button>
                        <button
                          type="button"
                          className={state.tone === 'negative' ? 'is-selected negative' : ''}
                          aria-pressed={state.tone === 'negative'}
                          onClick={() => setSymptom(system, symptom, 'negative')}
                        >
                          阴性
                        </button>
                      </div>
                      {entry?.checked ? (
                        <FormGrid className="symptom-details">
                          <FieldRenderer
                            path={`ros.${system.key}.${symptom.key}.time`}
                            label="时间"
                            value={stringAt(record, `ros.${system.key}.${symptom.key}.time`)}
                            onChange={update}
                            placeholder="如：3天前"
                            error={errors[`ros.${system.key}.${symptom.key}.time`]}
                          />
                          <FieldRenderer
                            path={`ros.${system.key}.${symptom.key}.detail`}
                            label="补充描述"
                            value={stringAt(record, `ros.${system.key}.${symptom.key}.detail`)}
                            onChange={update}
                            kind="textarea"
                            rows={2}
                            placeholder={symptom.detail ? `如：${symptom.detail}` : '补充症状特点'}
                            error={errors[`ros.${system.key}.${symptom.key}.detail`]}
                          />
                        </FormGrid>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Collapsible>
          );
        })}
      </div>
      <p className="muted">
        当前记录对象版本 {RECORD_CORE.SCHEMA_VERSION}。三态数据保持兼容，未点选内容不会写入病历。
      </p>
    </StepShell>
  );
}
