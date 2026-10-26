/* ===========================================================================
 * 精神科（psychiatry）科室护栏测试（node:test + node:assert/strict）
 * 运行：node --test tests/psychiatry.test.cjs
 *
 * 来历：用户说「可以再加个精神科的」。加一个科室看起来只是往 DEPARTMENTS
 * 里塞一行，其实牵动四件互相牵扯的事，任何一件漏了都会在病历上留下痕迹：
 *
 *   ① 路由：中文科室名必须认得出「精神科」，但**绝不许**把「神经内科」
 *      一起吃进去——这两个科在中文里只差一个字，认错就等于把神经科的
 *      病人塞进精神科病历，反过来也一样。这类错误不会报错，只会静默生成
 *      一份科室不对的病历，学生点开时才发现。
 *
 *   ② 勾选制：精神状况检查（MSE）十项，没勾的一项都不许出现。替学生编造
 *      他没有做的精神检查，比编造腹部查体更危险——精神科病历里一句
 *      「未引出幻觉」会被当作本次精神状态评估的正式记录。
 *
 *   ③ 切科室不残留：学生先选了精神科、勾了几项，发现选错改成消化内科，
 *      那些 psy* 描述不能留在病历里。界面上已经点不到了，学生想删都没处删。
 *
 *   ④ 十项不重复：MSE 十项里有几项默认描述自带逗号（「衣着整洁，接触主动，
 *      合作」），如果去重按子串比，会把「情感反应协调，情绪平稳」误判成
 *      「情绪平稳」的重复。所以这一组**按分句精确比对**。
 *
 *   ⑤ 个人史新增两栏：病前性格、发病前应激事件。它们是精神科专用的问诊
 *      内容，综合医院的病历里多出这两行会很突兀——留空时必须整行消失。
 *
 * 与 src/ 的约定：
 *   SCHEMA.DEPARTMENTS / PE_SPECIAL.psychiatry / ROS.nervous  —— 科室、专科项、问诊症状
 *   CORE.normalizeDeptKey                                     —— 中文科室名 → 科室键
 *   SCHEMA.peChecked / peNormalText + GENERATOR.buildPE       —— 勾选制
 *   GENERATOR.buildPersonal                                   —— 个人史两栏
 *   GENERATOR.buildROS                                        —— 新 ROS 症状落地
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, CORE, GENERATOR, HINTS } = bootGlobals();
const S = SCHEMA;
const G = GENERATOR;

const DEPT_KEYS = S.DEPARTMENTS.map(d => d.key);
const PSY = S.PE_SPECIAL.psychiatry;
const PSY_ITEMS = PSY.items;

/** 与 tests/special-pe.test.cjs 同款最小可用记录：只填生成必需字段。 */
function makeRecord(deptKey) {
  const r = S.emptyRecord();
  r.basic.department = deptKey || 'psychiatry';
  r.basic.name = '测试患者';
  r.basic.gender = '男';
  r.basic.age = '45';
  r.basic.marital = '已婚';
  r.basic.chiefComplaint = '情绪低落';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '月';
  r.hpi.onset = '3个月前无明显诱因出现情绪低落';
  r.hpi.generalCondition = '发病以来精神可';
  r.diagnosis.confirmed = ['待完善'];
  return r;
}

/** 把精神科某一项勾上；value 省略表示「勾了但不填」。 */
function checkPsy(r, itemKey, value) {
  S.setPeChecked(r, 'special_psychiatry', itemKey, true);
  if (value !== undefined) {
    if (!r.pe.special_psychiatry) r.pe.special_psychiatry = {};
    r.pe.special_psychiatry[itemKey] = value;
  }
  return r;
}

/** 【体格检查】节的所有非空行。 */
function peSection(text) {
  const lines = String(text || '').split('\n');
  const i = lines.findIndex(l => l.trim() === '【体格检查】');
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^【/.test(lines[j])) break;
    if (lines[j].trim()) out.push(lines[j]);
  }
  return out;
}

const peLineOf = (text, spName) => peSection(text).find(l => l.startsWith(spName + '：')) || '';
const genText = r => G.generate(r).text;

