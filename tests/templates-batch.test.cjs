/* ===========================================================================
 * 模板库「批量护栏」测试
 *
 * 单个模板写得好不好，看生成结果；整个模板库会不会烂掉，看的是另一批东西：
 *   1. 库里每一份模板都能被取到、科室归属正确 —— 取不到 = 学生搜不到这份病历
 *   2. 模板不许替学生编生命体征和身份信息 —— 那是编造医疗记录
 *   3. 模板套用后必须还能命中诊断提示 —— 命不中就说明症状体征没写到点上
 *   4. 模板数量与科室覆盖 —— 防止「只做了一个科室」就宣布完成
 *   5. 库级唯一性（key / name / alias）—— 两个病种抢一个搜索词，学生就会套错模板
 *
 * 与 tests/templates.test.cjs 的分工：
 *   templates.test.cjs 逐份模板做「字段级」检查（查体值合不合法、ROS 状态合不合法……）；
 *   本文件做「库级」不变量（三处视图是否一致、分布、唯一性、幂等、确定性），
 *   以及跨模板的聚合报告——一条测试红掉时能直接看出是哪几份模板出的问题。
 *
 * 所有断言都在失败信息里写清「为什么这很重要」，因为改模板的人往往不是写测试的人。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { bootGlobals } = require('./bootstrap.cjs');
const { SCHEMA: S, TEMPLATES, GENERATOR: G, HINTS: H } = bootGlobals();

const ROOT = path.join(__dirname, '..');
const PARTS_DIR = path.join(ROOT, 'tools', 'tpl-parts');

const ALL = TEMPLATES.all();
// 院内范例按原始证据守真实性，不套用完整典型教学病例的补齐要求。
const isHospitalExample = t => t.source?.kind === 'hospital-example';
const TEACHING = ALL.filter(t => !isHospitalExample(t));
const DEPT_KEYS = S.DEPARTMENTS.map(d => d.key);
const DEPT_NAME = {};
S.DEPARTMENTS.forEach(d => { DEPT_NAME[d.key] = d.name; });

/* 模板绝不许替学生决定的患者身份字段 */
const PRIVACY = ['name', 'gender', 'age', 'birthDate', 'recordNo', 'bedNo', 'admitDate', 'admitTime', 'recordDate', 'recordTime'];
/* 病历里出现这些词就是在教学生「先写个不确定的诊断」——初步诊断必须落地 */
const BANNED = ['可能', '疑似', '待查', '?', '？'];
/* 现病史十项里必须有实质内容的那几项 */
const HPI_REQUIRED = ['onset', 'cause', 'symptoms', 'relief', 'evolution', 'accompanying',
  'negativeDiscriminating', 'treatment', 'generalCondition'];

function applied(key) {
  const r = S.emptyRecord();
  const res = TEMPLATES.apply(r, key);
  return { r, res };
}
function linesOf(text) {
  return String(text).split('\n').filter(x => x.trim());
}
function textOf(key) {
  const { r } = applied(key);
  const out = G.generate(r);
  return typeof out === 'string' ? out : out.text;
}
function countFilled(o) {
  let n = 0;
  (function walk(v) {
    if (v === null || v === undefined) return;
    if (typeof v === 'string') { if (v.trim()) n++; return; }
    if (Array.isArray(v)) { if (v.length) n++; return; }
    if (typeof v === 'object') Object.keys(v).forEach(k => walk(v[k]));
  })(o);
  return n;
}
/* 阳性体征：查体值既不是 default 也不是 normal，说明是本病特有的异常发现 */
function positiveSigns(t) {
  const out = [];
  const pe = t.record.pe || {};
  Object.keys(pe).forEach(gk => {
    if (gk === 'vitals' || gk === 'checked') return;
    const group = gk.startsWith('special_')
      ? S.PE_SPECIAL[gk.slice('special_'.length)]
      : S.PE_COMMON.find(g => g.key === gk);
    if (!group) return;
    Object.keys(pe[gk] || {}).forEach(k => {
      const it = group.items.find(x => x.key === k);
      if (!it) return;
      const v = String(pe[gk][k] || '').trim();
      if (!v) return;
      if (v !== String(it.default || '').trim() && v !== String(it.normal || '').trim()) {
        out.push(`${gk}.${k}=「${v}」`);
      }
    });
  });
  return out;
}

