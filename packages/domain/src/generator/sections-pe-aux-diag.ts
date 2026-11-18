import {
  childPEItems,
  DEPARTMENTS,
  normalizeFactState,
  PE_COMMON,
  PE_SPECIAL,
  peChecked,
  peFactState,
  peItemFilled,
  peNormalText,
  peValueIsDefault
} from '../schema';
import type { AuxiliaryItem, DabingliRecord, FieldStore, PeGroup, PeItem } from '../types';
import { buildChiefComplaint, buildHPI, hpiGeneralSentence, negativeHistoryText } from './sections-basic-history';
import {
  abnormalVitalFindings,
  ageWithUnit,
  dedupeClauses,
  dedupeTexts,
  ensureSentence,
  joinSentences,
  PH,
  splitClauses,
  squash,
  stripTail,
  subjectOf,
  vitalSnapshot,
  vitalValue
} from './utils';

/* ---------------------------- 体格检查 ---------------------------- */

export function buildVitals(r: DabingliRecord): string {
  const v = ((r.pe || {}).vitals || {}) as Record<string, unknown>;
  const snapshot = vitalSnapshot(v);
  const safe = (k: string): string => (snapshot[k] ? snapshot[k].raw : PH);
  const parts = [
    `T ${safe('temperature')}℃`,
    `P ${safe('pulse')}次/分`,
    `R ${safe('respiration')}次/分`,
    `BP ${safe('sbp')}/${safe('dbp')}mmHg`,
    `身高 ${safe('height')}cm`,
    `体重 ${safe('weight')}kg`
  ];
  if (vitalValue(v.headCirc) && safe('headCirc') !== PH) parts.push(`头围 ${safe('headCirc')}cm`);
  if (vitalValue(v.chestCirc) && safe('chestCirc') !== PH) parts.push(`胸围 ${safe('chestCirc')}cm`);
  if (vitalValue(v.abdCirc) && safe('abdCirc') !== PH) parts.push(`腹围 ${safe('abdCirc')}cm`);
  return `${parts.join('，')}。`;
}

export function peValue(r: DabingliRecord, groupKey: string, item: PeItem): string {
  const pe = (r.pe || {}) as unknown as Record<string, FieldStore | undefined>;
  const g = pe[groupKey] || {};
  const raw = g[item.key];
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    const d = ((r.peDefaults || {})[groupKey] || {}) as Record<string, string | undefined>;
    return d[item.key] || item.default || '';
  }
  return String(raw).trim();
}

export function peOutputValue(r: DabingliRecord, groupKey: string, item: PeItem): string {
  const pe = (r.pe || {}) as unknown as Record<string, FieldStore | undefined>;
  const store = pe[groupKey] || {};
  const own = stripTail(store[item.key]);
  const state = peFactState(r, groupKey, item.key, item);
  if (state === 'not_asked') return '';
  if (state === 'asked_positive') return own;
  if (state === 'asked_negative') return own || stripTail(peNormalText(item));
  if (state === 'default_normal_pending_review') return own;
  return own || stripTail(peValue(r, groupKey, item)) || stripTail(peNormalText(item));
}

export function peParentChildConflict(
  groupKey: string,
  parentKey: string,
  parentText: string,
  childKey: string,
  childText: string
): boolean {
  const parent = String(parentText || '');
  const child = String(childText || '');
  if (groupKey === 'abdomen' && parentKey === 'abdPalpation') {
    const positivePain = /压痛/.test(child) && !/(无|未见|否认|没有)[^，。；、]{0,8}压痛/.test(child);
    const palpable = /(?:可触及|触及包块|触及肿块)/.test(child) && !/(未|无|不能)触及/.test(child);
    if (
      /无压痛/.test(parent) &&
      positivePain &&
      ['abdPalpSuperficial', 'abdPalpDeep', 'gallbladderPalpation'].includes(childKey)
    ) {
      return true;
    }
    if (/(未触及|肝脾肋下未触及)/.test(parent) && palpable) return true;
    if (/腹平软|腹软/.test(parent) && /腹肌紧张|板状腹/.test(child)) return true;
  }
  if (groupKey === 'nervousPE' && parentKey === 'nerve') {
    if (/病理反射未引出|神经系统常见阴性/.test(parent) && /阳性/.test(child)) return true;
  }
  if (groupKey === 'spine' && parentKey === 'limbs') {
    if (/活动自如/.test(parent) && childKey === 'limbMuscle' && /偏瘫|不能活动|不能行走/.test(child)) return true;
    if (/无水肿/.test(parent) && /水肿/.test(child) && !/无水肿/.test(child)) return true;
  }
  return false;
}