/** lead 指定口径：按分句切（顿号不切，「记忆、计算与理解力尚可」必须整体保留）。 */
const splitClauses = t => String(t || '').split(/[，,；;。\n]/).map(s => s.trim()).filter(Boolean);
const countOf = (hay, needle) => (needle ? String(hay).split(needle).length - 1 : 0);

/* ======================= 1. 科室存在且能正确路由 ======================= */

test('精神科在科室表里，并且带自己的专科组', () => {
  const d = S.DEPARTMENTS.find(x => x.key === 'psychiatry');
  assert.ok(d,
    'DEPARTMENTS 里找不到 psychiatry：新增科室没写进表，用户切到精神科后会落回通用科，' +
    '整段精神状况检查凭空消失且界面不给任何提示。');
  assert.equal(d.name, '精神科',
    '科室键对了但显示名不是「精神科」：下拉框里会出现空名字或错名字，「精神科」这个需求等于没做。');
  assert.equal((d.special || []).join(','), 'psychiatry',
    'psychiatry 的 special 必须是 [\'psychiatry\']：写成别的键生成时会去 PE_SPECIAL 里找一个不存在的组，' +
    '专科查体整段静默丢失。');
  assert.equal(S.DEPARTMENTS.length, 14,
    '科室总数应为 14（原 13 + 精神科）：数目不对说明有人又增删了科室，其他科室的键位断言会跟着错。');
  assert.equal(new Set(DEPT_KEYS).size, 14,
    '科室键重复了：normalizeDeptKey 直通匹配会命中第一个，另一个科室永远进不去。');
  const orphans = Object.keys(S.PE_SPECIAL).filter(k => !S.DEPARTMENTS.some(x => (x.special || []).includes(k)));
  assert.equal(orphans.join(','), '',
    `PE_SPECIAL 里有科室表根本引用不到的组（${orphans.join(',')}）：这样的组永远生成不出来，是死配置。`);
});

test('精神状况检查是十项 MSE，顺序与键名都锁定', () => {
  assert.equal(PSY.name, '精神状况检查',
    '专科组名必须是「精神状况检查」：它同时是生成时的行首标签（「精神状况检查：…」），' +
    '改名会让所有按行首找这段的代码与既有病历对不上。');
  assert.equal(PSY_ITEMS.length, 10,
    'MSE 应为十项（仪表/定向/言语/思维形式/思维内容/感知觉/情感/认知/自知力/意志行为）：' +
    '少一项就是漏了一次精神检查，多一项则超出了标准 MSE 的范围。');
  assert.equal(PSY_ITEMS.map(i => i.key).join(','),
    'psyAppearance,psyOrientation,psySpeech,psyThoughtForm,psyThoughtContent,' +
    'psyPerception,psyMood,psyCognition,psyInsight,psyBehavior',
    '十项的键名或顺序变了：病历里 MSE 的书写顺序就是临床习惯顺序（由外到内、由观察到自知力），' +
    '顺序乱了带教老师会认为没按规范做精神检查。');
  assert.equal(PSY_ITEMS.filter(i => i.parent).length, 0,
    'MSE 十项都是独立项，不该有 parent：有 parent 的项默认不勾，学生勾了父项也不会带出子项。');
});

test('中文科室名认得出精神科（含常见别名）', () => {
  const cases = ['精神科', '心理科', '心身医学科', '精神卫生科', '精神心理科', '精神病科', '精神医学'];
  for (const name of cases) {
    assert.equal(CORE.normalizeDeptKey(name, DEPT_KEYS), 'psychiatry',
      `「${name}」应该认成 psychiatry：导入的病历里科室常写成中文，认不出来就回退 general，` +
      '精神状况检查整段消失，而界面上不会有任何提示。');
  }
  assert.equal(CORE.normalizeDeptKey('psychiatry', DEPT_KEYS), 'psychiatry',
    '科室键本身必须直通：前端存档里存的就是这个键。');
});

