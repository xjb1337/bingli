/* ===========================================================================
 * 专科查体「勾选制」与「汇总项去重」测试（node:test）
 * 运行：node build.js && node --test tests/*.test.cjs
 *
 * 背景——这两套机制解决的都是「病历里出现了不该出现/重复出现的话」：
 *
 *   A 勾选制：学生这次做了哪几项检查，就只写哪几项。
 *     没勾的项一个字都不许出现——替学生编造他没做过的查体，是这类工具最不能
 *     犯的错，患者真按病历去复述会出人命。反过来，勾了却懒得写具体所见，
 *     要用该项目的规范正常描述补齐，不能留一个空条目。
 *
 *   B 汇总项去重：schema 里有一批历史遗留的「汇总项」（respExtra / gynExtra1…），
 *     内容已经被后来细分的明细项完整覆盖。全勾时两套都写，同一句话出现两遍。
 *     去重的做法是**整项让位**，不是按分句删——按分句删会切出「质中，活动度好」
 *     这种没有主语的半句，读病历的人根本不知道说的是子宫。所以 C 组专门盯着残句。
 *
 * 本文件与 src/ 的约定：
 *   SCHEMA.peChecked   —— 五级判定，决定一项要不要写
 *   SCHEMA.peNormalText —— 勾了没填时补的那句话
 *   GENERATOR.peEntries / buildPE —— 真正落笔的地方
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();

/* ------------------------------ 测试夹具 ------------------------------ */

/** 与 tests/generator.test.cjs 同款的最小可用记录：只填生成必需字段。 */
function makeRecord(deptKey) {
  const r = SCHEMA.emptyRecord();
  r.basic.department = deptKey;
  r.basic.name = '测试患者';
  r.basic.gender = '男';
  r.basic.age = '45';
  r.basic.marital = '已婚';
  r.basic.chiefComplaint = '咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '3天前出现咳嗽';
  r.hpi.generalCondition = '发病以来精神可';
  r.diagnosis.confirmed = ['待完善'];
  return r;
}

/** 专科查体段落在病历里是一行一项：以「〈科室〉专科查体：」开头。 */
function specialLineOf(peText, spName) {
  const lines = String(peText || '').split('\n');
  const idx = lines.findIndex(l => l.startsWith(spName + '：'));
  return {
    lines,
    idx,
    line: idx < 0 ? '' : lines[idx],
    count: lines.filter(l => l.startsWith(spName + '：')).length
  };
}

const stripTail = s => String(s || '').replace(/[。；;，,、\s]+$/, '');
const splitClauses = t => String(t || '').split(/[，,；;。、]/).map(s => s.trim()).filter(Boolean);
const hanLen = s => (String(s).match(/[\u4e00-\u9fa5]/g) || []).length;
const countOccur = (hay, needle) => (needle ? String(hay).split(needle).length - 1 : 0);

/** 科室 → 它的专科组列表（只有 12 个非 general 科室有专科组）。 */
function specialGroupsOf(dept) {
  return (dept.special || []).map(k => ({ key: k, sp: SCHEMA.PE_SPECIAL[k] })).filter(x => x.sp);
}

/** 勾选一个专科项（其余保持空记录默认的「全不勾」）。 */
function recordWithSpecial(deptKey, spKey, itemKey) {
  const r = makeRecord(deptKey);
  SCHEMA.setPeChecked(r, 'special_' + spKey, itemKey, true);
  return r;
}

const ALL_PE_ITEMS = (() => {
  const out = [];
  for (const g of SCHEMA.PE_COMMON) for (const it of g.items) out.push({ groupKey: g.key, item: it });
  for (const [spKey, sp] of Object.entries(SCHEMA.PE_SPECIAL)) {
    for (const it of sp.items) out.push({ groupKey: 'special_' + spKey, item: it, spKey, sp });
  }
  return out;
})();

/** 单项所属科室：专科项看 spKey，通用项看 depts 限定（如乳房只在外科）。 */
function deptKeyOfEntry(e) {
  if (e.spKey) {
    const d = SCHEMA.DEPARTMENTS.find(x => (x.special || []).includes(e.spKey));
    return d ? d.key : 'general';
  }
  const it = e.item;
  return (it.depts && it.depts.length) ? it.depts[0] : 'general';
}

/* ======================================================================
 * A 组：勾选制基础
 * ==================================================================== */

test('A0 通用查体默认全不勾：schema 有默认描述也不能算「已查」', () => {
  // 为什么重要：这是 entire 勾选制的地基。通用查体每一项都有 default（「神志清楚」
  // 「腹平软」这种正常描述），如果「有 default 就算已勾」，空记录就会吐出整段正常查体——
  // 学生一个字没填、一项没做，病历里却写着他查了 57 项、全部正常。那是编造。
  //
  // 教材《诊断学》第10版 第六篇：「病历必须客观地、真实地反映病情…避免任何臆断或虚构」。
  const withDefault = [];
  for (const g of SCHEMA.PE_COMMON) {
    for (const it of g.items) {
      if (!it.parent && String(it.default || '').trim()) withDefault.push(`${g.key}.${it.key}`);
    }
  }
  assert.ok(withDefault.length > 30,
    `有 default 的通用查体项只剩 ${withDefault.length} 个，本测试前提不成立`);

  const r = makeRecord('general');
  const wrong = withDefault.filter(ref => {
    const [g, k] = ref.split('.');
    return SCHEMA.peChecked(r, g, k) !== false;
  });
  assert.deepEqual(wrong, [],
    `这些项有默认描述，但学生没勾，却被当成已查（${wrong.length} 项）：\n` +
    wrong.slice(0, 10).join('\n'));

  // 落到病历文本上：空记录的体格检查里不能出现任何一句正常查体描述
  const pe = GENERATOR.buildPE(makeRecord('digestive'));
  for (const ref of withDefault.slice(0, 20)) {
    const [g, k] = ref.split('.');
    const norm = SCHEMA.peNormalText(SCHEMA.findPEItem(ref));
    if (!norm) continue;
    assert.ok(!pe.includes(norm),
      `${ref}（默认「${norm}」）没勾就写进了病历：\n${pe}`);
  }

  // 三个必须保留的例外：旧存档保护、显式勾选优先、显式取消能覆盖已写的字
  const legacy = makeRecord('general');
  legacy.pe.general = { conscious: '神志清楚' };
  assert.equal(SCHEMA.peChecked(legacy, 'general', 'conscious'), true,
    '旧存档里已经写了字的项必须仍视为已查，否则老病历会凭空丢内容');

  const explicit = makeRecord('general');
  SCHEMA.setPeChecked(explicit, 'general', 'conscious', true);
  assert.equal(SCHEMA.peChecked(explicit, 'general', 'conscious'), true);

  explicit.pe.general.conscious = '神志清楚';
  SCHEMA.setPeChecked(explicit, 'general', 'conscious', false);
  assert.equal(SCHEMA.peChecked(explicit, 'general', 'conscious'), false,
    '学生显式取消勾选，即使字段里还留着旧文字也必须尊重');
});