export interface PeEntry {
  item: PeItem;
  value: string;
}

export function peEntries(r: DabingliRecord, groupKey: string, items: readonly PeItem[]): PeEntry[] {
  const pe = (r.pe || {}) as unknown as Record<string, FieldStore | undefined>;
  const store = pe[groupKey] || {};
  return items
    .filter((it) => peChecked(r, groupKey, it.key))
    .filter((it) => {
      if (peItemFilled(store, it)) return true;
      const parent = stripTail(peValue(r, groupKey, it)) || stripTail(peNormalText(it));
      return !childPEItems(groupKey, it.key).some(
        (child) =>
          peChecked(r, groupKey, child.key) &&
          peParentChildConflict(
            groupKey,
            it.key,
            parent,
            child.key,
            stripTail(peValue(r, groupKey, child)) || stripTail(peNormalText(child))
          )
      );
    })
    .map((it) => ({ item: it, value: peOutputValue(r, groupKey, it) }))
    .filter((e) => Boolean(e && e.value));
}

export function renderPEGroup(group: Pick<PeGroup, 'name' | 'joinWith'>, entries: readonly PeEntry[]): string[] {
  const DASH = /^(.+?)—(.+)$/;
  const MODALITY = /^(视诊|触诊|叩诊|听诊|嗅诊)$/;
  const blocked: Array<{ block: string; label: string; value: string }> = [];
  const plain: string[] = [];
  entries.forEach((e) => {
    const label = e.item.label || '';
    const m = DASH.exec(label);
    if (m) blocked.push({ block: m[1], label: m[2], value: e.value });
    else if (MODALITY.test(label)) blocked.push({ block: label, label: '', value: e.value });
    else plain.push(e.value);
  });

  if (!blocked.length) {
    const texts = dedupeTexts(plain);
    const glue = group.joinWith || '。';
    return [`${group.name}：${texts.join(glue)}。`];
  }

  const lines: string[] = [];
  if (plain.length) lines.push(`${group.name}：${dedupeTexts(plain).join('。')}。`);
  else lines.push(`${group.name}：`);

  let last: string | null = null;
  blocked.forEach((b) => {
    const isNew = b.block !== last;
    if (isNew) {
      last = b.block;
      if (b.label) {
        lines.push(`　${b.block}：`);
        lines.push(`　　${b.label}：${b.value}`);
      } else {
        lines.push(`　${b.block}：${b.value}`);
      }
    } else if (b.label) {
      lines.push(`\u3000\u3000${b.label}：${b.value}`);
    } else {
      lines.push(`　${b.value}`);
    }
  });
  return lines;
}