test('反向锁定：神经内科不许被精神科吃掉', () => {
  // 这是本组最重要的一条：中文里「神经」与「精神」只差一个字，
  // 别名表一旦写成前缀/包含匹配，「神经内科」就会被判成精神科。
  const neuro = ['神经内科', '神经科', '神内'];
  for (const name of neuro) {
    assert.equal(CORE.normalizeDeptKey(name, DEPT_KEYS), 'neurology',
      `「${name}」必须映射到 neurology：精神科别名若用包含匹配，神经内科病人会被塞进精神科病历，` +
      '生成一份只有精神状况检查、没有神经系统查体的文书，而学生完全看不出哪里错了。');
    assert.notEqual(CORE.normalizeDeptKey(name, DEPT_KEYS), 'psychiatry',
      `「${name}」被判成了 psychiatry：神经科与精神科是两本病历，混淆会直接改变诊断方向。`);
  }
  assert.notEqual(CORE.normalizeDeptKey('精神科', DEPT_KEYS), 'neurology',
    '反过来同样成立：「精神科」不能落到 neurology，否则精神科病历里长出神经系统查体。');
  // 认不出来时必须回到 general，绝不许静默落到某个专科
  assert.equal(CORE.normalizeDeptKey('未知精神科室XYZ', DEPT_KEYS), 'general',
    '完全不认识的科室名应回退 general（通用/全科），不能猜成任何专科。');
});

/* =================== 2. 精神科查体默认不写进病历 =================== */

test('不勾任何项时，精神状况检查一个字都不写', () => {
  const r = makeRecord('psychiatry');
  assert.equal(G.peEntries(r, 'special_psychiatry', PSY_ITEMS).length, 0,
    '空记录下 peEntries 应返回 0 项：勾选制要求专科项默认全不勾，' +
    '否则等于替学生写了他没做的检查。');
  assert.equal(S.peChecked(r, 'special_psychiatry', 'psyAppearance'), false,
    '专科项默认必须是「未勾选」：精神科查体尤其不能替学生表态。');

  const t = genText(r);
  assert.equal(t.includes('精神状况检查'), false,
    '空记录的精神科病历里出现了「精神状况检查」：整段查体都是编造的，' +
    '病历上却写着这是本次检查所见。');
  const leaked = PSY_ITEMS.filter(i => t.includes(i.default)).map(i => `${i.key}=${i.default}`);
  assert.equal(leaked.join(' | '), '',
    `空记录里泄漏了 ${leaked.length} 项 MSE 默认描述（${leaked.join(' | ')}）：` +
    '这些句子代表「本次检查过且结果正常」，没勾就写等于伪造精神检查记录。');
  assert.equal(countOf(t, '未查'), 0,
    '病历里出现了「未查」：未勾选的项应当整项不写，不能写个「未查」占位——' +
    '「未查」在病历里是明确的医疗行为缺失记录，不该由工具替学生声明。');
});

/* ===================== 3. 勾一项就只写这一项 ===================== */

test('勾一项只写这一项，其余九项的默认描述不出现', () => {
  const r = checkPsy(makeRecord('psychiatry'), 'psyPerception', '幻听');
  const line = peLineOf(genText(r), '精神状况检查');
  assert.equal(line, '精神状况检查：幻听。',
    `只勾感知觉填「幻听」时应生成「精神状况检查：幻听。」，实际是「${line}」：` +
    '勾了一项却把别的项也写出来，就是替学生编造他没检查的内容。');

  const t = genText(r);
  const leaked = PSY_ITEMS.filter(i => i.key !== 'psyPerception' && t.includes(i.default)).map(i => i.key);
  assert.equal(leaked.join(','), '',
    `未勾选的 ${leaked.length} 项默认描述出现在病历里（${leaked.join(',')}）：` +
    'MSE 十项互相独立，勾一项不能带出其他项。');
});

/* =============== 4. 勾了不填 → 写该类目的规范正常描述 =============== */