/* =========================================================================
 * ① 三处视图必须一致：all() / get() / listByDept()
 * ========================================================================= */

test('57份模板与外科7份覆盖（含唯一的肺结节院内范例）', () => {
  assert.equal(ALL.length, 57);
  assert.equal(TEMPLATES.listByDept('surgery').length, 7);
  assert.deepEqual(ALL.filter(isHospitalExample).map(t => t.key), ['lungNodule']);
});

test('① 每份模板都能被 get() 取到，且 listByDept 给出的每个 key 都在 all() 里', () => {
  assert.ok(ALL.length > 0, '模板库是空的——任何「按科室找模板」的功能都会空手而归');

  const missingGet = [];
  const notInAll = [];
  const allKeys = new Set(ALL.map(t => t.key));

  ALL.forEach(t => {
    const got = TEMPLATES.get(t.key);
    if (!got) { missingGet.push(t.key); return; }
    // 不能只判非空：get 拿到的必须就是这一份，否则搜索/套用会串到别的病种
    if (got.key !== t.key) missingGet.push(`${t.key} -> get 返回 ${got.key}`);
    if (got.dept !== t.dept) missingGet.push(`${t.key}: all.dept=${t.dept} 但 get.dept=${got.dept}`);
    if (got.name !== t.name) missingGet.push(`${t.key}: all.name 与 get.name 不一致`);
  });

  DEPT_KEYS.forEach(dk => {
    TEMPLATES.listByDept(dk).forEach(x => {
      if (!allKeys.has(x.key)) notInAll.push(`${dk} 返回了 ${x.key}`);
    });
  });

  assert.deepEqual(
    missingGet, [],
    `这些模板 all() 里有、get() 却取不到（或取到了别的东西）：\n  ${missingGet.join('\n  ')}\n` +
    '为什么重要：学生按病种搜索模板时走的就是 get(key)，取不到就等于这份模板不存在。'
  );
  assert.deepEqual(
    notInAll, [],
    `listByDept 返回了 all() 里没有的 key：\n  ${notInAll.join('\n  ')}\n` +
    '为什么重要：列表里有一份套不上的模板，学生点「套用」会得到 ok:false 并丢掉已填内容。'
  );

  // 反向：all() 里的每一份都必须出现在它自己科室的列表里，否则「按科室选模板」会漏
  const notListed = ALL
    .filter(t => !TEMPLATES.listByDept(t.dept).some(x => x.key === t.key))
    .map(t => `${t.key}@${t.dept}`);
  assert.deepEqual(
    notListed, [],
    `这些模板没出现在自己科室的 listByDept 里：${notListed.join(', ')}\n` +
    '为什么重要：学生进科室后只会看到 listByDept 的结果，漏掉就等于没有。'
  );
});

/* =========================================================================
 * ② 科室归属：dept 字段与它出现的科室列表必须是同一件事
 * ========================================================================= */

test('② 模板的 dept 与它出现在 listByDept 的科室完全一致（不许串台）', () => {
  const wrong = [];
  const cross = [];
  ALL.forEach(t => {
    TEMPLATES.listByDept(t.dept).forEach(x => {
      if (x.key === t.key && x.dept !== t.dept) {
        wrong.push(`${t.key}: dept=${t.dept}，但列表里带着 dept=${x.dept}`);
      }
    });
    DEPT_KEYS.filter(k => k !== t.dept).forEach(other => {
      if (TEMPLATES.listByDept(other).some(x => x.key === t.key)) {
        cross.push(`${t.key}（${t.dept}）出现在了 ${other} 的列表里`);
      }
    });
  });
  assert.deepEqual(
    wrong, [],
    `dept 字段与列表归属不一致：\n  ${wrong.join('\n  ')}\n` +
    '为什么重要：dept 写错会让模板跑到别的科室，学生套用后专科查体整段不出来。'
  );
  assert.deepEqual(
    cross, [],
    `模板跨科室串台：\n  ${cross.join('\n  ')}\n` +
    '为什么重要：一个消化科模板出现在心内科列表里，学生套用后会被改成消化科——直接把病历写歪。'
  );
});

