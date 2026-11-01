import { GENERATOR } from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { FieldRenderer } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

export function HpiStep({ record, update, errors, notify }: StepComponentProps) {
  const draft = GENERATOR.draftHPI(record);
  const canDraft = !record.hpi.onset.trim() && Boolean(record.basic.chiefComplaint.trim());

  return (
    <StepShell
      eyebrow="第 2 / 11 步"
      title="现病史"
      description={STEP_DESCRIPTIONS.hpi}
      actions={
        <button
          type="button"
          className="button secondary"
          disabled={!canDraft}
          onClick={() => {
            update('hpi', draft);
            notify('已根据主诉补起病初稿，请核对');
          }}
        >
          生成起病初稿
        </button>
      }
    >
      <Card title="本次疾病经过" description="按分句填写，生成病历时会自动整理成完整句子。">
        <FormGrid>
          <FieldRenderer
            path="hpi.onset"
            label="起病情况"
            value={stringAt(record, 'hpi.onset')}
            onChange={update}
            kind="textarea"
            rows={3}
            placeholder="如：3天前受凉后出现发热，体温最高39.2℃，伴畏寒"
            hint="写明何时、何种方式起病及诱因。"
            error={errors['hpi.onset']}
            className="field-wide"
          />
          <FieldRenderer
            path="hpi.symptoms"
            label="主要症状特点"
            value={stringAt(record, 'hpi.symptoms')}
            onChange={update}
            kind="textarea"
            rows={3}
            placeholder="部位、性质、程度、持续时间、加重或缓解因素"
            error={errors['hpi.symptoms']}
            className="field-wide"
          />
          <FieldRenderer
            path="hpi.treatment"
            label="诊治经过"
            value={stringAt(record, 'hpi.treatment')}
            onChange={update}
            kind="textarea"
            rows={3}
            placeholder="在何处就诊、检查、用药及效果"
            error={errors['hpi.treatment']}
            className="field-wide"
          />
          <FieldRenderer
            path="hpi.generalCondition"
            label="一般情况"
            value={stringAt(record, 'hpi.generalCondition')}
            onChange={update}
            kind="textarea"
            rows={2}
            placeholder="精神、食欲、睡眠、大小便、体重变化"
            hint="留空不会自动补入正常情况。"
            error={errors['hpi.generalCondition']}
            className="field-wide"
          />
        </FormGrid>
        <Collapsible title="补充诱因、进展和伴随症状">
          <FormGrid>
            <FieldRenderer
              path="hpi.cause"
              label="发病诱因"
              value={stringAt(record, 'hpi.cause')}
              onChange={update}
              placeholder="受凉后 / 无明显诱因"
              error={errors['hpi.cause']}
            />
            <FieldRenderer
              path="hpi.aggravating"
              label="加重因素"
              value={stringAt(record, 'hpi.aggravating')}
              onChange={update}
              kind="textarea"
              rows={2}
              placeholder="如：进食后腹痛加重"
              error={errors['hpi.aggravating']}
            />
            <FieldRenderer
              path="hpi.relief"
              label="缓解因素"
              value={stringAt(record, 'hpi.relief')}
              onChange={update}
              kind="textarea"
              rows={2}
              placeholder="如：休息后腹痛稍缓解"
              error={errors['hpi.relief']}
            />
            <FieldRenderer
              path="hpi.evolution"
              label="病情进展"
              value={stringAt(record, 'hpi.evolution')}
              onChange={update}
              kind="textarea"
              rows={2}
              placeholder="如：症状逐渐加重"
              error={errors['hpi.evolution']}
            />
            <FieldRenderer
              path="hpi.accompanying"
              label="伴随症状"
              value={stringAt(record, 'hpi.accompanying')}
              onChange={update}
              kind="textarea"
              rows={2}
              placeholder="如：伴胸痛；无咯血"
              error={errors['hpi.accompanying']}
            />
            <FieldRenderer
              path="hpi.negativeDiscriminating"
              label="有鉴别诊断意义的阴性病史"
              value={stringAt(record, 'hpi.negativeDiscriminating')}
              onChange={update}
              kind="textarea"
              rows={2}
              placeholder="如：无咯血、盗汗、消瘦"
              hint="只填写实际询问过的阴性症状。"
              error={errors['hpi.negativeDiscriminating']}
            />
            <FieldRenderer
              path="hpi.extra"
              label="其他补充"
              value={stringAt(record, 'hpi.extra')}
              onChange={update}
              kind="textarea"
              rows={2}
              error={errors['hpi.extra']}
            />
          </FormGrid>
        </Collapsible>
      </Card>
    </StepShell>
  );
}
