/* 检查 hints.js 里引用的 ros:系统.症状 键是否都还存在于 SCHEMA.ROS。
 *
 * 为什么需要这个：hints 的 must/match 键是纯字符串，
 * 拼错了或者 schema 改键名了，JS 不会报错，规则只是永远不命中——
 * 诊断提示会静默变少，而测试如果只测"能跑"就发现不了。
 *
 * 用法：node tools/check-ros-keys.js
 * 退出码：0 全部存在；1 有失效键
 */
const path = require('node:path');
require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs')).bootGlobals();
const { SCHEMA, HINTS } = globalThis;

// 建立当前 schema 的合法键集合
const valid = new Set();
SCHEMA.ROS.forEach(sys => {
  sys.symptoms.forEach(sym => valid.add(`ros:${sys.key}.${sym.key}`));
});

// 收集 rules 里出现的所有 ros: 键
const used = new Map(); // key -> [rule ids]
function scan(obj, ruleId) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(v => {
      if (typeof v === 'string' && v.startsWith('ros:')) {
        if (!used.has(v)) used.set(v, []);
        if (ruleId && !used.get(v).includes(ruleId)) used.get(v).push(ruleId);
      } else if (v && typeof v === 'object') {
        scan(v, ruleId);
      }
    });
    return;
  }
  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => {
      const id = (v && v.id) || ruleId;
      if (typeof v === 'string' && v.startsWith('ros:')) {
        if (!used.has(v)) used.set(v, []);
        if (id && !used.get(v).includes(id)) used.get(v).push(id);
      } else {
        scan(v, id);
      }
    });
  }
}

const rules = (HINTS && (HINTS.RULES || HINTS)) || [];
rules.forEach(r => {
  const id = r.id || r.name || '(无 id)';
  ['must', 'need', 'match', 'any', 'all'].forEach(f => scan(r[f], id));
  if (r.match && Array.isArray(r.match)) scan(r.match, id);
});

let bad = 0;
console.log(`schema 现有 ros 键：${valid.size} 个`);
console.log(`hints 引用 ros 键：${used.size} 个`);
console.log('');

[...used.keys()].sort().forEach(k => {
  if (!valid.has(k)) {
    bad++;
    console.log(`✗ 失效：${k}  （被规则：${used.get(k).join(', ')}）`);
  }
});

if (bad) {
  console.log('');
  console.log(`共 ${bad} 个失效键。这些规则将永远无法命中。`);
  process.exit(1);
} else {
  console.log('✓ 所有 ros 键都存在');
}

// 附带：列出没被任何规则引用的症状（不是错误，只是提示改进空间）
const unused = [...valid].filter(k => !used.has(k));
if (unused.length) {
  console.log('');
  console.log(`未被任何规则引用的症状：${unused.length} 个（正常，仅作参考）`);
}