test('A1 专科查体默认不写进病历（13 个科室）', async t => {
  // 为什么重要：专科查体是「这次实际做了才写」的。空记录就等于学生什么都没做，
  // 病历里出现任何一句专科描述都是在替他编造查体结果。
  for (const dept of SCHEMA.DEPARTMENTS) {
    await t.test(dept.name, () => {
      const r = makeRecord(dept.key);
      const pe = GENERATOR.buildPE(r);
      const text = GENERATOR.generate(r).text;
      for (const { key, sp } of specialGroupsOf(dept)) {
        assert.ok(!pe.includes(sp.name),
          `[${dept.name}] 未勾选任何 ${sp.name} 项目时，体格检查里不应出现「${sp.name}」` +
          `（专科查体默认不勾，出现即等于编造未做的检查）。\n实际：${JSON.stringify(pe)}`);
        assert.ok(!text.includes(sp.name),
          `[${dept.name}] 整份病历都不应出现「${sp.name}」，实际：${JSON.stringify(text.slice(0, 400))}…`);
      }
      // 通用查体是默认写的，反过来也要保证「不写专科」不是靠整段查体失败实现的。
      assert.ok(pe.length > 0, `[${dept.name}] 通用查体应当照常生成，不应是空段落`);
    });
  }
});

test('A2 勾一个专科项后只写这一项，其他项不出现', async t => {
  // 为什么重要：勾选制最容易在两个方向上出错——漏写（勾了不出现，学生以为没保存）
  // 和多写（没勾的项被默认值带出来）。这里把每个专科项单独勾一遍，两边都盯住。
  const leaks = [];
  let swept = 0;

  for (const { key: spKey, sp } of Object.entries(SCHEMA.PE_SPECIAL).map(([key, sp]) => ({ key, sp }))) {
    const dept = SCHEMA.DEPARTMENTS.find(d => (d.special || []).includes(spKey));
    if (!dept) continue;
    for (const it of sp.items) {
      // 汇总项由 B 组专门覆盖（它的正常行为是「明细齐了就让位」），这里只看明细项。
      if (Array.isArray(it.summaryOf)) continue;
      swept++;
      const r = recordWithSpecial(dept.key, spKey, it.key);
      const pe = GENERATOR.buildPE(r);
      const got = specialLineOf(pe, sp.name);

      if (got.count !== 1) {
        leaks.push(`${spKey}.${it.key}: 「${sp.name}」行数=${got.count}，应恰好 1 行`);
        continue;
      }
      const body = stripTail(got.line.slice(sp.name.length + 1));
      if (!body) leaks.push(`${spKey}.${it.key}: 勾了却输出空内容（学生以为勾选没生效）`);

      // 没勾的项不许被带出来。按整句比对：短句（“两侧对称”之类）在不同项里
      // 本来就会合法重叠，按分句比会误伤。
      const own = SCHEMA.peNormalText(it);
      for (const other of sp.items) {
        if (other.key === it.key) continue;
        const otherText = SCHEMA.peNormalText(other);
        if (!otherText || otherText === own) continue;
        if (got.line.includes(otherText)) {
          leaks.push(`${spKey}.${it.key}: 未勾选的 ${other.key} 内容被带出（"${otherText}"）`);
        }
      }
    }
  }

  assert.ok(swept > 100, `逐个专科项扫描应当覆盖上百项，实际只扫到 ${swept} 项（schema 结构变化？）`);
  assert.deepEqual(leaks, [], `勾选制在 ${leaks.length} 项上失真：\n` + leaks.slice(0, 15).join('\n'));

  // 每科留一条具体锚点，失败时能一眼看出输出长什么样。
  // 期望值从 schema 现取，而不是抄一份文案进来：抄进来的那一刻起，这段
  // 断言测的就不是「渲染路径对不对」，而是「文案有没有被改过」——每次改
  // 正常描述都要来这里松一次绳子，最后没人知道这条测试原本在守什么。
  const anchors = [
    ['respiratory', 'respShape'],
    ['cardiology', 'cardioApex'],
    ['digestive', 'giExtra'],
    ['endocrinology', 'endoExtra'],
    ['nephrology', 'renalFacialEdema'],
    ['hematology', 'hemAnemia'],
    ['neurology', 'neuroExtra1'],
    ['pediatrics', 'pedExtra1'],
    ['surgery', 'surgExtra1'],
    ['obstetrics', 'obsExtra1'],
    ['gynecology', 'gynVulva'],
    ['emergency', 'emExtra1']
  ];
  for (const [spKey, itemKey] of anchors) {
    const sp = SCHEMA.PE_SPECIAL[spKey];
    const item = sp.items.find(it => it.key === itemKey);
    assert.ok(item, `锚点 ${spKey}.${itemKey} 不存在了，请更新这条测试`);
    const expected = `${sp.name}：${SCHEMA.peNormalText(item)}。`;
    const dept = SCHEMA.DEPARTMENTS.find(d => (d.special || []).includes(spKey));
    const got = specialLineOf(GENERATOR.buildPE(recordWithSpecial(dept.key, spKey, itemKey)), sp.name);
    assert.equal(got.line, expected,
      `只勾 ${spKey}.${itemKey} 时，专科查体这一行应当逐字如此；多一个空格、少一个句号都说明渲染路径变了。\n` +
      `实际整份体格检查：${JSON.stringify(got.lines)}`);
  }
});

test('A3 勾了但没填具体所见 → 写该项的 peNormalText', async t => {
  // 为什么重要：勾了不写会让病历出现「查了但什么都没记录」的空洞。
  // 兜底必须是 schema 里声明的规范正常描述，而不是随便一句「未见异常」。
  //
  // 特例：有 9 个专科项的每一句都已经被前面的通用查体写过一遍，教材对这种情形的
  // 处理是「只写见前述体格检查」。这时内容并没有丢，只是不重复写，所以断言是
  // 「要么正文就是 peNormalText，要么写见前述且每一句都能在前面找到」。
  const bad = [];
  const xref = [];

  for (const [spKey, sp] of Object.entries(SCHEMA.PE_SPECIAL)) {
    const dept = SCHEMA.DEPARTMENTS.find(d => (d.special || []).includes(spKey));
    if (!dept) continue;
    for (const it of sp.items) {
      const r = recordWithSpecial(dept.key, spKey, it.key);
      const pe = GENERATOR.buildPE(r);
      const got = specialLineOf(pe, sp.name);
      if (got.count !== 1) { bad.push(`${spKey}.${it.key}: 行数=${got.count}`); continue; }
      const body = stripTail(got.line.slice(sp.name.length + 1));
      const norm = stripTail(SCHEMA.peNormalText(it));

      if (body === norm) continue;

      if (body === '见前述体格检查') {
        const before = got.lines.slice(0, got.idx).join('\n');
        const missing = splitClauses(norm).filter(c => !before.includes(c));
        if (missing.length) {
          bad.push(`${spKey}.${it.key}: 写了「见前述体格检查」，但 ${JSON.stringify(missing)} 在前面根本找不到`);
        } else {
          xref.push(`${spKey}.${it.key}`);
        }
        continue;
      }
      bad.push(`${spKey}.${it.key}: 期望 "${norm}"，实际 "${body}"`);
    }
  }

  assert.deepEqual(bad, [], `勾了没填时没有正确补上规范描述（${bad.length} 项）：\n` + bad.slice(0, 15).join('\n'));
  // 交叉引用是 schema 演进的产物，数量不该悄悄变多——变多意味着新的专科项
  // 内容被通用查体掏空了，学生从此看不到专科特有的那几句。
  assert.ok(xref.length <= 12,
    `「见前述体格检查」的专科项增加到 ${xref.length} 个（${xref.join(',')}），` +
    `说明越来越多专科项的内容被通用查体完全覆盖，专科查体名存实亡`);
});