export function buildPE(r: DabingliRecord, opts: { admission: true; template?: boolean }): { common: string; special: string };
export function buildPE(r: DabingliRecord, opts?: { admission?: false; template?: boolean }): string;
export function buildPE(
  r: DabingliRecord,
  opts: { admission?: boolean; template?: boolean } = {}
): string | { common: string; special: string } {
  const deptKey = (r.basic || {}).department || 'general';
  const dept = DEPARTMENTS.find((d) => d.key === deptKey) || DEPARTMENTS[0];
  const out: string[] = [];
  const vit = buildVitals(r);
  if (vit) out.push(vit);

  PE_COMMON.forEach((group) => {
    const items = group.items.filter((it) => !it.depts || it.depts.includes(deptKey));
    if (!items.length) return;
    const entries = peEntries(r, group.key, items);
    if (opts.admission) {
      if (group.key === 'genital') {
        ['genitalia', 'anus'].forEach((key, index) => {
          const entry = entries.find((value) => value.item.key === key);
          out.push(`${index ? '直肠肛门' : '外生殖器'}：${entry ? ensureSentence(entry.value) : PH}`);
        });
      } else if (group.key === 'chest') {
        const chest = entries.filter((entry) => !/^(lung|heart)/.test(entry.item.key));
        out.push(`胸部：${chest.length ? ensureSentence(chest.map((entry) => entry.value).join('。')) : PH}`);
        [
          ['lung', '肺'],
          ['heart', '心']
        ].forEach(([prefix, label]) => {
          const values = entries
            .filter((entry) => entry.item.key.startsWith(prefix))
            .map((entry) => entry.value);
          out.push(`　${label}：${values.length ? ensureSentence(values.join('。')) : PH}`);
        });
      } else {
        out.push(
          `${group.key === 'skin' ? '皮肤黏膜' : group.name}：${entries.length ? ensureSentence(entries.map((entry) => entry.value).join(group.joinWith || '。')) : PH}`
        );
      }
      return;
    }
    if (!entries.length) return;
    renderPEGroup(group, entries).forEach((line) => out.push(line));
  });

  const specialOut: string[] = [];
  const peMap = (r.pe || {}) as unknown as Record<string, FieldStore | undefined>;

  (dept.special || []).forEach((spKey) => {
    const sp = PE_SPECIAL[spKey];
    if (!sp) return;
    const storeKey = `special_${spKey}`;
    const store = peMap[storeKey] || {};
    const checkedItems = sp.items.filter((it) => peChecked(r, storeKey, it.key));
    const keepItems = checkedItems.filter((it) => {
      const subs = it.summaryOf;
      if (!Array.isArray(subs) || !subs.length) return true;
      if (String(store[it.key] || '').trim()) return true;
      return !subs.every((k) => peChecked(r, storeKey, k));
    });
    const vals = keepItems.map((it) => peOutputValue(r, storeKey, it));
    const seen = out.concat(specialOut).join('\n');
    const acc = [seen];
    const own: string[] = [];
    vals.forEach((v) => {
      const allSeen = splitClauses(v).every((c) => acc.some((s) => s.includes(c)));
      if (allSeen) return;
      own.push(v);
      acc.push(v);
    });
    if (!own.length) {
      if (vals.some(Boolean)) specialOut.push(`${sp.name}：见前述体格检查。`);
      return;
    }
    specialOut.push(`${sp.name}：${own.join('。')}。`);
  });

  const focus = buildFocusPE(r);
  if (focus) specialOut.push(focus);
  if (opts.admission) return { common: out.join('\n'), special: specialOut.join('\n') || PH };
  if (opts.template) {
    out.unshift('体格检查表（一）');
    if (specialOut.length) out.push('体格检查表（二）补充及专科情况', ...specialOut);
  } else {
    out.push(...specialOut);
  }
  return out.join('\n');
}

export function rawPeFactState(record: DabingliRecord, groupKey: string, itemKey: string): string {
  const all = (record || {}).peFactStates || {};
  const group = all[groupKey];
  if (!group || typeof group !== 'object') return '';
  const raw = group[itemKey];
  const value = raw && typeof raw === 'object' ? raw.state || raw.status : raw;
  return normalizeFactState(value);
}

export function anyPEExamined(r: DabingliRecord): boolean {
  const pe = (r || {}).pe || ({} as DabingliRecord['pe']);
  const factStates = (r || {}).peFactStates || {};
  const explicitExamined = Object.keys(factStates).some((groupKey) => {
    const group = factStates[groupKey];
    return (
      !!group &&
      typeof group === 'object' &&
      Object.keys(group).some((itemKey) => {
        const state = rawPeFactState(r, groupKey, itemKey);
        return Boolean(state && state !== 'not_asked');
      })
    );
  });
  if (explicitExamined) return true;
  const peObj = pe as unknown as Record<string, FieldStore | Record<string, FieldStore | undefined> | undefined>;
  const examined = Object.keys(peObj)
    .filter((k) => k !== 'vitals' && k !== 'checked')
    .some((k) => {
      const g = peObj[k];
      if (!g || typeof g !== 'object') return false;
      return Object.keys(g).some((itemKey) => {
        const v = (g as FieldStore)[itemKey];
        if (v === false || v === undefined || v === null) return false;
        if (v !== true && String(v).trim() === '') return false;
        return peFactState(r, k, itemKey) !== 'not_asked';
      });
    });
  if (examined) return true;
  const ck = pe.checked || {};
  return Object.keys(ck).some((g) => {
    const row = ck[g];
    return !!row && typeof row === 'object' && Object.keys(row).some((itemKey) => row[itemKey] === true);
  });
}

