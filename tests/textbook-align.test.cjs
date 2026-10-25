/**
 * 教材对齐 —— 守的是「《诊断学》要求写的项目，我们一个都不能少」
 *
 * 对照依据：人民卫生出版社《诊断学》第10版 第六篇·病历书写
 * 第556-559 页「住院病历」的体格检查书写清单，原文提取见 tools/book-record.txt
 * 第173-267 行；全身体格检查 122 项基本项目见 tools/book-fullpe.txt。
 *
 * 这一组测试不检查文字怎么写，只检查**字段在不在**。
 * 具体的书写格式由 textbook-record.test.cjs 守。
 *
 * 为什么单独一个文件：以前这些比对只写在 tools/align-textbook.js 里，
 * 跑不跑全靠自觉。有一次补字段时漏了腹围，工具报缺失却没人看，
 * 直到空病历输出里少了「腹围 80cm」才发现。挪进测试才有强制力。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA } = bootGlobals();
const S = SCHEMA;

/** 字段索引：查体组.项 + 专科.项 + 生命体征.项，统一成可查找的 Map */
function buildIndex() {
  const index = new Map();
  S.PE_COMMON.forEach(g => g.items.forEach(it => index.set(`${g.key}.${it.key}`, it)));
  Object.keys(S.PE_SPECIAL).forEach(sp => {
    (S.PE_SPECIAL[sp].items || []).forEach(it => index.set(`special_${sp}.${it.key}`, it));
  });
  // 生命体征同样是体格检查的书写内容（体温、脉搏、呼吸、血压、身高、体重、腹围）
  (S.VITALS || []).forEach(v => index.set(`vitals.${v.key}`, v));
  return index;
}

/* 教材第557-559 页逐项列出的书写项目，右侧是 schema 里的候选字段（任一命中即算覆盖）。
 * 空数组表示「确实没有对应字段」，是一项待补的缺口，不允许悄悄留着。 */
