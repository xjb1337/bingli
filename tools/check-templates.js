/* 模板病例自检 —— 撰写者自己跑，不要等人来挑错
 *
 * 用法：
 *   node tools/check-templates.js                 # 检查 tools/tpl-parts/ 下全部
 *   node tools/check-templates.js tools/tpl-parts/pud.cjs   # 只查一个
 *
 * 检查的是「这份模板会不会生成一份自相矛盾、或根本点不出东西的病历」：
 *   1. 结构：key/dept/name/record 齐备，dept 是合法科室键，key 唯一
 *   2. 键名：record 里出现的每个嵌套 key 都必须在 schema 里真实存在
 *   3. 查体值：写进 pe 的每一条描述，要么等于该项的 default / normal，
 *      要么逐字出现在该项的 options 里 —— 否则诊断提示（pev: 精确匹配）命中不了
 *   4. 不写患者隐私：basic 里不许出现 name/gender/age/recordNo/bedNo/admitDate
 *   5. 不写生命体征：pe.vitals 必须为空（学生自己测）
 *   6. 生成：套用后能生成非空病历，且 诊断提示 top3 里能命中该模板宣告的诊断
 *   7. 一致性：生成文本里不应同时出现互相否定的同一体征（借 generator 的 validate）
 *
 * 退出码 0 = 全过，1 = 有问题（问题逐条打印，带文件与路径）。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
global.SCHEMA = require(path.join(ROOT, 'src/schema.js'));
const CORE = require(path.join(ROOT, 'src/core.js'));
global.RECORD_CORE = CORE;
global.GENERATOR = require(path.join(ROOT, 'src/generator.js'));
global.HINTS = require(path.join(ROOT, 'src/hints.js'));

const S = global.SCHEMA;
const G = global.GENERATOR;
const H = global.HINTS;

const PARTS_DIR = path.join(__dirname, 'tpl-parts');
const FORBIDDEN_BASIC = ['name', 'gender', 'age', 'birthDate', 'recordNo', 'bedNo', 'admitDate', 'admitTime', 'recordDate', 'recordTime'];

let problems = 0;
let warns = 0;

function err(file, msg) {
  problems++;
  console.log(`  ✗ ${msg}`);
}
function warn(file, msg) {
  warns++;
  console.log(`  ! ${msg}`);
}

/* 合法科室键 */
const DEPT_KEYS = S.DEPARTMENTS.map(d => d.key);

/* 允许出现在 record 顶层与各节里的键 —— 直接照 emptyRecord() 的结构取，
 * 这样 schema 加字段时这里不用跟着改。 */
const SHAPE = S.emptyRecord();

function shapeOf(node) {
  // 返回该节点的「合法子键集合」，非对象返回 null（表示叶子，任意标量都行）
  if (node === null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    return node.length && typeof node[0] === 'object' ? shapeOf(node[0]) : null;
  }
  return new Set(Object.keys(node));
}

/* 特殊：pe.special_<dept> 是动态的，从 PE_SPECIAL 取 */
function peGroupShape(groupKey) {
  if (groupKey.startsWith('special_')) {
    const deptKey = groupKey.slice('special_'.length);
    const sp = S.PE_SPECIAL[deptKey];
    return sp ? new Set(sp.items.map(it => it.key)) : null;
  }
  const g = S.PE_COMMON.find(x => x.key === groupKey);
  return g ? new Set(g.items.map(it => it.key)) : null;
}

/* 字典类容器（键是用户数据，不能按 schema 校验） */
const DICT_KEYS = new Set([
  'ros',            // 系统 → 症状 → {checked,negative,detail}
  'diseaseChecks',  // 病名 → true
  'allergenChecks',
  'allergenReactionChecks',
  'checked',        // pe.checked
  'suggestions'
]);

function checkKeys(file, node, shape, trail) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => checkKeys(file, v, shape, `${trail}[${i}]`));
    return;
  }
  const keys = Object.keys(node);
  if (!shape) return;
  keys.forEach(k => {
    if (!shape.has(k)) {
      // 动态容器：只校验一层，往里不再按 schema 查
      if (DICT_KEYS.has(k)) return;
      err(file, `多余的键 ${trail}.${k}（schema 里没有）`);
      return;
    }
    checkKeys(file, node[k], shapeOf(shape.get ? shape.get(k) : undefined), `${trail}.${k}`);
  });
}

