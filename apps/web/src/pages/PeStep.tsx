import { SCHEMA, type PeGroup, type PeItem, type PeSpecialGroup } from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
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

export function PeStep({ record, update, errors }: StepComponentProps) {
  const departmentKey = record.basic.department || 'general';
  const department = SCHEMA.DEPARTMENTS.find((item) => item.key === departmentKey) ?? SCHEMA.DEPARTMENTS[0];
  const groups: PeGroupView[] = SCHEMA.PE_COMMON.map((group: PeGroup) => ({
    groupKey: group.key,
    containerKey: group.key,
    name: group.name,
    items: group.items.filter((item) => !item.depts || item.depts.includes(departmentKey)),
    special: false,
  })).filter((group) => group.items.length > 0);

  (department?.special ?? []).forEach((specialKey) => {
    const special: PeSpecialGroup | undefined = SCHEMA.PE_SPECIAL[specialKey];
    if (!special) return;
    groups.push({
      groupKey: `special_${specialKey}`,
      containerKey: `special_${specialKey}`,
      name: special.name,
      items: special.items,
      special: true,
    });
  });

  const focusOptions = groups.flatMap((group) =>
    group.items.map((item) => ({
      ref: `${group.groupKey}.${item.key}`,
      label: `${group.name} · ${item.label}`,
    })),
  );
  const focusKeys = record.focusPE.keys.filter((key) => focusOptions.some((option) => option.ref === key));

  function setChecked(groupKey: string, itemKey: string, checked: boolean) {
    update(`pe.checked.${groupKey}.${itemKey}`, checked);
  }

  function setAll(group: PeGroupView, checked: boolean) {
    const values = Object.fromEntries(group.items.map((item) => [item.key, checked]));
    update(`pe.checked.${group.groupKey}`, values);
  }

  function chooseQuick(group: PeGroupView, item: PeItem, value: string) {
    update(`pe.${group.containerKey}.${item.key}`, value);
    setChecked(group.groupKey, item.key, true);
  }

  return (
    <StepShell
      eyebrow="第 8 / 11 步"
      title="体格检查"
      description={STEP_DESCRIPTIONS.pe}
    >
      <Card title="生命体征">
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
        <p className="muted">只写入实测值；未填写项不会自动补正常值。</p>
        {errors.pe ? <div className="field-error">{errors.pe}</div> : null}
      </Card>

      <Collapsible title="重点查体与检查思路">
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
        <Collapsible title="从查体项中添加">
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
          return (
            <Collapsible
              key={group.groupKey}
              title={group.name}
              defaultOpen={group.special && checkedCount > 0}
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
              </div>
              <div className="pe-item-list">
                {group.items.map((item) => {
                  const checked = SCHEMA.peChecked(record, group.groupKey, item.key);
                  const fieldPath = `pe.${group.containerKey}.${item.key}`;
                  const stored = store[item.key];
                  const value = typeof stored === 'string' ? stored : '';
                  const normal = SCHEMA.peNormalText(item);
                  const state = !checked ? '未查' : value ? '已填' : normal ? '系统默认' : '需填';
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
                        <span className={`state-pill ${checked ? 'positive' : 'unasked'}`}>{state}</span>
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
                        <Collapsible title="常用描述">
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
    </StepShell>
  );
}