export function buildFocusPE(r: DabingliRecord): string {
  const f = r.focusPE || ({} as Partial<DabingliRecord['focusPE']>);
  const parts: string[] = [];
  const deptKey = (r.basic || {}).department || 'general';
  const peMap = (r.pe || {}) as unknown as Record<string, FieldStore | undefined>;

  (f.keys || []).forEach((ref) => {
    const text = String(ref || '');
    const dot = text.indexOf('.');
    if (dot <= 0) return;
    const groupKey = text.slice(0, dot);
    const itemKey = text.slice(dot + 1);
    let item: PeItem | null = null;
    let groupName = '';
    if (groupKey.startsWith('special_')) {
      const spKey = groupKey.slice('special_'.length);
      const dept = DEPARTMENTS.find((d) => d.key === deptKey) || DEPARTMENTS[0];
      if (!(dept.special || []).includes(spKey)) return;
      const sp = PE_SPECIAL[spKey];
      if (!sp) return;
      item = (sp.items || []).find((it) => it.key === itemKey) || null;
      groupName = sp.name;
    } else {
      const group = PE_COMMON.find((g) => g.key === groupKey);
      if (!group) return;
      item = group.items.find((it) => it.key === itemKey) || null;
      groupName = group.name;
    }
    if (!item) return;

    const store = peMap[groupKey] || {};
    if (!peChecked(r, groupKey, itemKey)) return;
    const filled = peItemFilled(store, item);
    const val = stripTail(peValue(r, groupKey, item));
    if (!filled || !val) return;
    parts.push(`${groupName}：${item.label}${val}`);
  });

  const note = stripTail(f.note);
  if (!parts.length && !note) return '';
  const body = parts.length ? `${parts.join('；')}。` : '';
  return `重点查体：${body}${note ? ensureSentence(note) : ''}`;
}

const POSITIVE_OVERRIDE = /未(?:闻及|探及|引出)(?:胎心|胎动|呼吸音|心音|肠鸣音)/;
const PE_NEG_PREFIX = /^(?:无(?!痛性)|未见(?!异常)|未发现|未查(?!见)|否认|没有|正常|阴性)/;
const PE_NEG_FINDING =
  /(?:无(?!痛性)|未见(?!异常)|未发现|未闻及|未触及|未引出|未扪及|不能触及|没有|否认)[^，。；、]{0,6}(?:压痛|反跳痛|包块|肿块|肿大|杂音|啰音|哮鸣音|摩擦音|震颤|结节|水肿|黄染|发绀|皮疹|出血点|畸形|抵抗|分泌物|充盈|渗出|溃疡|萎缩|异常|浊音|实音|充血|叩击痛|触痛|膨隆|隆起|肝|脾)/;
const PE_NEG_SUFFIX =
  /(?:肝|脾|包块|肿块|淋巴结|结节|异常|压痛|反跳痛|杂音|啰音|肿大|水肿|黄染|征|试验|反射)[^，。；、]{0,4}(?:未触及|未闻及|未引出|未及|阴性)|不肿$|不粗$|不高$/;