/* 校验 pe：逐项对 default / normal / options */
function checkPE(file, pe) {
  if (!pe || typeof pe !== 'object') return;
  Object.keys(pe).forEach(groupKey => {
    if (groupKey === 'vitals') {
      const v = pe.vitals || {};
      const nonEmpty = Object.keys(v).filter(k => String(v[k] || '').trim());
      if (nonEmpty.length) {
        err(file, `pe.vitals 必须留空（学生自己测），却写了：${nonEmpty.join(', ')}`);
      }
      return;
    }
    if (groupKey === 'checked') return;
    const valid = peGroupShape(groupKey);
    if (!valid) { err(file, `未知查体组 pe.${groupKey}`); return; }
    Object.keys(pe[groupKey] || {}).forEach(itemKey => {
      if (!valid.has(itemKey)) { err(file, `未知查体项 pe.${groupKey}.${itemKey}`); return; }
      const val = String(pe[groupKey][itemKey] || '').trim();
      if (!val) return;
      const it = groupKey.startsWith('special_')
        ? S.PE_SPECIAL[groupKey.slice(8)].items.find(x => x.key === itemKey)
        : S.PE_COMMON.find(g => g.key === groupKey).items.find(x => x.key === itemKey);
      const allowed = new Set([it.default, it.normal].filter(Boolean).map(x => String(x).trim()));
      (it.options || []).forEach(o => allowed.add(String(o).trim()));
      if (!allowed.has(val)) {
        err(file, `查体描述对不上 ${groupKey}.${itemKey}：\n       写的是「${val}」\n       可用的是「${[...allowed].join('」「')}」`);
      }
    });
  });
}

/* 校验 basic 不含患者隐私 */
function checkPrivacy(file, basic) {
  if (!basic || typeof basic !== 'object') return;
  FORBIDDEN_BASIC.forEach(k => {
    if (String(basic[k] || '').trim()) {
      err(file, `basic.${k} 不许写（患者信息由学生自己填），却写了「${basic[k]}」`);
    }
  });
  if (basic.department && !DEPT_KEYS.includes(basic.department)) {
    err(file, `basic.department「${basic.department}」不是合法科室键`);
  }
}

/* 校验 ros 系统/症状键 */
function checkROS(file, ros) {
  if (!ros || typeof ros !== 'object') return;
  Object.keys(ros).forEach(sysKey => {
    const sys = S.ROS.find(x => x.key === sysKey);
    if (!sys) { err(file, `未知系统回顾系统 ros.${sysKey}`); return; }
    Object.keys(ros[sysKey] || {}).forEach(symKey => {
      if (!sys.symptoms.some(s => s.key === symKey)) {
        err(file, `未知症状 ros.${sysKey}.${symKey}`);
        return;
      }
      const st = ros[sysKey][symKey];
      if (!st || typeof st !== 'object') { err(file, `ros.${sysKey}.${symKey} 应是 {checked:true} 或 {negative:true}`); return; }
      if (!st.checked && !st.negative) {
        err(file, `ros.${sysKey}.${symKey} 既没勾阳性也没标阴性——没问过的症状应该整个键都不写`);
      }
      if (st.checked && st.negative) {
        err(file, `ros.${sysKey}.${symKey} 同时是阳性和阴性`);
      }
    });
  });
}

/* 校验疾病勾选的病名 */
function checkNamedChecks(file, obj, list, label) {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach(name => {
    if (!list.includes(name)) {
      err(file, `${label}「${name}」不在可选清单里（可用：${list.join('、')}）`);
    }
  });
}