const BOOK_ITEMS = [
  // 一般状况
  ['发育', ['general.development']],
  ['营养', ['general.nutrition']],
  ['神志', ['general.conscious']],
  ['体位', ['general.posture']],
  ['面容与表情', ['general.face']],
  ['检查能否合作', ['general.cooperation']],
  // 皮肤黏膜
  ['皮肤颜色', ['skin.color']],
  ['温度湿度弹性', ['skin.elasticity']],
  ['皮疹瘀点紫癜', ['skin.rash']],
  // 教材第三篇第二章第二节「皮肤检查」第七小节：蜘蛛痣与肝掌。
  // 归在皮肤，不在腹部——肝硬化最有价值的体表体征就靠这一项记。
  ['蜘蛛痣与肝掌', ['skin.spider']],
  ['毛发', ['head.hair']],
  // 淋巴结（教材把它单列在皮肤之后）
  ['浅表淋巴结', ['skin.lymph']],
  // 头部及其器官
  ['头颅大小形状', ['head.headShape']],
  ['眼', ['head.eyes']],
  ['耳鼻口腔', ['head.ent', 'head.teeth']],
  // 颈部
  ['颈静脉颈动脉', ['neck.neckVessel']],
  ['气管', ['neck.trachea']],
  ['甲状腺', ['neck.thyroid']],
  // 胸部与肺
  ['胸廓', ['chest.chestShape']],
  ['乳房', ['chest.breast']],
  ['肺视诊', ['chest.lungInspect']],
  ['肺触诊', ['chest.lungPalpation']],
  ['肺叩诊', ['chest.lungPercussion']],
  ['肺听诊', ['chest.lungAuscultation']],
  // 心脏
  ['心视诊', ['chest.heartInspect']],
  ['心触诊', ['chest.heartPalpation']],
  ['心叩诊', ['chest.heartPercussion']],
  ['心听诊', ['chest.heartAuscultation']],
  // 血管
  ['桡动脉脉搏', ['spine.radialPulse']],
  ['周围血管征', ['spine.dorsalisPedis']],
  // 腹部
  ['腹围', ['vitals.abdCirc']],
  ['腹部视诊', ['abdomen.abdInspect']],
  ['腹壁紧张度', ['abdomen.abdPalpation']],
  ['压痛反跳痛', ['abdomen.abdPalpation', 'abdomen.abdPalpSuperficial']],
  ['液波震颤', ['abdomen.fluidThrill', 'abdomen.abdPalpDeep']],
  ['腹部肿块', ['abdomen.abdPalpation']],
  ['肝脏触诊', ['abdomen.liverPalpation', 'abdomen.abdPalpation']],
  ['胆囊与Murphy征', ['abdomen.gallbladderPalpation', 'abdomen.abdPalpation']],
  ['脾脏触诊', ['abdomen.spleenPalpation', 'abdomen.abdPalpation']],
  ['肾脏触诊', ['abdomen.kidneyPalpation', 'abdomen.abdPalpation']],
  ['膀胱', ['abdomen.bladderPalpation', 'abdomen.abdPalpation']],
  ['肝浊音界与肝区叩击痛', ['abdomen.abdPercussion']],
  ['移动性浊音', ['abdomen.abdPercussion']],
  ['肾区叩击痛', ['abdomen.abdPercussion']],
  ['肠鸣音', ['abdomen.abdAuscultation']],
  ['振水音', ['abdomen.succussionSplash', 'abdomen.abdAuscultation']],
  ['血管杂音', ['abdomen.abdAuscultation']],
  // 肛门生殖器
  ['肛门直肠', ['genital.anus']],
  ['外生殖器', ['genital.genitalia']],
  // 脊柱四肢
  ['脊柱', ['spine.spineCol']],
  ['四肢', ['spine.limbs']],
  ['四肢肌力', ['spine.limbMuscle']],
  ['下肢水肿', ['spine.edemaAnkle', 'spine.edemaPretibial']],
  ['足背动脉', ['spine.dorsalisPedis']],
  // 神经
  ['生理反射', ['nervousPE.nerve']],
  ['病理反射', ['nervousPE.babinski']],
  ['膝腱反射', ['nervousPE.tendonReflex', 'spine.kneeJerk']],
  ['脑膜刺激征', ['nervousPE.brudzinski', 'nervousPE.kernig', 'neck.neckResist']],
  // 生命体征（教材第557 页：体温 ℃ 脉搏 次/分 呼吸 次/分 血压 /mmHg 身高 cm 体重 kg）
  ['体温', ['vitals.temperature']],
  ['脉搏', ['vitals.pulse']],
  ['呼吸', ['vitals.respiration']],
  ['血压', ['vitals.sbp']],
  ['身高', ['vitals.height']],
  ['体重', ['vitals.weight']]
];

test('教材要求的书写项目一个都不缺', () => {
  const index = buildIndex();
  const missing = BOOK_ITEMS
    .filter(([, keys]) => !keys.some(k => index.has(k)))
    .map(([name, keys]) => `${name}（候选 ${keys.join('/') || '无'}）`);
  assert.deepEqual(missing, [], `缺字段：${missing.join('；')}`);
});

