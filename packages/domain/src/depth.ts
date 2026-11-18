/* ============================================================
 * 问诊深度自查（DEPTH）
 * ------------------------------------------------------------
 * 边界：
 *   1. 只读学生自己写的自由文本，不读模板、不读系统默认描述。
 *   2. 否定的提及不算提及——「无呕吐」不会被要求补呕吐次数。
 *   3. 全部结论都是提示，进不了病历正文。
 * ============================================================ */

import { years as ageYearsOf } from './age';
import { create as createDiagnostic } from './quality/diagnostics';
import {
  chiefComplaintDays,
  DURATION_PATTERN,
  durationDays,
  isNegatedBeforeIndex,
  maxDurationDays,
  parseDurationNum,
  toDays
} from './shared/text-utils';
import type { AppSettings, DabingliRecord, DepthItem, DiagnosticSeverity, GenerateOptions } from './types';

const SEVERITY_BY_LEVEL: Readonly<Record<'high' | 'mid' | 'low', DiagnosticSeverity>> = {
  high: 'error',
  mid: 'warning',
  low: 'info'
};

interface DepthRuleMeta {
  code: string;
  path: string;
  action: string;
  evidence: (r: Partial<DabingliRecord>) => string;
}

interface RawDepthFinding {
  id: string;
  level: 'high' | 'mid' | 'low';
  section: string;
  message: string;
}

export interface DepthSymptomRule {
  key: string;
  name: string;
  trig: RegExp;
  aspects: ReadonlyArray<{ name: string; re: RegExp }>;
  tip: string;
}