/* =========================================================================
 * ③ 套用后可生成、够长、不含模糊诊断词
 * ========================================================================= */

test('③ 每份模板可套用；完整教学模板生成 ≥60 行且不含模糊诊断词', () => {
  const tooShort = [];
  const hasBanned = [];
  const failedApply = [];

  ALL.forEach(t => {
    const { res } = applied(t.key);
    if (!res.ok || res.count === 0) failedApply.push(`${t.key}: apply ok=${res.ok} count=${res.count}`);
    const text = textOf(t.key);
    assert.ok(text.includes('【初步诊断】'), `${t.key}: 生成病历缺少初步诊断章节`);
    if (isHospitalExample(t)) return;
    const n = linesOf(text).length;
    if (n < 60) tooShort.push(`${t.key}: 只有 ${n} 行`);
    BANNED.forEach(w => {
      if (text.includes(w)) {
        const line = linesOf(text).find(l => l.includes(w)) || '';
        hasBanned.push(`${t.key} 含「${w}」：${line.trim().slice(0, 50)}`);
      }
    });
  });

  assert.deepEqual(
    failedApply, [],
    `这些模板套用后一个字段都没填上：\n  ${failedApply.join('\n  ')}\n` +
    '为什么重要：套用是为了给初稿，count=0 说明模板的字段名与 emptyRecord 对不上，等于没写。'
  );
  assert.deepEqual(
    tooShort, [],
    `这些模板套用后不足 60 行：\n  ${tooShort.join('\n  ')}\n` +
    '为什么重要：不到 60 行的病历缺节少项，学生拿去改比自己从头写还慢，模板就失去意义。'
  );
  assert.deepEqual(
    hasBanned, [],
    `这些模板生成结果里出现模糊诊断词：\n  ${hasBanned.join('\n  ')}\n` +
    '为什么重要：初步诊断必须落地。写了「可能」「疑似」「待查」「?」，学生照抄交上去就是不合格病历。'
  );
});

/* =========================================================================
 * ④ 套用后诊断提示至少命中一条
 * ========================================================================= */

test('④ 完整教学模板套用后 H.analyze() 至少命中 1 条诊断提示', () => {
  const noHit = [];
  TEACHING.forEach(t => {
    const { r } = applied(t.key);
    const hits = H.analyze(r) || [];
    if (!hits.length) {
      const declared = ((t.record.diagnosis || {}).confirmed || []).join('、');
      noHit.push(`${t.key}（${DEPT_NAME[t.dept] || t.dept}，宣告：${declared || '无'}）`);
    }
  });
  assert.deepEqual(
    noHit, [],
    `这些模板一条诊断提示都命不中：\n  ${noHit.join('\n  ')}\n` +
    '为什么重要：诊断提示是学生核对思路的第一反馈。一条都不中，说明模板的阳性病史/体征没有写进任何规则的识别范围——' +
    '这份模板教不出「症状体征怎么支撑诊断」。'
  );
});

/* =========================================================================
 * ⑤ 不写生命体征 / ⑥ 不写身份信息
 * ========================================================================= */

test('⑤ 模板一律不写 pe.vitals（体温血压是学生测出来的，不是编的）', () => {
  const bad = [];
  ALL.forEach(t => {
    const v = (t.record.pe || {}).vitals || {};
    const written = Object.keys(v).filter(k => String(v[k] || '').trim());
    if (written.length) bad.push(`${t.key}: ${written.join(', ')}`);
    // 连键都不该出现：写了空串也算「这个模板关心体温」，会误导后来改模板的人
    const extraKeys = Object.keys(v);
    if (extraKeys.length) bad.push(`${t.key}: pe.vitals 有键 ${extraKeys.join(', ')}（应为 {}）`);
  });
  assert.deepEqual(
    bad, [],
    `这些模板动了生命体征：\n  ${bad.join('\n  ')}\n` +
    '为什么重要：生命体征是逐次测量值。模板给一个数字，学生就会直接抄进病历——这是编造医疗记录，' +
    '而且掩盖了「这个病人到底发不发热」这件必须由学生亲自判断的事。'
  );
});