const PE_NEW_SUBJECT = /^(?:左|右|双|两侧|患侧|对侧|头部|颈|胸|腹|背|腰|上肢|下肢|四肢|全身|局部|前|后)/;
const PE_NOT_A_FINDING = /(触诊不满意|无法检查|拒查|未查)/;
const PE_NORMAL_EXACT = [
  /^腹部平坦$/,
  /^腹软$/,
  /^腹平软$/,
  /^腹部柔软$/,
  /^肠鸣音正常$/,
  /^肠鸣音正常[，,]?约?\d+次\/分$/,
  /^心界不大$/,
  /^心律齐$/,
  /^律齐$/,
  /^营养(?:情况)?(?:良好|中等|一般)$/,
  /^神志清$/,
  /^瞳孔等大等圆$/,
  /^对光反射(?:灵敏|灵敏正常)$/
];
const PE_NORMAL_PHRASE =
  /(营养良好|营养中等|营养一般|发育正常|发育良好|神志清楚|精神一般|精神可|自主体位|自动体位|面容自然|查体合作|皮肤弹性良好|毛发分布均匀|气管居中|颈软|腹平软|脊柱生理弯曲存在|生理反射存在|肌力正常|肌力5级|肌力Ⅴ级|双肺呼吸音清|呼吸音清|前囟平软|愈合良好)/;

function isNegativePeClause(c: string, item: PeItem): boolean {
  return (
    PE_NEG_PREFIX.test(c) ||
    PE_NEG_FINDING.test(c) ||
    PE_NEG_SUFFIX.test(c) ||
    PE_NOT_A_FINDING.test(c) ||
    PE_NORMAL_EXACT.some((rx) => rx.test(c)) ||
    PE_NORMAL_PHRASE.test(c) ||
    (item.key === 'face' && /^自然$/.test(c))
  );
}

/** 提取某项查体描述的阳性部分；绝不原地修改 schema 中的 item 单例。 */
function extractPositivePeText(item: PeItem, val: string): string {
  if (!val) return '';
  if (peValueIsDefault(item, val)) return '';
  const norm = (s: string): string => String(s).trim().replace(/[，,；;。.、\s]+$/g, '');
  if (item.normal && norm(val) === norm(item.normal)) return '';

  const positiveClauses: string[] = [];
  val.split(/[。；;]/).forEach((sentence) => {
    let negScope = false;
    sentence.split(/[，,、]/).forEach((clause) => {
      const c = clause.trim();
      if (!c) return;
      if (POSITIVE_OVERRIDE.test(c)) {
        positiveClauses.push(c);
        negScope = false;
        return;
      }
      if (isNegativePeClause(c, item)) {
        if (/(无|未见|未闻及|未触及|未引出|否认|没有)/.test(c)) negScope = true;
        return;
      }
      if (negScope && !PE_NEW_SUBJECT.test(c)) return;
      negScope = false;
      positiveClauses.push(c);
    });
  });
  return positiveClauses.join('，');
}

export interface AbnormalPeFinding {
  group: string;
  label: string;
  text: string;
  key: string;
}

export function abnormalPE(r: DabingliRecord): AbnormalPeFinding[] {
  const deptKey = (r.basic || {}).department || 'general';
  const dept = DEPARTMENTS.find((d) => d.key === deptKey) || DEPARTMENTS[0];
  const res: AbnormalPeFinding[] = [];

  PE_COMMON.forEach((group) => {
    const items = group.items.filter((it) => !it.depts || it.depts.includes(deptKey));
    peEntries(r, group.key, items).forEach(({ item: it, value }) => {
      const positiveText = extractPositivePeText(it, value);
      if (!positiveText) return;
      res.push({ group: group.name, label: it.label, text: positiveText, key: it.key });
    });
  });

  (dept.special || []).forEach((spKey) => {
    const sp = PE_SPECIAL[spKey];
    if (!sp) return;
    sp.items.forEach((it) => {
      if (!peChecked(r, `special_${spKey}`, it.key)) return;
      const val = peOutputValue(r, `special_${spKey}`, it);
      const positiveText = extractPositivePeText(it, val);
      if (!positiveText) return;
      res.push({ group: sp.name, label: it.label, text: positiveText, key: it.key });
    });
  });

  return res;
}

/* ---------------------------- 辅助检查 ---------------------------- */