test('A3b 通用查体里只有 normal、没有 default 的项，勾了也必须补出文字', async t => {
  // 为什么重要：有 19 个通用查体项（腹部深层触诊、神经系统病理反射等）只在 schema 里
  // 写了 normal、没写 default。peValue 读 default 时返回空串，所以它们的文字**全靠**
  // 「勾了没填就补 peNormalText」这一条兜底。这条兜底一旦被删，这些项会静默变成空值
  // 被 peEntries 丢掉——学生勾了「巴氏征」却什么都没写，病历里就那么消失了，
  // 而且没有任何报错。专科项也走同一条路径，所以这里覆盖通用项，把 19 项全钉住。
  const bare = [];
  for (const g of SCHEMA.PE_COMMON) {
    for (const it of g.items) {
      const hasDefault = it.default != null && String(it.default).trim() !== '';
      const hasNormal = it.normal != null && String(it.normal).trim() !== '';
      if (hasNormal && !hasDefault) bare.push([g, it]);
    }
  }
  assert.ok(bare.length >= 19,
    `只有 normal 没有 default 的通用查体项只剩 ${bare.length} 个，schema 可能被改过，这个测试的前提不再成立`);

  const bad = [];
  for (const [g, it] of bare) {
    const r = makeRecord('general');
    SCHEMA.setPeChecked(r, g.key, it.key, true);
    const pe = GENERATOR.buildPE(r);
    const norm = stripTail(SCHEMA.peNormalText(it));
    if (!pe.includes(norm)) {
      bad.push(`${g.key}.${it.key}: 勾了这项、没填所见，但「${norm}」没有出现在体格检查里`);
    }
  }
  assert.deepEqual(bad, [],
    `勾了没填时这些项凭空消失（${bad.length} 项）——它们是只有 normal 没有 default 的项，` +
    `一旦兜底失效就会静默丢内容：\n` + bad.join('\n'));
});

test('A4 勾了且填了 → 写用户的话，不写默认值', async t => {
  // 为什么重要：学生写的具体所见（“双肺可闻及少量湿啰音”）是这份病历唯一的
  // 一手信息。任何情况下都不能被 schema 里的默认正常描述盖掉或者拼在后面，
  // 否则等于把阳性体征改写成阴性——这是最危险的一种数据损坏。
  const bad = [];
  for (const [spKey, sp] of Object.entries(SCHEMA.PE_SPECIAL)) {
    const dept = SCHEMA.DEPARTMENTS.find(d => (d.special || []).includes(spKey));
    if (!dept) continue;
    for (const it of sp.items) {
      const r = recordWithSpecial(dept.key, spKey, it.key);
      r.pe['special_' + spKey] = Object.assign({}, r.pe['special_' + spKey], { [it.key]: '自定义所见ZZ' });
      const pe = GENERATOR.buildPE(r);
      const got = specialLineOf(pe, sp.name);
      if (got.count !== 1) { bad.push(`${spKey}.${it.key}: 行数=${got.count}`); continue; }
      if (!got.line.includes('自定义所见ZZ')) {
        bad.push(`${spKey}.${it.key}: 用户写的「自定义所见ZZ」没有出现在病历里`);
      }
      const norm = SCHEMA.peNormalText(it);
      if (hanLen(norm) > 4 && got.line.includes(norm)) {
        bad.push(`${spKey}.${it.key}: 用户已经填了具体所见，仍把默认值「${norm}」写进了同一行`);
      }
    }
  }
  assert.deepEqual(bad, [], `用户填写的所见被默认值污染（${bad.length} 项）：\n` + bad.slice(0, 15).join('\n'));
});