test('⑥ 模板一律不写 7 个隐私字段，也不写死 department', () => {
  const bad = [];
  ALL.forEach(t => {
    const b = t.record.basic || {};
    PRIVACY.forEach(k => {
      const v = b[k];
      if (v !== undefined && String(v).trim() !== '') bad.push(`${t.key}: basic.${k}="${v}"`);
    });
    // department 由 apply() 按「科室还停在 general」时才补，模板自己写死会让套用失去这个保护
    if (String(b.department || '').trim() !== '') {
      bad.push(`${t.key}: basic.department="${b.department}"（应由 apply 按需补）`);
    }
  });
  assert.deepEqual(
    bad, [],
    `这些模板写了不该由模板决定的东西：\n  ${bad.join('\n  ')}\n` +
    '为什么重要：姓名性别年龄住院号属于这一次真实接诊；模板写死了，学生套用后忘了改，' +
    '就会把「测试患者」交上去。department 写死则会覆盖学生已选的科室。'
  );
});

/* =========================================================================
 * ⑦ 数量与科室覆盖 · ⑧ key 唯一
 * ========================================================================= */

test('⑦ 模板总数 ≥30，且每个有模板的科室 ≥3 份（防止「只做了一个科室」）', () => {
  assert.ok(
    ALL.length >= 30,
    `模板库只有 ${ALL.length} 份，少于 30 份——模板库的目的是覆盖常见病种，太少等于没建起来`
  );

  const dist = {};
  ALL.forEach(t => { dist[t.dept] = (dist[t.dept] || 0) + 1; });
  const report = DEPT_KEYS.filter(k => dist[k]).map(k => `${DEPT_NAME[k] || k}=${dist[k]}`).join('，');

  const thin = Object.keys(dist).filter(k => dist[k] < 3).map(k => `${DEPT_NAME[k] || k} 只有 ${dist[k]} 份`);
  assert.deepEqual(
    thin, [],
    `这些科室的模板不足 3 份：${thin.join('；')}\n当前分布：${report}\n` +
    '为什么重要：一个科室只有 1～2 份模板，等于「这个科室的常见病我们只准备了两个」，' +
    '学生进科后找不到对应病种就会放弃使用模板。'
  );

  // 科室 key 必须合法，否则上面的分布统计会把模板藏在一个不存在的科室里
  const unknown = ALL.filter(t => !DEPT_KEYS.includes(t.dept)).map(t => `${t.key}@${t.dept}`);
  assert.deepEqual(
    unknown, [],
    `这些模板的 dept 不是合法科室键：${unknown.join(', ')}\n为什么重要：非法科室键不会出现在任何科室下拉里，模板永远选不到。`
  );
});

test('⑧ 模板 key 全局唯一，且没有出现两份同 key 的模板', () => {
  const seen = {};
  const dup = [];
  ALL.forEach(t => {
    if (seen[t.key]) dup.push(t.key);
    seen[t.key] = true;
  });
  assert.deepEqual(
    dup, [],
    `重复的模板 key：${dup.join(', ')}\n` +
    '为什么重要：key 是套用与搜索的唯一入口。两份同 key 的模板只能取到其中一份，另一份永远用不上；' +
    '而且 gen-templates.js 生成的产物会因为去重而悄悄少掉一份。'
  );
});

/* =========================================================================
 * 库级唯一性与元数据（搜索体验的直接来源）
 * ========================================================================= */