test('教材没有的项要能说出为什么留着', () => {
  // 反向检查：schema 里每一项都应该能在教材清单里找到出处，或者是有意补充。
  // 发现新出现的「无出处字段」时，请先确认它是不是误加的，再决定加进白名单还是删掉。
  const INTENTIONAL = new Set([
    // 脑膜刺激征的颈项强直，教材列在神经反射里，我们放在颈部（查的时候人就在颈部）
    'neck.neckResist',
    // 教材腹部触诊条目下列了液波震颤、胆囊、肾、膀胱、振水音，
    // 我们把它们做成独立子项，方便只查其中一两项
    'abdomen.gallbladderPalpation',
    'abdomen.kidneyPalpation',
    'abdomen.bladderPalpation',
    'abdomen.fluidThrill',
    'abdomen.succussionSplash'
  ]);
  const bookKeys = new Set();
  BOOK_ITEMS.forEach(([, keys]) => keys.forEach(k => bookKeys.add(k)));
  const unexplained = [];
  S.PE_COMMON.forEach(g => g.items.forEach(it => {
    const ref = `${g.key}.${it.key}`;
    if (!bookKeys.has(ref) && !INTENTIONAL.has(ref)) unexplained.push(`${ref}（${it.label}）`);
  }));
  assert.deepEqual(unexplained, [],
    `这些字段教材没提，也没登记为有意补充：${unexplained.join('；')}`);
});

test('腹部查体次序是视→听→叩→触，教材第189 页有明文', () => {
  // 教材原文：「为了避免触诊引起胃肠蠕动增加，影响肠鸣音的听诊，
  // 腹部检查的顺序应为视、听、叩、触。」
  // 医院模板里写成视触听（缺叩诊）是模板的问题，不照抄。
  const abd = S.PE_COMMON.find(g => g.key === 'abdomen');
  const keys = abd.items.map(it => it.key);
  const iInspect = keys.indexOf('abdInspect');
  const iAusc = keys.indexOf('abdAuscultation');
  const iPerc = keys.indexOf('abdPercussion');
  const iPalp = keys.indexOf('abdPalpation');
  assert.ok(iInspect >= 0 && iAusc >= 0 && iPerc >= 0 && iPalp >= 0, '四个模态项都要在');
  assert.ok(iInspect < iAusc, '视诊应在听诊前');
  assert.ok(iAusc < iPerc, '听诊应在叩诊前');
  assert.ok(iPerc < iPalp, '叩诊应在触诊前');
  // 触诊细分子项必须都排在父项之后，否则生成的病历里会出现「先写细分再写总计」
  abd.items.forEach((it, i) => {
    if (it.parent === 'abdPalpation') assert.ok(i > iPalp, `${it.key} 应在 abdPalpation 之后`);
  });
});

test('蜘蛛痣与肝掌归在皮肤检查，不在腹部', () => {
  // 《诊断学》第10版 第三篇第二章第二节「皮肤检查」第七小节：蜘蛛痣与肝掌。
  // 这是肝硬化最有价值的体表体征，曾经被误放进消化专科的 giExtra 里——
  // 那是个单选字段，写蜘蛛痣就会把「肝颈静脉回流征阴性」挤掉，
  // 而后者恰好是鉴别心源性腹水的关键阴性。
  const skin = S.PE_COMMON.find(x => x.key === 'skin');
  const item = skin.items.find(it => it.key === 'spider');
  assert.ok(item, '皮肤组里应该有「蜘蛛痣与肝掌」这一项');
  assert.equal(item.default, '未见蜘蛛痣及肝掌');
  // 三个阳性写法都要能选到，模板里「可见蜘蛛痣，肝掌阳性」才选得出来
  ['可见蜘蛛痣', '肝掌阳性', '可见蜘蛛痣，肝掌阳性']
    .forEach(v => assert.ok(item.options.includes(v), `缺选项：${v}`));

  // 消化专科的 giExtra 里不许再出现——它挤掉肝颈静脉回流征
  const gi = S.findPEItem('special_digestive.giExtra');
  gi.options.forEach(o => assert.ok(!/蜘蛛痣|肝掌/.test(o),
    `giExtra 是单选字段，不该塞进「${o}」`));
  assert.ok(gi.options.includes('肝颈静脉回流征阴性'), '心源性腹水的关键阴性不能丢');
});