export interface NormalizedAuxItem {
  name: string;
  result: string;
  date: string;
  hospital: string;
  no: string;
  category?: string;
}

export function auxItems(r: DabingliRecord): NormalizedAuxItem[] {
  const raw = (((r.auxiliary || {}).items) || [])
    .map((it): NormalizedAuxItem => {
      const o = (it || {}) as Partial<AuxiliaryItem>;
      return {
        name: stripTail(o.name),
        result: stripTail(o.result),
        date: String(o.date || '').trim(),
        hospital: stripTail(o.hospital),
        no: String(o.no || '').trim(),
        category: o.category
      };
    })
    .filter((it) => Boolean(it.name || it.result));

  const dated: Array<{ it: NormalizedAuxItem; i: number }> = [];
  const undated: Array<{ it: NormalizedAuxItem; i: number }> = [];
  raw.forEach((it, i) => {
    if (it.date) dated.push({ it, i });
    else undated.push({ it, i });
  });
  dated.sort((a, b) => (a.it.date === b.it.date ? a.i - b.i : a.it.date < b.it.date ? -1 : 1));
  return dated.concat(undated).map((x) => x.it);
}

export function auxiliaryCategory(item: Partial<NormalizedAuxItem> | null | undefined): 'lab' | 'special' | 'pathology' {
  if (item && item.category && ['lab', 'special', 'pathology'].includes(item.category)) {
    return item.category as 'lab' | 'special' | 'pathology';
  }
  const name = stripTail(item && item.name);
  if (/病理/.test(name)) return 'pathology';
  if (/(?:\b(?:CT|MRI|PET)\b|超声|X线|心电图|(?:胃|肠|支气管|膀胱|喉|内)镜|造影|核素|放射)/i.test(name)) {
    return 'special';
  }
  if (/(?:检验|血|尿|生化|常规|培养|免疫|电解质|凝血|血气)/.test(name)) return 'lab';
  return 'lab';
}

function formatAuxiliaryLine(item: NormalizedAuxItem, category: 'lab' | 'special' | 'pathology'): string {
  if (category === 'lab') {
    const hospital = stripTail(item.hospital);
    const parts = [`均于${hospital || '本院'}`];
    if (item.date) parts.push(item.date);
    if (item.no) parts.push(`检查号 ${item.no}`);
    if (item.name) parts.push(item.name);
    parts.push(item.result || PH);
    return ensureSentence(parts.join(' '));
  }
  const head: string[] = [];
  if (item.date) head.push(item.date);
  if (item.hospital) head.push(item.hospital);
  if (item.no) head.push(`检查号 ${item.no}`);
  const body =
    item.name && item.result
      ? `${item.name}：${item.result}。`
      : item.name
        ? `${item.name}：${PH}。`
        : `${item.result}。`;
  return head.length ? `${head.join(' ')} ${body}` : body;
}

export function buildAuxiliary(
  r: DabingliRecord,
  opts: { category?: 'lab' | 'special' | 'pathology'; template?: boolean } = {}
): string {
  const items = auxItems(r).filter(
    (item) =>
      !opts.category ||
      (opts.category === 'special'
        ? auxiliaryCategory(item) !== 'lab'
        : auxiliaryCategory(item) === opts.category)
  );
  if (!items.length) return '暂缺。';
  if (opts.category) return items.map((item) => formatAuxiliaryLine(item, auxiliaryCategory(item))).join('\n');
  if (!opts.template) return items.map((it) => formatAuxiliaryLine(it, 'special')).join('\n');

  const grouped: Record<'lab' | 'special' | 'pathology', NormalizedAuxItem[]> = {
    lab: [],
    special: [],
    pathology: []
  };
  items.forEach((item) => grouped[auxiliaryCategory(item)].push(item));
  const out: string[] = [];
  ([
    ['lab', '实验室检查'],
    ['special', '特殊检查'],
    ['pathology', '病理检查']
  ] as const).forEach(([key, label]) => {
    if (!grouped[key].length) return;
    out.push(`${label}：`);
    grouped[key].forEach((item) => out.push(formatAuxiliaryLine(item, key)));
  });
  return out.join('\n');
}