test('模板 name / alias / hint 非空且全库唯一（两个病种不许抢同一个搜索词）', () => {
  const aliasOwner = {};
  const dupAlias = [];
  const noAlias = [];
  const emptyHint = [];
  const dupName = {};
  const names = [];

  ALL.forEach(t => {
    if (names.includes(t.name)) dupName[t.name] = true;
    names.push(t.name);

    const hint = String(t.hint || '').trim();
    if (!hint) emptyHint.push(t.key);

    const alias = Array.isArray(t.alias) ? t.alias.map(a => String(a).trim()).filter(Boolean) : [];
    if (!alias.length) noAlias.push(t.key);
    alias.forEach(a => {
      if (aliasOwner[a] && aliasOwner[a] !== t.key) dupAlias.push(`「${a}」被 ${aliasOwner[a]} 和 ${t.key} 同时占用`);
      aliasOwner[a] = t.key;
    });
  });

  assert.deepEqual(
    dupAlias, [],
    `别名冲突：\n  ${dupAlias.join('\n  ')}\n` +
    '为什么重要：别名是学生输入病种名时命中的关键词。两个模板抢一个词，搜索结果会随机给一份——' +
    '学生可能把「脾破裂」套成「肠梗阻」的病历。'
  );
  assert.deepEqual(
    noAlias, [],
    `这些模板没有 alias，学生只能靠完整病名搜索：${noAlias.join(', ')}`
  );
  assert.deepEqual(
    emptyHint, [],
    `这些模板的 hint 为空：${emptyHint.join(', ')}——模板列表里会显示一行空白，学生不知道这份模板适用什么场景`
  );
  assert.deepEqual(
    Object.keys(dupName), [],
    `模板 name 重复：${Object.keys(dupName).join(', ')}——列表里会出现两个一模一样的名字，无法区分`
  );
});

test('源文件名与模板 key 必须同名（防止生成的产物错位）', () => {
  const files = fs.readdirSync(PARTS_DIR).filter(f => f.endsWith('.cjs')).sort();
  const mismatch = [];
  files.forEach(f => {
    const full = path.join(PARTS_DIR, f);
    delete require.cache[require.resolve(full)];
    const mod = require(full);
    const base = f.replace(/\.cjs$/, '');
    if (mod.key !== base) mismatch.push(`${f}: key="${mod.key}"`);
  });
  assert.deepEqual(
    mismatch, [],
    `文件名与 key 不一致：\n  ${mismatch.join('\n  ')}\n` +
    '为什么重要：tools/gen-templates.js 按文件遍历生成 src/template-data.js，' +
    '文件名和 key 对不上时，排查「某份模板内容没更新」会找不到源头，改错文件也看不出来。'
  );
});

/* =========================================================================
 * 幂等与确定性（学生反复点「套用」不能越点越乱）
 * ========================================================================= */

test('模板里没有函数、没有占位符残留（必须是纯数据）', () => {
  const fnFields = [];
  const placeholders = [];
  function scanFn(o, p, key) {
    if (typeof o === 'function') { fnFields.push(`${key}${p}`); return; }
    if (o && typeof o === 'object') Object.keys(o).forEach(k => scanFn(o[k], `${p}.${k}`, key));
  }
  ALL.forEach(t => {
    scanFn(t.record, '', t.key);
    const s = JSON.stringify(t.record);
    ['XXX', 'xxx', 'TODO', '待填', '〔', '／／'].forEach(w => {
      if (s.includes(w)) placeholders.push(`${t.key}: 含「${w}」`);
    });
  });
  assert.deepEqual(
    fnFields, [],
    `模板 record 里有函数：${fnFields.join(', ')}\n` +
    '为什么重要：src/template-data.js 是 JSON 序列化产物，函数会在生成时丢失，导致「源文件能跑、页面里不能用」。'
  );
  assert.deepEqual(
    placeholders, [],
    `模板里残留占位符：\n  ${placeholders.join('\n  ')}\n` +
    '为什么重要：占位符被原样生成进病历，学生一不留神就交了一份带「XXX」的病历。'
  );
});

test('套用两次是幂等的：第二次不再补任何字段，也不覆盖学生改过的内容', () => {
  const notIdempotent = [];
  const overwritten = [];
  ALL.forEach(t => {
    const { r } = applied(t.key);
    const second = TEMPLATES.apply(r, t.key);
    if (second.count !== 0 || second.filled.length) {
      notIdempotent.push(`${t.key}: 第二次仍填了 ${second.count} 项（${second.filled.slice(0, 3).join(', ')}…）`);
    }
    // 学生改过的字段必须活下来
    const r2 = S.emptyRecord();
    TEMPLATES.apply(r2, t.key);
    r2.hpi.symptoms = '学生自己改写的主诉特点';
    r2.diagnosis.confirmed = ['学生自己下的诊断'];
    TEMPLATES.apply(r2, t.key);
    if (r2.hpi.symptoms !== '学生自己改写的主诉特点') overwritten.push(`${t.key}: hpi.symptoms 被覆盖`);
    if (r2.diagnosis.confirmed.length !== 1 || r2.diagnosis.confirmed[0] !== '学生自己下的诊断') {
      overwritten.push(`${t.key}: diagnosis.confirmed 被覆盖`);
    }
  });
  assert.deepEqual(
    notIdempotent, [],
    `这些模板反复套用会不断往记录里塞东西：\n  ${notIdempotent.join('\n  ')}\n` +
    '为什么重要：学生手滑点两下「套用」是常态。第二次还能填东西，说明它把第一次填进去的内容当成了空白位，' +
    '记录会越套越脏。'
  );
  assert.deepEqual(
    overwritten, [],
    `这些模板覆盖了学生已经写的内容：\n  ${overwritten.join('\n  ')}\n` +
    '为什么重要：套用的语义是「补空白」。覆盖已经问到的内容，等于把学生半小时的问诊一键清空。'
  );
});