function isText(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

function t(v: unknown): string {
  return isText(v) ? v.trim() : '';
}

const RULE_META: Readonly<Record<string, DepthRuleMeta>> = {
  'neg-symptom': {
    code: 'DEPTH_NEGATIVE_MISSING',
    path: 'hpi.negativeDiscriminating',
    action: '补阴性鉴别病史',
    evidence: (r) => {
      const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
      return [h.onset, h.symptoms, h.evolution, h.accompanying, h.treatment].filter(isText).join('，');
    }
  },
  'chronic-meds': {
    code: 'DEPTH_CHRONIC_MEDS',
    path: 'pmh.longTermMeds',
    action: '补长期用药',
    evidence: (r) => {
      const checks = (r.pmh && r.pmh.diseaseChecks) || {};
      return Object.keys(checks).filter((k) => checks[k]).join('、');
    }
  },
  'chronic-control': {
    code: 'DEPTH_CHRONIC_CONTROL',
    path: 'pmh.longTermMeds',
    action: '补控制情况',
    evidence: (r) => t(r.pmh && r.pmh.longTermMeds)
  },
  'surgery-detail': {
    code: 'DEPTH_SURGERY_DETAIL',
    path: 'pmh.surgery',
    action: '补手术年份和机构',
    evidence: (r) => t(r.pmh && r.pmh.surgery)
  },
  antithrombotic: {
    code: 'DEPTH_ANTITHROMBOTIC',
    path: 'pmh.longTermMeds',
    action: '核对抗栓药物',
    evidence: (r) => {
      const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
      return [t(p.diseaseDetail), t(p.diseaseOther), t(p.longTermMeds), t(p.relatedHistory)]
        .filter(isText)
        .join('，');
    }
  },
  'duration-mismatch': {
    code: 'DEPTH_DURATION_MISMATCH',
    path: 'basic.chiefComplaint',
    action: '核对病程时长',
    evidence: (r) => {
      const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
      const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
      return [t(b.chiefComplaint), t(h.onset)].filter(isText).join('；');
    }
  },
  'onset-trace': {
    code: 'DEPTH_ONSET_TRACE',
    path: 'hpi.onset',
    action: '补完整病程',
    evidence: (r) => {
      const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
      return [h.onset, h.cause, h.symptoms, h.evolution].filter(isText).join('，');
    }
  },
  'ambiguous-date': {
    code: 'DEPTH_AMBIGUOUS_DATE',
    path: 'hpi.onset',
    action: '写明具体日期',
    evidence: (r) => {
      const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
      return [h.onset, h.symptoms, h.evolution, h.treatment].filter(isText).join('，');
    }
  },
  'aux-hospital': {
    code: 'DEPTH_AUX_HOSPITAL',
    path: 'auxiliary.items',
    action: '补检查机构',
    evidence: (r) =>
      ((r.auxiliary && r.auxiliary.items) || [])
        .filter((it) => it && isText(it.name))
        .map((it) => t(it.name))
        .join('、')
  },
  menstrual: {
    code: 'DEPTH_MENSTRUAL',
    path: 'menstruation.lmp',
    action: '询问月经史',
    evidence: (r) => t(r.basic && r.basic.chiefComplaint)
  },
  'pediatric-personal': {
    code: 'DEPTH_PEDIATRIC_PERSONAL',
    path: 'personal.birth',
    action: '补出生喂养史',
    evidence: (r) => t(r.basic && r.basic.age)
  },
  'allergy-missed': {
    code: 'DEPTH_ALLERGY_MISSED',
    path: 'pmh.allergy',
    action: '询问过敏史',
    evidence: (r) => {
      const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
      return [p.health, p.diseaseDetail, p.infection, p.surgery, p.longTermMeds].filter(isText).join('，');
    }
  },
  'infection-missed': {
    code: 'DEPTH_INFECTION_MISSED',
    path: 'pmh.infection',
    action: '询问传染病史',
    evidence: (r) => {
      const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
      return [p.health, p.diseaseDetail, p.allergy, p.surgery, p.longTermMeds].filter(isText).join('，');
    }
  }
};

function ruleMeta(id: string, r: Partial<DabingliRecord>): DepthRuleMeta {
  if (Object.prototype.hasOwnProperty.call(RULE_META, id)) return RULE_META[id];
  if (id.indexOf('sym:') === 0) {
    return {
      code: 'DEPTH_SYMPTOM_QUANTIFICATION',
      path: 'hpi.symptoms',
      action: '补症状量化',
      evidence: () => {
        const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
        return [h.onset, h.cause, h.symptoms, h.relief, h.evolution, h.accompanying].filter(isText).join('，');
      }
    };
  }
  if (id.indexOf('aux-grade:') === 0) {
    return {
      code: 'DEPTH_AUX_GRADE',
      path: 'auxiliary.items',
      action: '抄录检查分级',
      evidence: () =>
        ((r.auxiliary && r.auxiliary.items) || [])
          .filter((it) => it && isText(it.name))
          .map((it) => t(it.name))
          .join('、')
    };
  }
  return {
    code: 'DEPTH_INTERNAL',
    path: 'record',
    action: '忽略该提醒',
    evidence: () => ''
  };
}

function typedRule(item: RawDepthFinding, r: Partial<DabingliRecord>): DepthItem {
  const meta = ruleMeta(item.id, r || {});
  const evidenceText = t(meta.evidence ? meta.evidence(r || {}) : '') || t(item.message);
  const protocol = createDiagnostic({
    code: meta.code,
    severity: SEVERITY_BY_LEVEL[item.level] || 'info',
    document: 'record',
    path: meta.path,
    message: item.message,
    action: meta.action,
    evidence: evidenceText ? [{ path: meta.path, text: evidenceText }] : []
  });
  return {
    ...item,
    ...protocol,
    paths: protocol.paths || (meta.path ? [meta.path] : []),
    evidence: protocol.evidence || [],
    label: LABEL[item.level] || ''
  };
}

function splitClauses(text: unknown): string[] {
  return String(text == null ? '' : text)
    .split(/[，,；;。\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 使用共享 AGE 口径获取周岁（月龄/日龄按 0 岁，未知返回 NaN） */
function ageOf(r: Partial<DabingliRecord> | null | undefined): number {
  return ageYearsOf(r as DabingliRecord);
}

function mentions(clauses: readonly string[], trig: RegExp): number[] {
  const hits: number[] = [];
  clauses.forEach((c, i) => {
    const m = c.match(trig);
    if (!m || m.index === undefined) return;
    if (isNegatedBeforeIndex(c, m.index, 8)) return;
    hits.push(i);
  });
  return hits;
}

function scopeText(
  clauses: readonly string[],
  startIdx: number,
  allTriggers: readonly RegExp[],
  ownTrigger: RegExp
): string {
  const parts = [clauses[startIdx]];
  for (let i = startIdx + 1; i < clauses.length; i++) {
    const c = clauses[i];
    const other = allTriggers.some((re) => re !== ownTrigger && re.test(c));
    if (other) break;
    parts.push(c);
  }
  return parts.join('，');
}

export const SYMPTOMS: readonly DepthSymptomRule[] = [
  {
    key: 'vomit',
    name: '呕吐',
    trig: /呕吐/,
    aspects: [
      {
        name: '次数',
        re: /(每日|每天|一日|一天|1日)\s*[0-9一二三四五六七八九十]+|[0-9一二三四五六七八九十]+\s*次|偶有|频繁|多次|次数/
      },
      {
        name: '呕吐物性状',
        re: /胃内容物|胆汁|咖啡样|咖啡色|血性|宿食|食物残渣|酸水|黄绿色|米汤样/
      }
    ],
    tip: '呕吐要写清每天几次、吐出的是什么（胃内容物／胆汁／咖啡样／血性／宿食），以及与进食、腹痛的关系。'
  },
  {
    key: 'melena',
    name: '黑便',
    trig: /黑便|柏油样?便/,
    aspects: [
      {
        name: '次数或量',
        re: /[0-9一二三四五六七八九十]+\s*次|每次|量约|[0-9]+\s*(?:ml|毫升|g|克)|鸡蛋|拳头|瓶|碗|较多|少量|量多|量少/
      },
      {
        name: '性状',
        re: /柏油样|柏油|成形|稀|糊状|黑亮|发亮|暗红/
      }
    ],
    tip: '黑便要说清每天几次、每次大概多少（用「一个鸡蛋大小」「半瓶矿泉水」这种具象说法最好）、是成形还是稀糊。出血量评估全靠这个。'
  },
  {
    key: 'hematemesis',
    name: '呕血',
    trig: /呕血|呕咖啡/,
    aspects: [
      { name: '量', re: /[0-9]+\s*(?:ml|毫升)|量约|每次|少量|大量|一口|数口/ },
      { name: '颜色', re: /鲜红|咖啡|暗红|暗褐|紫红/ }
    ],
    tip: '呕血要写清量（约多少毫升）和颜色（鲜红／咖啡样），这两项直接决定出血量和出血速度的判断。'
  },
  {
    key: 'abdpain',
    name: '腹痛',
    trig: /腹[^，。；]{0,4}(?:疼|痛)/,
    aspects: [{ name: '是持续性还是阵发性', re: /持续性|阵发性|间歇性|反复|持续|阵发/ }],
    tip: '腹痛必须写清是持续性还是阵发性——只写「隐痛」「胀痛」不够，这一项决定鉴别方向。'
  },
  {
    key: 'diarrhea',
    name: '腹泻',
    trig: /腹泻/,
    aspects: [
      { name: '次数', re: /[0-9一二三四五六七八九十]+\s*次|每日|每天|多次/ },
      { name: '性状', re: /水样|糊状|稀便|稀水|黏液|脓血|蛋花|米泔/ }
    ],
    tip: '腹泻要写清每天几次、大便什么性状（水样／糊状／黏液／脓血）。'
  },
  {
    key: 'fever',
    name: '发热',
    trig: /发热|发烧/,
    aspects: [
      {
        name: '体温或热型',
        re: /最高|体温[^，。；]{0,6}[0-9]|[0-9]+\.?[0-9]*\s*℃|[0-9]+\s*度|热型|弛张|稽留|间歇热|午后低热|寒战/
      }
    ],
    tip: '发热要写清最高多少度、什么热型、有没有寒战。'
  },
  {
    key: 'cough',
    name: '咳嗽',
    trig: /咳嗽/,
    aspects: [
      { name: '干咳还是湿咳（有没有痰）', re: /干咳|湿咳|湿性|咳痰|无痰|有痰|痰/ },
      { name: '昼夜节律', re: /夜间|日间|白天|晨起|阵发|连咳|持续/ }
    ],
    tip: '咳嗽要写清是干咳还是湿咳、痰的颜色和量、白天重还是夜间重。'
  }
];

const TRIGGERS = SYMPTOMS.map((s) => s.trig);

function checkSymptoms(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const narrative = [h.onset, h.cause, h.symptoms, h.relief, h.evolution, h.accompanying].filter(isText).join('，');
  if (!narrative) return out;

  const clauses = splitClauses(narrative);
  const cc = t(r.basic && r.basic.chiefComplaint);

  SYMPTOMS.forEach((sym) => {
    const hits = mentions(clauses, sym.trig);
    if (!hits.length) return;
    const scope = hits.map((i) => scopeText(clauses, i, TRIGGERS, sym.trig)).join('，');
    const missing = sym.aspects.filter((a) => !a.re.test(scope)).map((a) => a.name);
    if (!missing.length) return;
    const inCC = sym.trig.test(cc);
    out.push({
      id: `sym:${sym.key}`,
      level: inCC ? 'high' : 'mid',
      section: '现病史',
      message: `写了「${sym.name}」，但没写${missing.join('、')}。${sym.tip}`
    });
  });

  return out;
}

const NEG_SYMPTOM_WORDS = [
  '发热', '发烧', '呕血', '黑便', '腹痛', '腹胀', '胸痛', '胸闷', '心悸', '气促',
  '呼吸困难', '恶心', '呕吐', '腹泻', '便秘', '黄疸', '体重下降', '消瘦', '盗汗',
  '咳嗽', '咳痰', '咯血', '头晕', '头痛', '水肿', '尿频', '尿急', '尿痛', '皮疹',
  '关节痛', '乏力', '食欲', '晕厥', '黑矇'
];

const NEG_SYMPTOM_RE = new RegExp(
  `(?:无|未见|未出现|否认|没有|不伴|无明显)[^，。；]{0,8}(?:${NEG_SYMPTOM_WORDS.join('|')})`
);

function checkNegative(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  if (t(h.negativeDiscriminating) || t(h.negativePertinent)) return out;
  const narrative = [h.onset, h.symptoms, h.evolution, h.accompanying, h.treatment].filter(isText).join('，');
  if (!narrative) return out;
  if (NEG_SYMPTOM_RE.test(narrative)) return out;
  out.push({
    id: 'neg-symptom',
    level: 'high',
    section: '现病史',
    message: '现病史尚未记录相关阴性症状；请按实际询问结果补充有鉴别意义的内容。'
  });
  return out;
}

const CHRONIC = [
  '高血压', '糖尿病', '冠心病', '心力衰竭', '高脂血症', '脑卒中',
  '慢性阻塞性肺疾病', '哮喘', '痛风', '甲状腺功能亢进', '甲状腺功能减退',
  '类风湿关节炎', '慢性肾脏病', '肝硬化'
];

const MED_RE = /药|服用|口服|用药|治疗|控制/;

function checkChronic(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
  const checks = p.diseaseChecks || {};
  const hit = CHRONIC.filter((d) => checks[d]);
  if (!hit.length) return out;

  const meds = t(p.longTermMeds);
  const detail = t(p.diseaseDetail);
  const hasMed = !!meds || MED_RE.test(detail);

  if (!hasMed) {
    out.push({
      id: 'chronic-meds',
      level: 'high',
      section: '既往史',
      message: `「${hit.join('」「')}」仅记录了病名，可核对既往用药、剂量及控制情况。`
    });
    return out;
  }

  if (!/控制|监测|平稳|达标|良好|欠佳|不佳|正常/.test(meds + detail)) {
    out.push({
      id: 'chronic-control',
      level: 'mid',
      section: '既往史',
      message: `「${hit.join('」「')}」写了用药，但没写控制情况（家里是否监测、血压／血糖大概多少、控制得满意不满意）。`
    });
  }
  return out;
}

function checkSurgery(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
  const s = t(p.surgery);
  if (!s || /^(否认|无|未|没有)/.test(s)) return out;

  const missing: string[] = [];
  if (!/(\d{4}|[0-9一二三四五六七八九十]+)\s*年/.test(s)) missing.push('哪一年做的');
  if (!/(医院|卫生院|保健院|中心|诊所)/.test(s)) missing.push('在哪家医院做的');
  if (!/(术|切除|修补|吻合|置换|结扎|探查|引流|固定|方式)/.test(s)) missing.push('做的什么手术');

  if (!missing.length) return out;
  out.push({
    id: 'surgery-detail',
    level: 'high',
    section: '既往史',
    message: `手术史写了「${s}」，可核对${missing.join('、')}。`
  });
  return out;
}

const CARDIO_HISTORY = ['冠心病', '脑卒中', '心力衰竭'];
const ANTITHROMBOTIC_RE = /阿司匹林|氯吡格雷|替格瑞洛|华法林|利伐沙班|达比加群|抗凝|抗血小板|双抗/;

function checkAntithrombotic(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
  const checks = p.diseaseChecks || {};
  const text = [t(p.diseaseDetail), t(p.diseaseOther), t(p.longTermMeds), t(p.relatedHistory)].join('，');
  const risky = CARDIO_HISTORY.some((d) => checks[d]) || /房颤|心房颤动|支架|起搏器|瓣膜|换瓣/.test(text);
  if (!risky || ANTITHROMBOTIC_RE.test(text)) return out;

  out.push({
    id: 'antithrombotic',
    level: 'mid',
    section: '既往史',
    message:
      '病人有心血管病史，但没问抗血小板／抗凝药（阿司匹林、氯吡格雷、华法林、利伐沙班等）。' +
      '这类药术前一般要停 5～7 天，停不了的要改用低分子肝素桥接——直接影响手术能不能做、什么时候做。'
  });
  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function fmtDays(d: number): string {
  if (d >= 365) return `${round1(d / 365)} 年`;
  if (d >= 30) return `${round1(d / 30)} 个月`;
  if (d >= 1) return `${round1(d)} 天`;
  return `${round1(d * 24)} 小时`;
}

function checkDurationMatch(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const ccDays = chiefComplaintDays(b);
  const onsetDays = durationDays(h.onset);
  if (!Number.isFinite(ccDays) || !Number.isFinite(onsetDays)) return out;
  if (ccDays <= 0 || onsetDays <= 0) return out;

  const lo = Math.min(ccDays, onsetDays);
  const hi = Math.max(ccDays, onsetDays);
  if (hi - lo <= 1) return out;
  if (hi <= lo * 1.3) return out;

  out.push({
    id: 'duration-mismatch',
    level: 'mid',
    section: '主诉',
    message: `主诉写的时长和现病史的起病时间可能不同（主诉约 ${fmtDays(ccDays)}，现病史起病于 ${fmtDays(onsetDays)} 前），请核对是否描述不同阶段。`
  });
  return out;
}

function checkOnsetTrace(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const ccDays = chiefComplaintDays(b);
  if (!Number.isFinite(ccDays) || ccDays > 30) return out;

  const narrative = [h.onset, h.cause, h.symptoms, h.evolution].filter(isText).join('，');
  if (!narrative) return out;

  const days = maxDurationDays(narrative);
  if (!Number.isFinite(days) || days < 60) return out;
  if (days < ccDays * 4) return out;

  const re = new RegExp(DURATION_PATTERN.source, 'g');
  let m: RegExpExecArray | null;
  let shown = '';
  while ((m = re.exec(narrative)) !== null) {
    if (toDays(parseDurationNum(m[1]), m[2]) === days) {
      shown = m[0];
      break;
    }
  }

  out.push({
    id: 'onset-trace',
    level: 'high',
    section: '主诉',
    message: `主诉写了 ${fmtDays(ccDays)}，现病史还提到「${shown || fmtDays(days)}」，请核对较早症状与本次病情的关系。`
  });
  return out;
}

function checkAmbiguousDate(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const narrative = [h.onset, h.symptoms, h.evolution, h.treatment].filter(isText).join('，');
  if (!narrative) return out;

  const re = /(?<![月年\d])(\d{1,2})\s*日(?![前后余来左右内])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(narrative)) !== null) {
    const n = Number(m[1]);
    if (!(n > 12)) continue;
    out.push({
      id: 'ambiguous-date',
      level: 'low',
      section: '现病史',
      message: `现病史里的「${m[0]}」可能有歧义，请写明具体日期或距今时长。`
    });
    break;
  }
  return out;
}

function checkAuxHospital(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const items = (r.auxiliary && r.auxiliary.items) || [];
  const named = items.filter((it) => it && isText(it.name));
  if (!named.length) return out;
  const noHospital = named.filter((it) => !isText(it.hospital));
  if (noHospital.length < named.length) return out;

  out.push({
    id: 'aux-hospital',
    level: 'mid',
    section: '辅助检查',
    message: '辅助检查尚未填写机构。请按实际报告核对检查机构、检查号和时间。'
  });
  return out;
}

const GRADED_EXAMS = [
  { re: /乳腺|乳房|钼靶|BI-?RADS/i, grade: /BI-?RADS|0类|1类|2类|3类|4[ABC]?类?|5类|6类|RADS/i, name: 'BI-RADS 分级' },
  { re: /甲状腺|TI-?RADS/i, grade: /TI-?RADS|4[ABC]?类?|C?-?TIRADS/i, name: 'TI-RADS 分级' },
  {
    re: /胃镜|内镜|十二指肠镜/i,
    grade: /Forrest|Ⅰ[abc]?|Ⅱ[abc]?|Ⅲ|A[12]期|H[12]期|S[12]期|活动期|愈合期|瘢痕期/i,
    name: 'Forrest 分级或溃疡分期'
  }
];

function checkAuxGrade(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const items = (r.auxiliary && r.auxiliary.items) || [];
  GRADED_EXAMS.forEach((g) => {
    const hit = items.filter((it) => it && g.re.test(`${t(it.name)}，${t(it.result)}`));
    if (!hit.length) return;
    const graded = hit.some((it) => g.grade.test(t(it.result)));
    if (graded) return;
    out.push({
      id: `aux-grade:${g.name}`,
      level: 'mid',
      section: '辅助检查',
      message: `${hit[0].name}尚未记录${g.name}；如原报告包含分级，请核对后补充。`
    });
  });
  return out;
}

function checkMenstrual(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  if (b.gender !== '女') return out;
  const age = ageOf(r);
  if (!Number.isFinite(age) || age < 14) return out;

  const cc = t(b.chiefComplaint);
  const diag = ((r.diagnosis && r.diagnosis.confirmed) || []).join('，');
  const breastOrThyroid =
    /乳腺|乳房|乳[^，。；]{0,4}(?:肿块|包块|结节|癌|溢液|疼痛)|甲状腺|颈[部前][^，。；]{0,4}(?:肿块|肿物|结节|包块)/;
  if (!breastOrThyroid.test(`${cc}，${diag}`)) return out;

  const men = (r.menstruation || {}) as Partial<DabingliRecord['menstruation']>;
  // 支持 '有' | '无' | '未初潮' | '' 及旧数据布尔值：'未初潮'（尚未行经）或 false 不触发提醒
  if (men.applicable === false || men.applicable === '未初潮') return out;
  if (isText(men.lmp) || isText(men.menopauseAge) || isText(men.age)) return out;
  if (men.applicable === '无' && isText(men.extra)) return out;

  out.push({
    id: 'menstrual',
    level: 'mid',
    section: '月经史',
    message: '可结合本次病情核对月经史，并按实际询问结果填写。'
  });
  return out;
}

function checkPediatric(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const age = ageOf(r);
  if (!Number.isFinite(age) || age >= 14) return out;

  const p = r.personal || ({} as Partial<DabingliRecord['personal']>);
  if (isText(p.birth) || isText(p.feeding) || isText(p.growth)) return out;

  out.push({
    id: 'pediatric-personal',
    level: 'high',
    section: '个人史',
    message: '出生史、喂养史和生长发育史尚未填写，请根据实际情况核对。'
  });
  return out;
}

function checkMissedHistory(r: Partial<DabingliRecord>): RawDepthFinding[] {
  const out: RawDepthFinding[] = [];
  const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
  const hasCheckedDisease = Object.values(p.diseaseChecks || {}).some(Boolean);
  const any =
    t(p.health) ||
    t(p.diseaseDetail) ||
    t(p.infection) ||
    t(p.surgery) ||
    t(p.allergy) ||
    t(p.longTermMeds) ||
    hasCheckedDisease;
  if (!any) return out;

  if (!t(p.allergy)) {
    out.push({
      id: 'allergy-missed',
      level: 'mid',
      section: '既往史',
      message: '过敏史还没问（药物、食物都要问）。这一项漏了，出院带药时可能开出病人过敏的药。'
    });
  }
  if (!t(p.infection)) {
    out.push({
      id: 'infection-missed',
      level: 'low',
      section: '既往史',
      message: '传染病史还没问（乙肝、结核等）。外科和消化科尤其要问——乙肝关系到手术安排和抗病毒治疗。'
    });
  }
  return out;
}

const ORDER: Readonly<Record<'high' | 'mid' | 'low', number>> = { high: 0, mid: 1, low: 2 };
export const LABEL: Readonly<Record<string, string>> = { high: '核对', mid: '建议', low: '留意' };

export const DIAGNOSTIC_CODES: readonly string[] = [
  'DEPTH_SYMPTOM_QUANTIFICATION',
  'DEPTH_NEGATIVE_MISSING',
  'DEPTH_CHRONIC_MEDS',
  'DEPTH_CHRONIC_CONTROL',
  'DEPTH_SURGERY_DETAIL',
  'DEPTH_ANTITHROMBOTIC',
  'DEPTH_DURATION_MISMATCH',
  'DEPTH_ONSET_TRACE',
  'DEPTH_AMBIGUOUS_DATE',
  'DEPTH_AUX_HOSPITAL',
  'DEPTH_AUX_GRADE',
  'DEPTH_MENSTRUAL',
  'DEPTH_PEDIATRIC_PERSONAL',
  'DEPTH_ALLERGY_MISSED',
  'DEPTH_INFECTION_MISSED',
  'DEPTH_INTERNAL'
];

export function check(
  r: Partial<DabingliRecord> | null | undefined,
  _settings?: AppSettings | null,
  _options?: GenerateOptions
): DepthItem[] {
  if (!r || typeof r !== 'object') return [];
  let all: DepthItem[] = [];
  const rules = [
    checkSymptoms,
    checkNegative,
    checkChronic,
    checkSurgery,
    checkAntithrombotic,
    checkDurationMatch,
    checkOnsetTrace,
    checkAmbiguousDate,
    checkAuxHospital,
    checkAuxGrade,
    checkMenstrual,
    checkPediatric,
    checkMissedHistory
  ];
  rules.forEach((fn) => {
    try {
      all = all.concat((fn(r) || []).map((item) => typedRule(item, r)));
    } catch (e) {
      all.push(
        typedRule(
          {
            id: 'internal',
            level: 'low',
            section: '自查',
            message: `这一项自查没能跑完（${e && (e as Error).message ? (e as Error).message : '未知错误'}），请忽略。`
          },
          r
        )
      );
    }
  });

  all.forEach((f) => {
    f.label = LABEL[f.level] || '';
  });
  all.sort((a, b) => (ORDER[a.level] || 0) - (ORDER[b.level] || 0));
  return all;
}

export function count(r: Partial<DabingliRecord> | null | undefined): {
  total: number;
  high: number;
  mid: number;
  low: number;
} {
  const list = check(r);
  return {
    total: list.length,
    high: list.filter((f) => f.level === 'high').length,
    mid: list.filter((f) => f.level === 'mid').length,
    low: list.filter((f) => f.level === 'low').length
  };
}

export const _internals = {
  splitClauses,
  durationDays,
  fmtDays,
  parseNum: parseDurationNum
};

export const DEPTH = {
  check,
  count,
  LABEL,
  SYMPTOMS,
  DIAGNOSTIC_CODES,
  _internals
};

export default DEPTH;
