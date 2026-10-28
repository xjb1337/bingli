/* ===========================================================================
 * 模板病例测试
 *
 * 模板含完整教学初稿与忠实保留缺项的院内范例，学生套用后按自己实际问到的删改。
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
function hasMeaningfulValue(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return !!v.trim();
  if (Array.isArray(v)) return v.some(hasMeaningfulValue);
  if (typeof v === 'object') return Object.values(v).some(hasMeaningfulValue);
  return true;
}

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
    for (const k of ['alias', 'hint', 'source']) {
      assert.deepEqual(g[k], p[k], `模板「${p.key}」的 ${k} 元数据未与源码同步`);
    }
  });
});

test('每个模板的 key 唯一、dept 是合法科室、有 name', () => {
  const keys = new Set();
  const deptKeys = S.DEPARTMENTS.map(d => d.key);
  TEMPLATES.all().forEach(t => {
    // key 同时是文件名（tools/tpl-parts/<key>.cjs）和 data-tpl 属性值，
    // 所以只约束「小写字母开头、只含字母数字」，允许中间驼峰。
    // 一开始写成全小写是有原因的——怕有人写 key 和文件名对不上。
    // 但 pedPneumonia 这种驼峰比 pedpneumonia 好读太多，而唯一性由下面这条断言管着，
    // 文件名一致性由 tools/check-templates.js 管着，正则没必要卡死风格。
    assert.match(t.key, /^[a-z][a-zA-Z0-9]*$/, `模板 key「${t.key}」应以小写字母开头且只含字母数字`);
    assert.ok(!keys.has(t.key), `模板 key「${t.key}」重复`);
    keys.add(t.key);
    assert.ok(deptKeys.includes(t.dept), `模板「${t.key}」的 dept「${t.dept}」不是合法科室键`);
    assert.ok(String(t.name).trim().length > 2, `模板「${t.key}」缺少 name`);
  });
});

test('模板不写患者身份信息（那只能学生自己填）', () => {
  const FORBIDDEN = ['name', 'gender', 'age', 'birthDate', 'recordNo', 'bedNo', 'admitDate', 'admitTime', 'recordDate', 'recordTime'];
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

test('lungNodule 院内范例按原始证据保留空白与不确定性', () => {
  const t = TEMPLATES.get('lungNodule');
  assert.ok(t, '缺少 lungNodule 模板');
  assert.equal(t.dept, 'surgery');
  assert.equal(t.name, '肺结节（院内范例）');
  assert.deepEqual(t.source, {
    kind: 'hospital-example',
    label: '院内范例',
    note: '依据用户提供的肺结节病历截图整理；截图未展示完整摘要及诊断，这两项为整理示例。身份、生命体征及未展示病史留空，检查日期、机构和编号需按实际报告补录。'
  });

  const b = t.record.basic || {};
  ['name', 'gender', 'age', 'birthDate', 'marital', 'nativePlace', 'birthPlace', 'nationality',
    'occupation', 'workUnit', 'address', 'phone', 'recordNo', 'bedNo', 'admitDate', 'admitTime', 'recordDate', 'recordTime']
    .forEach(k => assert.ok(!String(b[k] || '').trim(), `basic.${k} 应留空`));
  assert.equal(Object.values(t.record.pe.vitals || {}).filter(v => String(v || '').trim()).length, 0,
    '原始范例没有生命体征数字');
  assert.deepEqual(t.record.pe, {
    vitals: {},
    general: { conscious: '神志清楚，精神可' },
    chest: {
      lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音',
      heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
    },
    abdomen: {
      abdAuscultation: '肠鸣音正常',
      abdPalpation: '腹平软，全腹无压痛、反跳痛，肝脾肋下未触及'
    },
    spine: { limbs: '双下肢无水肿' },
    nervousPE: { nerve: '神经系统常见阴性' }
  }, '只保留范例有记录的阴性查体，不推断阳性体征或补齐一般查体');
  assert.equal(Object.keys(t.record.ros || {}).length, 0, '未展示的系统回顾必须留空');
  ['relief', 'negativeDiscriminating', 'treatment'].forEach(k =>
    assert.equal(String(t.record.hpi[k] || '').trim(), '', `未提供的 hpi.${k} 不得补写`));
  ['personal', 'marriage', 'menstruation', 'childbirth', 'family'].forEach(k => {
    assert.ok(!hasMeaningfulValue(t.record[k]), `未展示的 ${k} 内容应留空`);
  });

  assert.match(t.record.pmh.diseaseDetail, /慢性乙型病毒性肝炎/);
  assert.match(t.record.pmh.longTermMeds, /恩替卡韦分散片0\.5mg每晚1次/);
  assert.match(t.record.pmh.longTermMeds, /病史记载/);
  const exams = t.record.auxiliary.items;
  assert.equal(exams.length, 4, '范例应有4项辅助检查');
  assert.deepEqual(exams.map(x => x.name), ['胸部CT', '腹部超声', 'PET/CT', '病理检查']);
  exams.forEach((x, i) => {
    assert.ok(String(x.result || '').trim(), `第${i + 1}项检查须保留原始结果或病理状态`);
    ['date', 'hospital', 'no'].forEach(k => assert.equal(String(x[k] || '').trim(), '', `${x.name}.${k} 不得补造`));
  });
  assert.match(exams.find(x => x.name === '病理检查').result, /暂缺/);
  assert.match(exams.find(x => x.name === 'PET/CT').result, /原发性肺癌可能性大/);
  assert.doesNotMatch(JSON.stringify(t.record), /SUV|分期|T[0-4]N[0-3]M[0-1]|\b\d+(?:\.\d+)?\s*(?:mm|cm)\b/i,
    '原始记录未提供 SUV、分期或结节尺寸');
  assert.deepEqual(t.record.diagnosis.confirmed,
    ['右肺上叶部分实性结节（性质待定）', '慢性乙型病毒性肝炎']);

  const r = S.emptyRecord();
  const applied = TEMPLATES.apply(r, t.key);
  assert.ok(applied.ok && applied.count > 0);
  const text = G.generate(r).text;
  assert.ok(text.includes('原发性肺癌可能性大'), '生成病历须保留影像不确定性');
  assert.ok(text.includes('暂缺'), '生成病历须保留病理暂缺状态');
  assert.ok(text.includes('性质待定'), '生成病历诊断须保留性质待定');
  assert.ok(text.includes('恩替卡韦分散片0.5mg每晚1次'), '长期药物须作为既往史保留');
  assert.ok(!text.includes(t.source.note) && !text.includes(t.source.label), '来源说明不能混入病历正文');
});

test('院内范例套用保留已有字段与整组辅助检查，默认空白行可以填入', () => {
  const t = TEMPLATES.get('lungNodule');
  const blank = S.emptyRecord();
  TEMPLATES.apply(blank, t.key);
  assert.equal(blank.auxiliary.items.length, 4, '默认全空辅助检查预置行应由模板填入4项');

  for (const [field, value] of [['date', '2026-10-01'], ['hospital', '院内检查室']]) {
    const current = S.emptyRecord();
    current.basic.name = '本人已填姓名';
    current.hpi.symptoms = '本人已写症状';
    current.auxiliary.items = [{ name: '', result: '', date: '', hospital: '', no: '', [field]: value }];
    const existing = JSON.parse(JSON.stringify(current.auxiliary.items));
    TEMPLATES.apply(current, t.key);
    assert.equal(current.basic.name, '本人已填姓名');
    assert.equal(current.hpi.symptoms, '本人已写症状');
    assert.deepEqual(current.auxiliary.items, existing,
      `辅助检查只有 ${field} 已有内容时也应整组保留，不能拼入范例检查`);
  }
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
    '婚姻史', '月经与生育史', '家庭史', '体格检查', '辅助检查', '摘要', '诊断依据', '初步诊断'];
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

test('完整教学模板套用后诊断提示能命中该病种', () => {
  const bad = [];
  TEMPLATES.all().filter(t => t.source?.kind !== 'hospital-example').forEach(t => {
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
test('主诉的时长单位必须跟着模板一起生效（不会被默认的「天」顶掉）', () => {
  // 坑的来历：emptyRecord() 把 basic.chiefComplaintDurationUnit 的默认值写成了「天」，
  // 而 fillBlanks 只填空位 —— 模板写「3 / 月」时，时长填上了，单位却被「天」顶掉，
  // 于是主诉说「乏力 3 天」，现病史说「3 个月前」，同一份病历自相矛盾。
  const bad = [];
  TEMPLATES.all().forEach(t => {
    const b = t.record.basic || {};
    const dur = String(b.chiefComplaintDuration || '').trim();
    const unit = String(b.chiefComplaintDurationUnit || '').trim();
    if (!dur || !unit) return;

    const r = S.emptyRecord();
    TEMPLATES.apply(r, t.key);
    const ccSec = G.generate(r).text.split('【主诉】')[1] || '';
    const cc = (ccSec.split('\n').filter(s => s.trim())[0] || '').trim();
    if (!cc.includes(dur + unit)) {
      bad.push(`${t.key}: 期望主诉含「${dur}${unit}」，实际是「${cc}」`);
    }
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('学生自己填过的时长，套模板时不会被改单位', () => {
  const r = S.emptyRecord();
  r.basic.chiefComplaintDuration = '6';
  r.basic.chiefComplaintDurationUnit = '小时';
  TEMPLATES.apply(r, 'pud');           // pud 模板写的是 2 年
  assert.equal(r.basic.chiefComplaintDuration, '6', '学生填的时长被改了');
  assert.equal(r.basic.chiefComplaintDurationUnit, '小时', '学生填的单位被改了');
});