test('同一份记录重复 generate 输出完全一致（生成是确定性的）', () => {
  const unstable = [];
  ALL.forEach(t => {
    const { r } = applied(t.key);
    const a = G.generate(r).text;
    const b = G.generate(r).text;
    if (a !== b) unstable.push(t.key);
  });
  assert.deepEqual(
    unstable, [],
    `这些模板生成结果不稳定（两次调用不一致）：${unstable.join(', ')}\n` +
    '为什么重要：生成里有随机或时间相关内容时，「刚才还是对的」会在刷新后变成另一份病历，' +
    '学生和老师看的是两份不同的东西。'
  );
});

/* =========================================================================
 * 内容密度：模板得真的写满了，不能只有骨架
 * ========================================================================= */

test('完整教学模板都有实质内容：现病史九项齐全、至少有 1 个阳性体征', () => {
  const hpiMissing = [];
  const noPositive = [];
  TEACHING.forEach(t => {
    const h = t.record.hpi || {};
    const miss = HPI_REQUIRED.filter(k => !String(h[k] || '').trim());
    if (miss.length) hpiMissing.push(`${t.key}: 缺 ${miss.join('/')}`);
    if (!positiveSigns(t).length) noPositive.push(t.key);
  });
  assert.deepEqual(
    hpiMissing, [],
    `这些模板的现病史有空白项：\n  ${hpiMissing.join('\n  ')}\n` +
    '为什么重要：现病史是按项扣分的地方。模板缺项，学生就照着缺项抄，交上去就是一份不完整的现病史；' +
    '尤其 negativeDiscriminating（鉴别阴性）和 treatment（既往用药剂量疗程）缺了，整份病历就没了鉴别思路。'
  );
  assert.deepEqual(
    noPositive, [],
    `这些模板查体全是正常值，没有一处阳性体征：${noPositive.join(', ')}\n` +
    '为什么重要：一份「查体全部正常」的病历支撑不了任何诊断。模板必须示范「这个病该在查体上看到什么」。'
  );
});

test('每份模板的辅助检查逐条可追溯：有项目名和结果，且不编日期/医院/检查号', () => {
  const bad = [];
  ALL.forEach(t => {
    const items = ((t.record.auxiliary || {}).items) || [];
    if (items.length < 2) bad.push(`${t.key}: 只有 ${items.length} 条辅助检查（至少要 2 条）`);
    items.forEach((it, i) => {
      const name = String((it || {}).name || '').trim();
      const result = String((it || {}).result || '').trim();
      if (!name) bad.push(`${t.key} 第${i + 1}条: 缺项目名`);
      if (!result) bad.push(`${t.key} 第${i + 1}条「${name}」: 缺结果`);
      ['date', 'hospital', 'no'].forEach(k => {
        const v = String((it || {})[k] || '').trim();
        if (v) bad.push(`${t.key} 第${i + 1}条「${name}」: 编了 ${k}="${v}"`);
      });
    });
  });
  assert.deepEqual(
    bad, [],
    `辅助检查有问题：\n  ${bad.join('\n  ')}\n` +
    '为什么重要：检查结果要有出处。模板编一个「2024-03-15 市第一医院 编号 0012345」，' +
    '学生抄进病历就是伪造检查记录；而只有项目名没有结果，又等于空表。'
  );
});