test('蜘蛛痣能推动肝硬化提示，单独一个蜘蛛痣不会凭空下诊断', () => {
  const H = globalThis.HINTS;
  const scoreOf = rec => {
    const hit = H.analyze(rec).find(x => x.id === 'ci');
    return hit ? hit.score : 0;
  };

  // 肝硬化模板里有肝病背景 + 蜘蛛痣，应该命中 ci
  const r = S.emptyRecord();
  globalThis.TEMPLATES.apply(r, 'cirrhosis');
  const withSpider = scoreOf(r);
  assert.ok(withSpider > 0, `肝硬化模板应命中 ci，实际 ${withSpider}`);

  // 关键：把蜘蛛痣拿掉，ci 的得分必须下降。
  // 只断言「top3 里有 ci」是不够的——模板里还有腹水、腹壁静脉曲张、
  // 肝炎病史好几条证据，删掉蜘蛛痣照样命中，测试会假通过（变异自检抓到过）。
  const without = S.emptyRecord();
  globalThis.TEMPLATES.apply(without, 'cirrhosis');
  delete without.pe.skin.spider;
  assert.ok(scoreOf(without) < withSpider,
    `蜘蛛痣必须能加分：有=${withSpider}，无=${scoreOf(without)}，两者相同说明规则没接上`);

  // 只有蜘蛛痣、没有任何肝病背景：ci 的 must 不满足，不能给提示
  const bare = S.emptyRecord();
  bare.basic.department = 'digestive';
  bare.pe.skin = { spider: '可见蜘蛛痣' };
  S.setPeChecked(bare, 'skin', 'spider', true);
  const ids = H.analyze(bare).map(x => x.id);
  assert.ok(!ids.includes('ci'), '只有蜘蛛痣不能直接提示肝硬化');
});

test('生命体征包含了教材要求的全部测量项', () => {
  const keys = (S.VITALS || []).map(v => v.key);
  ['temperature', 'pulse', 'respiration', 'sbp', 'dbp', 'height', 'weight', 'abdCirc']
    .forEach(k => assert.ok(keys.includes(k), `生命体征缺 ${k}`));
});

test('一般状况的六项按教材顺序排列', () => {
  // 教材：「发育，营养，神志，体位，面容与表情，检查能否合作。」
  const g = S.PE_COMMON.find(x => x.key === 'general');
  assert.deepEqual(g.items.map(it => it.key),
    ['development', 'nutrition', 'conscious', 'posture', 'face', 'cooperation']);
  assert.equal(g.joinWith, '，', '一般状况要逗号连写成一段，不能逐句句号断开');
});

/* ------------------------------------------------------------------ *
 * 专科段不许静默消失
 *
 * 教材第244-247 页对专科情况的规定是「前面体格检查中的相应项目不必
 * 重复书写，只写见××科情况」。这条规定的前提是：专科段本身要在。
 *
 * 实际踩过的坑：儿科 pedExtra3「咽无充血，扁桃体无肿大」、急诊
 * emConscious「神志清楚，双侧瞳孔等大等圆…」这几项的默认描述与通用
 * 查体逐字相同，学生勾上之后整项被去重跳过，专科段整段消失——
 * 界面上勾了，病历里一个字没有，学生只会以为工具坏了。
 * 勾了就该有一句「见前述体格检查」指明去哪儿看。
 * ------------------------------------------------------------------ */
test('每科单独勾一项，专科段都不会凭空消失', () => {
  const G = globalThis.GENERATOR;
  const depts = S.DEPARTMENTS.filter(d => (d.special || []).length);
  const vanished = [];
  depts.forEach(d => {
    (d.special || []).forEach(spKey => {
      S.PE_SPECIAL[spKey].items.forEach(it => {
        const r = S.emptyRecord();
        r.basic.department = d.key;
        S.setPeChecked(r, 'special_' + spKey, it.key, true);
        const text = G.generate(r).text;
        const line = text.split('\n').find(l => l.startsWith(S.PE_SPECIAL[spKey].name));
        if (!line) vanished.push(`${d.key} / ${spKey}.${it.key}`);
      });
    });
  });
  assert.deepEqual(vanished, [], `勾了但专科段没出现：${vanished.join('；')}`);
});

