/* ===========================================================================
 * UI 层：分步骤表单、本地保存、预览导出
 * 依赖 SCHEMA / GENERATOR / HINTS / RECORD_CORE（构建时内联到同一文件）
 *
 * 存储与数据校验一律走 RECORD_CORE（可在 node:test 中单测），
 * 这里只负责 DOM 与用户交互。
 * =========================================================================== */

const APP = (() => {
  'use strict';

  const CORE = RECORD_CORE;
  const K = CORE.STORAGE_KEYS;

  /** 当前正在编辑的病历 */
  let R = null;
  /** 已保存病历列表 */
  let LIST = [];
  /** 当前步骤索引 */
  let step = 0;
  let settings = { ...CORE.SETTINGS_DEFAULTS };
  /** 存储异常提示（损坏 / 写满），显示在界面顶部 */
  let storageAlert = '';

  /** 当前所有合法科室键，供 core 校验 */
  const deptKeys = () => SCHEMA.DEPARTMENTS.map(d => d.key);

  const STEPS = [
    { key: 'basic', name: '基本情况', icon: '①' },
    { key: 'hpi', name: '现病史', icon: '②' },
    { key: 'ros', name: '系统回顾', icon: '③' },
    { key: 'pmh', name: '既往史', icon: '④' },
    { key: 'personal', name: '个人史', icon: '⑤' },
    { key: 'marriage', name: '婚育史', icon: '⑥' },
    { key: 'family', name: '家族史', icon: '⑦' },
    { key: 'pe', name: '体格检查', icon: '⑧' },
    { key: 'aux', name: '辅助检查', icon: '⑨' },
    { key: 'summary', name: '摘要与诊断', icon: '⑩' },
    { key: 'output', name: '生成病历', icon: '✓' }
  ];

  /* ========================= 存储（委托给 core） ========================= */

  function loadList() {
    const res = CORE.loadList(localStorage);
    LIST = res.list;
    if (!res.ok && res.corrupt) {
      // 关键：损坏时不覆盖原存档，提示用户先导出/备份
      storageAlert = '本地病历列表读取失败，已保留原始数据未做修改。请勿在此状态下继续保存，建议联系技术支持或导出手工备份。';
    }
    return res;
  }

  function saveList() {
    const ok = CORE.safeSet(localStorage, K.list, JSON.stringify(LIST));
    if (!ok) {
      // 保存失败必须让用户看见，不能假装已保存
      storageAlert = '保存失败：浏览器存储空间可能已满。请先导出病历，再删除不需要的记录。';
      return false;
    }
    return true;
  }

  function saveCurrent() {
    if (!R) return false;
    const ok = CORE.safeSet(localStorage, K.current, JSON.stringify(R));
    if (!ok) storageAlert = '当前病历自动保存失败，存储空间可能已满。';
    return ok;
  }

  function loadCurrent() {
    const res = CORE.loadCurrent(localStorage, SCHEMA.emptyRecord, deptKeys());
    if (res.ok && res.record) { R = res.record; return true; }
    if (!res.ok) {
      storageAlert = '正在编辑的病历无法读取（' + (res.reason || '存档损坏') + '），已为你新建空白病历，原数据保留未动。';
    }
    return false;
  }

  function loadSettings() {
    const raw = CORE.safeGetJSON(localStorage, K.settings);
    settings = CORE.normalizeSettings(raw);
    applyFontScale();
  }

  function saveSettings() {
    CORE.safeSet(localStorage, K.settings, JSON.stringify(settings));
    applyFontScale();
  }

  function applyFontScale() {
    document.documentElement.style.setProperty('--fs-scale', String(settings.fontScale || 1));
  }

  /** 把 defaults 中缺失的键补进 obj（保留 obj 已有值）—— 由 core 提供 */
  const deepMerge = CORE.deepMerge;

  /* ========================= 工具 ========================= */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const uid = CORE.uid;

  /** 给对象设置嵌套路径的值，如 setPath(R,'pe.vitals.temperature','37') */
  function setPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] === undefined || cur[parts[i]] === null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);
  }

  /* ========================= 通用控件 ========================= */

  /** 文本输入 */
  function input(label, path, opts = {}) {
    const val = getPath(R, path) || '';
    const type = opts.type || 'text';
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    const hint = opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : '';
    return `<label class="field">
      <span class="field-label">${esc(label)}</span>
      <input type="${type}" data-path="${path}" value="${esc(val)}"${ph}
        ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''}>
      ${hint}
    </label>`;
  }

  /** 多行文本 */
  function textarea(label, path, opts = {}) {
    const val = getPath(R, path) || '';
    const rows = opts.rows || 3;
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    const hint = opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : '';
    return `<label class="field">
      <span class="field-label">${esc(label)}</span>
      <textarea rows="${rows}" data-path="${path}"${ph}>${esc(val)}</textarea>
      ${hint}
    </label>`;
  }

  /** 单选 segmented */
  function seg(label, path, options, opts = {}) {
    const cur = getPath(R, path);
    const btns = options.map(o => {
      const v = typeof o === 'string' ? o : o.value;
      const t = typeof o === 'string' ? o : o.text;
      const on = String(cur) === String(v) ? ' on' : '';
      return `<button type="button" class="seg-btn${on}" data-seg="${path}" data-val="${esc(v)}">${esc(t)}</button>`;
    }).join('');
    return `<div class="field">
      <span class="field-label">${esc(label)}</span>
      <div class="seg">${btns}</div>
      ${opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : ''}
    </div>`;
  }

  /** 单选下拉，支持 optgroup 分组 */
  function select(label, path, options, opts = {}) {
    const cur = getPath(R, path) || '';
    const isGrouped = options.length && options[0] && options[0].items;

    let optsHtml;
    if (isGrouped) {
      optsHtml = options.map(g => `<optgroup label="${esc(g.label)}">` +
        g.items.map(o => `<option value="${esc(o.value)}"${String(cur) === String(o.value) ? ' selected' : ''}>${esc(o.text)}</option>`).join('') +
        '</optgroup>').join('');
    } else {
      optsHtml = options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const t = typeof o === 'string' ? o : o.text;
        return `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(t)}</option>`;
      }).join('');
    }

    return `<label class="field">
      <span class="field-label">${esc(label)}</span>
      <select data-path="${path}">
        ${opts.empty ? `<option value="">${esc(opts.empty)}</option>` : ''}
        ${optsHtml}
      </select>
      ${opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : ''}
    </label>`;
  }

  /** 科室分组选项 */
  function deptGroups() {
    const groups = [];
    SCHEMA.DEPARTMENTS.forEach(d => {
      let g = groups.find(x => x.label === d.group);
      if (!g) { g = { label: d.group, items: [] }; groups.push(g); }
      g.items.push({ value: d.key, text: d.name });
    });
    return groups;
  }

  /** 复选框组（多选），path 指向对象，如 pmh.diseaseChecks */
  function checks(label, path, options, opts = {}) {
    const obj = getPath(R, path) || {};
    const btns = options.map(o => {
      const v = typeof o === 'string' ? o : o.value;
      const t = typeof o === 'string' ? o : o.text;
      const on = obj[v] ? ' on' : '';
      return `<button type="button" class="chip${on}" data-check="${path}" data-val="${esc(v)}">${esc(t)}</button>`;
    }).join('');
    return `<div class="field">
      <span class="field-label">${esc(label)}</span>
      <div class="chips">${btns}</div>
    </div>`;
  }

  /* ========================= 各步骤渲染 ========================= */

  function renderBasic() {
    const b = R.basic;
    return `
      <div class="card">
        <div class="card-title">科室</div>
        ${select('本次见习科室', 'basic.department', deptGroups(), {
          hint: '选择科室后，体格检查会自动追加该科室的专科查体项目。'
        })}
      </div>

      <div class="card">
        <div class="card-title">一般项目</div>
        ${input('姓名', 'basic.name', { placeholder: '如：张三' })}
        ${seg('性别', 'basic.gender', SCHEMA.GENDERS)}
        ${input('年龄（岁）', 'basic.age', { type: 'number', inputmode: 'numeric', placeholder: '58' })}
        ${seg('婚姻', 'basic.marital', SCHEMA.MARITAL)}
        ${input('职业', 'basic.occupation', { placeholder: '退休 / 农民 / 工人…' })}
        ${input('籍贯', 'basic.birthPlace', { placeholder: '浙江温州' })}
        ${input('入院日期', 'basic.admitDate', { type: 'date' })}
        ${input('记录日期', 'basic.recordDate', { type: 'date' })}
        ${input('病史陈述者', 'basic.informant', { placeholder: '留空则默认患者本人' })}
        ${select('病史可靠程度', 'basic.reliability', SCHEMA.RELIABILITY)}
      </div>

      <div class="card">
        <div class="card-title">主诉 <span class="tag-req">必填</span></div>
        ${textarea('主诉症状', 'basic.chiefComplaint', {
          rows: 2,
          placeholder: '如：发热、咳嗽、咳痰',
          hint: '只写症状和体征，不写诊断；一般不超过20字。'
        })}
        <div class="row2">
          ${input('持续时间', 'basic.chiefComplaintDuration', { placeholder: '3' })}
          ${select('单位', 'basic.chiefComplaintDurationUnit', SCHEMA.DURATION_UNITS)}
        </div>
        <div class="live-preview" id="ccPreview"></div>
      </div>
    `;
  }

  function renderHpi() {
    const h = R.hpi;
    return `
      <div class="card">
        <div class="card-title">现病史
          <button class="btn-mini" data-act="draftHpi">一键生成初稿</button>
        </div>
        <div class="hint">按提示分句填写，生成的现病史会自动加句号并补主语"患者"。</div>

        ${textarea('起病情况（何时、何种方式起病、有无诱因）', 'hpi.onset', {
          rows: 3,
          placeholder: '如：3天前受凉后出现发热，体温最高39.2℃，伴畏寒'
        })}
        ${textarea('主要症状特点（部位、性质、程度、持续时间、加重缓解因素）', 'hpi.symptoms', {
          rows: 3,
          placeholder: '如：咳嗽呈阵发性连声咳，咳黄色黏痰，量中等，不易咳出'
        })}
        ${textarea('病情进展（症状如何变化）', 'hpi.evolution', {
          rows: 2,
          placeholder: '如：症状逐渐加重，夜间咳嗽明显，影响睡眠'
        })}
        ${textarea('伴随症状（有则写，无则写"无…"）', 'hpi.accompanying', {
          rows: 2,
          placeholder: '如：伴右侧胸痛，咳嗽及深呼吸时加重；无咯血、盗汗'
        })}
        ${textarea('诊治经过（在何处就诊、检查、用药及效果）', 'hpi.treatment', {
          rows: 3,
          placeholder: '如：自服布洛芬后体温可暂时下降，未到医院就诊'
        })}
        ${textarea('一般情况（精神、食欲、睡眠、大小便、体重）', 'hpi.generalCondition', {
          rows: 2,
          placeholder: '留空则默认：发病以来，精神、食欲、睡眠可，大小便正常，体重无明显变化'
        })}
        ${textarea('其他补充', 'hpi.extra', { rows: 2 })}
      </div>
    `;
  }

  function renderRos() {
    const totalPos = SCHEMA.ROS.reduce((n, sys) => {
      const store = R.ros[sys.key] || {};
      return n + sys.symptoms.filter(s => (store[s.key] || {}).checked).length;
    }, 0);

    let html = `
      <div class="card sticky-note">
        <div class="ros-head">
          <div>
            <strong>系统回顾</strong>
            <div class="hint">默认全部为阴性；有症状的点一下变红，即记为阳性。</div>
          </div>
          <div class="ros-count">已选阳性 <b>${totalPos}</b> 项</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-ghost" data-act="rosAllNegative">全部标记为阴性</button>
          <button class="btn btn-ghost" data-act="rosExpandAll">展开/收起全部</button>
        </div>
        <div class="ros-jump">
          ${SCHEMA.ROS.map((sys, i) => {
            const store = R.ros[sys.key] || {};
            const n = sys.symptoms.filter(s => (store[s.key] || {}).checked).length;
            return `<button class="jump-btn${n ? ' has-pos' : ''}" data-jump="${sys.key}">
              ${esc(sys.name.replace('及其器官', ''))}${n ? `<b>${n}</b>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
    `;

    SCHEMA.ROS.forEach(sys => {
      const store = R.ros[sys.key] || {};
      const posCount = sys.symptoms.filter(s => (store[s.key] || {}).checked).length;
      const chips = sys.symptoms.map(sym => {
        const v = store[sym.key] || {};
        const on = v.checked ? ' on' : '';
        return `<button type="button" class="chip chip-sym${on}" data-ros="${sys.key}" data-sym="${sym.key}">
          ${esc(sym.label)}${v.checked ? ' ✓' : ''}
        </button>`;
      }).join('');
      // 默认展开含阳性项的系统，其余收起（避免一屏全是标题）
      html += `<details class="card ros-group" id="ros-group-${sys.key}" ${posCount ? 'open' : ''}>
        <summary>
          <span>${esc(sys.name)}</span>
          ${posCount ? `<span class="badge-pos">${posCount}</span>` : ''}
        </summary>
        <div class="chips">${chips}</div>
        <div class="ros-detail" data-ros-detail="${sys.key}"></div>
      </details>`;
    });
    return html;
  }

  /** 系统回顾中某系统的阳性详情输入区 */
  function renderRosDetail(sysKey) {
    const sys = SCHEMA.ROS.find(s => s.key === sysKey);
    if (!sys) return '';
    const store = R.ros[sysKey] || {};
    const positives = sys.symptoms.filter(s => (store[s.key] || {}).checked);
    if (!positives.length) return '';
    return positives.map(sym => {
      const v = store[sym.key] || {};
      return `<div class="ros-item">
        <div class="ros-item-name">${esc(sym.label)}</div>
        <div class="row2">
          <input type="text" data-path="ros.${sysKey}.${sym.key}.time" value="${esc(v.time || '')}"
            placeholder="时间，如：3天前 / 2年">
          <input type="text" data-path="ros.${sysKey}.${sym.key}.detail" value="${esc(v.detail || '')}"
            placeholder="${esc(sym.detail || '补充描述')}">
        </div>
      </div>`;
    }).join('');
  }

  function renderPmh() {
    const p = R.pmh;
    return `
      <div class="card">
        <div class="card-title">平素健康状况</div>
        ${seg('健康状况', 'pmh.health', ['良好', '一般', '较差'])}
      </div>

      <div class="card">
        <div class="card-title">既往慢性病</div>
        ${checks('勾选既往疾病（可多选）', 'pmh.diseaseChecks', SCHEMA.COMMON_PMH)}
        ${input('其他疾病', 'pmh.diseaseOther', { placeholder: '补充未列出的疾病' })}
        ${textarea('疾病详情（病程、治疗、控制情况）', 'pmh.diseaseDetail', {
          rows: 3,
          placeholder: '如：高血压病史5年，长期口服氨氯地平5mg qd，血压控制在130/80mmHg左右',
          hint: '填写此项后会直接采用这里的文字，替代上面的勾选描述。'
        })}
      </div>

      <div class="card">
        <div class="card-title">传染病史</div>
        ${textarea('传染病史', 'pmh.infection', {
          rows: 2, placeholder: '如：否认肝炎、结核等传染病史'
        })}
        ${textarea('手术史', 'pmh.surgery', { rows: 2, placeholder: '如：2015年阑尾切除术' })}
        ${textarea('外伤史', 'pmh.trauma', { rows: 2, placeholder: '如：否认外伤史' })}
        ${textarea('输血史', 'pmh.transfusion', { rows: 2, placeholder: '如：否认输血史' })}
        ${textarea('预防接种史', 'pmh.vaccine', { rows: 2, placeholder: '如：预防接种史不详' })}
      </div>

      <div class="card">
        <div class="card-title">过敏史</div>
        ${seg('有无过敏史', 'pmh.allergy', ['无', '有'])}
        ${p.allergy === '有' ? `
          ${checks('过敏原', 'pmh.allergenChecks', SCHEMA.ALLERGENS)}
          ${input('其他过敏原', 'pmh.allergenOther')}
          ${checks('过敏反应表现', 'pmh.allergenReactionChecks', SCHEMA.ALLERGY_REACTIONS)}
          ${input('反应描述', 'pmh.allergyReaction', { placeholder: '如：全身皮疹伴瘙痒' })}
        ` : ''}
      </div>

      <div class="card">
        <div class="card-title">其他</div>
        ${textarea('其他需补充的既往史', 'pmh.special', {
          rows: 2, placeholder: '如：否认疫区接触史'
        })}
      </div>
    `;
  }

  function renderPersonal() {
    return `
      <div class="card">
        <div class="card-title">出生与居住</div>
        ${textarea('出生地及居留情况', 'personal.birth', {
          rows: 2, placeholder: '如：出生于浙江温州，无疫区长期居留史'
        })}
        ${input('长期居住地', 'personal.residence', { placeholder: '温州' })}
        ${input('近期旅行/居住史', 'personal.travel', { placeholder: '近1月无外地旅居史' })}
      </div>

      <div class="card">
        <div class="card-title">嗜好</div>
        ${seg('吸烟', 'personal.smoking', ['无', '有', '已戒'])}
        ${input('吸烟情况', 'personal.smokingAmount', {
          placeholder: '如：吸烟30年，每日约20支，未戒烟'
        })}
        ${seg('饮酒', 'personal.drinking', ['无', '有', '已戒'])}
        ${input('饮酒情况', 'personal.drinkingAmount', {
          placeholder: '如：饮白酒约2两/日，已戒酒5年'
        })}
      </div>

      <div class="card">
        <div class="card-title">接触史</div>
        ${textarea('毒物、粉尘、放射性物质接触史', 'personal.drugs', {
          rows: 2, placeholder: '如：否认毒物、粉尘及放射性物质接触史'
        })}
        ${textarea('疫区、疫水、动物接触史', 'personal.environment', { rows: 2 })}
        ${textarea('其他生活习惯', 'personal.habits', { rows: 2 })}
      </div>
    `;
  }

  function renderMarriage() {
    const b = R.basic;
    const isFemale = b.gender === '女';
    return `
      <div class="card">
        <div class="card-title">婚姻史</div>
        ${seg('婚姻状况', 'marriage.status', SCHEMA.MARITAL)}
        ${input('结婚年龄', 'marriage.age', { type: 'number', inputmode: 'numeric', placeholder: '25' })}
        ${input('配偶健康状况', 'marriage.spouseHealth', { placeholder: '如：配偶体健' })}
      </div>

      ${isFemale ? `
      <div class="card">
        <div class="card-title">月经史</div>
        ${seg('月经情况', 'menstruation.applicable', [
          { value: '', text: '未选' }, { value: '有', text: '有月经' }, { value: '无', text: '已绝经' }
        ])}
        ${textarea('月经史描述', 'menstruation.extra', {
          rows: 2,
          placeholder: '如：14岁初潮，周期28-30天，经期5天，经量中等，无痛经，末次月经2026-09-28',
          hint: '可直接写整句，或使用下面的结构化字段。'
        })}
        <details class="mini-details">
          <summary>结构化填写</summary>
          <div class="row2">
            ${input('初潮年龄', 'menstruation.age', { type: 'number', inputmode: 'numeric' })}
            ${input('周期（天）', 'menstruation.cycle', { type: 'number', inputmode: 'numeric' })}
          </div>
          <div class="row2">
            ${input('经期（天）', 'menstruation.duration', { type: 'number', inputmode: 'numeric' })}
            ${input('经量', 'menstruation.quantity', { placeholder: '中等' })}
          </div>
          <div class="row2">
            ${input('绝经年龄', 'menstruation.menopauseAge', { type: 'number', inputmode: 'numeric' })}
            ${input('末次月经', 'menstruation.lmp', { placeholder: '2026-09-28' })}
          </div>
          ${seg('痛经', 'menstruation.dysmenorrhea', ['无', '有'])}
        </details>
      </div>

      <div class="card">
        <div class="card-title">生育史</div>
        <div class="row2">
          ${input('孕次', 'childbirth.gravida', { type: 'number', inputmode: 'numeric' })}
          ${input('产次', 'childbirth.para', { type: 'number', inputmode: 'numeric' })}
        </div>
        <div class="row2">
          ${input('流产次数', 'childbirth.abortion', { type: 'number', inputmode: 'numeric' })}
          ${input('末次分娩', 'childbirth.lastBirth', { placeholder: '2020年顺产一子' })}
        </div>
        ${textarea('分娩及子女情况', 'childbirth.details', { rows: 2, placeholder: '如：顺产1子，体健' })}
        ${input('避孕方式', 'childbirth.contraception', { placeholder: '如：宫内节育器 / 无' })}
      </div>
      ` : `
      <div class="card">
        <div class="card-title">生育史（男性患者可选填）</div>
        <div class="row2">
          ${input('子女数', 'childbirth.gravida', { type: 'number', inputmode: 'numeric', placeholder: '留空则不显示' })}
          ${input('子女健康状况', 'childbirth.details', { placeholder: '如：子女体健' })}
        </div>
      </div>
      `}
    `;
  }

  function renderFamily() {
    return `
      <div class="card">
        <div class="card-title">家族史</div>
        ${checks('家族中患有的疾病（可多选）', 'family.diseaseChecks', SCHEMA.FAMILY_DISEASES)}
        ${textarea('父母、兄弟姐妹健康状况', 'family.deceased', {
          rows: 2, placeholder: '如：父母健在，兄弟1人均体健'
        })}
        ${textarea('其他补充（遗传病、传染病、死亡原因）', 'family.other', {
          rows: 2, placeholder: '如：否认家族性遗传病及传染病史'
        })}
      </div>
    `;
  }

  function renderPe() {
    const deptKey = R.basic.department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];

    let html = `
      <div class="card">
        <div class="card-title">生命体征</div>
        <div class="grid3">
          ${SCHEMA.VITALS.filter(v => !v.dept || v.dept === deptKey).map(v => `
            <label class="vital">
              <span class="vital-label">${esc(v.label)}</span>
              <input type="number" step="0.1" inputmode="decimal"
                data-path="pe.vitals.${v.key}" value="${esc(R.pe.vitals[v.key] || '')}"
                placeholder="${esc(v.placeholder || '')}">
              <span class="vital-unit">${esc(v.unit)}</span>
            </label>
          `).join('')}
        </div>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-ghost" data-act="fillVitalsNormal">填入正常值</button>
        </div>
        <div class="live-preview" id="bmiPreview"></div>
        <div class="ros-jump pe-jump">
          ${SCHEMA.PE_COMMON.map(g => `<button class="jump-btn" data-jump="pe-${g.key}">${esc(g.name)}</button>`).join('')}
          ${(dept.special || []).map(sp => `<button class="jump-btn has-pos" data-jump="pe-special_${sp}">${esc(SCHEMA.PE_SPECIAL[sp].name)}</button>`).join('')}
        </div>
      </div>
    `;

    // 通用查体
    SCHEMA.PE_COMMON.forEach(group => {
      const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
      if (!items.length) return;
      const itemHtml = items.map(it => {
        const cur = R.pe[group.key] && R.pe[group.key][it.key];
        const val = cur !== undefined && cur !== null && String(cur) !== '' ? String(cur) : '';
        const shown = val || it.default || '';
        const quick = (it.options || []).map(o =>
          `<button type="button" class="chip small${shown === o ? ' on' : ''}"
            data-pequick="${group.key}" data-pekey="${it.key}" data-val="${esc(o)}">${esc(o)}</button>`
        ).join('');
        return `<div class="pe-item">
          <div class="pe-label">${esc(it.label)}</div>
          <textarea rows="2" class="pe-text" data-path="pe.${group.key}.${it.key}"
            placeholder="${esc(it.default || '')}">${esc(shown)}</textarea>
          <details class="pe-opts">
            <summary>常用描述</summary>
            <div class="chips">${quick}</div>
          </details>
        </div>`;
      }).join('');
      html += `<details class="card pe-group" id="pe-${group.key}" ${R.pe[group.key] && Object.values(R.pe[group.key] || {}).some(v => v) ? 'open' : ''}>
        <summary>${esc(group.name)}</summary>
        <div class="pe-body">${itemHtml}</div>
      </details>`;
    });

    // 专科查体
    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      const storeKey = 'special_' + spKey;
      const itemHtml = sp.items.map(it => {
        const cur = (R.pe[storeKey] || {})[it.key];
        const val = cur !== undefined && cur !== null && String(cur) !== '' ? String(cur) : '';
        const shown = val || it.default || '';
        const quick = (it.options || []).map(o =>
          `<button type="button" class="chip small${shown === o ? ' on' : ''}"
            data-pequick="${storeKey}" data-pekey="${it.key}" data-val="${esc(o)}">${esc(o)}</button>`
        ).join('');
        return `<div class="pe-item">
          <div class="pe-label">${esc(it.label)}</div>
          <textarea rows="2" class="pe-text" data-path="pe.${storeKey}.${it.key}"
            placeholder="${esc(it.default || '')}">${esc(shown)}</textarea>
          <details class="pe-opts">
            <summary>常用描述</summary>
            <div class="chips">${quick}</div>
          </details>
        </div>`;
      }).join('');
      html += `<details class="card pe-group pe-special" id="pe-special_${spKey}">
        <summary>${esc(sp.name)}<span class="tag-dept">本科室</span></summary>
        <div class="pe-body">${itemHtml}</div>
      </details>`;
    });

    return html;
  }

  function renderAux() {
    const items = (R.auxiliary && R.auxiliary.items) || [{ name: '', result: '' }];
    const rows = items.map((it, i) => `
      <div class="aux-row">
        <input type="text" data-aux="name" data-idx="${i}" value="${esc(it.name || '')}"
          placeholder="检查项目，如：血常规">
        <input type="text" data-aux="result" data-idx="${i}" value="${esc(it.result || '')}"
          placeholder="结果">
        <button type="button" class="btn-del" data-auxdel="${i}">×</button>
      </div>
    `).join('');
    return `
      <div class="card">
        <div class="card-title">辅助检查</div>
        <div class="hint">填写本次就诊已有的检查结果；没有可留空，生成时显示"暂缺"。</div>
        <div id="auxList">${rows}</div>
        <button class="btn btn-ghost" data-act="addAux">+ 添加一项</button>
      </div>
    `;
  }

  function renderSummary() {
    const diagList = ((R.diagnosis || {}).confirmed) || [];
    const hints = HINTS.analyze(R);
    const warnings = GENERATOR.validate(R);

    const diagHtml = diagList.map((d, i) => `
      <div class="diag-row">
        <span class="diag-no">${i + 1}.</span>
        <input type="text" data-diag="${i}" value="${esc(d)}">
        <button type="button" class="btn-del" data-diagdel="${i}">×</button>
      </div>
    `).join('');

    const hintHtml = hints.length ? hints.map(h => `
      <div class="hint-card">
        <div class="hint-name">${esc(h.name)}</div>
        <div class="hint-text">${esc(h.hint)}</div>
        <div class="hint-note">💡 ${esc(h.note)}</div>
        <div class="hint-matched">依据：${h.matched.map(m => esc(friendlyKey(m))).join('、')}</div>
        <button class="btn btn-mini" data-addhint="${esc(h.name)}">加入诊断</button>
      </div>
    `).join('') : '<div class="empty">暂无匹配的参考提示。已有足够的阳性发现时才会出现提示。</div>';

    const warnHtml = warnings.length
      ? warnings.map(w => `<div class="warn-item">${esc(w)}</div>`).join('')
      : '<div class="ok-item">✓ 主要项目已填写完整</div>';

    return `
      <div class="card">
        <div class="card-title">质控提醒</div>
        <div class="warn-list">${warnHtml}</div>
      </div>

      <div class="card">
        <div class="card-title">诊断参考提示</div>
        <div class="hint">根据已填写的阳性发现自动匹配，仅供参考，请自行判断后决定是否采用。</div>
        ${hintHtml}
      </div>

      <div class="card">
        <div class="card-title">初步诊断</div>
        <div id="diagList">${diagHtml || '<div class="empty">尚未添加诊断</div>'}</div>
        <div class="diag-add">
          <input type="text" id="diagNew" placeholder="输入诊断后点添加">
          <button class="btn" data-act="addDiag">添加</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">病历摘要
          <button class="btn-mini" data-act="draftSummary">自动生成初稿</button>
        </div>
        <div class="hint">留空则使用自动生成的摘要；点右上角可先生成初稿，再按自己的表述修改。</div>
        ${textarea('摘要', 'summary', {
          rows: 5,
          placeholder: '留空自动生成'
        })}
      </div>
    `;
  }

  function friendlyKey(k) {
    const map = {
      'cc:发热': '主诉/现病史提及发热',
      'cc:咳嗽': '主诉/现病史提及咳嗽',
      'cc:咳痰': '主诉/现病史提及咳痰',
      'cc:咯血': '主诉/现病史提及咯血',
      'cc:胸痛': '主诉/现病史提及胸痛',
      'cc:胸闷': '主诉/现病史提及胸闷',
      'cc:气促': '主诉/现病史提及气促',
      'cc:喘息': '主诉/现病史提及喘息',
      'cc:心悸': '主诉/现病史提及心悸',
      'cc:腹痛': '主诉/现病史提及腹痛',
      'cc:上腹痛': '主诉/现病史提及上腹痛',
      'cc:右上腹痛': '主诉/现病史提及右上腹痛',
      'cc:转移性右下腹痛': '主诉/现病史提及转移性右下腹痛',
      'cc:腹胀': '主诉/现病史提及腹胀',
      'cc:黑便': '主诉/现病史提及黑便',
      'cc:呕血': '主诉/现病史提及呕血',
      'cc:乏力': '主诉/现病史提及乏力',
      'cc:消瘦': '主诉/现病史提及消瘦',
      'vital:tempUp': '体温升高',
      'vital:tachy': '心率增快',
      'vital:tachypnea': '呼吸增快',
      'vital:bpUp': '血压升高',
      'vital:bpDown': '血压下降',
      'vital:bmiHigh': 'BMI 偏高',
      'smoke:有': '有吸烟史',
      'risk:smoke': '吸烟危险因素',
      'risk:alcohol': '饮酒史',
      'trauma:有': '有外伤史',
      'gender:女': '女性',
      'age:elderly': '年龄≥65岁',
      'age:fertile': '育龄期',
      'age:child': '儿童',
      'menstruation:delay': '月经推迟/停经'
    };
    if (map[k]) return map[k];
    if (k.startsWith('ros:')) {
      const [, sysKey, symKey] = k.split('.');
      const sys = SCHEMA.ROS.find(s => s.key === sysKey);
      const sym = sys && sys.symptoms.find(s => s.key === symKey);
      return sym ? `${sys.name}：${sym.label}` : k;
    }
    if (k.startsWith('pmh:')) return `既往史：${k.slice(4)}`;
    if (k.startsWith('aux:')) return `辅助检查：${k.slice(4)}`;
    if (k.startsWith('pev:')) {
      const body = k.slice(4);
      const eq = body.indexOf('=');
      return eq > 0 ? `查体：${body.slice(eq + 1)}` : `查体：${body}`;
    }
    if (k.startsWith('pe:')) return `查体异常：${k.slice(3)}`;
    return k;
  }

  function renderOutput() {
    const res = GENERATOR.generate(R, { rosMode: settings.rosMode });
    GENERATED = res;
    return `
      <div class="card">
        <div class="card-title">生成设置</div>
        ${seg('系统回顾详略', 'settings.rosMode', [
          { value: 'detail', text: '逐系统写出（推荐）' },
          { value: 'brief', text: '只写阳性' }
        ])}
        <div class="hint">科室：${esc((SCHEMA.DEPARTMENTS.find(d => d.key === R.basic.department) || {}).name || '通用')}</div>
      </div>

      <div class="card">
        <div class="card-title">大病历预览</div>
        <div class="btn-row">
          <button class="btn" data-act="copyText">复制全文</button>
          <button class="btn btn-ghost" data-act="downloadTxt">下载 .txt</button>
          <button class="btn btn-ghost" data-act="copySection">复制某段</button>
        </div>
        <pre id="outputText" class="output">${esc(res.text)}</pre>
      </div>

      <div class="card">
        <div class="card-title">质控提醒</div>
        <div class="warn-list">
          ${res.warnings.length ? res.warnings.map(w => `<div class="warn-item">${esc(w)}</div>`).join('') : '<div class="ok-item">✓ 主要项目已填写完整</div>'}
        </div>
      </div>
    `;
  }

  /* ========================= 渲染主循环 ========================= */

  let GENERATED = null;

  function render() {
    // 同步 segmented 设置
    if (settings.rosMode) R.__rosMode = settings.rosMode;

    const cur = STEPS[step];
    let body = '';
    switch (cur.key) {
      case 'basic': body = renderBasic(); break;
      case 'hpi': body = renderHpi(); break;
      case 'ros': body = renderRos(); break;
      case 'pmh': body = renderPmh(); break;
      case 'personal': body = renderPersonal(); break;
      case 'marriage': body = renderMarriage(); break;
      case 'family': body = renderFamily(); break;
      case 'pe': body = renderPe(); break;
      case 'aux': body = renderAux(); break;
      case 'summary': body = renderSummary(); break;
      case 'output': body = renderOutput(); break;
    }

    // 存储异常必须让用户看到，不能静默
    const banner = storageAlert
      ? `<div class="storage-alert" id="storageAlert">⚠️ ${esc(storageAlert)}
           <button type="button" class="alert-x" data-dismiss-alert>知道了</button></div>`
      : '';
    $('#content').innerHTML = banner + body;

    // 步骤条
    $('#stepTitle').textContent = cur.name;
    $('#stepNum').textContent = `${step + 1}/${STEPS.length}`;
    $('#progressBar').style.width = ((step + 1) / STEPS.length * 100) + '%';

    // 系统回顾详情区
    if (cur.key === 'ros') {
      SCHEMA.ROS.forEach(sys => {
        const box = document.querySelector(`[data-ros-detail="${sys.key}"]`);
        if (box) box.innerHTML = renderRosDetail(sys.key);
      });
    }

    // 实时预览
    updateLivePreviews();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateLivePreviews() {
    const cc = $('#ccPreview');
    if (cc) {
      const text = GENERATOR.buildChiefComplaint(R);
      cc.innerHTML = text ? `<b>生成的主诉：</b>${esc(text)}` : '<span class="muted">填写后这里会实时显示主诉</span>';
    }
    const bmi = $('#bmiPreview');
    if (bmi) {
      const h = parseFloat(R.pe.vitals.height);
      const w = parseFloat(R.pe.vitals.weight);
      if (h > 0 && w > 0) {
        const v = (w / Math.pow(h / 100, 2)).toFixed(1);
        let tag = '正常';
        if (v < 18.5) tag = '偏瘦';
        else if (v >= 24 && v < 28) tag = '超重';
        else if (v >= 28) tag = '肥胖';
        bmi.innerHTML = `<b>BMI：</b>${v}（${tag}）`;
      } else {
        bmi.innerHTML = '';
      }
    }
  }

  /* ========================= 事件处理 ========================= */

  function bindEvents() {
    // 输入事件（委托）
    document.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.path) {
        let v = t.value;
        if (t.type === 'number' || t.dataset.num === '1') {
          // 保留原始字符串，生成时再处理
        }
        setPath(R, t.dataset.path, v);
        saveCurrent();
        updateLivePreviews();
        // 过敏史/性别切换需要重绘
        if (t.dataset.path === 'pmh.allergy' || t.dataset.path === 'marital') { }
      }
      if (t.dataset.aux) {
        const idx = parseInt(t.dataset.idx, 10);
        R.auxiliary.items[idx] = R.auxiliary.items[idx] || { name: '', result: '' };
        R.auxiliary.items[idx][t.dataset.aux] = t.value;
        saveCurrent();
      }
      if (t.dataset.diag !== undefined) {
        R.diagnosis.confirmed[parseInt(t.dataset.diag, 10)] = t.value;
        saveCurrent();
      }
    });

    // 点击事件（委托）
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-seg],[data-check],[data-ros],[data-pequick],[data-act],[data-addhint],[data-auxdel],[data-diagdel],[data-jump],[data-dismiss-alert]');
      if (!t) return;
      const ds = t.dataset;

      // segmented 单选
      if (ds.seg !== undefined) {
        setPath(R, ds.seg, ds.val);
        saveCurrent();
        const needsRerender =
          ds.seg === 'basic.department' || ds.seg === 'pmh.allergy' ||
          ds.seg === 'basic.gender' || ds.seg === 'menstruation.applicable' ||
          ds.seg === 'settings.rosMode';
        if (ds.seg === 'settings.rosMode') {
          settings.rosMode = ds.val;
          saveSettings();
        }
        if (needsRerender) render();
        else {
          $$(`[data-seg="${ds.seg}"]`).forEach(b => b.classList.toggle('on', b.dataset.val === ds.val));
        }
        return;
      }

      // 多选 chip
      if (ds.check !== undefined) {
        const obj = getPath(R, ds.check) || {};
        obj[ds.val] = !obj[ds.val];
        setPath(R, ds.check, obj);
        saveCurrent();
        t.classList.toggle('on', !!obj[ds.val]);
        return;
      }

      // 系统回顾阳性切换
      if (ds.ros !== undefined) {
        const store = R.ros[ds.ros] || (R.ros[ds.ros] = {});
        const item = store[ds.sym] || (store[ds.sym] = { checked: false, time: '', detail: '' });
        item.checked = !item.checked;
        saveCurrent();
        // 更新按钮外观与详情区
        const label = SCHEMA.ROS.find(s => s.key === ds.ros).symptoms.find(s => s.key === ds.sym).label;
        t.classList.toggle('on', item.checked);
        t.innerHTML = esc(label) + (item.checked ? ' ✓' : '');
        const box = document.querySelector(`[data-ros-detail="${ds.ros}"]`);
        if (box) box.innerHTML = renderRosDetail(ds.ros);
        // 选中阳性时自动展开该系统
        const group = document.getElementById('ros-group-' + ds.ros);
        if (group) {
          group.open = true;
          const badge = group.querySelector('.badge-pos');
          const summary = group.querySelector('summary');
          const posN = SCHEMA.ROS.find(s => s.key === ds.ros).symptoms
            .filter(s => ((R.ros[ds.ros] || {})[s.key] || {}).checked).length;
          if (badge) badge.textContent = posN;
          else if (posN) {
            const span = document.createElement('span');
            span.className = 'badge-pos';
            span.textContent = posN;
            summary.appendChild(span);
          }
        }
        // 更新计数
        const totalPos = SCHEMA.ROS.reduce((n, sys) => {
          const s = R.ros[sys.key] || {};
          return n + sys.symptoms.filter(x => (s[x.key] || {}).checked).length;
        }, 0);
        const cnt = document.querySelector('.ros-count b');
        if (cnt) cnt.textContent = totalPos;
        return;
      }

      // 查体快捷描述
      if (ds.pequick !== undefined) {
        const group = R.pe[ds.pequick] || (R.pe[ds.pequick] = {});
        group[ds.pekey] = ds.val;
        saveCurrent();
        // 同步文本框
        const ta = document.querySelector(`textarea[data-path="pe.${ds.pequick}.${ds.pekey}"]`);
        if (ta) ta.value = ds.val;
        $$(`[data-pequick="${ds.pequick}"][data-pekey="${ds.pekey}"]`).forEach(b =>
          b.classList.toggle('on', b.dataset.val === ds.val)
        );
        return;
      }

      // 关闭存储告警
      if (ds.dismissAlert !== undefined) {
        storageAlert = '';
        const el = document.getElementById('storageAlert');
        if (el) el.remove();
        return;
      }

      // 跳转到某个系统 / 查体分组
      if (ds.jump !== undefined) {
        const target = document.getElementById(
          ds.jump.startsWith('pe-') ? ds.jump : 'ros-group-' + ds.jump
        );
        if (target) {
          target.open = true;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // 操作按钮
      const act = ds.act;
      if (act) handleAction(act, t);
      if (ds.addhint) {
        R.diagnosis.confirmed.push(ds.addhint);
        saveCurrent();
        render();
      }
      if (ds.auxdel !== undefined) {
        R.auxiliary.items.splice(parseInt(ds.auxdel, 10), 1);
        if (!R.auxiliary.items.length) R.auxiliary.items = [{ name: '', result: '' }];
        saveCurrent();
        render();
      }
      if (ds.diagdel !== undefined) {
        R.diagnosis.confirmed.splice(parseInt(ds.diagdel, 10), 1);
        saveCurrent();
        render();
      }
    });

    // 下拉框
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.path) {
        setPath(R, t.dataset.path, t.value);
        saveCurrent();
        if (t.dataset.path === 'basic.department') render();
      }
    });
  }

  function handleAction(act, el) {
    switch (act) {
      case 'draftHpi': {
        R.hpi = GENERATOR.draftHPI(R);
        saveCurrent();
        render();
        toast('已生成现病史初稿，请补充修改');
        break;
      }
      case 'draftSummary': {
        R.summary = '';  // 先清空，让它自动生成
        saveCurrent();
        const draft = GENERATOR.draftSummary(R);
        R.summary = draft;
        saveCurrent();
        render();
        toast('已生成摘要初稿，请核对');
        break;
      }
      case 'rosAllNegative': {
        if (!confirm('确定要把所有系统回顾项目都标记为阴性吗？将清除已选的阳性项。')) return;
        R.ros = {};
        saveCurrent();
        render();
        toast('已全部标记为阴性');
        break;
      }
      case 'rosExpandAll': {
        const groups = $$('.ros-group');
        const anyClosed = groups.some(g => !g.open);
        groups.forEach(g => { g.open = anyClosed; });
        break;
      }
      case 'fillVitalsNormal': {
        const normal = { temperature: '36.5', pulse: '78', respiration: '18', sbp: '120', dbp: '80' };
        Object.keys(normal).forEach(k => { if (!R.pe.vitals[k]) R.pe.vitals[k] = normal[k]; });
        saveCurrent();
        render();
        break;
      }
      case 'addAux': {
        R.auxiliary.items.push({ name: '', result: '' });
        saveCurrent();
        render();
        break;
      }
      case 'addDiag': {
        const inp = $('#diagNew');
        const v = (inp && inp.value || '').trim();
        if (!v) { toast('请先输入诊断内容'); return; }
        R.diagnosis.confirmed.push(v);
        saveCurrent();
        render();
        toast('已添加诊断');
        break;
      }
      case 'copyText': {
        const txt = (GENERATED && GENERATED.text) || GENERATOR.generate(R).text;
        copyToClipboard(txt);
        break;
      }
      case 'downloadTxt': {
        const txt = (GENERATED && GENERATED.text) || GENERATOR.generate(R).text;
        downloadText(txt);
        break;
      }
      case 'copySection': {
        showSectionPicker();
        break;
      }
    }
  }

  /* ========================= 复制 / 下载 ========================= */

  function toast(msg) {
    let box = $('#toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(box.__t);
    box.__t = setTimeout(() => box.classList.remove('show'), 1800);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 兼容 file:// 打开的情况
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast('已复制到剪贴板');
    } catch (err) {
      // 最后兜底：弹出手动复制框
      showManualCopy(text);
    }
  }

  function showManualCopy(text) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-title">请长按全选后复制</div>
        <textarea class="modal-ta" readonly>${esc(text)}</textarea>
        <div class="btn-row">
          <button class="btn" data-close>关闭</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', ev => {
      if (ev.target === wrap || ev.target.hasAttribute('data-close')) wrap.remove();
    });
    const ta = wrap.querySelector('textarea');
    ta.focus();
    ta.select();
  }

  function showSectionPicker() {
    const res = GENERATOR.generate(R);
    const names = GENERATOR.SECTION_ORDER.filter(n => res.sections[n]);
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-title">选择要复制的段落</div>
        <div class="sec-pick">
          ${names.map(n => `<button class="btn btn-ghost" data-sec="${esc(n)}">${esc(n)}</button>`).join('')}
        </div>
        <div class="btn-row"><button class="btn" data-close>关闭</button></div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', ev => {
      if (ev.target.hasAttribute('data-close') || ev.target === wrap) wrap.remove();
      const sec = ev.target.dataset.sec;
      if (sec) {
        copyToClipboard(`${sec}：${res.sections[sec]}`);
        wrap.remove();
      }
    });
  }

  function downloadText(text) {
    const name = (R.basic.name || '患者') + '_大病历_' + (R.basic.recordDate || SCHEMA.todayStr()) + '.txt';
    const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已开始下载');
  }

  /* ========================= 病历列表 ========================= */

  function openList() {
    loadList();
    const rows = CORE.sortByUpdated(LIST).map(item => {
      const s = CORE.summarize(item);
      const dept = (SCHEMA.DEPARTMENTS.find(d => d.key === s.department) || {}).name || '通用';
      return `
        <div class="list-row">
          <div class="list-main" data-open="${esc(s.id)}">
            <div class="list-name">${esc(s.name)}
              <span class="list-meta">${esc(s.gender)} ${esc(s.age)}${s.age ? '岁' : ''}</span>
            </div>
            <div class="list-sub">${esc(dept)} · ${esc((s.chiefComplaint || '无主诉').slice(0, 20))}</div>
            <div class="list-sub muted">更新于 ${esc(fmtTime(s.updatedAt))}</div>
          </div>
          <button class="btn-del" data-del="${esc(s.id)}">删除</button>
        </div>`;
    }).join('');

    const alertHtml = storageAlert
      ? `<div class="warn-item" style="margin-bottom:10px">${esc(storageAlert)}</div>` : '';

    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-title">我的病历（${LIST.length}）</div>
        ${alertHtml}
        <div class="list-box">${rows || '<div class="empty">还没有保存的病历</div>'}</div>
        <div class="btn-row">
          <button class="btn" data-new>新建病历</button>
          <button class="btn btn-ghost" data-backup>导出备份</button>
          <button class="btn btn-ghost" data-import-file>导入备份</button>
          <button class="btn btn-ghost" data-close>关闭</button>
        </div>
        <div class="hint">数据只存在本机浏览器。换手机或清理浏览器数据前，务必先「导出备份」并保存到手机外（如微信收藏、电脑）。</div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.addEventListener('click', ev => {
      if (ev.target === wrap || ev.target.hasAttribute('data-close')) { wrap.remove(); return; }
      if (ev.target.hasAttribute('data-backup')) { exportBackup(); return; }
      if (ev.target.hasAttribute('data-import-file')) { wrap.remove(); importBackup(); return; }
      if (ev.target.hasAttribute('data-new')) {
        if (!R.basic.name && !R.basic.chiefComplaint) {
          // 空白病历不必确认
          R = SCHEMA.emptyRecord();
          step = 0; saveCurrent(); wrap.remove(); render(); return;
        }
        if (!confirm('新建病历？当前病历会先保存。')) return;
        saveToLibrary();
        R = SCHEMA.emptyRecord();
        step = 0;
        saveCurrent();
        wrap.remove();
        render();
        return;
      }
      const delId = ev.target.dataset.del;
      if (delId) {
        if (!confirm('确定删除这份病历？删除后无法恢复，建议先导出备份。')) return;
        LIST = CORE.removeRecord(LIST, delId);
        saveList();
        wrap.remove();
        openList();
        return;
      }
      const openId = ev.target.closest('[data-open]') && ev.target.closest('[data-open]').dataset.open;
      if (openId) {
        const found = CORE.findRecord(LIST, openId);
        if (!found) return;
        if (!confirm('打开这份病历？当前病历会先保存。')) return;
        saveToLibrary();
        // 用 core 规范化，兼容旧版本存档
        try {
          R = CORE.normalizeRecord(JSON.parse(JSON.stringify(found.data)), SCHEMA.emptyRecord, deptKeys());
        } catch (e) {
          R = deepMerge(SCHEMA.emptyRecord(), JSON.parse(JSON.stringify(found.data || found)));
          storageAlert = '该病历结构较旧，已尽量补齐字段。';
        }
        R.id = found.id;
        step = 0;
        saveCurrent();
        wrap.remove();
        render();
      }
    });
  }

  function saveToLibrary() {
    if (!R) return false;
    loadList();
    const res = CORE.upsertRecord(LIST, R, new Date().toISOString());
    LIST = res.list;
    R.id = res.id;
    R.updatedAt = LIST.find(x => x.id === res.id).updatedAt;
    const okList = saveList();
    const okCur = saveCurrent();
    if (!okList) return false;
    if (okCur) storageAlert = '';
    return true;
  }

  /* ========================= 备份导出 / 导入 ========================= */

  function exportBackup() {
    const payload = CORE.buildExport(LIST, new Date().toISOString());
    if (!payload.records.length) {
      toast('还没有保存的病历可导出');
      return;
    }
    const name = `大病历备份_${SCHEMA.todayStr()}.json`;
    downloadBlob(JSON.stringify(payload, null, 2), name, 'application/json');
    toast(`已导出 ${payload.records.length} 份病历`);
  }

  function downloadBlob(text, filename, mime) {
    const blob = new Blob(['\ufeff' + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** 选择备份文件并预览，用户确认后才真正合并 */
  function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let parsed;
        try {
          parsed = CORE.parseImport(String(reader.result), SCHEMA.emptyRecord, deptKeys());
        } catch (e) {
          showModal('导入失败', `<div class="warn-item">${esc(e.message)}</div>
            <div class="hint">你的现有病历没有任何改动。</div>`);
          return;
        }
        previewImport(parsed);
      };
      reader.onerror = () => showModal('导入失败', '<div class="warn-item">无法读取该文件</div>');
      reader.readAsText(file, 'utf-8');
    });
    input.click();
  }

  /** 导入预览：显示条数与摘要，让用户选择合并或替换 */
  function previewImport(parsed) {
    const rows = parsed.records.map(r => {
      const s = CORE.summarize(r);
      const dept = (SCHEMA.DEPARTMENTS.find(d => d.key === s.department) || {}).name || '通用';
      return `<div class="list-row">
        <div class="list-main">
          <div class="list-name">${esc(s.name)} <span class="list-meta">${esc(s.gender)} ${esc(s.age)}${s.age ? '岁' : ''}</span></div>
          <div class="list-sub">${esc(dept)} · ${esc((s.chiefComplaint || '无主诉').slice(0, 18))}</div>
        </div>
      </div>`;
    }).join('');

    showModal('导入预览', `
      <div class="hint">共 ${parsed.records.length} 份病历。选择处理方式：</div>
      <div class="list-box">${rows}</div>
      <div class="hint">· <b>合并</b>：保留现有病历，同 ID 时以更新时间较新的为准<br>
      · <b>替换</b>：清空当前列表，只保留导入的内容</div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-import="merge">合并导入</button>
        <button class="btn btn-ghost" data-import="replace">替换全部</button>
        <button class="btn btn-ghost" data-close>取消</button>
      </div>
    `, wrap => {
      wrap.addEventListener('click', ev => {
        const mode = ev.target.dataset.import;
        if (!mode) return;
        loadList();
        if (mode === 'merge') {
          const res = CORE.mergeImport(LIST, parsed.records);
          LIST = res.list;
          saveList();
          wrap.remove();
          toast(`已导入：新增 ${res.added}，更新 ${res.updated}，跳过 ${res.skipped}`);
        } else {
          if (!confirm('替换会清空当前列表中的全部病历，确定继续？')) return;
          LIST = CORE.replaceImport(parsed.records);
          saveList();
          wrap.remove();
          toast(`已替换为导入的 ${LIST.length} 份病历`);
        }
        openList();
      });
    });
  }

  /** 通用弹窗 */
  function showModal(title, bodyHtml, setup) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `<div class="modal">
      <div class="modal-title">${esc(title)}</div>
      ${bodyHtml}
    </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', ev => {
      if (ev.target === wrap || ev.target.hasAttribute('data-close')) wrap.remove();
    });
    if (setup) setup(wrap);
    return wrap;
  }

  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ========================= 初始化 ========================= */

  function init() {
    loadSettings();
    if (!loadCurrent()) {
      R = SCHEMA.emptyRecord();
    }
    if (!R.basic.recordDate) R.basic.recordDate = SCHEMA.todayStr();
    if (!R.basic.admitDate) R.basic.admitDate = SCHEMA.todayStr();

    bindEvents();
    render();

    // 顶部按钮
    $('#btnPrev').addEventListener('click', () => {
      if (step > 0) { step--; render(); }
    });
    $('#btnNext').addEventListener('click', () => {
      if (step < STEPS.length - 1) { step++; render(); }
      else saveWithFeedback();
    });
    $('#btnSave').addEventListener('click', saveWithFeedback);
    $('#btnList').addEventListener('click', openList);
    $('#btnExport').addEventListener('click', () => {
      step = STEPS.length - 1;
      render();
    });

    // 自动保存
    setInterval(() => { saveCurrent(); }, 10000);

    // 防误关：尝试保存一次
    window.addEventListener('beforeunload', () => { saveCurrent(); });

    // 回到前台时若之前有存储异常，重新渲染让提示可见
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && storageAlert) render();
    });
  }

  /** 保存并给出真实反馈（失败时绝不能提示"已保存"） */
  function saveWithFeedback() {
    const ok = saveToLibrary();
    if (ok) toast('已保存到本机');
    else {
      toast('保存失败，请查看页面顶部提示');
      render();
    }
    return ok;
  }

  return {
    init, getRecord: () => R, STEPS,
    // 供测试使用
    _test: {
      saveToLibrary,
      loadList: () => loadList(),
      getList: () => LIST,
      render,
      setRecord: r => { R = r; },
      openList
    }
  };
})();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => APP.init());
}