test('勾了但没填，写该项的规范正常描述（peNormalText）', () => {
  const item = PSY_ITEMS.find(i => i.key === 'psyInsight');
  const normal = S.peNormalText(item);
  assert.equal(normal, '自知力完整，承认有病并愿意接受治疗',
    `psyInsight 的 peNormalText 应是「自知力完整，承认有病并愿意接受治疗」，实际是「${normal}」：` +
    '这是勾了不填时补进病历的原句，改了就等于换了病历上的措辞。');

  const r = checkPsy(makeRecord('psychiatry'), 'psyInsight');
  const line = peLineOf(genText(r), '精神状况检查');
  assert.equal(line, `精神状况检查：${normal}。`,
    `勾了自知力但留空时应补「${normal}」，实际是「${line}」：` +
    '勾了却留空，病历里会出现空条目或缺项，学生以为写了其实没写。');

  // 十项各自勾了不填，都必须落到自己的 peNormalText
  const bad = [];
  for (const it of PSY_ITEMS) {
    const rr = checkPsy(makeRecord('psychiatry'), it.key);
    const l = peLineOf(genText(rr), '精神状况检查');
    const want = `精神状况检查：${S.peNormalText(it)}。`;
    if (l !== want) bad.push(`${it.key}: 期望「${want}」实际「${l}」`);
  }
  assert.equal(bad.join(' | '), '',
    `有 ${bad.length} 项勾了不填没有补成规范描述（${bad.join(' | ')}）：` +
    '勾了不填是本工具最常见的用法，一项漏补就是病历里少一句话。');
});

/* ================= 5. 切科室后精神科查体不许残留 ================= */

test('切到别的科室后，精神科查体与重点查体都不残留', () => {
  const r = checkPsy(makeRecord('psychiatry'), 'psyPerception', '幻听');
  checkPsy(r, 'psyMood', '情感低落');
  checkPsy(r, 'psyBehavior', '意志减退，生活懒散');
  r.focusPE = { keys: ['special_psychiatry.psyPerception'] };

  const before = genText(r);
  assert.ok(before.includes('幻听'),
    '切换前病历里应能看到「幻听」——这是本测试的前提，看不到说明勾选没生效，后面的残留断言就失去意义。');
  assert.ok(before.includes('精神状况检查'),
    '切换前病历里应有「精神状况检查」这一行：前提不成立时残留断言会假绿。');
  assert.equal(G.buildFocusPE(r), '重点查体：精神状况检查：感知觉幻听。',
    '切换前重点查体应写出该项：这是学生手点的重点，切科室后要跟着一起消失。');

  r.basic.department = 'digestive';
  const after = genText(r);
  assert.equal(after.includes('精神状况检查'), false,
    '切到消化内科后仍出现「精神状况检查」：专科段应按当前科室的 special 过滤，' +
    '否则消化科病历里挂着一段精神检查，学生界面上已经点不到、想删也删不掉。');
  assert.equal(after.includes('幻听'), false,
    '切科后仍残留自定义查体值「幻听」：这是真实病人的精神状态描述，出现在消化科病历里属于串档。');
  assert.equal(after.includes('意志减退，生活懒散'), false,
    '切科后仍残留 psyBehavior 的自定义值：同上，串档比漏写更难被发现。');
  const leaked = PSY_ITEMS.filter(i => after.includes(i.default)).map(i => i.key);
  assert.equal(leaked.join(','), '',
    `切科后仍残留 ${leaked.length} 项 MSE 默认描述（${leaked.join(',')}）：` +
    '默认描述同样按科室过滤，不能因为「反正没填」就漏过滤。');
  assert.equal(G.buildFocusPE(r), '',
    '切科后重点查体仍输出精神科项：buildFocusPE 已按当前科室校验 special_ 前缀的键，' +
    '这条断言锁的就是这个行为——重点查体不能跨科室残留。');

  // 其他科室的记录本来也不该长出精神科内容
  const d = makeRecord('digestive');
  assert.equal(genText(d).includes('精神状况检查'), false,
    '消化内科空记录出现精神状况检查：科室串了，或专科段遍历没有按当前科室取组。');
});

/* ============ 6. 十个 MSE 项的值不许重复（分句精确比对） ============ */

