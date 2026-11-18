import { marriageValue } from '../core';
import { DEPARTMENTS, rosFactState, ROS } from '../schema';
import { isBareTimeFragment } from '../shared/text-utils';
import type { DabingliRecord, FactState, HpiSection } from '../types';
import { assembleClinicalNarrative } from './document-ir';
import {
  ageWithUnit,
  ensureSentence,
  filledOrPH,
  joinClauses,
  joinList,
  joinSentences,
  mergeIntoHistory,
  PH,
  squash,
  stripTail,
  subjectOf
} from './utils';

/* ---------------------------- 一般项目 ---------------------------- */

function departmentName(r: DabingliRecord): string {
  const raw = stripTail((r.basic || {}).department);
  if (!raw) return '';
  const dept = DEPARTMENTS.find((item) => item.key === raw);
  return dept ? dept.name : raw;
}

function dateTimeText(date: unknown, time: unknown): string {
  const d = stripTail(date);
  const t = stripTail(time);
  const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : '';
  if (!d && !validTime) return '';
  if (!validTime) return d;
  return `${d || PH} ${validTime}`;
}

function admissionPid(r: DabingliRecord): string {
  return stripTail((r.basic || {}).recordNo) || '';
}

function admissionHeaderLine(r: DabingliRecord): string {
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const ward = stripTail(b.ward) || stripTail(r.ward);
  return `PID：${filledOrPH(admissionPid(r))} 姓名：${filledOrPH(b.name)} 科室：${filledOrPH(departmentName(r))} 病区：${filledOrPH(ward)} 床号：${filledOrPH(b.bedNo)}`;
}

export function admissionPrefix(r: DabingliRecord): string {
  return `【入院记录】\n${admissionHeaderLine(r)}`;
}

export function buildAdmissionBasicInfo(r: DabingliRecord): string {
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const age = ageWithUnit(r);
  const marital = marriageValue(r);
  const pairs: ReadonlyArray<readonly [string, unknown]> = [
    ['姓名', b.name],
    ['性别', b.gender],
    ['年龄', age],
    ['科别', departmentName(r)],
    ['床号', b.bedNo],
    ['住院号', b.recordNo],
    ['民族', b.nationality],
    ['出生地', b.birthPlace],
    ['婚姻', marital],
    ['职业', b.occupation],
    ['入院日期', dateTimeText(b.admitDate, b.admitTime)],
    ['记录日期', dateTimeText(b.recordDate, b.recordTime)],
    ['病史陈述者', b.informant],
    ['病史可靠程度', b.reliability]
  ];
  return pairs.map(([label, value]) => `${label}：${filledOrPH(value)}`).join('\n');
}

export function buildBasicInfo(r: DabingliRecord, opts: { template?: boolean } = {}): string {
  if (opts.template) return buildAdmissionBasicInfo(r);
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const lines: string[] = [];
  const age = ageWithUnit(r);
  const dept = DEPARTMENTS.find((d) => d.key === b.department);
  const deptName = dept ? dept.name : '';

  lines.push(`姓名：${filledOrPH(b.name)}`);
  lines.push(`性别：${filledOrPH(b.gender)}`);
  lines.push(`出生日期：${filledOrPH(b.birthDate)}`);
  lines.push(`年龄：${filledOrPH(age)}`);
  lines.push(`科别：${filledOrPH(deptName)}`);
  lines.push(`床号：${filledOrPH(b.bedNo)}`);
  lines.push(`住院号：${filledOrPH(b.recordNo)}`);
  lines.push(`民族：${filledOrPH(b.nationality)}`);
  lines.push(`籍贯：${filledOrPH(b.nativePlace)}`);
  lines.push(`出生地：${filledOrPH(b.birthPlace)}`);
  const marital = marriageValue(r);
  lines.push(`婚姻：${filledOrPH(marital)}`);
  lines.push(`职业：${filledOrPH(b.occupation)}`);
  lines.push(`工作单位：${filledOrPH(b.workUnit)}`);
  lines.push(`通讯地址：${filledOrPH(b.address)}`);
  lines.push(`电话号码：${filledOrPH(b.phone)}`);
  const validTime = (value: unknown): string =>
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(stripTail(value)) ? ` ${stripTail(value)}` : '';
  lines.push(`入院日期：${filledOrPH(b.admitDate)}${validTime(b.admitTime)}`);
  lines.push(`记录日期：${filledOrPH(b.recordDate)}${validTime(b.recordTime)}`);
  const informant = stripTail(b.informant);
  lines.push(`病史陈述者：${filledOrPH(informant)}`);
  lines.push(`病史可靠程度：${filledOrPH(b.reliability)}`);
  return lines.join('\n');
}

