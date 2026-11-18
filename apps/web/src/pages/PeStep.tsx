import { useMemo, useState } from 'react';
import { RECORD_CORE, SCHEMA, type DabingliRecord, type PeGroup, type PeItem, type PeSpecialGroup } from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { ConfirmModal } from '../components/ConfirmModal';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { fieldStoreAt, stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

interface PeGroupView {
  groupKey: string;
  containerKey: string;
  name: string;
  items: PeItem[];
  special: boolean;
}

const NORMAL_VITALS_SAMPLE = {
  temperature: '36.5',
  pulse: '78',
  respiration: '18',
  sbp: '120',
  dbp: '80',
} as const;

export function peReviewValid(record: DabingliRecord, path: string, shownText: string): boolean {
  const st = RECORD_CORE.fieldState(record, path);
  return Boolean(st.reviewed && st.reviewedValueHash === RECORD_CORE.fingerprint(String(shownText || '')));
}

export function computeBmiSummary(heightRaw: string, weightRaw: string): { value: string; category: string } | null {
  const height = Number.parseFloat(heightRaw);
  const weight = Number.parseFloat(weightRaw);
  if (!(height > 0 && weight > 0)) return null;
  const bmi = weight / Math.pow(height / 100, 2);
  if (!Number.isFinite(bmi)) return null;
  const value = bmi.toFixed(1);
  const num = Number.parseFloat(value);
  let category = '正常';
  if (num < 18.5) category = '偏瘦';
  else if (num >= 24 && num < 28) category = '超重';
  else if (num >= 28) category = '肥胖';
  return { value, category };
}

export function PeStep({ record, update, replaceRecord, errors, notify }: StepComponentProps) {
  const [showVitalsSample, setShowVitalsSample] = useState(false);
  const [vitalsConfirmOpen, setVitalsConfirmOpen] = useState(false);
  const [pendingConfirmGroup, setPendingConfirmGroup] = useState<{
    group: PeGroupView;
    items: Array<{ path: string; label: string; shown: string; source: 'manual' | 'default' }>;
  } | null>(null);

  const departmentKey = record.basic.department || 'general';
  const department = SCHEMA.DEPARTMENTS.find((item) => item.key === departmentKey) ?? SCHEMA.DEPARTMENTS[0];

  const groups: PeGroupView[] = useMemo(() => {
    const base: PeGroupView[] = SCHEMA.PE_COMMON.map((group: PeGroup) => ({
      groupKey: group.key,
      containerKey: group.key,
      name: group.name,
      items: group.items.filter((item) => !item.depts || item.depts.includes(departmentKey)),
      special: false,
    })).filter((group) => group.items.length > 0);

    (department?.special ?? []).forEach((specialKey) => {
      const special: PeSpecialGroup | undefined = SCHEMA.PE_SPECIAL[specialKey];
      if (!special) return;
      base.push({
        groupKey: `special_${specialKey}`,
        containerKey: `special_${specialKey}`,
        name: special.name,
        items: special.items,
        special: true,
      });
    });
    return base;
  }, [department, departmentKey]);

  const focusOptions = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) => ({
          ref: `${group.groupKey}.${item.key}`,
          label: `${group.name} · ${item.label}`,
        })),
      ),
    [groups],
  );
  const focusKeys = record.focusPE.keys.filter((key) => focusOptions.some((option) => option.ref === key));

  const bmi = computeBmiSummary(
    stringAt(record, 'pe.vitals.height'),
    stringAt(record, 'pe.vitals.weight'),
  );

  function setChecked(groupKey: string, itemKey: string, checked: boolean) {
    const next = RECORD_CORE.cloneValue(record);
    SCHEMA.setPeChecked(next, groupKey, itemKey, checked);
    replaceRecord(next, { snapshotLabel: checked ? '勾选查体项' : '取消查体项' });
  }

  function setAll(group: PeGroupView, checked: boolean) {
    const next = RECORD_CORE.cloneValue(record);
    group.items.forEach((item) => {
      SCHEMA.setPeChecked(next, group.groupKey, item.key, checked);
    });
    replaceRecord(next, { snapshotLabel: checked ? `全选：${group.name}` : `全不选：${group.name}` });
  }

  function chooseQuick(group: PeGroupView, item: PeItem, value: string) {
    const next = RECORD_CORE.cloneValue(record);
    const path = `pe.${group.containerKey}.${item.key}`;
    RECORD_CORE.setPath(next, path, value);
    RECORD_CORE.markFieldManual(next, path);
    SCHEMA.setPeChecked(next, group.groupKey, item.key, true);
    replaceRecord(next, { snapshotLabel: `选择查体描述：${item.label}` });
  }

  function confirmPeItem(group: PeGroupView, item: PeItem) {
    const store = fieldStoreAt(record, `pe.${group.containerKey}`);
    const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
    const checked = SCHEMA.peChecked(record, group.groupKey, item.key);
    const shown = val || (checked ? SCHEMA.peNormalText(item) : '');
    if (!shown) {
      notify('这一项还没有可核对的内容');
      return;
    }
    const path = `pe.${group.containerKey}.${item.key}`;
    const next = RECORD_CORE.cloneValue(record);
    const prev = RECORD_CORE.fieldState(next, path);
    RECORD_CORE.setFieldState(next, path, {
      source: prev.source || (val ? 'manual' : 'default'),
      reviewed: true,
      reviewedValueHash: RECORD_CORE.fingerprint(shown),
    });
    replaceRecord(next, { snapshotLabel: `确认查体：${item.label}` });
    notify(`已确认「${item.label}」描述`, 'success');
  }

  function requestConfirmAllPe(group: PeGroupView) {
    const store = fieldStoreAt(record, `pe.${group.containerKey}`);
    const pending: Array<{ path: string; label: string; shown: string; source: 'manual' | 'default' }> = [];
    group.items.forEach((item) => {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      const checked = SCHEMA.peChecked(record, group.groupKey, item.key);
      if (!checked) return;
      const shown = val || SCHEMA.peNormalText(item);
      if (!shown) return;
      const path = `pe.${group.containerKey}.${item.key}`;
      if (peReviewValid(record, path, shown)) return;
      pending.push({ path, label: item.label, shown, source: val ? 'manual' : 'default' });
    });
    if (!pending.length) {
      notify('本组没有待确认的描述');
      return;
    }
    setPendingConfirmGroup({ group, items: pending });
  }

  function applyConfirmAllPe() {
    if (!pendingConfirmGroup) return;
    const { group, items } = pendingConfirmGroup;
    const next = RECORD_CORE.cloneValue(record);
    items.forEach((entry) => {
      const prev = RECORD_CORE.fieldState(next, entry.path);
      RECORD_CORE.setFieldState(next, entry.path, {
        source: prev.source || entry.source,
        reviewed: true,
        reviewedValueHash: RECORD_CORE.fingerprint(entry.shown),
      });
    });
    setPendingConfirmGroup(null);
    replaceRecord(next, { snapshotLabel: `批量确认查体：${group.name}` });
    notify(`已确认 ${items.length} 项查体描述`, 'success');
  }

  function jumpToGroup(groupKey: string) {
    const el = document.getElementById(`pe-group-${groupKey}`);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView?.({ block: 'start' });
    }
  }

  return (
    <StepShell
      eyebrow="第 7 / 10 步"
      title="体格检查（一）/（二）"
      description={STEP_DESCRIPTIONS.pe}
    >
      <Card title="体格检查（一）：生命体征">
        <div className="vitals-grid">
          {SCHEMA.VITALS.filter((vital) => !vital.dept || vital.dept === departmentKey).map((vital) => (
            <FieldRenderer
              key={vital.key}
              path={`pe.vitals.${vital.key}`}
              label={`${vital.label}${vital.unit ? `（${vital.unit}）` : ''}`}
              value={stringAt(record, `pe.vitals.${vital.key}`)}
              onChange={update}
              kind="number"
              inputMode="decimal"
              placeholder={vital.placeholder}
              error={errors[`pe.vitals.${vital.key}`] ?? errors['pe.vitals']}
            />
          ))}
        </div>
        <div className="button-row compact">
          <button
            type="button"
            className="button ghost"
            onClick={() => setVitalsConfirmOpen(true)}
          >
            查看正常值参考示例
          </button>
        </div>
        <p className="muted">只写入实测值；未填写项不会自动补正常值。</p>
        {showVitalsSample ? (
          <div className="doc-state doc-state-muted" data-doc-state="vitals-example" role="status">
            <div className="doc-state-title">参考示例（未写入病历）</div>
            <p className="field-hint">
              体温 {NORMAL_VITALS_SAMPLE.temperature} ℃、脉搏 {NORMAL_VITALS_SAMPLE.pulse} 次/分、呼吸 {NORMAL_VITALS_SAMPLE.respiration} 次/分、血压 {NORMAL_VITALS_SAMPLE.sbp}/{NORMAL_VITALS_SAMPLE.dbp} mmHg
            </p>
          </div>
        ) : null}
        {bmi ? (
          <div className="live-preview" id="bmiPreview" aria-live="polite">
            <span>BMI</span>
            <strong>{bmi.value}（{bmi.category}）</strong>
          </div>
        ) : null}
        {errors.pe ? <div className="field-error" role="alert">{errors.pe}</div> : null}
        <div className="choice-cloud pe-jump" role="navigation" aria-label="查体分组快速跳转">
          {groups.map((group) => (
            <button
              type="button"
              key={group.groupKey}
              className={`choice-chip${group.special ? ' is-selected' : ''}`}
              onClick={() => jumpToGroup(group.groupKey)}
            >
              {group.name}
            </button>
          ))}
        </div>
      </Card>

      <Collapsible title="重点查体与检查思路" syncKey={record.id}>
        <p className="muted">最多选择与本次主诉和主要阳性体征直接相关的查体项，并说明检查理由。</p>
        <div className="selected-tags">
          {focusKeys.length ? (
            focusKeys.map((key) => {
              const option = focusOptions.find((item) => item.ref === key);
              return (
                <button
                  type="button"
                  key={key}
                  className="tag-button"
                  onClick={() => update('focusPE.keys', focusKeys.filter((value) => value !== key))}
                >
                  {option?.label ?? key} ×
                </button>
              );
            })
          ) : (
            <span className="muted">尚未标记重点查体</span>
          )}
        </div>
        <Collapsible title="从查体项中添加" syncKey={record.id}>
          <div className="choice-cloud">
            {focusOptions
              .filter((option) => !focusKeys.includes(option.ref))
              .map((option) => (
                <button
                  type="button"
                  key={option.ref}
                  className="choice-chip"
                  onClick={() => update('focusPE.keys', [...focusKeys, option.ref])}
                >
                  {option.label}
                </button>
              ))}
          </div>
        </Collapsible>
        <FieldRenderer
          path="focusPE.note"
          label="为什么查这些"
          value={stringAt(record, 'focusPE.note')}
          onChange={update}
          kind="textarea"
          rows={2}
          placeholder="与诊断思路或鉴别关键点的关系"
          error={errors['focusPE.note']}
        />
      </Collapsible>

      <div className="collapsible-stack">
        {groups.map((group) => {
          const checkedCount = group.items.filter((item) => SCHEMA.peChecked(record, group.groupKey, item.key)).length;
          const store = fieldStoreAt(record, `pe.${group.containerKey}`);
          const hasStoredValues = group.items.some((item) => {
            const val = store[item.key];
            return typeof val === 'string' && val.trim() !== '';
          });
          return (
            <Collapsible
              key={group.groupKey}
              id={`pe-group-${group.groupKey}`}
              title={group.special ? `体格检查（二）：补充及专科情况 · ${group.name}` : group.name}
              defaultOpen={hasStoredValues || (group.special && checkedCount > 0)}
              syncKey={record.id}
              className="pe-group"
              badge={`已勾 ${checkedCount}/${group.items.length}${group.special ? ' · 本科室' : ''}`}
            >
              <div className="button-row compact">
                <button type="button" className="button secondary" onClick={() => setAll(group, true)}>
                  全选本组
                </button>
                <button type="button" className="button ghost" onClick={() => setAll(group, false)}>
                  全不选
                </button>
                <button type="button" className="button ghost" onClick={() => requestConfirmAllPe(group)}>
                  确认本组描述
                </button>
              </div>
              <div className="pe-item-list">
                {group.items.map((item) => {
                  const checked = SCHEMA.peChecked(record, group.groupKey, item.key);
                  const fieldPath = `pe.${group.containerKey}.${item.key}`;
                  const stored = store[item.key];
                  const value = typeof stored === 'string' ? stored : '';
                  const normal = SCHEMA.peNormalText(item);
                  const shown = value || (checked ? normal : '');
                  const state = !checked ? 'off' : value ? 'filled' : normal ? 'default' : 'blank';
                  const stateLabel = state === 'off' ? '未查' : state === 'filled' ? '已填' : state === 'default' ? '系统默认' : '需填';
                  const reviewed = state !== 'off' && Boolean(shown) && peReviewValid(record, fieldPath, shown);
                  return (
                    <article className={`pe-item${checked ? ' is-checked' : ''}`} key={item.key}>
                      <div className="pe-item-header">
                        <label className="check-chip pe-check">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => setChecked(group.groupKey, item.key, event.target.checked)}
                          />
                          <span>本次检查</span>
                        </label>
                        <strong>{item.label}</strong>
                        <span className={`state-pill ${checked ? 'positive' : 'unasked'}`}>{stateLabel}</span>
                        {state !== 'off' && shown ? (
                          reviewed ? (
                            <span className="state-pill positive">已核对</span>
                          ) : (
                            <button
                              type="button"
                              className="button ghost compact-button"
                              onClick={() => confirmPeItem(group, item)}
                            >
                              待核对·确认
                            </button>
                          )
                        ) : null}
                      </div>
                      <FieldRenderer
                        path={fieldPath}
                        label={`${item.label}所见`}
                        value={value}
                        onChange={update}
                        kind="textarea"
                        rows={2}
                        placeholder={normal || '填写检查所见'}
                        error={errors[fieldPath] ?? errors[`pe.${group.containerKey}`]}
                      />
                      {item.options?.length ? (
                        <Collapsible title="常用描述" syncKey={record.id}>
                          <div className="choice-cloud">
                            {item.options.map((option) => (
                              <button
                                type="button"
                                key={option}
                                className={`choice-chip${value === option ? ' is-selected' : ''}`}
                                onClick={() => chooseQuick(group, item, option)}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </Collapsible>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </Collapsible>
          );
        })}
      </div>

      <ConfirmModal
        open={vitalsConfirmOpen}
        title="显示正常生命体征参考示例"
        message={`以下只是示例数值，不是患者的实测结果：体温 ${NORMAL_VITALS_SAMPLE.temperature} ℃、脉搏 ${NORMAL_VITALS_SAMPLE.pulse} 次/分、呼吸 ${NORMAL_VITALS_SAMPLE.respiration} 次/分、血压 ${NORMAL_VITALS_SAMPLE.sbp}/${NORMAL_VITALS_SAMPLE.dbp} mmHg。这些数字不会写入病历，请按实际测量值逐项填写。`}
        confirmLabel="显示参考示例"
        onConfirm={() => {
          setVitalsConfirmOpen(false);
          setShowVitalsSample(true);
          notify('示例值仅供参考，未写入病历');
        }}
        onCancel={() => setVitalsConfirmOpen(false)}
      />

      <ConfirmModal
        open={pendingConfirmGroup !== null}
        title={`批量确认：${pendingConfirmGroup?.group.name ?? ''}`}
        message={
          pendingConfirmGroup ? (
            <div>
              <p>将确认以下 {pendingConfirmGroup.items.length} 项的实际输出文字（确认后若文字再变化，会自动回到待核对）：</p>
              <ul className="outline-list">
                {pendingConfirmGroup.items.map((item) => (
                  <li key={item.path}>
                    <strong>{item.label}</strong>：{item.shown}
                  </li>
                ))}
              </ul>
            </div>
          ) : ''
        }
        confirmLabel="确认本组描述"
        onConfirm={applyConfirmAllPe}
        onCancel={() => setPendingConfirmGroup(null)}
      />
    </StepShell>
  );
}