test('一项都没勾时专科段完全不出现', () => {
  const G = globalThis.GENERATOR;
  S.DEPARTMENTS.filter(d => (d.special || []).length).forEach(d => {
    const r = S.emptyRecord();
    r.basic.department = d.key;
    const text = G.generate(r).text;
    (d.special || []).forEach(spKey => {
      assert.ok(!text.includes(S.PE_SPECIAL[spKey].name),
        `${d.key} 没勾任何专科项，不该出现「${S.PE_SPECIAL[spKey].name}」`);
    });
  });
});

test('专科项全被去重时写「见前述体格检查」，不能静默消失', () => {
  // 这是上一条的真正硬骨头：只勾专科项时，通用查体没勾，去重不会命中，
  // 所以上一条测不到「去重把整段吃光」的情形。必须**同时勾上通用查体**，
  // 让专科项的描述逐字出现在前面的通用段里，才真正走到兜底分支。
  const G = globalThis.GENERATOR;
  const r = S.emptyRecord();
  r.basic.department = 'digestive';
  // 通用腹部全勾（含「移动性浊音阴性」）
  S.PE_COMMON.find(g => g.key === 'abdomen').items
    .forEach(it => S.setPeChecked(r, 'abdomen', it.key, true));
  // 专科只勾一项，它的描述与通用腹部重复
  S.setPeChecked(r, 'special_digestive', 'giShiftingDullness', true);
  const text = G.generate(r).text;
  const line = text.split('\n').find(l => l.startsWith(S.PE_SPECIAL.digestive.name));
  assert.ok(line,
    `勾了专科项、内容又全被去重时，专科段整段消失了，学生只会以为工具坏了。\n` +
    `全文查体段：\n${text.split('【体格检查】')[1].split('【实验室检查】')[0]}`);
  assert.match(line, /见前述体格检查/,
    `专科段应在全被去重时指向通用查体，实际写的是：${JSON.stringify(line)}`);
});

test('全勾时每科专科段都在，且查体段内没有分句重复', () => {
  const G = globalThis.GENERATOR;
  const dupDepts = [];
  S.DEPARTMENTS.filter(d => (d.special || []).length).forEach(d => {
    const r = S.emptyRecord();
    r.basic.department = d.key;
    (d.special || []).forEach(spKey =>
      S.PE_SPECIAL[spKey].items.forEach(it => S.setPeChecked(r, 'special_' + spKey, it.key, true)));
    const text = G.generate(r).text;
    (d.special || []).forEach(spKey => {
      assert.ok(text.includes(S.PE_SPECIAL[spKey].name), `${d.key} 全勾后应有「${S.PE_SPECIAL[spKey].name}」`);
    });
    // 只在【体格检查】段里查重复——去重规则管的是查体段。
    // 摘要段复述现病史是设计使然（教材要求摘要「高度概述病史要点」），不在此列。
    const pe = text.split('【体格检查】')[1].split('【实验室检查】')[0];
    const seen = new Map();
    pe.split(/[，,；;。\n]/).map(s => s.trim()).filter(s => s.length >= 4)
      .forEach(c => seen.set(c, (seen.get(c) || 0) + 1));
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([c]) => c);
    if (dup.length) dupDepts.push(`${d.key}: ${dup.slice(0, 3).join(' / ')}`);
  });
  assert.deepEqual(dupDepts, [], `查体段有重复分句：${dupDepts.join('；')}`);
});

