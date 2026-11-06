import { AGE, type DabingliRecord } from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

export function MarriageStep({ record, update, errors }: StepComponentProps) {
  const isFemale = record.basic.gender === '女';
  const isChild = (AGE as unknown as { isChild: (value: DabingliRecord) => boolean }).isChild(record);
  const showPrepubertyHint = isFemale && isChild && !stringAt(record, 'menstruation.applicable').trim();

  return (
    <StepShell
      eyebrow="第 5 / 11 步"
      title="婚姻与生育史"
      description={STEP_DESCRIPTIONS.marriage}
    >
      <Card title="婚姻史">
        <FormGrid>
          <FieldRenderer
            path="basic.marital"
            label="婚姻状况"
            value={stringAt(record, 'basic.marital')}
            onChange={update}
            kind="segmented"
            options={[
              { value: '', label: '未填' },
              '未婚',
              '已婚',
              '离异',
              '丧偶',
            ]}
            hint="与基本情况共用同一个字段；不选＝没问过。"
            error={errors['basic.marital'] ?? errors['marriage.status']}
          />
          <FieldRenderer
            path="marriage.age"
            label="结婚年龄"
            value={stringAt(record, 'marriage.age')}
            onChange={update}
            kind="number"
            inputMode="numeric"
            error={errors['marriage.age']}
          />
          <FieldRenderer
            path="marriage.spouseHealth"
            label="配偶健康状况"
            value={stringAt(record, 'marriage.spouseHealth')}
            onChange={update}
            placeholder="如：配偶体健"
            error={errors['marriage.spouseHealth']}
          />
          <FieldRenderer
            path="marriage.sexLife"
            label="性生活情况"
            value={stringAt(record, 'marriage.sexLife')}
            onChange={update}
            placeholder="如：正常"
            error={errors['marriage.sexLife']}
          />
          <FieldRenderer
            path="marriage.relation"
            label="夫妻关系"
            value={stringAt(record, 'marriage.relation')}
            onChange={update}
            placeholder="如：和睦"
            error={errors['marriage.relation']}
          />
        </FormGrid>
      </Card>

      {isFemale ? (
        <>
          <Card title="月经史">
            <FieldRenderer
              path="menstruation.applicable"
              label="月经情况"
              value={stringAt(record, 'menstruation.applicable')}
              onChange={update}
              kind="segmented"
              options={[
                { value: '', label: '未选' },
                { value: '有', label: '有月经' },
                { value: '无', label: '已绝经' },
                { value: '未初潮', label: '未初潮' },
              ]}
              hint={showPrepubertyHint ? '儿童可选『未初潮』' : undefined}
              error={errors['menstruation.applicable']}
            />
            <FormGrid>
              <FieldRenderer
                path="menstruation.extra"
                label="月经史描述"
                value={stringAt(record, 'menstruation.extra')}
                onChange={update}
                kind="textarea"
                rows={2}
                placeholder="可整句描述，也可使用下方结构化字段"
                error={errors['menstruation.extra']}
                className="field-wide"
              />
            </FormGrid>
            <Collapsible title="结构化填写">
              <FormGrid>
                <FieldRenderer path="menstruation.age" label="初潮年龄" value={stringAt(record, 'menstruation.age')} onChange={update} kind="number" inputMode="numeric" error={errors['menstruation.age']} />
                <FieldRenderer path="menstruation.cycle" label="周期（天）" value={stringAt(record, 'menstruation.cycle')} onChange={update} kind="number" inputMode="numeric" error={errors['menstruation.cycle']} />
                <FieldRenderer path="menstruation.duration" label="经期（天）" value={stringAt(record, 'menstruation.duration')} onChange={update} kind="number" inputMode="numeric" error={errors['menstruation.duration']} />
                <FieldRenderer path="menstruation.quantity" label="经量" value={stringAt(record, 'menstruation.quantity')} onChange={update} error={errors['menstruation.quantity']} />
                <FieldRenderer path="menstruation.color" label="经血颜色" value={stringAt(record, 'menstruation.color')} onChange={update} error={errors['menstruation.color']} />
                <FieldRenderer path="menstruation.clot" label="血块" value={stringAt(record, 'menstruation.clot')} onChange={update} error={errors['menstruation.clot']} />
                <FieldRenderer path="menstruation.leukorrhea" label="白带" value={stringAt(record, 'menstruation.leukorrhea')} onChange={update} error={errors['menstruation.leukorrhea']} />
                <FieldRenderer path="menstruation.lmp" label="末次月经" value={stringAt(record, 'menstruation.lmp')} onChange={update} error={errors['menstruation.lmp']} />
                <FieldRenderer path="menstruation.menopauseAge" label="绝经年龄" value={stringAt(record, 'menstruation.menopauseAge')} onChange={update} kind="number" inputMode="numeric" error={errors['menstruation.menopauseAge']} />
                <FieldRenderer path="menstruation.dysmenorrhea" label="痛经" value={stringAt(record, 'menstruation.dysmenorrhea')} onChange={update} kind="segmented" options={[{ value: '', label: '未问' }, '无', '有']} error={errors['menstruation.dysmenorrhea']} />
              </FormGrid>
            </Collapsible>
          </Card>

          <Card title="生育史">
            <p className="card-description">
              足月、早产、流产、存活四项填任意一项时，生成器使用“足月-早产-流产-存活”格式。
            </p>
            <FormGrid>
              <FieldRenderer path="childbirth.fullTerm" label="足月分娩数" value={stringAt(record, 'childbirth.fullTerm')} onChange={update} kind="number" inputMode="numeric" error={errors['childbirth.fullTerm']} />
              <FieldRenderer path="childbirth.premature" label="早产数" value={stringAt(record, 'childbirth.premature')} onChange={update} kind="number" inputMode="numeric" error={errors['childbirth.premature']} />
              <FieldRenderer path="childbirth.abortion" label="流产或人流数" value={stringAt(record, 'childbirth.abortion')} onChange={update} kind="number" inputMode="numeric" error={errors['childbirth.abortion']} />
              <FieldRenderer path="childbirth.alive" label="存活数" value={stringAt(record, 'childbirth.alive')} onChange={update} kind="number" inputMode="numeric" error={errors['childbirth.alive']} />
            </FormGrid>
            <Collapsible title="其他生育信息">
              <FormGrid>
                <FieldRenderer path="childbirth.gravida" label="孕次" value={stringAt(record, 'childbirth.gravida')} onChange={update} kind="number" inputMode="numeric" error={errors['childbirth.gravida']} />
                <FieldRenderer path="childbirth.para" label="产次" value={stringAt(record, 'childbirth.para')} onChange={update} kind="number" inputMode="numeric" error={errors['childbirth.para']} />
                <FieldRenderer path="childbirth.lastBirth" label="末次分娩" value={stringAt(record, 'childbirth.lastBirth')} onChange={update} error={errors['childbirth.lastBirth']} />
                <FieldRenderer path="childbirth.details" label="分娩及子女情况" value={stringAt(record, 'childbirth.details')} onChange={update} kind="textarea" rows={2} error={errors['childbirth.details']} />
                <FieldRenderer path="childbirth.contraception" label="避孕措施" value={stringAt(record, 'childbirth.contraception')} onChange={update} error={errors['childbirth.contraception']} />
              </FormGrid>
            </Collapsible>
          </Card>
        </>
      ) : (
        <Card title="生育史（男性患者可选填）">
          <FormGrid>
            <FieldRenderer
              path="childbirth.children"
              label="子女数"
              value={stringAt(record, 'childbirth.children') || stringAt(record, 'childbirth.gravida')}
              onChange={update}
              kind="number"
              inputMode="numeric"
              error={errors['childbirth.children'] ?? errors['childbirth.gravida']}
            />
            <FieldRenderer path="childbirth.details" label="子女健康状况" value={stringAt(record, 'childbirth.details')} onChange={update} error={errors['childbirth.details']} />
          </FormGrid>
        </Card>
      )}
    </StepShell>
  );
}