test('A5 取消勾选一个通用查体项 → 该项完全不出现，且不能出现「未查」', async t => {
  // 为什么重要：病历里不能留下「未查」这种痕迹——它会让带教一眼看出这是模板生成
  // 且没做检查的病历，也让病历变成「自我举报」。正确做法是这一项整句消失。
  //
  // 通用查体已改为「默认全不勾」，所以这里不能靠默认值取得「其余都勾上」的底本，
  // 必须显式全勾、再把目标项单独取消——否则「取消后消失」是恒真，测了个寂寞。
  const allOn = [];
  const probe = makeRecord('general');
  for (const g of SCHEMA.PE_COMMON) {
    for (const it of g.items) SCHEMA.setPeChecked(probe, g.key, it.key, true);
  }
  for (const g of SCHEMA.PE_COMMON) {
    for (const it of g.items) if (SCHEMA.peChecked(probe, g.key, it.key)) allOn.push({ groupKey: g.key, item: it });
  }
  assert.ok(allOn.length > 20,
    `显式全勾后只认出 ${allOn.length} 项，勾选机制本身有问题`);

  /** 建一份「除某项外全部勾上」的记录 */
  function allOnExcept(deptKey, groupKey, itemKey) {
    const r = makeRecord(deptKey);
    for (const g of SCHEMA.PE_COMMON) {
      for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
    }
    SCHEMA.setPeChecked(r, groupKey, itemKey, false);
    return r;
  }

  // ① 条目层：取消勾选后 peEntries 不应再产出这一条
  await t.test('条目层：peEntries 不再产出该项', () => {
    const bad = [];
    for (const dept of SCHEMA.DEPARTMENTS) {
      for (const { groupKey, item } of allOn) {
        if (item.depts && !item.depts.includes(dept.key)) continue;
        const r = allOnExcept(dept.key, groupKey, item.key);
        if (SCHEMA.peChecked(r, groupKey, item.key) !== false) {
          bad.push(`${groupKey}.${item.key}: 显式取消勾选后 peChecked 仍为 true`);
          continue;
        }
        const group = SCHEMA.PE_COMMON.find(g => g.key === groupKey);
        const items = group.items.filter(it => !it.depts || it.depts.includes(dept.key));
        const entries = GENERATOR.peEntries(r, groupKey, items);
        if (entries.some(e => e.item.key === item.key)) {
          bad.push(`[${dept.key}] ${groupKey}.${item.key}: 已取消勾选，peEntries 仍然产出`);
        }
      }
    }
    assert.deepEqual(bad, [], `取消勾选没有在条目层生效（${bad.length} 处）：\n` + bad.slice(0, 15).join('\n'));
  });

  // ② 文本层：它的规范描述在整份病历里一个字都不能剩
  await t.test('文本层：规范描述在整份病历里消失', () => {
    const bad = [];
    // 「外生殖器」与「肛门」共用「未见异常」：取消其中一个，另一个仍会合法地写出
    // 「未见异常」，这是 schema 本身的文案重叠，不是勾选制失效——两个都取消才该消失。
    const SHARED = new Set(['genital.genitalia', 'genital.anus', 'genital.anus']);
    // 按分句比对，不能按子串比对：子项「脾肋下未触及」正好是父项
    // 「腹平软…肝脾肋下未触及」的一截，子串匹配会把父项正常写出误判成子项残留。
    // 真正要防的是它作为独立分句再出现一次。
    const clausesOf = text => text.split(/[，,；;。\n]/).map(s => s.trim()).filter(Boolean);
    for (const { groupKey, item } of allOn) {
      if (SHARED.has(`${groupKey}.${item.key}`)) continue;
      const norm = SCHEMA.peNormalText(item);
      if (!norm) continue;
      for (const dept of SCHEMA.DEPARTMENTS) {
        if (item.depts && !item.depts.includes(dept.key)) continue;
        const r = allOnExcept(dept.key, groupKey, item.key);
        const text = GENERATOR.generate(r).text;
        if (clausesOf(text).includes(norm)) {
          bad.push(`[${dept.key}] ${groupKey}.${item.key}: 取消勾选后仍出现「${norm}」`);
        }
      }
    }
    assert.deepEqual(bad, [], `取消勾选后内容仍有残留（${bad.length} 处）：\n` + bad.slice(0, 15).join('\n'));

    // 两个共用「未见异常」的项同时取消，整行应当消失
    const r2 = makeRecord('general');
    SCHEMA.setPeChecked(r2, 'genital', 'genitalia', false);
    SCHEMA.setPeChecked(r2, 'genital', 'anus', false);
    const pe2 = GENERATOR.buildPE(r2);
    assert.ok(!pe2.includes('未见异常'),
      `外生殖器与肛门都不勾选后，仍写出了「未见异常」：\n${pe2}`);
  });

  // ③ 整份病历任何配置下都不该出现「未查」
  await t.test('全科室扫描：任何配置都不出现「未查」字样', () => {
    const bad = [];
    for (const dept of SCHEMA.DEPARTMENTS) {
      const configs = [];
      const blank = makeRecord(dept.key);
      configs.push(['空记录', blank]);

      const allOff = makeRecord(dept.key);
      for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(allOff, g.key, it.key, false);
      configs.push(['全部取消勾选', allOff]);

      const allOn = makeRecord(dept.key);
      for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(allOn, g.key, it.key, true);
      for (const { key, sp } of specialGroupsOf(dept)) for (const it of sp.items) SCHEMA.setPeChecked(allOn, 'special_' + key, it.key, true);
      configs.push(['全部勾选', allOn]);

      for (const [label, r] of configs) {
        const text = GENERATOR.generate(r).text;
        if (text.includes('未查')) bad.push(`[${dept.key}/${label}] 出现了「未查」`);
      }
    }
    assert.deepEqual(bad, [], `病历里出现了「未查」字样（${bad.length} 处）：\n` + bad.join('\n') +
      `\n（「未查」会让带教看出这是没做检查的模板病历，正确做法是整项不写）`);
  });
});

test('A6 旧存档：pe 里有字但 pe.checked 为空 → 该项仍然出现', async t => {
  // 为什么重要：勾选制是后加的，之前存下来的病历里没有 checked 字段。
  // 如果只看 checked，学生打开旧病历会发现查体全没了——这是静默的数据丢失，
  // 比任何渲染瑕疵都严重。规则：已经写了字 = 一定查过。
  await t.test('专科项', () => {
    const bad = [];
    for (const { item, spKey, sp } of ALL_PE_ITEMS.filter(e => e.spKey)) {
      const dept = deptKeyOfEntry({ spKey });
      const r = makeRecord(dept);
      r.pe.checked = {};                        // 旧存档没有勾选记录
      r.pe['special_' + spKey] = Object.assign({}, r.pe['special_' + spKey], { [item.key]: '旧存档所见YY' });
      if (SCHEMA.peChecked(r, 'special_' + spKey, item.key) !== true) {
        bad.push(`${spKey}.${item.key}: 已有文字但 peChecked 判为未查`);
        continue;
      }
      const pe = GENERATOR.buildPE(r);
      const got = specialLineOf(pe, sp.name);
      if (!got.line.includes('旧存档所见YY')) bad.push(`${spKey}.${item.key}: 旧存档里的文字没有出现在病历里`);
    }
    assert.deepEqual(bad, [], `旧存档数据在专科查体里丢失（${bad.length} 项）：\n` + bad.slice(0, 15).join('\n'));
  });

  await t.test('通用查体项', () => {
    const bad = [];
    for (const { item, groupKey } of ALL_PE_ITEMS.filter(e => !e.spKey)) {
      const dept = deptKeyOfEntry({ groupKey, item });
      const r = makeRecord(dept);
      r.pe.checked = {};
      r.pe[groupKey] = Object.assign({}, r.pe[groupKey], { [item.key]: '旧存档通用QQ' });
      if (SCHEMA.peChecked(r, groupKey, item.key) !== true) {
        bad.push(`${groupKey}.${item.key}: 已有文字但 peChecked 判为未查`);
        continue;
      }
      const text = GENERATOR.generate(r).text;
      if (!text.includes('旧存档通用QQ')) bad.push(`[${dept}] ${groupKey}.${item.key}: 旧存档文字没有出现在病历里`);
    }
    assert.deepEqual(bad, [], `旧存档数据在通用查体里丢失（${bad.length} 项）：\n` + bad.slice(0, 15).join('\n'));
  });

  await t.test('汇总项（最容易被去重误杀的旧档）', () => {
    // 汇总项在明细勾齐时会让位；旧存档里没有勾选记录，所以明细一律「未勾」，
    // 汇总项必须原样保留。这是去重逻辑和旧档兼容最容易打架的地方。
    const bad = [];
    for (const [spKey, sp] of Object.entries(SCHEMA.PE_SPECIAL)) {
      for (const it of sp.items.filter(x => Array.isArray(x.summaryOf))) {
        const dept = SCHEMA.DEPARTMENTS.find(d => (d.special || []).includes(spKey));
        const r = makeRecord(dept.key);
        r.pe.checked = {};
        r.pe['special_' + spKey] = Object.assign({}, r.pe['special_' + spKey], { [it.key]: '旧存档汇总QQ' });
        const pe = GENERATOR.buildPE(r);
        const got = specialLineOf(pe, sp.name);
        if (!got.line.includes('旧存档汇总QQ')) {
          bad.push(`${spKey}.${it.key}: 旧存档里汇总项的文字被去重逻辑吞掉了`);
        }
      }
    }
    assert.deepEqual(bad, [], `旧存档的汇总项被误杀（${bad.length} 项）：\n` + bad.join('\n'));
  });
});