/* ---------------------------- 主诉 ---------------------------- */

export function hasDurationInText(text: unknown): boolean {
  const t = stripTail(text);
  if (!t) return false;
  return /[0-9０-９一二三四五六七八九十百千万两半十几数余]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|h|min)/.test(t);
}

export function buildChiefComplaint(r: DabingliRecord): string {
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const cc = stripTail(b.chiefComplaint);
  if (!cc) return '';
  let dur = stripTail(b.chiefComplaintDuration);
  if (!dur) return `${cc}。`;

  const unit = b.chiefComplaintDurationUnit || '';
  if (!/[天日周月年小时分]/.test(dur)) dur += unit;
  if (cc.includes(dur)) return `${cc}。`;
  if (/[0-9一二三四五六七八九十百]+(天|日|周|月|年|小时|分钟)(?:余|多|左右|来)?$/.test(cc)) return `${cc}。`;
  return `${cc}${dur}。`;
}

/* ---------------------------- 现病史 ---------------------------- */

export function hpiGeneralSentence(r: DabingliRecord): string {
  return stripTail((r.hpi || {}).generalCondition);
}

export function isBareOnsetPhrase(text: unknown): boolean {
  return isBareTimeFragment(text);
}

export function normalizeCause(v: unknown): string {
  const t = stripTail(v);
  if (!t) return '';
  if (/^(无明显诱因|无诱因|无明显原因|诱因不明)/.test(t)) return t;
  if (/[。；;]/.test(t) || /(出现|发生|诱发|起病|引起)/.test(t)) return t;
  if (/后$/.test(t)) return `${t}起病`;
  return t;
}