test('十项全勾各填默认值时，每个分句在查体段里只出现一次', () => {
  const r = makeRecord('psychiatry');
  for (const it of PSY_ITEMS) checkPsy(r, it.key, it.default);

  const pe = peSection(genText(r)).join('\n');
  const occurred = peLineOf(genText(r), '精神状况检查');
  assert.ok(occurred, '十项全勾后应当有「精神状况检查」这一行：没有这一行说明生成环节整段丢了。');

  const clauses = splitClauses(occurred.slice(occurred.indexOf('：') + 1));
  assert.equal(clauses.length, 19,
    `十项默认值切分句应为 19 段（psyAppearance 3 段、psySpeech 3 段、psyMood 2 段，其余各 1 段），` +
    `实际 ${clauses.length} 段：切分口径变了会让去重断言失去意义。`);

  const dup = clauses.filter((c, i) => clauses.indexOf(c) !== i);
  assert.equal([...new Set(dup)].join(','), '',
    `查体段里有重复分句（${[...new Set(dup)].join(',')}）：同一句精神检查写两遍，` +
    '病历看起来像复制粘贴，带教老师会怀疑整份记录的可靠性。');

  // 按分句精确比对（不按子串）：子串会把「情感反应协调，情绪平稳」误判成「情绪平稳」的重复
  const counters = clauses.reduce((acc, c) => (acc[c] = (acc[c] || 0) + 1, acc), {});
  const multi = Object.keys(counters).filter(c => counters[c] > 1).map(c => `${c}×${counters[c]}`);
  assert.equal(multi.join(','), '',
    `有分句出现多次（${multi.join(',')}）：MSE 十项之间不该有任何重叠内容。`);

  // 每个 default 的每个分句，在查体段里都恰好出现 1 次
  const wrong = [];
  for (const it of PSY_ITEMS) {
    for (const c of splitClauses(it.default)) {
      const n = countOf(pe, c);
      if (n !== 1) wrong.push(`${it.key}「${c}」出现 ${n} 次`);
    }
  }
  assert.equal(wrong.join(' | '), '',
    `有 ${wrong.length} 个分句出现次数不是 1（${wrong.join(' | ')}）：` +
    '要么被吞（漏写），要么被重复写（同一项进了两遍）。');
});

test('十项全勾但不填，输出与「各填默认值」完全一致', () => {
  const a = makeRecord('psychiatry');
  const b = makeRecord('psychiatry');
  for (const it of PSY_ITEMS) {
    checkPsy(a, it.key);              // 勾了不填
    checkPsy(b, it.key, it.default);  // 勾了且填的就是默认值
  }
  assert.equal(genText(a), genText(b),
    '「勾了不填」与「勾了并填上默认值」生成结果必须逐字相同：' +
    '两者在临床上都是「检查过、结果正常」，输出不同就意味着一批病历会莫名其妙缺句。');
});

test('少勾一项时，那一项的分句整条消失（不许只删一半）', () => {
  const r = makeRecord('psychiatry');
  for (const it of PSY_ITEMS) {
    if (it.key !== 'psyMood') checkPsy(r, it.key, it.default);
  }
  const line = peLineOf(genText(r), '精神状况检查');
  const mood = PSY_ITEMS.find(i => i.key === 'psyMood');
  assert.equal(line.includes(mood.default), false,
    `未勾选 psyMood，但它的默认描述「${mood.default}」仍在病历里：` +
    '勾选制失效，等于替学生写了他没做的那一项。');
  for (const c of splitClauses(mood.default)) {
    assert.equal(countOf(line, c), 0,
      `未勾选 psyMood，但它的分句「${c}」出现在病历里：如果只按字面删掉一部分，` +
      '会留下「情绪平稳」这种没有主语的残句，读者不知道是谁的情绪。');
  }
  const rest = PSY_ITEMS.filter(i => i.key !== 'psyMood');
  for (const it of rest) {
    for (const c of splitClauses(it.default)) {
      if (countOf(line, c) !== 1) throw new Error(`${it.key} 的分句「${c}」应恰好出现 1 次，实际 ${countOf(line, c)} 次`);
    }
  }
});