test('A7 有 parent 的子项默认不勾（父项概括时子项要主动勾）', async t => {
  // 为什么重要：腹部触诊的父项「全腹无压痛、反跳痛」已经把八项子检查概括进去了，
  // 如果子项也默认勾上，病历里会同时出现「全腹无压痛」和「右上腹压痛」这类
  // 自相矛盾的描述，带教一眼就能看出是模板拼出来的。
  const withParent = ALL_PE_ITEMS.filter(e => e.item.parent);
  assert.ok(withParent.length >= 10, `带 parent 的查体项只剩 ${withParent.length} 个，本测试前提不成立`);

  const bad = [];
  for (const dept of SCHEMA.DEPARTMENTS) {
    const r = makeRecord(dept.key);
    for (const { groupKey, item } of withParent) {
      if (SCHEMA.peChecked(r, groupKey, item.key) !== false) {
        bad.push(`[${dept.key}] ${groupKey}.${item.key}（parent=${item.parent}）默认被勾选`);
      }
    }
  }
  assert.deepEqual(bad, [], `带 parent 的子项默认被勾选（${bad.length} 处）：\n` + bad.slice(0, 15).join('\n') +
    `\n（子项默认勾选会与父项的概括性描述自相矛盾）`);

  // 具体锚点 + 反向确认：父项要主动勾，子项不跟着自动勾。
  // 注意「默认全不勾」之后父项也不再默认写入了，所以这里必须显式勾父项——
  // 这样测的才是「勾了父项不会顺手把子项也勾上」，而不是「两个都没勾」的恒等式。
  const r = makeRecord('general');
  SCHEMA.setPeChecked(r, 'abdomen', 'abdPalpation', true);
  assert.equal(SCHEMA.peChecked(r, 'abdomen', 'abdPalpation'), true,
    '腹部触诊父项勾选后应当生效');
  assert.equal(SCHEMA.peChecked(r, 'abdomen', 'abdPalpSuperficial'), false,
    '腹部浅触诊是有 parent 的子项，勾父项时不应被连带勾选');
  const pe = GENERATOR.buildPE(r);
  assert.ok(pe.includes('腹部'), '腹部段落应当照常生成');
  assert.ok(!pe.includes(SCHEMA.peNormalText(SCHEMA.findPEItem('abdomen.abdPalpSuperficial'))),
    `父项写入时，子项「浅触诊」的默认描述不应同时出现：\n${pe}`);

  // 子项被主动勾选、且父项也勾着时，父项应当让位（避免“全腹无压痛”与“右下腹压痛”并存）
  const r2 = makeRecord('general');
  SCHEMA.setPeChecked(r2, 'abdomen', 'abdPalpation', true);
  SCHEMA.setPeChecked(r2, 'abdomen', 'abdPalpSuperficial', true);
  r2.pe.abdomen = Object.assign({}, r2.pe.abdomen, { abdPalpSuperficial: '右下腹浅触诊压痛阳性' });
  const pe2 = GENERATOR.buildPE(r2);
  assert.ok(pe2.includes('右下腹浅触诊压痛阳性'), `子项填写后必须出现在病历里：\n${pe2}`);
  assert.ok(!pe2.includes(SCHEMA.peNormalText(SCHEMA.findPEItem('abdomen.abdPalpation'))),
    `子项接管后父项的「全腹无压痛」仍出现，与子项的阳性所见自相矛盾：\n${pe2}`);
});

/* ======================================================================
 * B 组：汇总项去重（summaryOf）
 *
 * schema 里 6 个汇总项声明了自己被哪些明细项完整覆盖：
 *   respExtra  ← respAccessory, respVocalResonance
 *   cardioExtra← cardioHeartSound, cardioPeripheralSign
 *   renalExtra ← renalFacialEdema, renalLegEdema, renalSkin
 *   hemExtra   ← hemSternum, hemBleeding, hemGum
 *   gynExtra1  ← gynVulva, gynVagina
 *   gynExtra2  ← gynUterus, gynAdnexa
 * 三条判据全满足才跳过汇总项：①声明了 summaryOf ②列出的明细项全都勾了
 * ③它自己没被用户改写。
 * ==================================================================== */

const SUMMARY_CASES = [
  { dept: 'gynecology', sum: 'gynExtra1', details: ['gynVulva', 'gynVagina'], needle: '外阴发育正常' },
  { dept: 'gynecology', sum: 'gynExtra2', details: ['gynUterus', 'gynAdnexa'], needle: '子宫前倾前屈' },
  { dept: 'hematology', sum: 'hemExtra', details: ['hemSternum', 'hemBleeding', 'hemGum'], needle: '胸骨无压痛' },
  { dept: 'cardiology', sum: 'cardioExtra', details: ['cardioHeartSound', 'cardioPeripheralSign'], needle: '未闻及额外心音' },
  { dept: 'nephrology', sum: 'renalExtra', details: ['renalFacialEdema', 'renalLegEdema', 'renalSkin'], needle: '颜面无水肿' },
  { dept: 'respiratory', sum: 'respExtra', details: ['respAccessory', 'respVocalResonance'], needle: '三凹征阴性' }
];

test('B0 schema 的 6 组 summaryOf 映射与去重逻辑的假设一致', () => {
  // 为什么重要：去重测试的所有断言都建立在「summaryOf 列的明细项确实覆盖了汇总项内容」
  // 这个前提上。前提变了，后面的测试就会变成假绿（比如明细项被删掉，汇总项让位后
  // 内容凭空消失，而测试还以为一切正常）。
  assert.equal(SUMMARY_CASES.length, 6, '本文件假定 schema 里恰好 6 个汇总项');
  const found = [];
  for (const [spKey, sp] of Object.entries(SCHEMA.PE_SPECIAL)) {
    for (const it of sp.items) if (Array.isArray(it.summaryOf)) found.push(`${spKey}.${it.key}`);
  }
  assert.deepEqual(found.sort(), SUMMARY_CASES.map(c => `${c.dept}.${c.sum}`).sort(),
    'schema 里的汇总项与测试假设不一致（新增/删除汇总项时，去重测试必须同步更新）');

  for (const c of SUMMARY_CASES) {
    const sp = SCHEMA.PE_SPECIAL[c.dept];
    const sum = sp.items.find(i => i.key === c.sum);
    assert.ok(sum, `${c.dept}.${c.sum} 不存在`);
    assert.deepEqual(sum.summaryOf, c.details,
      `${c.dept}.${c.sum} 的 summaryOf 与实际明细项不符`);
    for (const k of c.details) {
      const detail = sp.items.find(i => i.key === k);
      assert.ok(detail, `${c.dept}.${c.sum} 的 summaryOf 指向了不存在的明细项 ${k}`);
      const norm = SCHEMA.peNormalText(detail);
      assert.ok(norm, `明细项 ${c.dept}.${k} 没有 peNormalText，勾了没填会写出空条目`);
    }
    assert.ok(SCHEMA.peNormalText(sum), `汇总项 ${c.dept}.${c.sum} 没有默认描述`);
  }
});

