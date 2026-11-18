import { useEffect, useMemo, useState } from 'react';
import {
  GENERATOR,
  RECORD_CORE,
  SCHEMA,
  type Template,
  type TemplateOutlineItem,
} from '@dabingli/domain';
import { Collapsible } from '../components/Collapsible';
import { ModalDialog } from '../components/ConfirmModal';
import { FieldRenderer, type FieldOption } from '../components/FieldRenderer';
import { Card, FormGrid, StepShell } from '../components/StepShell';
import type { StepComponentProps } from '../editor-types';
import { stringAt } from '../form-utils';
import { STEP_DESCRIPTIONS } from '../steps';

type TemplatesModule = typeof import('@dabingli/domain/templates');

let templatesModulePromise: Promise<TemplatesModule> | null = null;

function loadTemplatesModule(): Promise<TemplatesModule> {
  if (!templatesModulePromise) {
    templatesModulePromise = import('@dabingli/domain/templates');
  }
  return templatesModulePromise;
}

const reliabilityOptions: FieldOption[] = [
  { value: '', label: '未评估' },
  ...SCHEMA.RELIABILITY.map((value) => ({ value, label: value })),
];

export function BasicStep({ record, update, replaceRecord, errors, notify }: StepComponentProps) {
  const [outline, setOutline] = useState<TemplateOutlineItem[]>([]);
  const [templatesMod, setTemplatesMod] = useState<TemplatesModule | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void loadTemplatesModule().then((mod) => {
      if (active) setTemplatesMod(mod);
    });
    return () => {
      active = false;
    };
  }, []);

  const templates: Template[] = useMemo(() => {
    if (!templatesMod) return [];
    return templatesMod.listByDept(record.basic.department || 'general');
  }, [record.basic.department, templatesMod]);

  const chiefPreview = useMemo(() => GENERATOR.buildChiefComplaint(record), [record]);
  const lastFill = record.meta.lastTemplateFill;

  async function applyTemplate(key: string, mode: 'example' | 'patient') {
    const mod = templatesMod ?? (await loadTemplatesModule());
    const next = RECORD_CORE.cloneValue(record);
    const result = mod.apply(next, key, { mode });
    if (!result.ok) {
      notify('模板无法套用', 'error');
      return;
    }
    if (mode === 'patient') {
      setOutline(result.outline ?? []);
      notify('已显示患者录入提纲，未写入病历');
      return;
    }
    replaceRecord(next, { snapshotLabel: `套用模板：${mod.get(key)?.name ?? key}` });
    setOutline([]);
    notify(`已带入 ${result.count} 项，请逐项核对`);
  }

  function undoTemplateFill() {
    if (!lastFill) {
      notify('没有本次带入记录');
      return;
    }
    const values = lastFill.values ?? {};
    const allPaths = Array.from(new Set([...(lastFill.filled ?? []), ...Object.keys(values)]));
    if (!allPaths.length) {
      notify('本次带入没有可撤销的文字字段');
      return;
    }
    const next = RECORD_CORE.cloneValue(record);
    const blank = SCHEMA.emptyRecord();
    let cleared = 0;
    let kept = 0;

    allPaths.forEach((path) => {
      const cur = RECORD_CORE.getPath(next, path);
      const hasSavedString = Object.prototype.hasOwnProperty.call(values, path);
      const st = RECORD_CORE.fieldState(next, path);
      if (hasSavedString) {
        if (String(cur ?? '') === String(values[path] ?? '')) {
          const fallback = RECORD_CORE.getPath(blank, path);
          RECORD_CORE.setPath(next, path, typeof fallback === 'string' ? fallback : '');
          RECORD_CORE.setFieldState(next, path, {
            source: 'manual',
            reviewed: false,
            reviewedValueHash: '',
            sourceRef: '',
          });
          cleared += 1;
        } else {
          kept += 1;
        }
      } else if (st.source === 'template' && !RECORD_CORE.fieldReviewValid(next, path)) {
        const fallback = RECORD_CORE.getPath(blank, path);
        RECORD_CORE.setPath(next, path, fallback !== undefined ? RECORD_CORE.cloneValue(fallback) : '');
        RECORD_CORE.setFieldState(next, path, {
          source: 'manual',
          reviewed: false,
          reviewedValueHash: '',
          sourceRef: '',
        });
        cleared += 1;
      } else {
        kept += 1;
      }
    });

    next.meta.lastTemplateFill = null;
    replaceRecord(next, { snapshotLabel: `撤销模板带入：${lastFill.name ?? lastFill.key}` });
    notify(`已撤销 ${cleared} 项${kept ? `，保留 ${kept} 项你后来改过的内容` : ''}`, 'success');
  }

  return (
    <StepShell
      eyebrow="第 1 / 10 步"
      title="基本情况"
      description={STEP_DESCRIPTIONS.basic}
    >
      <Card title="模板起点（可选）">
        <Collapsible
          title={templatesMod ? `用模板开始（可选，${templates.length} 个病种）` : '用模板开始（可选，正在加载模板…）'}
          defaultOpen={false}
          syncKey={record.id}
          badge={templatesMod ? (templates.length ? undefined : '本科室暂无模板') : '加载中'}
        >
          <p className="muted">
            学习范例会补入典型病例并逐字段标记为模板来源；患者录入提纲只列应问、应查项目，不写入事实。
          </p>
          {!templatesMod ? (
            <p className="muted">正在按需加载专科模板数据…</p>
          ) : templates.length ? (
            <div className="template-list">
              {templates.map((template) => (
                <article key={template.key} className="template-item">
                  <div>
                    <h4>{template.name}</h4>
                    {template.hint ? <p>{template.hint}</p> : null}
                    {template.source ? (
                      <p className="muted">
                        来源：{template.source.label}。{template.source.note}
                      </p>
                    ) : null}
                    <p className={`template-verification${template.verified ? ' is-verified' : ''}`}>
                      {template.verificationLabel ?? '待医院模板核对'}
                    </p>
                  </div>
                  <div className="button-row compact">
                    <button
                      type="button"
                      className="button primary"
                      onClick={() => void applyTemplate(template.key, 'example')}
                    >
                      作为学习范例填入
                    </button>
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() => void applyTemplate(template.key, 'patient')}
                    >
                      查看录入提纲
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">通用/全科不提供标准病例模板，请直接填写。</p>
          )}
          {lastFill ? (
            <div className="doc-state doc-state-muted" data-doc-state="template-fill">
              <div className="doc-state-title">
                本次带入：{lastFill.name ?? lastFill.key}（{(lastFill.filled ?? []).length} 项，来源已逐字段标记）
              </div>
              <div className="button-row compact">
                <button type="button" className="button secondary compact-button" onClick={() => setDetailOpen(true)}>
                  查看本次带入内容
                </button>
                <button type="button" className="button ghost compact-button" onClick={undoTemplateFill}>
                  撤销本次带入
                </button>
              </div>
              <p className="field-hint">撤销只回滚本次带入且此后没被改过的字段；你后来手改的内容会保留。</p>
            </div>
          ) : null}
          {outline.length ? (
            <div className="outline-panel" aria-live="polite">
              <h4>患者录入提纲</h4>
              <ul>
                {outline.map((item, index) => (
                  <li key={`${item.path}-${index}`}>
                    <strong>{item.section}</strong>：{item.label}
                  </li>
                ))}
              </ul>
              <button type="button" className="button ghost" onClick={() => setOutline([])}>
                收起提纲
              </button>
            </div>
          ) : null}
        </Collapsible>
      </Card>

      <Card title="一般项目">
        <FormGrid>
          <FieldRenderer
            path="basic.name"
            label="姓名"
            value={stringAt(record, 'basic.name')}
            onChange={update}
            placeholder="如：张三"
            required
            error={errors['basic.name']}
          />
          <FieldRenderer
            path="basic.gender"
            label="性别"
            value={stringAt(record, 'basic.gender')}
            onChange={update}
            kind="segmented"
            options={SCHEMA.GENDERS}
            required
            error={errors['basic.gender']}
          />
          <FieldRenderer
            path="basic.age"
            label="年龄"
            value={stringAt(record, 'basic.age')}
            onChange={update}
            placeholder="58 或 7月 / 3天"
            hint="成人填数字；婴儿可填“7月”或“3天”。"
            required
            error={errors['basic.age']}
          />
          <FieldRenderer
            path="basic.department"
            label="科别"
            value={stringAt(record, 'basic.department')}
            onChange={update}
            kind="select"
            options={SCHEMA.DEPARTMENTS.map((department) => ({ value: department.key, label: department.name }))}
            hint="选择科别后，查体步骤会显示对应专科项目。"
            error={errors['basic.department']}
          />
          <FieldRenderer path="basic.bedNo" label="床号" value={stringAt(record, 'basic.bedNo')} onChange={update} error={errors['basic.bedNo']} />
          <FieldRenderer path="basic.recordNo" label="住院号" value={stringAt(record, 'basic.recordNo')} onChange={update} error={errors['basic.recordNo']} />
          <FieldRenderer
            path="basic.nationality"
            label="民族"
            value={stringAt(record, 'basic.nationality')}
            onChange={update}
            placeholder="汉族"
            error={errors['basic.nationality']}
          />
          <FieldRenderer path="basic.birthPlace" label="出生地" value={stringAt(record, 'basic.birthPlace')} onChange={update} error={errors['basic.birthPlace']} />
          <FieldRenderer
            path="basic.marital"
            label="婚姻"
            value={stringAt(record, 'basic.marital')}
            onChange={update}
            kind="segmented"
            options={[{ value: '', label: '未填' }, ...SCHEMA.MARITAL]}
            error={errors['basic.marital']}
          />
          <FieldRenderer
            path="basic.occupation"
            label="职业"
            value={stringAt(record, 'basic.occupation')}
            onChange={update}
            placeholder="退休 / 农民 / 工人…"
            error={errors['basic.occupation']}
          />
          <FieldRenderer
            path="basic.admitDate"
            label="入院日期"
            value={stringAt(record, 'basic.admitDate')}
            onChange={update}
            kind="date"
            error={errors['basic.admitDate']}
          />
          <FieldRenderer
            path="basic.admitTime"
            label="入院时间"
            value={stringAt(record, 'basic.admitTime')}
            onChange={update}
            kind="time"
            error={errors['basic.admitTime']}
          />
          <FieldRenderer
            path="basic.recordDate"
            label="记录日期"
            value={stringAt(record, 'basic.recordDate')}
            onChange={update}
            kind="date"
            error={errors['basic.recordDate']}
          />
          <FieldRenderer
            path="basic.recordTime"
            label="记录时间"
            value={stringAt(record, 'basic.recordTime')}
            onChange={update}
            kind="time"
            error={errors['basic.recordTime']}
          />
          <FieldRenderer
            path="basic.informant"
            label="病史陈述者"
            value={stringAt(record, 'basic.informant')}
            onChange={update}
            placeholder="如：患者本人；儿科写母亲"
            error={errors['basic.informant']}
          />
          <FieldRenderer
            path="basic.reliability"
            label="病史可靠程度"
            value={stringAt(record, 'basic.reliability')}
            onChange={update}
            kind="select"
            options={reliabilityOptions}
            error={errors['basic.reliability']}
          />
        </FormGrid>
        <Collapsible title="出生日期、籍贯、工作单位和联系方式（补充资料）" syncKey={record.id}>
          <FormGrid>
            <FieldRenderer path="basic.birthDate" label="出生日期" value={stringAt(record, 'basic.birthDate')} onChange={update} kind="date" error={errors['basic.birthDate']} />
            <FieldRenderer path="basic.nativePlace" label="籍贯" value={stringAt(record, 'basic.nativePlace')} onChange={update} error={errors['basic.nativePlace']} />
            <FieldRenderer
              path="basic.workUnit"
              label="工作单位"
              value={stringAt(record, 'basic.workUnit')}
              onChange={update}
              placeholder="无 / ××公司"
              error={errors['basic.workUnit']}
            />
            <FieldRenderer
              path="basic.address"
              label="通讯地址"
              value={stringAt(record, 'basic.address')}
              onChange={update}
              error={errors['basic.address']}
            />
            <FieldRenderer
              path="basic.phone"
              label="电话号码"
              value={stringAt(record, 'basic.phone')}
              onChange={update}
              kind="tel"
              inputMode="tel"
              error={errors['basic.phone']}
            />
          </FormGrid>
        </Collapsible>
      </Card>

      <Card title="主诉">
        <FieldRenderer
          path="basic.chiefComplaint"
          label="主诉症状"
          value={stringAt(record, 'basic.chiefComplaint')}
          onChange={update}
          kind="textarea"
          rows={3}
          placeholder="如：发热、咳嗽、咳黄痰3天"
          hint="只写症状和体征，不写诊断；持续时间直接写进同一句。"
          required
          error={errors['basic.chiefComplaint']}
        />
        <div className="live-preview" aria-live="polite">
          <span>生成的主诉预览</span>
          <strong>{chiefPreview || '填写后显示'}</strong>
        </div>
      </Card>

      <ModalDialog open={detailOpen} title="本次带入内容" onClose={() => setDetailOpen(false)}>
        <p className="muted">
          共 {(lastFill?.filled ?? []).length} 项，全部标记为「模板来源、未核对」。请逐条对照实际问诊和查体修改。
        </p>
        <ul className="outline-list">
          {Object.entries(lastFill?.values ?? {}).length ? (
            Object.entries(lastFill?.values ?? {}).map(([path, value]) => (
              <li key={path}>
                <code>{path}</code>：{String(value)}
              </li>
            ))
          ) : (
            <li>（没有可显示的文字字段）</li>
          )}
        </ul>
      </ModalDialog>
    </StepShell>
  );
}