test('MSE 每一项的默认值都在自己的可选值里', () => {
  const bad = PSY_ITEMS.filter(i => !(i.options || []).includes(i.default)).map(i => i.key);
  assert.equal(bad.join(','), '',
    `这些项的默认值不在 options 里（${bad.join(',')}）：下拉框选不到它，` +
    '勾了不填时却会自动写进病历——学生看到的选项与生成的文字对不上，也没法把它改回来。');
  assert.equal(PSY_ITEMS.filter(i => i.normal).length, 0,
    'MSE 十项只应有 default、不应有 normal：两套命名并存时 peNormalText 取谁全看实现顺序，' +
    '将来改一处就会静默改变病历措辞。');
});

/* ==================== 7. 病前性格与应激事件 ==================== */

test('病前性格：值自带标签时原样写，不重复加前缀', () => {
  const r = makeRecord('psychiatry');
  r.personal.premorbidPersonality = '病前性格内向，少与人交往';
  const lines = G.buildPersonal(r).split('\n').map(l => l.trim()).filter(Boolean);
  assert.ok(lines.includes('病前性格内向，少与人交往'),
    `个人史里应有整行「病前性格内向，少与人交往」，实际是 ${JSON.stringify(lines)}：` +
    '这一栏是精神科问诊的固定项目（病前性格决定发病的人格基础），写不进去等于漏问。');
  assert.equal(lines.some(l => l.includes('病前性格：病前性格')), false,
    '出现了「病前性格：病前性格…」：值本身已经带标签时不能再加一遍，' +
    '病历里出现重复标签是很显眼的低级错误。');
  assert.equal(countOf(lines.join('\n'), '病前性格'), 1,
    '「病前性格」这一段在个人史里应只出现一次。');
});

test('病前性格：只写了内容时补上标签', () => {
  const r = makeRecord('psychiatry');
  r.personal.premorbidPersonality = '内向，少与人交往';
  const lines = G.buildPersonal(r).split('\n').map(l => l.trim()).filter(Boolean);
  assert.ok(lines.includes('病前性格：内向，少与人交往'),
    `只写内容时个人史应为「病前性格：内向，少与人交往」，实际是 ${JSON.stringify(lines)}：` +
    '不加标签的话，这行字会孤零零夹在吸烟史与毒物接触史之间，读者不知道它在说什么。');
});

test('发病前应激事件：补标签，值自带标签时原样写', () => {
  const r = makeRecord('psychiatry');
  r.personal.stressEvent = '3个月前因工作调动后出现情绪低落';
  const lines = G.buildPersonal(r).split('\n').map(l => l.trim()).filter(Boolean);
  assert.ok(lines.includes('发病前应激事件：3个月前因工作调动后出现情绪低落'),
    `个人史应为「发病前应激事件：3个月前因工作调动后出现情绪低落」，实际是 ${JSON.stringify(lines)}：` +
    '应激事件是精神科病历的必备要素（心因性/反应性障碍的判定前提）。');

  const r2 = makeRecord('psychiatry');
  r2.personal.stressEvent = '应激事件：3个月前工作调动';
  const lines2 = G.buildPersonal(r2).split('\n').map(l => l.trim()).filter(Boolean);
  assert.ok(lines2.includes('应激事件：3个月前工作调动'),
    `值自带「应激事件：」时应原样使用，实际是 ${JSON.stringify(lines2)}：` +
    '否则会生成「发病前应激事件：应激事件：…」这种重复标签。');
});

test('病前性格与应激事件留空时，病历里不许出现这两行', () => {
  const r = makeRecord('psychiatry');
  assert.equal(r.personal.premorbidPersonality, '',
    'emptyRecord().personal 应有 premorbidPersonality 且默认空串：新增字段没进 emptyRecord 的话，' +
    '界面绑定的输入框会写到 undefined 上，学生填了等于没填。');
  assert.equal(r.personal.stressEvent, '',
    'emptyRecord().personal 应有 stressEvent 且默认空串：理由同上。');

  const bp = G.buildPersonal(r);
  assert.equal(bp.includes('病前性格'), false,
    '没填病前性格却写了这一行：综合医院病历里多出一行空白精神科问诊项，' +
    '看起来像漏填，实际上学生根本不该被要求填它。');
  assert.equal(bp.includes('应激事件'), false,
    '没填应激事件却写了这一行：同上，空标签只是噪音。');

  const t = genText(r);
  assert.equal(t.includes('病前性格'), false,
    '生成的整份病历里出现了「病前性格」：留空必须整行消失，而不是留个空壳给读者猜。');
  assert.equal(t.includes('应激事件'), false,
    '生成的整份病历里出现了「应激事件」：留空必须整行消失。');

  // 其他科室留空同样不出现（这两栏不属于通用问诊）
  const d = makeRecord('digestive');
  const td = genText(d);
  assert.equal(td.includes('病前性格') || td.includes('应激事件'), false,
    '消化内科病历里也出现了这两行：它们是精神科专用问诊内容，不该污染所有科室。');
});