test('B1-B6 汇总项与明细项全勾时，同一句话只写一次', async t => {
  // 为什么重要：这就是本组测试要解决的问题。学生点「全选」是常规操作，
  // 若汇总项与明细项都写，一份病历里「外阴发育正常」会连着出现两遍——
  // 这是最容易被带教一眼识破的模板痕迹，也说明工具在替学生重复劳动。
  // 去重的前提是不能丢内容：明细项写全了，汇总项才能整项让位。
  for (const c of SUMMARY_CASES) {
    await t.test(`${c.dept}：${c.sum} + ${c.details.join(' + ')}`, () => {
      const sp = SCHEMA.PE_SPECIAL[c.dept];
      const r = makeRecord(c.dept);
      for (const k of [c.sum, ...c.details]) SCHEMA.setPeChecked(r, 'special_' + c.dept, k, true);

      const text = GENERATOR.generate(r).text;
      const got = specialLineOf(GENERATOR.buildPE(r), sp.name);
      const body = got.line.slice(sp.name.length + 1);

      assert.equal(countOccur(text, c.needle), 1,
        `「${c.needle}」在整份病历里出现 ${countOccur(text, c.needle)} 次，应当只有 1 次。\n` +
        `（汇总项 ${c.sum} 的内容已被明细项 ${c.details.join('/')} 完整覆盖，两边都写就是同一句话连写两遍）\n` +
        `专科查体实际输出：${JSON.stringify(got.line)}`);

      // 被保留下来的必须是明细项那一路（汇总项的默认整句不该再出现）
      const sumNorm = SCHEMA.peNormalText(sp.items.find(i => i.key === c.sum));
      assert.ok(!body.includes(sumNorm),
        `汇总项 ${c.sum} 与明细项同时渲染，说明去重没生效。\n汇总项默认描述：${JSON.stringify(sumNorm)}\n实际：${JSON.stringify(body)}`);

      // 反向保证：明细项的内容一句不少（不能靠“把汇总项和明细项都删掉”来通过）
      const missing = [];
      for (const k of c.details) {
        const detail = sp.items.find(i => i.key === k);
        for (const clause of splitClauses(SCHEMA.peNormalText(detail))) {
          if (!body.includes(clause)) missing.push(`${k}:${clause}`);
        }
      }
      assert.deepEqual(missing, [],
        `去重时把明细项的内容弄丢了（${c.needle} 只剩一句）——\n` +
        `汇总项让位的前提是明细项写全，缺了 ${JSON.stringify(missing)}\n实际：${JSON.stringify(body)}`);
    });
  }
});

test('B14 只勾汇总项、不勾任何明细项 → 汇总项照常完整输出', async t => {
  // 为什么重要：去重逻辑最容易写错的方向是「看到 summaryOf 就跳过」。
  // 那样只要学生习惯性点汇总项，整个专科查体就消失了，而且不会有任何报错。
  for (const c of SUMMARY_CASES) {
    await t.test(`${c.dept}：只勾 ${c.sum}`, () => {
      const sp = SCHEMA.PE_SPECIAL[c.dept];
      const r = makeRecord(c.dept);
      SCHEMA.setPeChecked(r, 'special_' + c.dept, c.sum, true);

      const pe = GENERATOR.buildPE(r);
      const got = specialLineOf(pe, sp.name);
      assert.equal(got.count, 1,
        `只勾汇总项 ${c.sum} 时，专科查体段应当照常出现一行，实际 ${got.count} 行。\n` +
        `（去重只在明细项齐备时才让汇总项让位；明细没勾就跳过等于把内容全丢了）\n实际：${JSON.stringify(pe)}`);

      const body = stripTail(got.line.slice(sp.name.length + 1));
      const norm = stripTail(SCHEMA.peNormalText(sp.items.find(i => i.key === c.sum)));
      assert.equal(body, norm,
        `只勾汇总项时应当原样写出它的规范描述。\n期望：${JSON.stringify(norm)}\n实际：${JSON.stringify(body)}`);
    });
  }
});

test('B15 汇总项被用户改写过 → 即使明细项都勾了也保留用户的话', async t => {
  // 为什么重要：学生手动改写的文字是这份病历里最不可替代的部分。
  // 去重是为了去掉「默认值的重复」，绝不能顺手把学生亲手写的观察删掉——
  // 那句「子宫后倾后屈，活动度差」恰恰是他这次查体的阳性发现。
  for (const c of SUMMARY_CASES) {
    await t.test(`${c.dept}：${c.sum} 改写 + 明细全勾`, () => {
      const sp = SCHEMA.PE_SPECIAL[c.dept];
      const r = makeRecord(c.dept);
      const custom = '用户改写所见ZZ';
      for (const k of [c.sum, ...c.details]) SCHEMA.setPeChecked(r, 'special_' + c.dept, k, true);
      r.pe['special_' + c.dept] = Object.assign({}, r.pe['special_' + c.dept], { [c.sum]: custom });

      const pe = GENERATOR.buildPE(r);
      const got = specialLineOf(pe, sp.name);
      assert.ok(got.line.includes(custom),
        `汇总项 ${c.sum} 已经被用户改写，去重仍然把它删掉了——学生亲手写的所见丢失。\n实际：${JSON.stringify(got.line)}`);

      const sumNorm = SCHEMA.peNormalText(sp.items.find(i => i.key === c.sum));
      assert.ok(!got.line.includes(sumNorm),
        `保留了用户改写内容，但又把默认描述「${sumNorm}」写在后面，等于给阳性所见配了一句阴性结论。\n实际：${JSON.stringify(got.line)}`);

      // 明细项也不能因为汇总项被改写就集体让位
      for (const k of c.details) {
        const detail = sp.items.find(i => i.key === k);
        for (const clause of splitClauses(SCHEMA.peNormalText(detail))) {
          assert.ok(got.line.includes(clause),
            `汇总项被改写时，明细项 ${k} 的「${clause}」从病历里消失了。\n实际：${JSON.stringify(got.line)}`);
        }
      }
    });
  }
});