test('每份模板的初步诊断无空项，完整教学模板须用确定语气', () => {
  const bad = [];
  ALL.forEach(t => {
    const confirmed = ((t.record.diagnosis || {}).confirmed) || [];
    if (!confirmed.length) { bad.push(`${t.key}: 没有初步诊断`); return; }
    confirmed.forEach(d => {
      const s = String(d || '').trim();
      if (!s) { bad.push(`${t.key}: 有空的诊断项`); return; }
      if (!isHospitalExample(t) && BANNED.some(w => s.includes(w))) bad.push(`${t.key}: 诊断「${s}」含模糊词`);
      // 只挡「一个字」这种明显残留；「便秘」「单活胎」这类两字病名是合法的，不能误伤
      if (s.length < 2) bad.push(`${t.key}: 诊断「${s}」只剩一个字，是没写完的残留`);
    });
  });
  assert.deepEqual(
    bad, [],
    `初步诊断有问题：\n  ${bad.join('\n  ')}\n` +
    '为什么重要：初步诊断是整份病历的落点。写「可能」「疑似」「待查」或只写一个字，' +
    '既不符合病历书写规范，也让学生学不到「怎么把症状体征收敛成一个诊断」。'
  );
});

test('模板不许把生命体征数字带进生成结果（模板只给文字，数字由学生测）', () => {
  const bad = [];
  ALL.forEach(t => {
    const text = textOf(t.key);
    const peIdx = text.indexOf('【体格检查】');
    if (peIdx < 0) { bad.push(`${t.key}: 生成结果里没有【体格检查】`); return; }
    const peSec = text.slice(peIdx + '【体格检查】'.length).split('\n【')[0];
    const first = linesOf(peSec)[0] || '';
    // 生命体征行允许保留 schema 的空位符「／」，但不许出现阿拉伯数字
    if (/[0-9]/.test(first)) bad.push(`${t.key}: 生命体征行出现数字「${first.trim().slice(0, 40)}」`);
  });
  assert.deepEqual(
    bad, [],
    `这些模板把数字带进了生命体征行：\n  ${bad.join('\n  ')}\n` +
    '为什么重要：体温 38.5℃、血压 90/60mmHg 是这一次接诊测出来的。模板一旦给了默认数字，' +
    '学生不测也会「有」一组漂亮的生命体征——这正是病历造假最常见的样子。'
  );
});

/* =========================================================================
 * 本次新增模板的回归钉子：血液 3 + 急诊 3
 * ========================================================================= */

test('血液内科与急诊/ICU 的 6 份模板必须在库里且科室正确', () => {
  const REQUIRED = [
    ['anemia', 'hematology', '缺铁性贫血'],
    ['leukemia', 'hematology', '白血病'],
    ['itp', 'hematology', '血小板减少'],
    ['sepsis', 'emergency', '脓毒症'],
    ['shock', 'emergency', '休克'],
    ['organophosphate', 'emergency', '有机磷']
  ];
  const bad = [];
  REQUIRED.forEach(([key, dept, keyword]) => {
    const t = TEMPLATES.get(key);
    if (!t) { bad.push(`${key}: 库里没有这份模板`); return; }
    if (t.dept !== dept) bad.push(`${key}: dept=${t.dept}，应为 ${dept}`);
    const blob = `${t.name} ${(t.alias || []).join(' ')} ${t.hint}`;
    if (!blob.includes(keyword)) bad.push(`${key}: name/alias/hint 里找不到「${keyword}」`);
    // 专科查体必须写到对应科室的专科组（否则专科查体整段是空的）
    const sp = (t.record.pe || {})[`special_${dept}`];
    const written = sp ? Object.keys(sp).filter(k => String(sp[k] || '').trim()) : [];
    if (!written.length) bad.push(`${key}: 没写 pe.special_${dept} 的任何一项`);
  });
  assert.deepEqual(
    bad, [],
    `血液/急诊模板有问题：\n  ${bad.join('\n  ')}\n` +
    '为什么重要：这 6 份是血液内科与急诊/ICU 病种覆盖的全部依靠。缺一份、科室写错一处，' +
    '对应科室的学生就找不到可套用的标准病历；专科查体为空则生成结果里整段专科查体消失。'
  );
});
