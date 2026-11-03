import { SCHEMA } from '@dabingli/domain';
import { CheckGroup, FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

export function FamilyStep({ record, update, errors }: StepComponentProps) {
  return (
    <StepShell
      eyebrow="第 6 / 11 步"
      title="家族史"
      description={STEP_DESCRIPTIONS.family}
    >
      <Card title="家族疾病情况">
        <CheckGroup
          label="家族中患有的疾病（可多选）"
          values={record.family.diseaseChecks}
          options={SCHEMA.FAMILY_DISEASES}
          onChange={(value, checked) =>
            update('family.diseaseChecks', { ...record.family.diseaseChecks, [value]: checked })
          }
        />
        <FormGrid>
          <FieldRenderer
            path="family.deceased"
            label="父母、兄弟姐妹健康状况"
            value={stringAt(record, 'family.deceased')}
            onChange={update}
            kind="textarea"
            rows={2}
            placeholder="如已死亡，写死亡原因及年龄"
            error={errors['family.deceased']}
          />
          <FieldRenderer
            path="family.similarDisease"
            label="与本病相似的病情"
            value={stringAt(record, 'family.similarDisease')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['family.similarDisease']}
          />
          <FieldRenderer
            path="family.infectionHistory"
            label="家族传染病史"
            value={stringAt(record, 'family.infectionHistory')}
            onChange={update}
            kind="textarea"
            rows={2}
            hint="留空写“／”，不会自动写成“否认”。"
            error={errors['family.infectionHistory']}
          />
          <FieldRenderer
            path="family.threeGeneration"
            label="两系三代遗传性疾病史"
            value={stringAt(record, 'family.threeGeneration')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['family.threeGeneration']}
          />
          <FieldRenderer
            path="family.other"
            label="其他补充"
            value={stringAt(record, 'family.other')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['family.other']}
          />
        </FormGrid>
      </Card>
    </StepShell>
  );
}