test('B 补充：明细项没勾全时汇总项必须保留（去重的边界）', async t => {
  // 为什么重要：三条判据里的第②条是「summaryOf 里列的每一项都勾了」。
  // 只勾了一半明细时，没勾的那部分内容只存在于汇总项里。此时若照样让汇总项让位，
  // 病历会静默丢掉一段真实查体结果——而且是看起来「去重成功」的那种静默。
  for (const c of SUMMARY_CASES) {
    await t.test(`${c.dept}：${c.sum} + 只勾 ${c.details[0]}`, () => {
      const sp = SCHEMA.PE_SPECIAL[c.dept];
      const r = makeRecord(c.dept);
      SCHEMA.setPeChecked(r, 'special_' + c.dept, c.sum, true);
      SCHEMA.setPeChecked(r, 'special_' + c.dept, c.details[0], true);

      const got = specialLineOf(GENERATOR.buildPE(r), sp.name);
      const body = got.line.slice(sp.name.length + 1);
      const sumNorm = SCHEMA.peNormalText(sp.items.find(i => i.key === c.sum));
      assert.ok(body.includes(stripTail(sumNorm)),
        `只勾了 ${c.details[0]}（共 ${c.details.length} 项明细），汇总项 ${c.sum} 却让位了，` +
        `剩下的明细项内容随之丢失。\n缺的汇总描述：${JSON.stringify(sumNorm)}\n实际：${JSON.stringify(body)}`);

      // 明细项那部分同样不能丢：汇总项让位的前提是「明细把内容讲全了」，
      // 但如果实现改成「只要有一项明细勾了就把汇总项整项丢掉」，没勾的明细
      // 和汇总项里独有的句子就都没了。这里逐句核对两者的规范描述都还在。
      const det = sp.items.find(i => i.key === c.details[0]);
      const missing = splitClauses(stripTail(SCHEMA.peNormalText(det)))
        .filter(cl => !body.includes(cl));
      assert.deepEqual(missing, [],
        `勾了 ${c.details[0]} 却漏写了它自己的所见：${JSON.stringify(missing)}\n实际：${JSON.stringify(body)}`);
    });
  }
});

test('B 补充：取消勾选汇总项、只勾明细项 → 明细照写，不重复', async t => {
  // 为什么重要：这是学生「知道有明细项、不用汇总项」的正常路径。
  // 明细项必须完整输出，且不能因为汇总项没勾就把内容也弄丢。
  for (const c of SUMMARY_CASES) {
    await t.test(`${c.dept}：取消 ${c.sum}，勾 ${c.details.join('/')}`, () => {
      const sp = SCHEMA.PE_SPECIAL[c.dept];
      const r = makeRecord(c.dept);
      SCHEMA.setPeChecked(r, 'special_' + c.dept, c.sum, false);
      for (const k of c.details) SCHEMA.setPeChecked(r, 'special_' + c.dept, k, true);

      const text = GENERATOR.generate(r).text;
      const got = specialLineOf(GENERATOR.buildPE(r), sp.name);
      const body = got.line.slice(sp.name.length + 1);
      assert.equal(countOccur(text, c.needle), 1,
        `明细项全勾、汇总项取消时「${c.needle}」出现 ${countOccur(text, c.needle)} 次，应当恰好 1 次。\n` +
        `实际：${JSON.stringify(got.line)}`);
      const sumNorm = SCHEMA.peNormalText(sp.items.find(i => i.key === c.sum));
      assert.ok(!body.includes(stripTail(sumNorm)),
        `汇总项已经取消勾选，却仍然写进了病历：${JSON.stringify(sumNorm)}\n实际：${JSON.stringify(body)}`);
    });
  }
});

test('B 补充：13 个科室全勾后，体格检查里没有重复的整句', async t => {
  // 为什么重要：逐项断言只覆盖了已知的 6 组汇总项。这条扫描盯着「未知的重复」——
  // 任何一个新加的汇总项或文案重叠都会在这里露头。
  for (const dept of SCHEMA.DEPARTMENTS) {
    await t.test(dept.name, () => {
      const r = makeRecord(dept.key);
      for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
      for (const { key, sp } of specialGroupsOf(dept)) for (const it of sp.items) SCHEMA.setPeChecked(r, 'special_' + key, it.key, true);

      const pe = GENERATOR.buildPE(r);
      const seen = new Map();
      pe.split('\n').forEach(raw => {
        const line = raw.replace(/^[\s\u3000]+/, '').replace(/\s+$/, '');
        if (!line || line.endsWith('：')) return;          // 「　肺：」这类块标题
        const idx = line.indexOf('：');
        const value = idx >= 0 ? line.slice(idx + 1) : line;
        for (const sentence of value.split('。').map(s => s.trim()).filter(s => hanLen(s) > 3)) {
          if (seen.has(sentence)) seen.set(sentence, seen.get(sentence) + 1);
          else seen.set(sentence, 1);
        }
      });
      const dups = [...seen.entries()].filter(([, n]) => n > 1).map(([s, n]) => `${s} ×${n}`);
      assert.deepEqual(dups, [], `[${dept.name}] 体格检查里出现重复整句（${dups.length} 句）：\n` + dups.join('\n'));
    });
  }
});

/* ======================================================================
 * C 组：不得产生残句
 *
 * 汇总项去重的做法是「整项跳过」而不是「按分句删」。这条边界必须被测试钉住：
 * 一旦有人为了少写几个字改成按分句删除，就会切出「质中，活动度好」这种
 * 没有主语的半句。重复只是啰嗦，残句是信息损坏——读病历的人会误判。
 * ==================================================================== */

/** 覆盖各种勾选/填写组合，供 C 组做批量扫描。 */
function buildConfigs(dept) {
  const configs = [];
  configs.push(['空记录', () => makeRecord(dept.key)]);

  configs.push(['通用查体全勾', () => {
    const r = makeRecord(dept.key);
    for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
    return r;
  }]);

  configs.push(['专科查体全勾', () => {
    const r = makeRecord(dept.key);
    for (const { key, sp } of specialGroupsOf(dept)) for (const it of sp.items) SCHEMA.setPeChecked(r, 'special_' + key, it.key, true);
    return r;
  }]);

  configs.push(['全部勾选', () => {
    const r = makeRecord(dept.key);
    for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
    for (const { key, sp } of specialGroupsOf(dept)) for (const it of sp.items) SCHEMA.setPeChecked(r, 'special_' + key, it.key, true);
    return r;
  }]);

  configs.push(['只勾汇总项', () => {
    const r = makeRecord(dept.key);
    for (const { key, sp } of specialGroupsOf(dept)) {
      for (const it of sp.items) if (Array.isArray(it.summaryOf)) SCHEMA.setPeChecked(r, 'special_' + key, it.key, true);
    }
    return r;
  }]);

  configs.push(['只勾明细项（汇总项全不勾）', () => {
    const r = makeRecord(dept.key);
    for (const { key, sp } of specialGroupsOf(dept)) {
      for (const it of sp.items) if (!Array.isArray(it.summaryOf)) SCHEMA.setPeChecked(r, 'special_' + key, it.key, true);
    }
    return r;
  }]);

  configs.push(['专科项逐个单独勾选', () => {
    // 每项单独构一个记录，用逗号串不起来，这里只取第一项做代表；
    // 真正的逐项覆盖在 A2/A3 里。
    const r = makeRecord(dept.key);
    for (const { key, sp } of specialGroupsOf(dept)) {
      const first = sp.items.find(it => !Array.isArray(it.summaryOf));
      if (first) SCHEMA.setPeChecked(r, 'special_' + key, first.key, true);
    }
    return r;
  }]);

  configs.push(['通用查体 + 单项专科', () => {
    const r = makeRecord(dept.key);
    for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
    for (const { key, sp } of specialGroupsOf(dept)) {
      const first = sp.items.find(it => !Array.isArray(it.summaryOf));
      if (first) SCHEMA.setPeChecked(r, 'special_' + key, first.key, true);
    }
    return r;
  }]);

  configs.push(['全部改写为自定义文字', () => {
    const r = makeRecord(dept.key);
    for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
    for (const { key, sp } of specialGroupsOf(dept)) {
      for (const it of sp.items) {
        SCHEMA.setPeChecked(r, 'special_' + key, it.key, true);
        r.pe['special_' + key] = Object.assign({}, r.pe['special_' + key], { [it.key]: '自定义所见' + it.key });
      }
    }
    return r;
  }]);

  configs.push(['取消一个默认勾选的通用项', () => {
    const r = makeRecord(dept.key);
    for (const g of SCHEMA.PE_COMMON) for (const it of g.items) SCHEMA.setPeChecked(r, g.key, it.key, true);
    SCHEMA.setPeChecked(r, 'abdomen', 'abdPalpSuperficial', false);
    return r;
  }]);

  configs.push(['汇总项 + 未勾全的明细（去重判据最容易被放宽的状态）', () => {
    // 让位判据要求「明细全勾」。只勾一半时汇总项必须留下来，这时输出里
    // 必然有整句重复（那是设计取舍），但绝不能因为「同时有两份内容」
    // 而在拼接处切出残句或标点错位。
    const r = makeRecord(dept.key);
    for (const { key, sp } of specialGroupsOf(dept)) {
      const sum = sp.items.find(it => Array.isArray(it.summaryOf));
      if (!sum) continue;
      SCHEMA.setPeChecked(r, 'special_' + key, sum.key, true);
      const det = sp.items.find(it => sum.summaryOf.includes(it.key));
      if (det) SCHEMA.setPeChecked(r, 'special_' + key, det.key, true);
    }
    return r;
  }]);

  return configs;
}