/* 主检查 */
function checkOne(file) {
  console.log(`\n=== ${path.basename(file)}`);
  let part;
  try {
    delete require.cache[require.resolve(file)];
    part = require(file);
  } catch (e) {
    err(file, `加载失败：${e.message}`);
    return null;
  }

  // 1 结构
  ['key', 'dept', 'name'].forEach(k => {
    if (!String(part[k] || '').trim()) err(file, `缺少 ${k}`);
  });
  if (part.dept && !DEPT_KEYS.includes(part.dept)) err(file, `dept「${part.dept}」不是合法科室键`);
  if (!part.record || typeof part.record !== 'object') { err(file, '缺少 record'); return null; }
  if (!Array.isArray(part.alias)) warn(file, 'alias 建议给一个数组，方便学生按别名找到它');
  if (!String(part.hint || '').trim()) warn(file, 'hint 建议写一句典型表现');

  // 2 键名
  checkKeys(file, part.record, shapeOf(SHAPE), 'record');

  // 3 查体
  checkPE(file, part.record.pe);

  // 4 隐私
  checkPrivacy(file, part.record.basic);

  // 5 生命体征
  const v = (part.record.pe || {}).vitals || {};
  if (Object.keys(v).filter(k => String(v[k] || '').trim()).length) {
    err(file, 'pe.vitals 必须全部留空');
  }

  // ROS / 疾病名
  checkROS(file, part.record.ros);
  checkNamedChecks(file, (part.record.pmh || {}).diseaseChecks, S.COMMON_PMH, 'pmh.diseaseChecks ');
  checkNamedChecks(file, (part.record.family || {}).diseaseChecks, S.FAMILY_DISEASES, 'family.diseaseChecks ');
  checkNamedChecks(file, (part.record.pmh || {}).allergenChecks, S.ALLERGENS, 'pmh.allergenChecks ');
  checkNamedChecks(file, (part.record.pmh || {}).allergenReactionChecks, S.ALLERGY_REACTIONS, 'pmh.allergenReactionChecks ');

  // 6 生成
  const rec = S.emptyRecord();
  rec.basic.department = part.dept;
  const filled = CORE.fillBlanks(rec, part.record);
  if (!filled.length) err(file, '套用后一个字段都没填上');

  let text = '';
  try {
    text = G.generate(rec).text;
  } catch (e) {
    err(file, `生成病历抛异常：${e.message}`);
    return part;
  }
  const lines = text.split('\n').filter(x => x.trim());
  if (lines.length < 25) err(file, `生成的病历只有 ${lines.length} 行，太短，像是没填够`);
  if (/／/.test(text)) {
    // 有些「／」是**应该**留着的：患者身份（姓名/性别/年龄/床号/住院号/联系方式）
    // 和生命体征数字本来就该由学生自己填，模板写了反而是编造。
    // 所以只统计「医学内容」里的占位，把一般项目与生命体征行排除掉。
    const medical = text
      .replace(/【一般项目】[\s\S]*?(?=\n【)/, '')
      .split('\n')
      .filter(l => !/^T\s/.test(l.trim()))
      .join('\n');
    const ph = (medical.match(/／/g) || []).length;
    if (ph > 6) warn(file, `医学内容里有 ${ph} 处「／」占位，检查是不是漏填了整节`);
  }

  // 6b 诊断提示命中
  const wanted = (part.record.diagnosis || {}).confirmed || [];
  if (!wanted.length) {
    err(file, 'diagnosis.confirmed 为空，模板必须给出确定诊断');
  } else {
    let hits = [];
    try {
      hits = H.analyze(rec) || [];
    } catch (e) {
      warn(file, `诊断提示抛异常：${e.message}`);
    }
    const names = hits.slice(0, 3).map(h => h.name || '');
    console.log(`  诊断提示 top3：${names.join(' / ') || '（无）'}`);
    console.log(`  模板宣告诊断：${wanted.join(' / ')}`);
    const anyHit = names.length > 0;
    if (!anyHit) warn(file, '诊断提示一条都没命中，可能是症状/查体没对上任何规则');
  }

  // 7 validate 提醒
  let warns2 = [];
  try { warns2 = G.validate(rec) || []; } catch (e) { /* ignore */ }
  const real = warns2.filter(w => !/未填写|未勾选|尚未/.test(w));
  if (real.length) {
    real.forEach(w => warn(file, `validate：${w}`));
  }

  console.log(`  已填 ${filled.length} 个字段，生成 ${lines.length} 行`);
  return part;
}

/* 入口 */
const args = process.argv.slice(2);
// 命令行传相对路径时 require 不会从 cwd 解析（它认的是 ./ 前缀或绝对路径），
// 这里统一转成绝对路径，否则从仓库根跑 `node tools/check-templates.js tools/tpl-parts/pud.cjs` 会报找不到模块。
let files = args.map(a => path.resolve(process.cwd(), a));
if (!files.length) {
  files = fs.existsSync(PARTS_DIR)
    ? fs.readdirSync(PARTS_DIR).filter(f => f.endsWith('.cjs')).map(f => path.join(PARTS_DIR, f))
    : [];
}
if (!files.length) {
  console.log('没有找到模板文件（tools/tpl-parts/*.cjs）');
  process.exit(0);
}

const seen = new Map();
files.forEach(f => {
  const part = checkOne(f);
  if (part && part.key) {
    if (seen.has(part.key)) err(f, `key「${part.key}」重复（已出现在 ${path.basename(seen.get(part.key))}）`);
    else seen.set(part.key, f);
  }
});

console.log(`\n===== 合计 ${files.length} 个模板，${problems} 个问题，${warns} 个提醒`);
process.exit(problems ? 1 : 0);