/* ==================== 8. 新增 ROS 症状能落地 ==================== */

const NEW_ROS = [
  ['interestLoss', '兴趣减退/愉快感缺失'],
  ['energyLoss', '精力下降/易疲劳'],
  ['suicidal', '自杀自伤观念'],
  ['appetiteChange', '食欲及体重改变'],
  ['behaviorAbnormal', '行为异常'],
];

test('五个新增精神症状在 ROS 里存在，且 label 锁定', () => {
  const nervous = S.ROS.find(g => g.key === 'nervous');
  assert.ok(nervous, 'ROS 里应有 nervous（神经精神系统）组。');
  assert.equal(nervous.symptoms.length, 25,
    `nervous 组应为 25 个症状（原 20 + 新增 5），实际 ${nervous.symptoms.length}：` +
    '数目不对说明症状被增删，问诊界面与生成会跟着错位。');
  for (const [key, label] of NEW_ROS) {
    const s = nervous.symptoms.find(x => x.key === key);
    assert.ok(s, `nervous 组缺少症状 ${key}：精神科问诊问不到它，摘要与提示规则也永远命不中。`);
    assert.equal(s.label, label,
      `${key} 的 label 应为「${label}」，实际「${s.label}」：label 就是病历上印出来的字，` +
      '改一个字等于改了问诊内容。');
  }
  const total = S.ROS.reduce((a, g) => a + g.symptoms.length, 0);
  assert.equal(total, 96,
    `ROS 症状总数应为 96，实际 ${total}：总数变化会影响所有按症状计数的逻辑。`);
});

test('阳性症状写成「label＋，＋具体细节」', () => {
  const detail = '对以前喜欢的事情提不起兴趣';
  const r = makeRecord('psychiatry');
  r.ros.nervous = { interestLoss: { checked: true, detail } };
  const out = G.buildROS(r, 'detail');
  assert.equal(out, `神经精神系统：兴趣减退/愉快感缺失，${detail}。`,
    `阳性项应写成「症状名，细节。」，实际是「${out}」：` +
    '只写症状名等于没说程度与表现，学生填的细节就白填了。');

  const t = genText(r);
  assert.ok(t.includes('兴趣减退') && t.includes(detail),
    '生成的病历【系统回顾】里找不到新增症状或其细节：问诊问了却不落笔，学生填了等于没填。');

  const bad = [];
  for (const [key, label] of NEW_ROS) {
    const rr = makeRecord('psychiatry');
    rr.ros.nervous = { [key]: { checked: true, detail: 'DDX' } };
    const o = G.buildROS(rr, 'detail');
    if (o !== `神经精神系统：${label}，DDX。`) bad.push(`${key}: 「${o}」`);
  }
  assert.equal(bad.join(' | '), '',
    `有 ${bad.length} 个新症状的阳性输出格式不对（${bad.join(' | ')}）：` +
    '五个症状必须走同一套（label＋细节）格式，否则病历里几种写法混排。');
});