/** 收集全 schema 的分句语料，用来区分「首句」与「只能跟在后面的续句」。 */
function clauseCorpus() {
  const all = new Set();
  const leading = new Set();
  const push = t => splitClauses(t).forEach((c, i) => { all.add(c); if (i === 0) leading.add(c); });
  for (const g of SCHEMA.PE_COMMON) for (const it of g.items) { push(SCHEMA.peNormalText(it)); push(it.default); push(it.normal); }
  for (const sp of Object.values(SCHEMA.PE_SPECIAL)) for (const it of sp.items) { push(SCHEMA.peNormalText(it)); push(it.default); push(it.normal); }
  return { all, leading, continuation: [...all].filter(c => !leading.has(c)) };
}

test('C16 生成结果里没有残缺的分句（不以逗号/句号开头或结尾）', async t => {
  // 为什么重要：按分句删内容最容易留下的痕迹就是标点错位——
  // 「，活动度好。」「质中，。」这类输出，学生复制进大病历本会直接交上去。
  const bad = [];
  let scanned = 0;
  for (const dept of SCHEMA.DEPARTMENTS) {
    for (const [label, build] of buildConfigs(dept)) {
      scanned++;
      const text = GENERATOR.generate(build()).text;
      text.split('\n').forEach(raw => {
        const line = raw.replace(/^[\s\u3000]+/, '').replace(/\s+$/, '');
        if (!line || /^【[^】]*】$/.test(line)) return;    // 空行 / 章节标题
        const problems = [];
        if (/[，,；;、]$/.test(line)) problems.push('以分隔符结尾');
        if (/[，,；;]。/.test(line)) problems.push('句号前多一个分隔符');
        if (/。。/.test(line)) problems.push('连续两个句号');
        if (/[，,；;]{2}/.test(line)) problems.push('连续两个分隔符');
        if (/[（(]\s*[）)]/.test(line)) problems.push('空括号');
        if (/(^|[：:])[，,；;。、]/.test(line)) problems.push('冒号后直接跟分隔符');
        if (problems.length) bad.push(`[${dept.key}/${label}] ${problems.join('+')}: ${JSON.stringify(line.slice(0, 120))}`);
      });
    }
  }
  assert.ok(scanned > 100, `扫描配置只有 ${scanned} 个，覆盖不足`);
  assert.deepEqual(bad, [], `生成结果里有 ${bad.length} 处残缺标点：\n` + bad.slice(0, 20).join('\n') +
    `\n（这类输出通常来自“按分句删重复内容”，重复去掉了，句子也被切坏了）`);
});

test('C17 生成结果里没有长度 < 3 字的孤立分句', async t => {
  // 为什么重要：「质中」「律齐」单独成句时，读病历的人不知道在说哪个器官。
  // 这是按分句去重最典型的副作用：前半句被前面的通用查体占掉，剩下的半句
  // 就变成了无主语的碎片。宁可保留整句重复，也不能切出这种残句。
  const { continuation } = clauseCorpus();
  assert.ok(continuation.length > 50,
    `续句语料只有 ${continuation.length} 条，本测试的判定依据太弱，无法发现残句`);

  const tooShort = [];
  const orphan = [];
  let scanned = 0;

  for (const dept of SCHEMA.DEPARTMENTS) {
    for (const [label, build] of buildConfigs(dept)) {
      scanned++;
      const pe = GENERATOR.buildPE(build());
      pe.split('\n').forEach(raw => {
        const line = raw.replace(/^[\s\u3000]+/, '').replace(/\s+$/, '');
        // 「　肺：」「　听诊：」是块标题行，本身没有句意，跳过
        if (!line || line.endsWith('：')) return;
        const idx = line.indexOf('：');
        const value = idx >= 0 ? line.slice(idx + 1) : line;
        value.split('。').map(s => s.trim()).filter(Boolean).forEach(sentence => {
          // ① 任何一句都不该短到无法表达意思
          if (hanLen(sentence) < 3) {
            tooShort.push(`[${dept.key}/${label}] ${JSON.stringify(sentence)} ← ${JSON.stringify(line.slice(0, 100))}`);
          }
          // ② 不该以「只能跟在别人后面的续句」开头（如「质中」「无压痛」「律齐」）
          const first = splitClauses(sentence)[0];
          if (first && continuation.includes(first) && hanLen(first) <= 4) {
            orphan.push(`[${dept.key}/${label}] ${JSON.stringify(sentence)} ← ${JSON.stringify(line.slice(0, 100))}`);
          }
        });
      });
    }
  }

  assert.deepEqual(tooShort, [], `出现了 ${tooShort.length} 个过短分句：\n` + tooShort.slice(0, 20).join('\n'));
  assert.deepEqual(orphan, [], `出现了 ${orphan.length} 个缺主语的残句：\n` + orphan.slice(0, 20).join('\n') +
    `\n（残句比重复严重得多：重复只是啰嗦，残句会让读病历的人误判体征归属）`);
  assert.ok(scanned > 100, `扫描配置只有 ${scanned} 个，覆盖不足`);
});