/* ---------------------------- 病历摘要 ---------------------------- */

function summaryHistory(r: DabingliRecord, hpi: string): string[] {
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const sentences = String(hpi || '')
    .split(/。/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (h.mode === 'manual') return sentences.slice(0, 2);

  const gc = hpiGeneralSentence(r);
  const other = stripTail((r.pmh || {}).otherTreatDiseases);
  const SUBJ = /^(患者|患儿|产妇|孕妇|本人|家属|该)/;
  const core = (s: string): string => squash(String(s || '').replace(SUBJ, ''));
  const skip = [gc, other ? `另有${other}，需继续治疗` : ''].map(core).filter(Boolean);
  const out = sentences.filter((s) => !skip.includes(core(s))).slice(0, 2);

  const neg = negativeHistoryText(h);
  if (neg) {
    const covered = squash(out.join(''));
    const NEG = /^(无|未|否认|没有|未见)/;
    const rest = neg
      .split(/[、，,]/)
      .map((s) => stripTail(s))
      .filter(Boolean)
      .filter((c) => !covered.includes(squash(c.replace(NEG, ''))));
    if (rest.length) {
      const head = (neg.match(NEG) || ['无'])[0];
      out.push(NEG.test(rest[0]) ? rest.join('、') : head + rest.join('、'));
    }
  }
  return out;
}

export function draftSummary(r: DabingliRecord): string {
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const seg: string[] = [];

  const who = [b.gender, ageWithUnit(r)].filter(Boolean).join('，');
  const ccFull = stripTail(buildChiefComplaint(r));
  const subj = subjectOf(r);
  if (who || ccFull) {
    let head = who ? `${subj}，${who}` : subj;
    if (ccFull) head += who ? `，因“${ccFull}”来院` : `因“${ccFull}”来院`;
    seg.push(head);
  }

  const hpi = buildHPI(r);
  if (hpi) {
    const points = summaryHistory(r, hpi);
    if (points.length) seg.push(points.join('。'));
  }

  const abn = abnormalPE(r);
  const abnormalVitals = abnormalVitalFindings(r);
  const peAll = abnormalVitals.concat(abn.map((a) => a.text).filter(Boolean));
  const dedup = dedupeClauses(
    peAll.filter((txt, i) => {
      if (!/^P \d+次\/分$/.test(txt)) return true;
      const m = txt.match(/\d+/);
      const num = m ? m[0] : '';
      return !peAll.some((other, j) => j !== i && /心率/.test(other) && other.includes(num));
    })
  );
  if (dedup.length) seg.push(`查体：${dedup.join('，')}`);
  else if (anyPEExamined(r)) seg.push('查体未见明显阳性体征');

  const aux = ((r.auxiliary || {}).items || []).filter((it) => stripTail(it.name) || stripTail(it.result));
  if (aux.length) {
    seg.push(
      '辅助检查：' +
        aux
          .map((it) => {
            const n = stripTail(it.name);
            const vv = stripTail(it.result);
            return n && vv ? `${n}（${vv}）` : n || vv;
          })
          .join('；')
    );
  }
  return joinSentences(seg);
}

export function buildSummary(r: DabingliRecord, _opts?: unknown): string {
  const manual = stripTail((r.summary || '').trim());
  if (manual) return `${manual}。`;
  return draftSummary(r);
}

/* ---------------------------- 初步诊断 ---------------------------- */

export function diagnosisList(r: DabingliRecord): string[] {
  return ((r.diagnosis || {}).confirmed || []).map((s) => stripTail(s)).filter(Boolean);
}

export function buildDiagnosis(r: DabingliRecord): string {
  const d = r.diagnosis || ({} as Partial<DabingliRecord['diagnosis']>);
  const list = (d.confirmed || []).map((s) => stripTail(s)).filter(Boolean);
  const sign = stripTail(d.signature);
  if (!list.length) return sign ? `待补充。\n\n医师签名：${sign}` : '待补充。';
  const body = list.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return sign ? `${body}\n\n医师签名：${sign}` : body;
}
