import { Collapsible } from '../components/Collapsible';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

const personalFields = [
  { path: 'personal.residence', label: '长期居住地', placeholder: '如：浙江温州' },
  { path: 'personal.travel', label: '近期旅行/居住史', placeholder: '近1月无外地旅居史' },
  { path: 'personal.occupationEnv', label: '职业与工作条件', kind: 'textarea' as const },
  { path: 'personal.drugs', label: '毒物、粉尘、放射性物质接触史', kind: 'textarea' as const },
  { path: 'personal.environment', label: '疫区、疫水、动物接触史', kind: 'textarea' as const },
  { path: 'personal.sexualHistory', label: '冶游史', kind: 'textarea' as const, hint: '敏感项，留空不会自动写成“否认”。' },
  { path: 'personal.habits', label: '其他生活习惯', kind: 'textarea' as const },
] as const;

export function PersonalStep({ record, update, errors }: StepComponentProps) {
  return (
    <StepShell
      eyebrow="第 4 / 10 步"
      title="个人史"
      description={STEP_DESCRIPTIONS.personal}
    >
      <Card title="居住、职业与接触史">
        <FormGrid>
          {personalFields.map((field) => (
            <FieldRenderer
              key={field.path}
              path={field.path}
              label={field.label}
              value={stringAt(record, field.path)}
              onChange={update}
              kind={'kind' in field ? field.kind : 'text'}
              rows={2}
              placeholder={'placeholder' in field ? field.placeholder : undefined}
              hint={'hint' in field ? field.hint : undefined}
              error={errors[field.path]}
            />
          ))}
        </FormGrid>
      </Card>

      <Card title="烟酒嗜好">
        <FormGrid>
          <FieldRenderer
            path="personal.smoking"
            label="吸烟"
            value={stringAt(record, 'personal.smoking')}
            onChange={update}
            kind="segmented"
            options={[{ value: '', label: '未问' }, '无', '有', '已戒']}
            hint="不选＝没问过，病历里写“／”。"
            error={errors['personal.smoking']}
          />
          <FieldRenderer
            path="personal.smokingAmount"
            label="吸烟情况"
            value={stringAt(record, 'personal.smokingAmount')}
            onChange={update}
            placeholder="如：吸烟30年，每日约20支，未戒烟"
            error={errors['personal.smokingAmount']}
          />
          <FieldRenderer
            path="personal.drinking"
            label="饮酒"
            value={stringAt(record, 'personal.drinking')}
            onChange={update}
            kind="segmented"
            options={[{ value: '', label: '未问' }, '无', '有', '已戒']}
            error={errors['personal.drinking']}
          />
          <FieldRenderer
            path="personal.drinkingAmount"
            label="饮酒情况"
            value={stringAt(record, 'personal.drinkingAmount')}
            onChange={update}
            placeholder="如：饮白酒约2两/日，已戒酒5年"
            error={errors['personal.drinkingAmount']}
          />
        </FormGrid>
      </Card>

      <Collapsible title="儿科与精神科补充（可选）">
        <FormGrid>
          <FieldRenderer
            path="personal.maternal"
            label="母亲妊娠期情况"
            value={stringAt(record, 'personal.maternal')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['personal.maternal']}
          />
          <FieldRenderer
            path="personal.birth"
            label="出生史"
            value={stringAt(record, 'personal.birth')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['personal.birth']}
          />
          <FieldRenderer
            path="personal.feeding"
            label="喂养史"
            value={stringAt(record, 'personal.feeding')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['personal.feeding']}
          />
          <FieldRenderer
            path="personal.growth"
            label="生长发育史"
            value={stringAt(record, 'personal.growth')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['personal.growth']}
          />
          <FieldRenderer
            path="personal.premorbidPersonality"
            label="病前性格"
            value={stringAt(record, 'personal.premorbidPersonality')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['personal.premorbidPersonality']}
          />
          <FieldRenderer
            path="personal.stressEvent"
            label="发病前应激事件"
            value={stringAt(record, 'personal.stressEvent')}
            onChange={update}
            kind="textarea"
            rows={2}
            error={errors['personal.stressEvent']}
          />
        </FormGrid>
      </Collapsible>
    </StepShell>
  );
}
