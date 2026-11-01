import { SCHEMA } from '@dabingli/domain';
import { CheckGroup, FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

export function PmhStep({ record, update, errors }: StepComponentProps) {
  const allergy = stringAt(record, 'pmh.allergy');

  function toggleMap(path: 'pmh.diseaseChecks' | 'pmh.allergenChecks' | 'pmh.allergenReactionChecks') {
    const current = record.pmh[path.split('.')[1] as keyof typeof record.pmh];
    return (value: string, checked: boolean) => {
      const base =
        current && typeof current === 'object' && !Array.isArray(current)
          ? (current as Record<string, boolean>)
          : {};
      update(path, { ...base, [value]: checked });
    };
  }

  return (
    <StepShell
      eyebrow="第 3 / 11 步"
      title="既往史"
      description={STEP_DESCRIPTIONS.pmh}
    >
      <Card title="平素健康与慢性病">
        <FormGrid>
          <FieldRenderer
            path="pmh.health"
            label="平素健康状况"
            value={stringAt(record, 'pmh.health')}
            onChange={update}
            kind="segmented"
            options={[{ value: '', label: '未问' }, '良好', '一般', '较差']}
            error={errors['pmh.health']}
          />
        </FormGrid>
        <CheckGroup
          label="勾选既往疾病（可多选）"
          values={record.pmh.diseaseChecks}
          options={SCHEMA.COMMON_PMH}
          onChange={toggleMap('pmh.diseaseChecks')}
        />
        <FormGrid>
          <FieldRenderer
            path="pmh.diseaseOther"
            label="其他疾病"
            value={stringAt(record, 'pmh.diseaseOther')}
            onChange={update}
            placeholder="补充未列出的疾病"
            error={errors['pmh.diseaseOther']}
          />
          <FieldRenderer
            path="pmh.diseaseDetail"
            label="疾病详情"
            value={stringAt(record, 'pmh.diseaseDetail')}
            onChange={update}
            kind="textarea"
            rows={3}
            placeholder="病程、治疗和控制情况"
            hint="填写后直接采用这段文字，不再重复拼勾选疾病。"
            error={errors['pmh.diseaseDetail']}
          />
          <FieldRenderer
            path="pmh.longTermMeds"
            label="长期用药史"
            value={stringAt(record, 'pmh.longTermMeds')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.longTermMeds']}
          />
          <FieldRenderer
            path="pmh.otherTreatDiseases"
            label="其他仍需治疗的疾病"
            value={stringAt(record, 'pmh.otherTreatDiseases')}
            onChange={update}
            kind="textarea"
            rows={2}
            hint="该内容会写入现病史结尾。"
            error={errors['pmh.otherTreatDiseases']}
          />
        </FormGrid>
      </Card>

      <Card title="其他既往史">
        <FormGrid>
          <FieldRenderer
            path="pmh.infection"
            label="传染病史"
            value={stringAt(record, 'pmh.infection')}
            onChange={update}
            kind="textarea"
            rows={2}
            placeholder="如：否认肝炎、结核等传染病史"
            error={errors['pmh.infection']}
          />
          <FieldRenderer
            path="pmh.surgery"
            label="手术史"
            value={stringAt(record, 'pmh.surgery')}
            onChange={update}
            kind="textarea"
            rows={2}
            placeholder="如：2015年阑尾切除术"
            error={errors['pmh.surgery']}
          />
          <FieldRenderer
            path="pmh.trauma"
            label="外伤史"
            value={stringAt(record, 'pmh.trauma')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.trauma']}
          />
          <FieldRenderer
            path="pmh.transfusion"
            label="输血史"
            value={stringAt(record, 'pmh.transfusion')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.transfusion']}
          />
          <FieldRenderer
            path="pmh.poisoning"
            label="中毒史"
            value={stringAt(record, 'pmh.poisoning')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.poisoning']}
          />
          <FieldRenderer
            path="pmh.vaccine"
            label="预防接种史"
            value={stringAt(record, 'pmh.vaccine')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.vaccine']}
          />
          <FieldRenderer
            path="pmh.relatedHistory"
            label="与本病相关病史"
            value={stringAt(record, 'pmh.relatedHistory')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.relatedHistory']}
          />
          <FieldRenderer
            path="pmh.special"
            label="其他需补充的既往史"
            value={stringAt(record, 'pmh.special')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['pmh.special']}
          />
        </FormGrid>
      </Card>

      <Card title="过敏史">
        <FieldRenderer
          path="pmh.allergy"
          label="有无过敏史"
          value={allergy}
          onChange={update}
          kind="segmented"
          options={[{ value: '', label: '未问' }, '无', '有']}
          hint="不选表示尚未询问，不会自动写成“否认过敏”。"
          error={errors['pmh.allergy']}
        />
        {allergy === '有' ? (
          <div className="conditional-panel">
            <CheckGroup
              label="过敏原"
              values={record.pmh.allergenChecks}
              options={SCHEMA.ALLERGENS}
              onChange={toggleMap('pmh.allergenChecks')}
            />
            <FormGrid>
              <FieldRenderer
                path="pmh.allergenOther"
                label="其他过敏原"
                value={stringAt(record, 'pmh.allergenOther')}
                onChange={update}
                error={errors['pmh.allergenOther']}
              />
            </FormGrid>
            <CheckGroup
              label="过敏反应表现"
              values={record.pmh.allergenReactionChecks}
              options={SCHEMA.ALLERGY_REACTIONS}
              onChange={toggleMap('pmh.allergenReactionChecks')}
            />
            <FormGrid>
              <FieldRenderer
                path="pmh.allergyReaction"
                label="反应描述"
                value={stringAt(record, 'pmh.allergyReaction')}
                onChange={update}
                placeholder="如：全身皮疹伴瘙痒"
                hint="手写描述优先于上方勾选。"
                error={errors['pmh.allergyReaction']}
              />
            </FormGrid>
          </div>
        ) : null}
      </Card>
    </StepShell>
  );
}