export function negativeHistoryText(h: Partial<HpiSection> | null | undefined): string {
  const source = h || {};
  const seen = new Set<string>();
  return [source.negativeDiscriminating, source.negativePertinent]
    .map(stripTail)
    .filter((value) => {
      const key = squash(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('，');
}

export function hpiNarrativeParts(r: DabingliRecord): {
  manual: boolean;
  sentences: string[];
  general: string;
  other: string;
  extra: string;
} {
  const h = (r.hpi || {}) as Partial<HpiSection>;
  if (h.mode === 'manual') {
    const manual = stripTail(h.manual);
    const units = assembleClinicalNarrative ? assembleClinicalNarrative([manual]) : joinClauses([manual]);
    return {
      manual: true,
      sentences: units,
      general: hpiGeneralSentence(r),
      other: stripTail((r.pmh || {}).otherTreatDiseases),
      extra: stripTail(h.extra)
    };
  }
  const seg: string[] = [];
  const causeText = normalizeCause(h.cause);
  const onset = stripTail(h.onset);
  if (onset) seg.push(onset);

  const cause = mergeIntoHistory(seg, causeText);
  if (cause) seg.push(cause);

  if (stripTail(h.symptoms)) seg.push(stripTail(h.symptoms));

  const aggravating = mergeIntoHistory(seg, h.aggravating);
  if (aggravating) seg.push(aggravating);

  const relief = mergeIntoHistory(seg, h.relief);
  if (relief) seg.push(relief);

  if (stripTail(h.evolution)) seg.push(stripTail(h.evolution));
  if (stripTail(h.accompanying)) seg.push(stripTail(h.accompanying));

  const negative = mergeIntoHistory(seg, negativeHistoryText(h));
  if (negative) seg.push(negative);

  if (stripTail(h.treatment)) seg.push(stripTail(h.treatment));

  const other = stripTail((r.pmh || {}).otherTreatDiseases);
  const gc = hpiGeneralSentence(r);

  let bodySeg = seg;
  if (seg.length === 1 && isBareOnsetPhrase(seg[0])) bodySeg = [];
  const sentences = assembleClinicalNarrative ? assembleClinicalNarrative(bodySeg) : joinClauses(bodySeg);
  return { manual: false, sentences, general: gc, other, extra: stripTail(h.extra) };
}

export function buildHPI(r: DabingliRecord): string {
  const parts = hpiNarrativeParts(r);
  const { sentences, general: gc, other, extra } = parts;
  if (parts.manual) return sentences.length ? joinSentences(sentences) : '';
  const tail: string[] = [];
  if (gc) tail.push(gc);
  if (other) tail.push(`另有${other}，需继续治疗`);
  if (extra) tail.push(extra);
  if (!sentences.length && !tail.length) return '';
  let text = joinSentences(sentences.concat(tail));
  if (!/^(患者|患儿|产妇|孕妇|本人|家属|该)/.test(text)) {
    text = subjectOf(r) + text;
  }
  return text;
}

function splitAdmissionGeneralCondition(text: string): { body: string; general: string } {
  const t = stripTail(text);
  if (!t) return { body: '', general: '' };
  const trigger = /(^|[；;，,。])\s*(病来以来|发病以来|起病以来|起病来|病来)/;
  const match = t.match(trigger);
  if (!match || match.index === undefined) return { body: '', general: ensureSentence(`起病来，${t}`) };

  const body = stripTail(t.slice(0, match.index));
  let clause = stripTail(match[2] + t.slice(match.index + match[0].length));
  let previous: string;
  do {
    previous = clause;
    clause = stripTail(clause.replace(/^(?:病来以来|发病以来|起病以来|起病来|病来)[，,]?\s*/, ''));
  } while (clause !== previous);

  clause = stripTail(clause.replace(/([；;，,。])\s*(?:病来以来|发病以来|起病以来|起病来|病来)[，,]?\s*/g, '$1'));
  return {
    body,
    general: clause ? ensureSentence(`起病来，${clause}`) : '起病来。'
  };
}

export function buildAdmissionHPI(r: DabingliRecord): string {
  const parts = hpiNarrativeParts(r);
  const generalParts = splitAdmissionGeneralCondition(parts.general);
  let body = joinSentences(parts.sentences);
  if (body && !/^(患者|患儿|产妇|孕妇|本人|家属|该)/.test(body)) {
    body = subjectOf(r) + body;
  }
  if (generalParts.body) body = joinSentences([body, generalParts.body]);
  const dx = (((r.diagnosis || {}).confirmed || []).map(stripTail).filter(Boolean))[0] || '';
  const alreadyAdmitted = /收住入院|收入/.test([body, parts.general, parts.other, parts.extra].join(''));
  if (dx && !alreadyAdmitted) {
    body = ensureSentence(body) + `现为求进一步诊治，遂至我院就诊，拟“${dx}”收住入院。`;
  }
  const lines: string[] = [];
  if (body) lines.push(body);
  if (generalParts.general) lines.push('　　' + generalParts.general);
  if (parts.other) lines.push('　　' + ensureSentence(`伴发疾病：${parts.other}`));
  if (parts.extra) lines.push('　　' + ensureSentence(parts.extra));
  return lines.join('\n');
}

export function draftHPI(r: DabingliRecord): HpiSection {
  const h = (r.hpi || {}) as HpiSection;
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const m = String(b.chiefComplaint || '').match(
    /([0-9０-９一二三四五六七八九十百千万两半十几数]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟))/i
  );
  let cc = stripTail(b.chiefComplaint);
  const durText = m
    ? m[1]
    : stripTail(b.chiefComplaintDuration)
      ? stripTail(b.chiefComplaintDuration) + (b.chiefComplaintDurationUnit || '')
      : '';
  const out: HpiSection = { ...h };
  if (!stripTail(out.onset) && cc) {
    if (m && durText === m[1]) {
      const esc = m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rest = stripTail(cc.replace(new RegExp(`${esc}(?:余|多|左右|来|许)?`), ''));
      cc = rest || '上述症状';
    }
    out.onset = `${durText ? `${durText}前` : ''}出现${cc}`;
  }
  return out;
}

/* ---------------------------- 系统回顾 ---------------------------- */

export interface RosCollectedEntry {
  symptomKey: string;
  label: string;
  text: string;
  state: FactState;
  path: string;
}

export interface RosCollectedSystem {
  key: string;
  name: string;
  positives: string[];
  negatives: string[];
  entries: RosCollectedEntry[];
  asked: boolean;
}

export function collectROS(r: DabingliRecord): RosCollectedSystem[] {
  const res: RosCollectedSystem[] = [];
  ROS.forEach((sys) => {
    const store = (r.ros || {})[sys.key] || {};
    const positives: string[] = [];
    const negatives: string[] = [];
    const entries: RosCollectedEntry[] = [];
    let asked = false;
    sys.symptoms.forEach((sym) => {
      const v = store[sym.key] || {};
      const state = rosFactState(v);
      const path = `ros.${sys.key}.${sym.key}`;
      if (state === 'asked_positive') {
        asked = true;
        let s = sym.label;
        if (v.time) s += stripTail(v.time);
        if (stripTail(v.detail)) s += `，${stripTail(v.detail)}`;
        positives.push(s);
        entries.push({ symptomKey: sym.key, label: sym.label, text: s, state, path });
      } else if (state === 'asked_negative') {
        asked = true;
        negatives.push(sym.label);
        entries.push({ symptomKey: sym.key, label: sym.label, text: `无${sym.label}`, state, path });
      } else if (state !== 'not_asked') {
        entries.push({ symptomKey: sym.key, label: sym.label, text: '', state, path });
      }
    });
    res.push({ key: sys.key, name: sys.name, positives, negatives, entries, asked });
  });
  return res;
}

export function buildROS(r: DabingliRecord, mode?: string): string {
  const data = collectROS(r);
  const allPositives = data.some((d) => d.positives.length > 0);
  const anyAsked = data.some((d) => d.asked);
  if (!allPositives && mode === 'brief') {
    return anyAsked ? '各系统回顾未见阳性症状。' : '';
  }
  const lines: string[] = [];
  data.forEach((d) => {
    if (d.positives.length) {
      const posText = d.positives.join('');
      const negs = d.negatives.filter((n) => !posText.includes(n));
      const line = `${d.name}：${d.positives.join('；')}${negs.length ? `；无${joinList(negs)}` : ''}。`;
      lines.push(line);
    } else if (d.negatives.length && mode !== 'brief') {
      lines.push(`${d.name}：无${joinList(d.negatives)}。`);
    }
  });
  return lines.join('\n');
}

/* ---------------------------- 既往史 ---------------------------- */

function pastHealthSentence(value: string): string {
  const health = stripTail(value);
  if (!health) return '';
  if (/^(?:平素)?(?:体健|健康)$/.test(health)) return '患者既往体健。';
  if (/^(?:平素)?一般$/.test(health)) return '患者既往健康状况一般。';
  if (/^(?:较差|差)$/.test(health)) return '患者既往健康状况较差。';
  if (/^患者既往/.test(health)) return ensureSentence(health);
  if (/^患者/.test(health)) return ensureSentence(health.replace(/^患者/, '患者既往'));
  if (/^既往/.test(health)) return ensureSentence(`患者${health}`);
  return ensureSentence(`患者既往${health}`);
}

export function buildPMH(r: DabingliRecord, opts: { template?: boolean } = {}): string {
  const p = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
  const lines: string[] = [];

  const health = stripTail(p.health);
  if (opts.template) {
    const healthSentence = pastHealthSentence(health);
    lines.push(healthSentence || `既往健康状况：${PH}`);
  } else {
    lines.push(`既往健康状况：${health ? (/^(平素|既往)/.test(health) ? health : `平素${health}`) : PH}`);
  }

  const checked = Object.keys(p.diseaseChecks || {}).filter(
    (k) => (p.diseaseChecks || {})[k] && k !== '其他'
  );
  const other = stripTail(p.diseaseOther);
  const detail = stripTail(p.diseaseDetail);
  const treat = stripTail(p.otherTreatDiseases);
  const known = checked.concat(other ? [other] : []);
  let disease: string;
  if (detail) disease = detail;
  else if (known.length || treat) {
    const rest = treat ? known.filter((k) => !treat.includes(k)) : known;
    disease = `既往患${joinList(rest.concat(treat ? [treat] : []))}`;
  } else disease = PH;
  lines.push(`疾病史：${disease}`);

  lines.push(`传染病史：${filledOrPH(p.infection)}`);
  lines.push(`预防接种史：${filledOrPH(p.vaccine)}`);

  if (p.allergy === '有') {
    const allergens = Object.keys(p.allergenChecks || {}).filter(
      (k) => (p.allergenChecks || {})[k] && k !== '其他'
    );
    const allergenOther = stripTail(p.allergenOther);
    if (allergenOther) allergens.push(allergenOther);
    let s = allergens.length ? `${joinList(allergens)}过敏` : '有药物或食物过敏史';
    const reactions = Object.keys(p.allergenReactionChecks || {}).filter(
      (k) => (p.allergenReactionChecks || {})[k] && k !== '其他'
    );
    const reactionText = stripTail(p.allergyReaction);
    if (reactionText) s += `，表现为${reactionText}`;
    else if (reactions.length) s += `，表现为${joinList(reactions)}`;
    lines.push(`过敏史：${s}`);
  } else if (p.allergy === '无') {
    lines.push('过敏史：否认食物、药物过敏史');
  } else {
    lines.push(`过敏史：${PH}`);
  }

  lines.push(`手术史：${filledOrPH(p.surgery)}`);
  lines.push(`外伤史：${filledOrPH(p.trauma)}`);
  lines.push(`输血史：${filledOrPH(p.transfusion)}`);
  lines.push(`中毒史：${filledOrPH(p.poisoning)}`);
  lines.push(`长期用药：${filledOrPH(p.longTermMeds)}`);

  if (opts.template || stripTail(p.relatedHistory)) {
    lines.push(`与本病相关病史：${filledOrPH(p.relatedHistory)}`);
  }
  if (stripTail(p.special)) lines.push(`其它：${stripTail(p.special)}`);

  return lines.join('\n');
}

/* ---------------------------- 个人史 ---------------------------- */

function smokingHistoryText(p: Partial<DabingliRecord['personal']>): string {
  const smoke = stripTail(p.smoking);
  if (smoke === '有' || smoke === '吸烟') {
    return `吸烟史：有${p.smokingAmount ? `，${stripTail(p.smokingAmount)}` : ''}`;
  }
  if (smoke === '已戒' || smoke === '已戒烟' || smoke === '戒烟') {
    return `吸烟史：已戒烟${p.smokingAmount ? `，${stripTail(p.smokingAmount)}` : ''}`;
  }
  if (smoke === '无' || smoke === '不吸烟') return '吸烟史：无';
  if (smoke) return /吸烟|抽烟|戒烟|香烟|烟草/.test(smoke) ? smoke : `吸烟史：${smoke}`;
  return `吸烟史：${PH}`;
}

function drinkingHistoryText(p: Partial<DabingliRecord['personal']>): string {
  const drink = stripTail(p.drinking);
  if (drink === '有' || drink === '饮酒') {
    return `饮酒史：有${p.drinkingAmount ? `，${stripTail(p.drinkingAmount)}` : ''}`;
  }
  if (drink === '已戒' || drink === '已戒酒' || drink === '戒酒') {
    return `饮酒史：已戒酒${p.drinkingAmount ? `，${stripTail(p.drinkingAmount)}` : ''}`;
  }
  if (drink === '无' || drink === '不饮酒') return '饮酒史：无';
  if (drink) return /饮酒|喝酒|酗酒|戒酒|白酒|啤酒|黄酒|红酒/.test(drink) ? drink : `饮酒史：${drink}`;
  return `饮酒史：${PH}`;
}

export function buildPersonal(r: DabingliRecord, opts: { template?: boolean } = {}): string {
  const p = r.personal || ({} as Partial<DabingliRecord['personal']>);
  const items: Record<string, string> = {};
  if (stripTail(p.maternal)) items.maternal = `母孕史：${stripTail(p.maternal)}`;
  if (stripTail(p.birth)) items.birth = `出生史：${stripTail(p.birth)}`;
  if (stripTail(p.feeding)) items.feeding = `喂养史：${stripTail(p.feeding)}`;
  if (stripTail(p.growth)) items.growth = `生长发育史：${stripTail(p.growth)}`;
  if (stripTail(p.residence)) items.residence = `居住史：${stripTail(p.residence)}`;
  if (stripTail(p.travel)) items.travel = `疫区接触史：${stripTail(p.travel)}`;
  items.smoking = smokingHistoryText(p);
  items.drinking = drinkingHistoryText(p);
  items.occupation = `职业与工作条件：${filledOrPH(p.occupationEnv)}`;
  items.sexual = `冶游史：${filledOrPH(p.sexualHistory)}`;
  if (stripTail(p.premorbidPersonality)) {
    const v = stripTail(p.premorbidPersonality);
    items.premorbid = /^病前性格/.test(v) ? v : `病前性格：${v}`;
  }
  if (stripTail(p.stressEvent)) {
    const v = stripTail(p.stressEvent);
    items.stress = /^(发病前)?应激事件/.test(v) ? v : `发病前应激事件：${v}`;
  }
  items.drugs = `毒物接触史：${filledOrPH(p.drugs)}`;
  if (stripTail(p.environment)) items.environment = stripTail(p.environment);
  if (stripTail(p.habits)) items.habits = stripTail(p.habits);
  const order = opts.template
    ? [
        'maternal', 'birth', 'feeding', 'growth', 'residence', 'travel', 'sexual',
        'drinking', 'smoking', 'occupation', 'drugs', 'environment', 'habits', 'premorbid', 'stress'
      ]
    : [
        'maternal', 'birth', 'feeding', 'growth', 'residence', 'travel', 'smoking',
        'drinking', 'occupation', 'sexual', 'premorbid', 'stress', 'drugs', 'environment', 'habits'
      ];
  return order.map((key) => items[key]).filter(Boolean).join('\n');
}

/* ---------------------------- 婚育史 ---------------------------- */

function appendMarriageExtra(m: Partial<DabingliRecord['marriage']>, push: (part: string) => void): void {
  const withLabel = (label: string, raw: unknown): string => {
    const v = stripTail(raw);
    if (!v) return '';
    return v.startsWith(label) ? v : label + v;
  };
  const sex = withLabel('性生活', m.sexLife);
  if (sex) push(sex);
  const rel = withLabel('夫妻关系', m.relation);
  if (rel) push(rel);
}

export function buildMarriage(r: DabingliRecord): string {
  const m = r.marriage || ({} as Partial<DabingliRecord['marriage']>);
  const status = marriageValue(r);
  if (status === '未婚') return '未婚。';
  let s = status;
  if (!s) return '';
  if (m.age) s += `，${m.age}岁结婚`;
  if (m.spouseHealth) s += `，${stripTail(m.spouseHealth)}`;
  appendMarriageExtra(m, (part) => {
    s += `，${part}`;
  });
  return `${s}。`;
}

export function buildMarriageHistory(r: DabingliRecord): string {
  const m = r.marriage || ({} as Partial<DabingliRecord['marriage']>);
  const status = marriageValue(r);
  if (status === '未婚') return '未婚。';
  const seg: string[] = [];
  if (status) seg.push(status);
  if (m.age) seg.push(`${m.age}岁结婚`);
  if (m.spouseHealth) {
    const sp = stripTail(m.spouseHealth);
    seg.push(/^配偶/.test(sp) ? sp : `配偶${sp}`);
  }
  appendMarriageExtra(m, (part) => {
    seg.push(part);
  });
  if (!seg.length) return '';
  return `${seg.join('，')}。`;
}

export function buildMenstruation(r: DabingliRecord): string {
  const m = r.menstruation || ({} as Partial<DabingliRecord['menstruation']>);
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  if (b.gender !== '女') return '';
  if (m.applicable === '未初潮') {
    const extra = stripTail(m.extra);
    return extra ? `月经史：未初潮，${extra}。` : '月经史：未初潮。';
  }
  if (m.applicable === '无') {
    const parts: string[] = [];
    if (m.age) parts.push(`初潮${m.age}岁`);
    if (m.menopauseAge) parts.push(`${m.menopauseAge}岁绝经`);
    if (m.lmp) parts.push(`末次月经${m.lmp}`);
    const extra = stripTail(m.extra);
    if (extra) parts.push(extra);
    if (!parts.length) return '已绝经。';
    if (!m.age && !m.menopauseAge && !m.lmp && /绝经|停经/.test(extra)) return `${extra}。`;
    return `月经史：${parts.join('，')}。`;
  }
  const parts: string[] = [];
  if (m.age) parts.push(`初潮${m.age}岁`);
  if (m.cycle) parts.push(`周期${m.cycle}天`);
  if (m.duration) parts.push(`经期${m.duration}天`);
  if (m.quantity) parts.push(`经量${m.quantity}`);
  if (stripTail(m.color)) parts.push(`经血${stripTail(m.color)}`);
  if (stripTail(m.clot)) parts.push(`血块：${stripTail(m.clot)}`);
  if (m.dysmenorrhea === '有') parts.push('有痛经');
  else if (m.dysmenorrhea === '无') parts.push('无痛经');
  if (stripTail(m.leukorrhea)) parts.push(`白带：${stripTail(m.leukorrhea)}`);
  if (m.menopauseAge) parts.push(`${m.menopauseAge}岁绝经`);
  if (m.lmp) parts.push(`末次月经${m.lmp}`);
  if (m.extra) parts.push(stripTail(m.extra));
  if (!parts.length) return '';
  return `月经史：${parts.join('，')}。`;
}

export function buildChildbirth(r: DabingliRecord): string {
  const c = r.childbirth || ({} as Partial<DabingliRecord['childbirth']>);
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  if (!b.gender) return '';

  if (b.gender !== '女') {
    const mp: string[] = [];
    const childCount =
      String(c.children == null ? '' : c.children).trim() ||
      String(c.gravida == null ? '' : c.gravida).trim();
    if (childCount) mp.push(`育有子女${childCount}人`);
    if (stripTail(c.details)) mp.push(stripTail(c.details));
    if (!mp.length) return '';
    return `生育史：${mp.join('，')}。`;
  }

  const parts: string[] = [];
  const triggers = ['fullTerm', 'premature', 'alive'] as const;
  const nonEmpty = (k: keyof DabingliRecord['childbirth']): boolean =>
    String(c[k] == null ? '' : c[k]).trim() !== '';
  const hasQuad =
    triggers.some(nonEmpty) || (nonEmpty('abortion') && !nonEmpty('gravida') && !nonEmpty('para'));
  if (hasQuad) {
    const n = (k: keyof DabingliRecord['childbirth']): string =>
      String(c[k] == null ? '' : c[k]).trim() || '0';
    parts.push(`${n('fullTerm')}-${n('premature')}-${n('abortion')}-${n('alive')}`);
  } else if (nonEmpty('gravida') || nonEmpty('para') || nonEmpty('abortion')) {
    parts.push(
      `孕${nonEmpty('gravida') ? String(c.gravida).trim() : '0'}产${nonEmpty('para') ? String(c.para).trim() : '0'}`
    );
    if (nonEmpty('abortion')) parts.push(`流产${String(c.abortion).trim()}次`);
  }
  if (c.details) parts.push(stripTail(c.details));
  if (c.lastBirth) parts.push(`末次分娩${stripTail(c.lastBirth)}`);
  if (c.contraception) parts.push(`避孕措施：${stripTail(c.contraception)}`);
  if (!parts.length) {
    if (c.applicable === '无') return '无生育史。';
    return '';
  }
  return `生育史：${parts.join('，')}。`;
}

export function buildMenstruationChildbirth(r: DabingliRecord): string {
  const parts: string[] = [];
  const men = buildMenstruation(r);
  if (men) parts.push(men);
  const cb = buildChildbirth(r);
  if (cb) parts.push(cb);
  if (!parts.length) return PH;
  return parts.join('\n');
}

export function buildAdmissionMarriageChildbirth(r: DabingliRecord): string {
  const lines: string[] = [];
  const marriage = buildMarriageHistory(r);
  if (marriage && marriage !== PH) lines.push(marriage);
  if ((r.basic || {}).gender === '女') {
    const menstruation = buildMenstruation(r);
    if (menstruation) lines.push(menstruation);
  }
  const childbirth = buildChildbirth(r);
  if (childbirth) lines.push(childbirth);
  return lines.length ? lines.join('\n') : PH;
}

export function buildMarriageChildbirth(r: DabingliRecord): string {
  const lines: string[] = [];
  const mar = buildMarriageHistory(r);
  if (mar) lines.push(mar);
  const mc = buildMenstruationChildbirth(r);
  if (mc && mc !== PH) lines.push(mc);
  if (!lines.length) return PH;
  return lines.join('\n');
}

/* ---------------------------- 家族史 ---------------------------- */

function familyLine(label: string, already: RegExp, value: string): string {
  const v = stripTail(value);
  if (!v) return `${label}：／`;
  return already.test(v) ? v : `${label}：${v}`;
}

export function buildFamily(r: DabingliRecord): string {
  const f = r.family || ({} as Partial<DabingliRecord['family']>);
  const checked = Object.keys(f.diseaseChecks || {}).filter((k) => (f.diseaseChecks || {})[k]);
  const seg: string[] = [];
  const deceased = stripTail(f.deceased);
  if (deceased) seg.push(deceased);

  const similar = stripTail(f.similarDisease);
  if (similar) seg.push(familyLine('家族中类似疾病史', /类似疾病|相似疾病/, similar));
  else if (checked.length) seg.push(`家族中${joinList(checked)}病史`);
  else if (!deceased) seg.push('家族中类似疾病史：／');

  const infect = stripTail(f.infectionHistory);
  seg.push(
    infect
      ? familyLine('家族中结核、肝炎、性病等传染性疾病史', /传染性疾病|传染病史/, infect)
      : '家族中结核、肝炎、性病等传染性疾病史：／'
  );

  const three = stripTail(f.threeGeneration);
  seg.push(
    three
      ? familyLine('两系三代遗传性疾病史', /遗传性疾病|遗传病|两系三代/, three)
      : '两系三代遗传性疾病史：／'
  );

  if (stripTail(f.other)) seg.push(stripTail(f.other));
  return joinSentences(seg);
}
