import { RECORD_CORE } from '@dabingli/domain';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

export function AuxStep({ record, update, errors }: StepComponentProps) {
  const items = record.auxiliary.items.length ? record.auxiliary.items : [{ name: '', result: '' }];

  function updateItems(next: typeof items) {
    update('auxiliary.items', next);
  }

  return (
    <StepShell
      eyebrow="第 9 / 11 步"
      title="辅助检查"
      description={STEP_DESCRIPTIONS.aux}
    >
      <Card title="检查结果" description="按检查时间顺序记录；外院检查请写明机构名称和检查号。">
        <div className="array-list">
          {items.map((_item, index) => (
            <article className="array-card" key={index}>
              <div className="array-card-head">
                <h4>检查 {index + 1}</h4>
                <button
                  type="button"
                  className="button danger ghost"
                  disabled={items.length === 1}
                  onClick={() => updateItems(RECORD_CORE.cloneValue(items).filter((_, row) => row !== index))}
                >
                  删除
                </button>
              </div>
              <FormGrid>
                <FieldRenderer
                  path={`auxiliary.items.${index}.name`}
                  label="检查项目"
                  value={stringAt(record, `auxiliary.items.${index}.name`)}
                  onChange={update}
                  placeholder="如：血常规"
                  error={errors[`auxiliary.items.${index}.name`] ?? errors['auxiliary.items']}
                />
                <FieldRenderer
                  path={`auxiliary.items.${index}.result`}
                  label="结果"
                  value={stringAt(record, `auxiliary.items.${index}.result`)}
                  onChange={update}
                  placeholder="检查结果"
                  error={errors[`auxiliary.items.${index}.result`] ?? errors['auxiliary.items']}
                />
                <FieldRenderer
                  path={`auxiliary.items.${index}.date`}
                  label="检查日期"
                  value={stringAt(record, `auxiliary.items.${index}.date`)}
                  onChange={update}
                  kind="date"
                  error={errors[`auxiliary.items.${index}.date`] ?? errors['auxiliary.items']}
                />
                <FieldRenderer
                  path={`auxiliary.items.${index}.hospital`}
                  label="检查机构"
                  value={stringAt(record, `auxiliary.items.${index}.hospital`)}
                  onChange={update}
                  placeholder="外院检查请填写"
                  error={errors[`auxiliary.items.${index}.hospital`] ?? errors['auxiliary.items']}
                />
                <FieldRenderer
                  path={`auxiliary.items.${index}.no`}
                  label="检查号"
                  value={stringAt(record, `auxiliary.items.${index}.no`)}
                  onChange={update}
                  placeholder="外院检查请填写"
                  error={errors[`auxiliary.items.${index}.no`] ?? errors['auxiliary.items']}
                />
              </FormGrid>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => updateItems([...items, { name: '', result: '', date: '', hospital: '', no: '' }])}
        >
          + 添加一项检查
        </button>
        {errors['auxiliary.items'] ? <div className="field-error">{errors['auxiliary.items']}</div> : null}
      </Card>
    </StepShell>
  );
}
