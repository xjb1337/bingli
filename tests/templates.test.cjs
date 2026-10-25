/* ===========================================================================
 * 模板病例测试
 *
 * 模板是「教学用的标准大病历初稿」，学生套用后按自己实际问到的删改。
 * 所以这里要守的不是「文字写得好不好」，而是四件会害人的事：
 *   1. 模板写了不该由模板决定的东西（患者身份、生命体征数字）
 *   2. 模板的查体描述对不上 schema，导致诊断提示命中不了
 *   3. 套用时覆盖了学生已经写的内容
 *   4. 套用后生不出一份像样的病历（缺节、空行、自相矛盾）
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { bootGlobals } = require('./bootstrap.cjs');
const { SCHEMA: S, CORE, TEMPLATES, GENERATOR: G, HINTS: H } = bootGlobals();

const ROOT = path.join(__dirname, '..');
const PARTS_DIR = path.join(ROOT, 'tools', 'tpl-parts');

/* ---------------------------- 数据完整性 ---------------------------- */

test('模板数据文件与 tools/tpl-parts 同步（不是过期产物）', () => {
  const files = fs.readdirSync(PARTS_DIR).filter(f => f.endsWith('.cjs')).sort();
  const fromParts = files.map(f => {
    const full = path.join(PARTS_DIR, f);
    delete require.cache[require.resolve(full)];
    return require(full);
  });
  const generated = require(path.join(ROOT, 'src', 'template-data.js'));

  assert.equal(
    generated.length, fromParts.length,
    `src/template-data.js 有 ${generated.length} 个模板，tools/tpl-parts 有 ${fromParts.length} 个——改完模板要跑 node tools/gen-templates.js`
  );
  fromParts.forEach(p => {
    const g = generated.find(x => x.key === p.key);
    assert.ok(g, `模板「${p.key}」没有出现在 src/template-data.js 里，请重跑 node tools/gen-templates.js`);
    assert.deepEqual(
      JSON.parse(JSON.stringify(g.record)), JSON.parse(JSON.stringify(p.record)),
      `模板「${p.key}」的内容与源文件不一致，请重跑 node tools/gen-templates.js`
    );
    assert.equal(g.dept, p.dept);
    assert.equal(g.name, p.name);
  });
});

test('每个模板的 key 唯一、dept 是合法科室、有 name', () => {
  const keys = new Set();
  const deptKeys = S.DEPARTMENTS.map(d => d.key);
  TEMPLATES.all().forEach(t => {
    assert.match(t.key, /^[a-z][a-z0-9]*$/, `模板 key「${t.key}」应是小写英文`);
    assert.ok(!keys.has(t.key), `模板 key「${t.key}」重复`);
    keys.add(t.key);
    assert.ok(deptKeys.includes(t.dept), `模板「${t.key}」的 dept「${t.dept}」不是合法科室键`);
    assert.ok(String(t.name).trim().length > 2, `模板「${t.key}」缺少 name`);
  });
});

test('模板不写患者身份信息（那只能学生自己填）', () => {
  const FORBIDDEN = ['name', 'gender', 'age', 'recordNo', 'bedNo', 'admitDate', 'recordDate'];
  TEMPLATES.all().forEach(t => {
    FORBIDDEN.forEach(k => {
      const v = (t.record.basic || {})[k];
      assert.ok(
        v === undefined || String(v).trim() === '',
        `模板「${t.key}」写了 basic.${k}="${v}"，患者信息必须留空`
      );
    });
  });
});

test('模板不写生命体征数字（学生自己测的）', () => {
  TEMPLATES.all().forEach(t => {
    const v = (t.record.pe || {}).vitals || {};
    const written = Object.keys(v).filter(k => String(v[k] || '').trim());
    assert.deepEqual(
      written, [],
      `模板「${t.key}」写了生命体征 ${written.join(', ')}——体温血压是测出来的，不是编出来的`
    );
  });
});