/* ------------------------------------------------------------------ *
 * 查体界面状态机：两个真实发生过的回归
 *
 * ① refreshPeBadge 曾经读 textarea 的 DOM 值判「填没填」，可 textarea 里
 *    预填着正常描述，于是「勾了但没填」显示成绿色「已填」，而整页重绘后
 *    又变回「系统默认」——同一份数据两种显示。
 *    现在唯一真相是记录值 R.pe[容器][键]。
 * ② 「全选 / 全不选」曾经调 render()，而 render() 末尾 window.scrollTo(0)，
 *    刚勾完的卡片瞬间离开视野，体验上等于点了没反应。
 *
 * 这两条都在 tools/verify-pe-ui.js 里用真浏览器验，这里守住代码层面的约束：
 * 状态判定的数据源必须是记录值，全选分支不许调 render()。
 * ------------------------------------------------------------------ */
test('refreshPeBadge 读记录值，不读 textarea 的 DOM 值', () => {
  const src = require('fs').readFileSync(
    require('path').resolve(__dirname, '..', 'src', 'app.js'), 'utf8');
  const fn = src.slice(src.indexOf('function refreshPeBadge'));
  const body = fn.slice(0, fn.indexOf('\n  }') + 4);
  assert.ok(/R\.pe\[containerKey\]/.test(body),
    'refreshPeBadge 必须从 R.pe[containerKey][itemKey] 取记录值');
  assert.ok(!/String\(el\.value/.test(body),
    'refreshPeBadge 不许读 el.value —— textarea 里预填着正常描述，会把「没填」判成「已填」');
});

test('整组全选走就地刷新，不许调 render()', () => {
  const src = require('fs').readFileSync(
    require('path').resolve(__dirname, '..', 'src', 'app.js'), 'utf8');
  const at = src.indexOf('ds.pall !== undefined');
  assert.ok(at > 0, '找不到全选分支');
  // 先剥掉注释再判——分支里那段注释本身就写着「不调 render()」，
  // 不剥注释会把说明文字当成调用，测试自己骗自己。
  const body = src.slice(at, src.indexOf('return;', at))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.ok(!/\brender\(\)/.test(body),
    '全选分支不许调 render()：render() 末尾会 window.scrollTo({top:0})，刚勾完的卡片瞬间离开视野');
  assert.ok(/refreshPeBadge/.test(body), '全选后要就地刷新每一项的角标');
});

/* ================= 默认描述不得编造具体测量值 ================= */

test('查体默认描述里不能出现和生命体征打架的具体数值', () => {
  // 真实踩过的坑：心脏听诊默认写「心率78次/分」，学生填了 P 88次/分，
  // 同一份病历里 88 和 78 并存，还一条提醒都没有。
  // 规则：默认描述是「勾了就当查过」时的正常所见，可以写「心率正常」，
  // 不能写「心率78次/分」——那个数字没人量过。
  const bad = [
    { re: /\d+\s*次\s*\/?\s*分/, why: '次数（心率/呼吸/肠鸣音等）' },
    { re: /\d+(\.\d+)?\s*℃/, why: '体温' },
    { re: /\d+\s*\/\s*\d+\s*mmHg/, why: '血压' },
    { re: /\d+(\.\d+)?\s*mm\b/, why: '瞳孔/直径的毫米数' },
    { re: /直径约?\s*\d/, why: '直径' },
  ];
  const hits = [];
  const scan = (where, it) => {
    const text = String(it.default || '') + ' ' + String(it.normal || '');
    for (const { re, why } of bad) {
      if (re.test(text)) hits.push(`${where} 含${why}：${text.trim()}`);
    }
  };
  (SCHEMA.PE_COMMON || []).forEach(g => (g.items || []).forEach(it => scan(`通用查体 ${g.key}.${it.key}`, it)));
  Object.keys(SCHEMA.PE_SPECIAL || {}).forEach(sp =>
    (SCHEMA.PE_SPECIAL[sp].items || []).forEach(it => scan(`专科查体 ${sp}.${it.key}`, it)));

  assert.deepEqual(hits, [], '默认描述里编造了没人量过的具体数值：\n' + hits.join('\n'));
});