test('阴性症状写成「无＋label」，五项全阴时只在第一个前面加「无」', () => {
  const bad = [];
  for (const [key, label] of NEW_ROS) {
    const r = makeRecord('psychiatry');
    r.ros.nervous = { [key]: { negative: true } };
    const o = G.buildROS(r, 'detail');
    if (o !== `神经精神系统：无${label}。`) bad.push(`${key}: 「${o}」`);
  }
  assert.equal(bad.join(' | '), '',
    `有 ${bad.length} 个新症状的阴性输出不对（${bad.join(' | ')}）：` +
    '明确阴性的症状必须写进病历（这是「问过并排除」的记录），写法也要统一。');

  const r = makeRecord('psychiatry');
  r.ros.nervous = {};
  for (const [key] of NEW_ROS) r.ros.nervous[key] = { negative: true };
  const all = G.buildROS(r, 'detail');
  assert.equal(all,
    '神经精神系统：无兴趣减退/愉快感缺失、精力下降/易疲劳、自杀自伤观念、食欲及体重改变、行为异常。',
    `五项全阴性时应合并成一句、只在第一个前加「无」，实际是「${all}」：` +
    '写成「无A、无B、无C」在中文病历里是重复啰嗦，而且和既有的其他系统回顾格式不一致。');

  const mixed = makeRecord('psychiatry');
  mixed.ros.nervous = {
    interestLoss: { checked: true, detail: '对以前喜欢的事情提不起兴趣' },
    energyLoss: { negative: true },
    suicidal: { negative: true },
    appetiteChange: { negative: true },
    behaviorAbnormal: { negative: true },
  };
  assert.equal(G.buildROS(mixed, 'detail'),
    '神经精神系统：兴趣减退/愉快感缺失，对以前喜欢的事情提不起兴趣；' +
    '无精力下降/易疲劳、自杀自伤观念、食欲及体重改变、行为异常。',
    '阳性与阴性混排时应「阳性；阴性」，实际输出不符：' +
    '混排是最常见的问诊结果，格式错会让整行读起来像两句话粘在一起。');
  const t = genText(mixed);
  assert.ok(t.includes('兴趣减退/愉快感缺失，对以前喜欢的事情提不起兴趣'),
    '混排时阳性项没有连同细节一起落进病历：学生填的细节被吞了。');
  assert.ok(t.includes('无精力下降/易疲劳、自杀自伤观念、食欲及体重改变、行为异常'),
    '混排时阴性项没有合并落进病历：明确排除的症状丢失，等于没有问诊记录。');
});

/* ================= 附加护栏：精神科提示规则不外溢 ================= */

test('精神科提示规则不许外溢到其他科室', () => {
  const rules = HINTS.RULES.filter(r => (r.depts || []).includes('psychiatry'));
  assert.equal(rules.map(r => r.id).join(','), 'depression,schizophrenia,bipolar,anxiety',
    `精神科规则应只有 depression/schizophrenia/bipolar/anxiety，实际 ${rules.map(r => r.id).join(',')}：` +
    '规则集的组成就是提示能力的边界。');
  const leakedToGeneral = rules.filter(r => (r.depts || []).includes('general')).map(r => r.id);
  assert.equal(leakedToGeneral.join(','), '',
    `这些精神科规则同时挂了 general（${leakedToGeneral.join(',')}）：` +
    'depts 里写 general 会让规则在**所有科室**生效——内科病人随口一句「最近睡不好、有点焦虑」' +
    '就会被提示「抑郁发作」。');

  // 同样的核心症状，在精神科要命中，在别的科不许命中
  const fill = r => { r.ros.nervous = {
    moodLow: { checked: true, detail: '几乎每天情绪低落' },
    interestLoss: { checked: true, detail: '对以前喜欢的事情提不起兴趣' },
    energyLoss: { checked: true, detail: '整日疲乏' },
  }; return r; };
  assert.equal(HINTS.analyze(fill(makeRecord('psychiatry'))).map(x => x.id).join(','), 'depression',
    '精神科记录里填了抑郁核心三联却没命中「抑郁发作」：这是精神科规则的主要用途。');
  assert.equal(HINTS.analyze(fill(makeRecord('digestive'))).map(x => x.id).join(','), '',
    '消化内科记录里填了同样三条症状却命中了精神科提示：提示会在无关科室刷屏，' +
    '带教老师会认为工具在乱猜诊断。');
  assert.equal(HINTS.analyze(fill(makeRecord('neurology'))).map(x => x.id).join(','), '',
    '神经内科记录命中了精神科提示：这两个科最容易被混，提示层面同样要锁死。');
});