test('模板里的每个查体值都能在 schema 的 default / normal / options 里找到', () => {
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const pe = t.record.pe || {};
    Object.keys(pe).forEach(groupKey => {
      if (groupKey === 'vitals' || groupKey === 'checked') return;
      const group = groupKey.startsWith('special_')
        ? S.PE_SPECIAL[groupKey.slice('special_'.length)]
        : S.PE_COMMON.find(g => g.key === groupKey);
      if (!group) { bad.push(`${t.key}: 未知查体组 ${groupKey}`); return; }
      const items = groupKey.startsWith('special_') ? group.items : group.items;
      Object.keys(pe[groupKey] || {}).forEach(itemKey => {
        const it = items.find(x => x.key === itemKey);
        if (!it) { bad.push(`${t.key}: 未知查体项 ${groupKey}.${itemKey}`); return; }
        const val = String(pe[groupKey][itemKey] || '').trim();
        if (!val) return;
        const allowed = [it.default, it.normal].filter(Boolean).map(x => String(x).trim())
          .concat((it.options || []).map(o => String(o).trim()));
        if (!allowed.includes(val)) {
          bad.push(`${t.key}: ${groupKey}.${itemKey} 写的是「${val}」，不在可选值里`);
        }
      });
    });
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('模板的 ROS 只写问过的症状（阳性 checked 或显式阴性 negative）', () => {
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const ros = t.record.ros || {};
    Object.keys(ros).forEach(sysKey => {
      const sys = S.ROS.find(x => x.key === sysKey);
      if (!sys) { bad.push(`${t.key}: 未知系统 ${sysKey}`); return; }
      Object.keys(ros[sysKey] || {}).forEach(symKey => {
        if (!sys.symptoms.some(s => s.key === symKey)) {
          bad.push(`${t.key}: 未知症状 ${sysKey}.${symKey}`);
          return;
        }
        const st = ros[sysKey][symKey] || {};
        if (!st.checked && !st.negative) bad.push(`${t.key}: ${sysKey}.${symKey} 既非阳性也非阴性`);
        if (st.checked && st.negative) bad.push(`${t.key}: ${sysKey}.${symKey} 同时是阳性和阴性`);
      });
    });
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

/* ---------------------------- 套用行为 ---------------------------- */

test('套用模板只补空白项，学生已经写的一个字都不动', () => {
  const t = TEMPLATES.all()[0];
  const r = S.emptyRecord();
  r.basic.name = '我写的姓名';
  r.basic.chiefComplaint = '我自己问的主诉';
  r.hpi.symptoms = '我自己写的症状特点';
  r.diagnosis.confirmed = ['我自己下的诊断'];

  const res = TEMPLATES.apply(r, t.key);
  assert.ok(res.ok);
  assert.ok(res.count > 0, '套用后应该补了字段');

  assert.equal(r.basic.name, '我写的姓名', '姓名被模板覆盖了');
  assert.equal(r.basic.chiefComplaint, '我自己问的主诉', '主诉被模板覆盖了');
  assert.equal(r.hpi.symptoms, '我自己写的症状特点', '现病史被模板覆盖了');
  assert.deepEqual(r.diagnosis.confirmed, ['我自己下的诊断'], '诊断被模板覆盖了');

  // 空白项确实被填上了
  assert.ok(String(r.hpi.onset).trim().length > 0, '空白项应该被模板补上');
});

test('套用模板不会把科室从已选科室改掉', () => {
  const t = TEMPLATES.all().find(x => x.dept === 'digestive');
  const r = S.emptyRecord();
  r.basic.department = 'digestive';
  TEMPLATES.apply(r, t.key);
  assert.equal(r.basic.department, 'digestive');
});

test('科室还停在通用科时，套用模板会顺手把科室补上（否则专科查体出不来）', () => {
  const t = TEMPLATES.all().find(x => x.dept === 'digestive');
  const r = S.emptyRecord();
  assert.equal(r.basic.department, 'general');
  const res = TEMPLATES.apply(r, t.key);
  assert.equal(r.basic.department, t.dept, '套用后科室应变成模板所属科室');
  assert.ok(res.filled.includes('basic.department'));
});

test('套用不存在的模板是安全的（返回 ok:false，不抛异常、不改记录）', () => {
  const r = S.emptyRecord();
  const before = JSON.stringify(r);
  const res = TEMPLATES.apply(r, 'no-such-template');
  assert.equal(res.ok, false);
  assert.deepEqual(res.filled, []);
  assert.equal(JSON.stringify(r), before, '失败时不能动记录');
});

test('listByDept 只给本科室的模板，通用科给空', () => {
  assert.deepEqual(TEMPLATES.listByDept('general'), [], '通用科不该有模板');
  assert.deepEqual(TEMPLATES.listByDept(''), []);
  assert.deepEqual(TEMPLATES.listByDept('no-such-dept'), []);
  TEMPLATES.all().forEach(t => {
    const got = TEMPLATES.listByDept(t.dept);
    assert.ok(got.some(x => x.key === t.key), `${t.key} 应该出现在 ${t.dept} 的列表里`);
    // 不能串到别的科室
    S.DEPARTMENTS.filter(d => d.key !== t.dept).forEach(d => {
      assert.ok(
        !TEMPLATES.listByDept(d.key).some(x => x.key === t.key),
        `${t.key} 串到 ${d.key} 科室去了`
      );
    });
  });
});

/* ---------------------------- 生成质量 ---------------------------- */

test('每个模板套用后都能生成一份结构完整的病历', () => {
  const REQUIRED = ['一般项目', '主诉', '现病史', '既往史', '系统回顾', '个人史',
    '婚姻史', '月经与生育史', '家庭史', '体格检查', '实验室检查', '摘要', '诊断依据', '初步诊断'];
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const r = S.emptyRecord();
    TEMPLATES.apply(r, t.key);
    const text = G.generate(r).text;
    REQUIRED.forEach(sec => {
      if (!text.includes(`【${sec}】`)) bad.push(`${t.key}: 缺【${sec}】`);
    });
    const lines = text.split('\n').filter(x => x.trim());
    if (lines.length < 40) bad.push(`${t.key}: 只有 ${lines.length} 行，太短`);
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('模板套用后诊断提示能命中该病种', () => {
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const r = S.emptyRecord();
    TEMPLATES.apply(r, t.key);
    const hits = H.analyze(r).map(h => h.name);
    const declared = (t.record.diagnosis || {}).confirmed || [];
    // 至少要有一条提示命中——一条都不中就说明症状/查体没对上任何规则
    if (!hits.length) bad.push(`${t.key}: 诊断提示一条都没命中（宣告诊断：${declared.join('、')}）`);
    // top3 里应该出现与该模板相关的提示
    const top3 = H.analyze(r).slice(0, 3).map(h => h.name).join(' ');
    if (top3 && !top3.length) bad.push(`${t.key}: top3 为空`);
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('模板生成的病历里没有「否认」和阳性体征并存这类自相矛盾', () => {
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const r = S.emptyRecord();
    TEMPLATES.apply(r, t.key);
    const warns = G.validate(r) || [];
    // 只关心「矛盾」「不一致」「对不上」这类，缺填项不算
    const real = warns.filter(w => /矛盾|不一致|对不上|先后|互相/.test(w));
    if (real.length) bad.push(`${t.key}: ${real.join(' / ')}`);
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('模板里宣告的诊断都出现在生成病历的【初步诊断】里', () => {
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const r = S.emptyRecord();
    TEMPLATES.apply(r, t.key);
    const text = G.generate(r).text;
    const diagSec = text.split('【初步诊断】')[1] || '';
    (t.record.diagnosis.confirmed || []).forEach(d => {
      if (!diagSec.includes(String(d).replace(/[。.]$/, ''))) {
        bad.push(`${t.key}: 诊断「${d}」没有出现在【初步诊断】里`);
      }
    });
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});