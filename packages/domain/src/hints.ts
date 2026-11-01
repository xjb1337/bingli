/* ===========================================================================
 * 诊断参考提示（不自动写入病历，仅作为清单提醒，由使用者自行判断）
 *
 * 匹配键说明：
 *   cc:症状          主诉/现病史中出现该关键词
 *   ros:系统.症状    系统回顾中该症状勾选为阳性
 *   pmh:疾病         既往史中勾选该疾病
 *   pe:组.条目       该查体条目为「异常」（非默认值）
 *   pev:组.条目=值   该查体条目命中具体异常描述（推荐用法）
 *   vital:xxx        生命体征异常（tempUp/tachy/tachypnea/bpUp/bpDown/bmiHigh）
 *   aux:xxx          辅助检查名称含关键词
 *   smoke:有 / risk:xxx / gender:女 / age:elderly|fertile|child
 *
 * need：命中最少条数才提示（避免过度敏感）
 * =========================================================================== */

const HINTS = (() => {
  'use strict';

  const RULES = [
    /* ------------------------------ 呼吸 ------------------------------ */
    {
      id: 'cap', name: '社区获得性肺炎',
      depts: ['respiratory', 'general', 'emergency', 'pediatrics'],
      must: ['ros:resp.cough','ros:resp.sputum','pe:chest.lungAuscultation','aux:CT','aux:胸片'],
      need: 3,
      match: ['cc:发热', 'cc:咳嗽', 'ros:resp.cough', 'ros:resp.sputum', 'vital:tempUp',
        'pev:chest.lungAuscultation=双肺可闻及湿性啰音',
        'pev:chest.lungAuscultation=右下肺可闻及湿性啰音',
        'aux:CT', 'aux:胸片'],
      hint: '发热、咳嗽咳痰 + 肺部湿啰音/影像学浸润影，需考虑社区获得性肺炎。',
      note: '可补充：血常规+CRP、痰涂片及培养、胸部CT；用 CURB-65 评估病情严重度。'
    },
    {
      id: 'copd', name: '慢性阻塞性肺疾病（急性加重）',
      depts: ['respiratory', 'general', 'emergency'],
      must: ['smoke:有','ros:resp.dyspnea','ros:resp.wheeze','pe:chest.chestShape','pe:chest.lungPercussion'],
      need: 2,
      match: ['smoke:有', 'ros:resp.dyspnea', 'ros:resp.wheeze', 'cc:气促', 'cc:喘息',
        'pev:chest.chestShape=桶状胸', 'pev:chest.lungPercussion=双肺叩诊过清音',
        'pev:chest.lungAuscultation=呼吸音减弱'],
      hint: '长期吸烟、慢性咳嗽咳痰伴活动后气短，桶状胸/过清音/呼吸音减弱，需考虑 COPD。',
      note: '可补充：肺功能（吸入支气管扩张剂后 FEV1/FVC<70%）、血气分析、胸部CT。'
    },
    {
      id: 'asthma', name: '支气管哮喘',
      depts: ['respiratory', 'pediatrics', 'general'],
      must: ['ros:resp.wheeze','ros:resp.dyspnea','pe:chest.lungAuscultation'],
      need: 2,
      match: ['ros:resp.wheeze', 'ros:resp.dyspnea', 'cc:喘息', 'cc:胸闷',
        'pev:chest.lungAuscultation=双肺可闻及哮鸣音'],
      hint: '反复发作性喘息、胸闷，双肺可闻及哮鸣音，需考虑支气管哮喘。',
      note: '可补充：肺功能+支气管舒张/激发试验、呼出气NO、过敏原、嗜酸性粒细胞计数。'
    },
    {
      id: 'ptx', name: '气胸',
      depts: ['respiratory', 'emergency', 'surgery'],
      must: ['ros:resp.dyspnea','ros:resp.chestPainResp','pe:chest.lungAuscultation','pe:chest.lungPercussion'],
      need: 2,
      match: ['cc:胸痛', 'ros:resp.dyspnea', 'ros:resp.chestPainResp',
        'pev:chest.lungAuscultation=呼吸音减弱', 'pev:chest.lungPercussion=局部叩诊鼓音'],
      hint: '突发一侧胸痛伴呼吸困难、患侧呼吸音减弱，需警惕气胸。',
      note: '可补充：立位胸片（可见气胸线）、床旁超声、必要时胸腔穿刺减压。'
    },
    {
      id: 'tb', name: '肺结核',
      depts: ['respiratory', 'general'],
      must: ['ros:resp.nightSweat','ros:endocrine.weightLoss','ros:resp.hemoptysis','pmh:肺结核'],
      need: 2,
      match: ['ros:resp.nightSweat', 'ros:endocrine.weightLoss', 'ros:resp.fever',
        'ros:resp.hemoptysis', 'cc:咯血', 'pmh:肺结核'],
      hint: '低热盗汗、消瘦、咳嗽超过2周或咯血，需排除肺结核。',
      note: '可补充：胸片/胸部CT、痰抗酸杆菌涂片+培养、结核菌素试验/γ干扰素释放试验、痰GeneXpert。'
    },
    {
      id: 'bronchiectasis', name: '支气管扩张',
      depts: ['respiratory', 'general'],
      must: ['ros:resp.sputum','ros:resp.hemoptysis'],
      need: 2,
      match: ['ros:resp.sputum', 'ros:resp.hemoptysis', 'cc:咯血', 'cc:咳痰'],
      hint: '长期反复咳嗽、大量脓痰、反复咯血，需考虑支气管扩张。',
      note: '可补充：高分辨率胸部CT、痰培养、肺功能。'
    },

    /* ------------------------------ 心血管 ------------------------------ */
    {
      id: 'hf', name: '心力衰竭',
      depts: ['cardiology', 'general', 'emergency'],
      must: ['ros:cardio.orthopnea','ros:cardio.edemaCardio','pe:chest.heartPercussion','pe:neck.neckVessel','pe:spine.limbs'],
      need: 3,
      match: ['ros:cardio.orthopnea', 'ros:cardio.edemaCardio', 'ros:cardio.palpitation',
        'pev:chest.heartPercussion=心界向左下扩大', 'pev:chest.heartPercussion=心界向两侧扩大',
        'pev:chest.heartAuscultation=可闻及奔马律', 'pev:chest.heartAuscultation=心音低钝',
        'pev:chest.lungAuscultation=双肺可闻及湿性啰音',
        'pev:neck.neckVessel=颈静脉怒张', 'pe:spine.limbs'],
      hint: '端坐呼吸/夜间阵发性呼吸困难、下肢水肿、心界扩大、肺部湿啰音，需考虑心力衰竭。',
      note: '可补充：BNP/NT-proBNP、心脏超声（EF）、胸片、心功能分级（NYHA）。'
    },
    {
      id: 'acs', name: '急性冠脉综合征',
      depts: ['cardiology', 'emergency', 'general'],
      must: ['ros:cardio.chestPainCardio','pe:chest.heartAuscultation'],
      need: 2,
      match: ['ros:cardio.chestPainCardio', 'cc:胸痛', 'cc:胸闷', 'risk:smoke', 'pmh:高血压', 'pmh:糖尿病',
        'pev:chest.heartAuscultation=心音低钝'],
      hint: '压榨性胸痛持续不缓解、伴大汗或心悸，需警惕急性冠脉综合征。',
      note: '可补充：18导联心电图（动态复查）、心肌损伤标志物（hs-cTn）、D-二聚体、心电监护。'
    },
    {
      id: 'af', name: '心房颤动',
      depts: ['cardiology', 'neurology', 'emergency', 'general'],
      must: ['pe:chest.heartAuscultation'],
      need: 1,
      match: ['pev:chest.heartAuscultation=心律不齐，可闻及早搏', 'ros:cardio.palpitation', 'cc:心悸'],
      hint: '心悸伴心律绝对不齐、脉搏短绌，需考虑心房颤动。',
      note: '可补充：心电图、动态心电图、心脏超声、甲状腺功能、CHA2DS2-VASc 评分。'
    },
    {
      id: 'htn', name: '高血压病',
      depts: ['cardiology', 'general', 'neurology', 'nephrology', 'endocrinology'],
      /* must 里不能只放 vital:bpUp —— 模板（以及只填了病史、还没录生命体征的
       * 真实记录）pe.vitals 是空的，这样写会让「高血压病」永远 0 命中：
       * 明明写了「高血压病史 10 年」，提示却一条都不给。
       * 病史 + 靶器官损害的体征同样成立，故补 pmh:高血压。
       *
       * need 必须是 2，不能是 1：只有一条「高血压病史」时，
       *   ① 学生早就知道病人有高血压，再提示一遍没有信息量；
       *   ② score = 命中数/need = 1.0，会顶掉真正要做的主诊断
       *      （实测：急性肾损伤模板的 top1 变成了「高血压病」）。
       * 现在的口径是「病史 + 至少一条旁证」：血压升高、靶器官损害体征、
       * 或尿蛋白——也就是「高血压确实在造成损害」才提示。 */
      must: ['vital:bpUp','pmh:高血压'],
      need: 2,
      match: ['vital:bpUp', 'pmh:高血压',
        // 靶器官损害体征：左心室肥厚/扩大、蛋白尿
        'pev:chest.heartInspect=心尖搏动向左下移位',
        'pev:chest.heartPercussion=心界向左下扩大',
        'pev:special_cardiology.cardioBorder=心界向左下扩大',
        'aux:尿蛋白'],
      hint: '血压升高需考虑原发性高血压，注意排除继发性因素。',
      note: '可补充：不同日多次测量、24h动态血压、尿常规、肾功能、眼底检查、心脏超声、血脂血糖。'
    },
    {
      id: 'valve', name: '心脏瓣膜病',
      depts: ['cardiology', 'general'],
      must: ['pe:chest.heartAuscultation'],
      need: 1,
      /* 原来只有两条互斥的杂音（心尖区收缩期 / 主动脉瓣区舒张期），一个病人
       * 只可能有一种，score 封顶就是 1.0。而心房颤动的 need 是 1，只要写了
       * 「心悸」加一条听诊就 2.0——瓣膜病模板的 top1 因此永远是心房颤动。
       * 补三条瓣膜病自己的证据：周围血管征（水冲脉）、舒张期震颤、收缩期杂音。
       * 这三条在高血压、心衰、房颤的模板里都不出现，不会把别人的榜抢走。 */
      match: ['pev:chest.heartAuscultation=心尖区可闻及收缩期杂音',
        'pev:chest.heartAuscultation=主动脉瓣区可闻及舒张期杂音',
        'pev:special_cardiology.cardioPeripheralSign=水冲脉阳性',
        'pev:special_cardiology.cardioThrill=可触及舒张期震颤'],
      hint: '心脏杂音需考虑心脏瓣膜病，注意结合病史鉴别生理性杂音。',
      note: '可补充：心脏超声（首选）、心电图、胸片。'
    },
    {
      id: 'pericarditis', name: '心包炎',
      depts: ['cardiology', 'general'],
      must: ['pe:chest.heartAuscultation'],
      need: 1,
      match: ['pev:chest.heartAuscultation=可闻及心包摩擦音'],
      hint: '闻及心包摩擦音，需考虑心包炎（需与心包积液鉴别）。',
      note: '可补充：心电图、心脏超声、CRP、结核相关检查。'
    },

    /* ------------------------------ 消化 ------------------------------ */
    {
      id: 'pud', name: '消化性溃疡（无出血）',
      depts: ['digestive', 'general'],
      // 必要条件给「节律性上腹痛」与「幽门螺杆菌/胃镜证据」任一条即可：
      // 只有上腹痛没有检查的病例也该提示，那是学生最需要被提醒去做胃镜的时候。
      must: ['ros:gi.abdominalPain', 'cc:上腹痛', 'aux:胃镜', 'aux:幽门螺杆菌'],
      need: 3,
      match: ['ros:gi.abdominalPain', 'ros:gi.reflux',
        'pev:special_digestive.giTenderness=上腹部压痛',
        'pev:abdomen.abdPalpation=上腹部压痛，无反跳痛',
        'aux:胃镜', 'aux:幽门螺杆菌', 'aux:大便', 'risk:smoke'],
      hint: '慢性、周期性、节律性上腹痛，空腹痛或夜间痛、进食后缓解，伴反酸嗳气，需考虑消化性溃疡。',
      note: '可补充：胃镜（确诊金标准）、幽门螺杆菌检测（13C/14C 呼气试验或快速尿素酶）、粪便隐血、血常规。'
    },
    {
      id: 'ugib', name: '消化性溃疡 / 上消化道出血',
      depts: ['digestive', 'emergency', 'general'],
      must: ['ros:gi.hematemesis','ros:gi.melena'],
      need: 2,
      match: ['ros:gi.hematemesis', 'ros:gi.melena', 'cc:黑便', 'cc:呕血', 'cc:上腹痛',
        'pev:abdomen.abdPalpation=上腹部压痛，无反跳痛'],
      hint: '节律性上腹痛、黑便或呕血，需考虑消化性溃疡并上消化道出血。',
      note: '可补充：血常规、大便隐血、幽门螺杆菌检测、肝功能；稳定后胃镜。'
    },
    {
      id: 'pancreatitis', name: '急性胰腺炎',
      depts: ['digestive', 'emergency', 'surgery', 'general'],
      /* must 收紧到「胰酶」：既往 must 里的『上腹痛 / 呕吐』是几乎所有急腹症都有的
       * 通用表现，脓毒症、胆道感染病历都能凑满 need，结果把别人的 top1 顶成胰腺炎。
       * 现在必须真的查到血淀粉酶或脂肪酶才谈得上胰腺炎。 */
      must: ['aux:淀粉酶','aux:脂肪酶'],
      need: 3,
      /* match 同步收紧：删掉 'cc:腹痛'（14 份模板都有）与 'ros:gi.vomiting'（14 份），
       * 只留胰腺炎特征性的定位性上腹痛、饮酒诱因、胰酶、CT 与上腹压痛。 */
      match: ['cc:上腹痛', 'risk:alcohol', 'aux:淀粉酶', 'aux:脂肪酶', 'aux:CT',
        'pev:special_digestive.giTenderness=上腹部压痛',
        'pev:abdomen.abdPalpation=上腹部压痛，无反跳痛'],
      hint: '饱食或饮酒后上腹剧痛放射至腰背、伴呕吐，需考虑急性胰腺炎。',
      note: '可补充：血/尿淀粉酶、脂肪酶、腹部CT、血脂、肝功能、电解质及血糖。'
    },
    {
      id: 'chole', name: '胆囊炎 / 胆石症',
      depts: ['digestive', 'surgery', 'general', 'emergency'],
      must: ['aux:超声','pe:abdomen.abdPercussion','ros:gi.jaundiceGi'],
      need: 2,
      match: ['cc:右上腹痛', 'ros:gi.jaundiceGi', 'ros:gi.nausea', 'aux:超声',
        'pev:special_digestive.giTenderness=右上腹压痛，胆囊点压痛',
        'pev:special_digestive.giGallbladderPalp=Murphy征阳性',
        'pev:abdomen.abdPalpation=上腹部压痛，无反跳痛', 'pev:abdomen.abdPercussion=肝区叩击痛'],
      hint: '进食油腻后右上腹痛、放射至右肩背，需考虑胆囊炎/胆石症。',
      note: '可补充：腹部超声（首选）、血常规、肝功能、胆红素、腹部CT。'
    },
    {
      id: 'cholangitis', name: '急性胆管炎',
      depts: ['surgery', 'digestive', 'emergency'],
      /* 胆总管结石伴急性胆管炎原来没有规则，只能落到「胆囊炎 / 胆石症」上。
       * 两者的区别很明确：胆管炎的黄疸更突出，还会打寒战高热（Charcot 三联征），
       * 胆囊炎则主要是右上腹痛 + Murphy 征。所以这条的 must 只要黄疸或寒战，
       * 而胆囊炎那条的 must 是超声/叩击痛/黄疸三选一，两者能分开。 */
      must: ['ros:gi.jaundiceGi', 'ros:resp.chills', 'pev:head.eyes=巩膜黄染'],
      /* need 从 3 降到 2。胆管炎的 match 有 8 条，但 must 只要黄疸或寒战，
       * 真正命中时往往是「黄疸 + 发热 + 寒战 + 肝区叩击痛」一起出现，8/3=2.67，
       * 压不过胆囊炎的 6/2=3.00。胆管炎比胆囊炎更急更重，理应排在前面。
       * 降到 2 不会误报：单纯胆囊炎病例没有黄疸也没有寒战，命中数到不了 2。 */
      need: 2,
      match: ['ros:gi.jaundiceGi', 'ros:gi.jaundice',
        'pev:head.eyes=巩膜黄染', 'pev:skin.color=皮肤黏膜黄染',
        'pev:abdomen.abdPercussion=肝区叩击痛',
        'ros:resp.fever', 'ros:resp.chills', 'pmh:胆囊结石'],
      hint: '黄疸伴寒战高热、肝区叩击痛，需考虑急性胆管炎（Charcot 三联征），注意胆道梗阻。',
      note: '可补充：肝功能+胆红素、腹部超声、MRCP，必要时 ERCP；监测血压警惕 Reynolds 五联征。'
    },
    {
      id: 'appendicitis', name: '急性阑尾炎',
      depts: ['surgery', 'emergency', 'general'],
      must: ['pe:abdomen.abdPalpation'],
      need: 2,
      match: ['cc:转移性右下腹痛', 'ros:resp.fever', 'vital:tempUp',
        'pev:abdomen.abdPalpation=右下腹压痛、反跳痛', 'pev:abdomen.abdPalpation=全腹压痛、反跳痛，腹肌紧张'],
      hint: '转移性右下腹痛伴右下腹固定压痛/反跳痛，需考虑急性阑尾炎。',
      note: '可补充：血常规、腹部超声或CT、尿常规；育龄女性加做尿妊娠试验。'
    },
    {
      id: 'peritonitis', name: '急性腹膜炎',
      /* 不写 'general'：腹膜刺激征是外科急腹症的定位体征，全科室提示没有意义。 */
      depts: ['surgery', 'emergency', 'digestive'],
      must: ['pe:abdomen.abdPalpation'],
      need: 3,
      /* 这条规则此前根本不存在，于是「全腹压痛反跳痛、腹肌紧张」的病历被
       * 急性胰腺炎/肠梗阻顶成 top1。特征选词只用腹膜刺激征及其直接后果：
       * 全腹压痛反跳痛+腹肌紧张、肝浊音界消失（气腹）、肠鸣音消失、鼓音区缩小、
       * 立位腹平片。刻意不放 cc:腹痛/发热 这类所有急腹症都有的通用表现。 */
      match: ['pev:abdomen.abdPalpation=全腹压痛、反跳痛，腹肌紧张',
        'pev:special_surgery.surgPeritoneum=全腹压痛、反跳痛伴板状腹',
        'pev:special_surgery.surgPeritoneum=肝浊音界消失',
        'pev:abdomen.abdAuscultation=肠鸣音消失',
        'pev:abdomen.abdPercussion=鼓音区缩小',
        'aux:腹部平片'],
      hint: '全腹压痛、反跳痛伴腹肌紧张，肠鸣音消失或肝浊音界消失，需考虑急性腹膜炎（消化道穿孔可能）。',
      note: '可补充：立位腹部平片（膈下游离气体）、腹部CT、血常规+CRP、血淀粉酶、急诊外科会诊。'
    },
    {
      id: 'obstruction', name: '肠梗阻',
      depts: ['digestive', 'surgery', 'emergency', 'general'],
      must: ['pe:abdomen.abdInspect','pe:abdomen.abdAuscultation','ros:gi.constipation'],
      need: 3,
      match: ['ros:gi.constipation', 'ros:gi.vomiting', 'cc:腹胀', 'cc:腹痛',
        'pev:abdomen.abdInspect=腹部膨隆', 'pev:abdomen.abdInspect=可见胃肠型及蠕动波',
        'pev:abdomen.abdAuscultation=肠鸣音活跃', 'pev:abdomen.abdAuscultation=肠鸣音减弱'],
      hint: '腹痛、呕吐、腹胀、停止排气排便，伴肠鸣音异常，需考虑肠梗阻。',
      note: '可补充：立位腹部平片、腹部CT、电解质、腹部超声。'
    },
    {
      id: 'ci', name: '肝硬化 / 腹水',
      depts: ['digestive', 'general'],
      must: ['pmh:肝硬化','pmh:病毒性肝炎','pe:abdomen.abdPercussion','pe:abdomen.abdInspect'],
      need: 2,
      match: ['pmh:肝硬化', 'pmh:病毒性肝炎', 'ros:gi.bloating', 'ros:gi.jaundiceGi',
        'pev:abdomen.abdPercussion=移动性浊音阳性', 'pev:abdomen.abdInspect=腹壁静脉曲张',
        'pev:abdomen.abdInspect=腹部膨隆',
        // 蜘蛛痣与肝掌是门脉高压最有价值的体表体征。这里用 key 级（pe:）而不是值级（pev:），
        // 因为 schema 给了「可见蜘蛛痣 / 肝掌阳性 / 两者都有」三个选项，值级只能匹配其中一个。
        'pe:skin.spider'],
      hint: '肝病背景 + 腹水、侧支循环开放，需考虑肝硬化。',
      note: '可补充：肝功能、凝血功能、血氨、腹部超声（门脉宽度、脾大）、胃镜评估静脉曲张。'
    },

    /* ------------------------------ 肾脏 ------------------------------ */
    {
      id: 'ckd', name: '慢性肾脏病',
      /* depts 里不要写 'general'：analyze() 的 inDept 判定是
       * `deptKey === 'general' || depts.includes(deptKey) || depts.includes('general')`，
       * 写上 'general' 就等于「任何科室都提示慢性肾脏病」，结果眼科、产科、
       * 儿科的病历也会被顶成 CKD。只保留真正会管这个病的科室。 */
      depts: ['nephrology', 'endocrinology', 'cardiology'],
      /* must 里不能放 pe:abdomen.abdPercussion —— 腹部叩诊是全腹查体的常规项，
       * 几乎每份病历都会做，用它当必要条件等于「做了查体就算 CKD」。
       * 这里的每一条都必须真的指向肾实质受累：尿量改变、血尿、既往 CKD 诊断。 */
      must: ['ros:gu.oliguria','ros:gu.hematuria','pmh:慢性肾脏病','ros:gu.nocturia',
        'pev:special_nephrology.renalSkin=睑结膜苍白'],
      need: 2,
      /* 删掉 pmh:糖尿病 / pmh:高血压：那是病因和危险因素，不是肾脏受累的表现，
       * 留着会让任何糖尿病、高血压病历都冒出 CKD 提示，把真正写了肾性贫血、
       * 夜尿增多、肾区叩击痛、血肌酐升高的病历挤下去。 */
      match: ['ros:gu.oliguria', 'ros:gu.edemaGu', 'ros:gu.hematuria', 'pmh:慢性肾脏病',
        'ros:gu.nocturia', 'ros:gu.polyuria',
        'pev:special_nephrology.renalSkin=睑结膜苍白',
        'pev:special_nephrology.renalBP=血压升高',
        'pev:chest.heartPercussion=心界向左下扩大',
        'pev:abdomen.abdPercussion=双肾区叩击痛',
        'aux:肌酐'],
      hint: '夜尿增多、水肿、尿量改变、肾性贫血或肾区叩击痛，需考虑慢性肾脏病。',
      note: '可补充：尿常规+尿沉渣、尿蛋白/肌酐比、血肌酐+eGFR、泌尿系超声。'
    },
    {
      id: 'aki', name: '急性肾损伤',
      /* 必须写 'nephrology' 之外只留 'emergency'：AKI 是急诊/肾内的判断，
       * 不写 'general'，否则任何做了肾功能的手术病历都会被提示 AKI。 */
      depts: ['nephrology', 'emergency'],
      /* 必要条件只认「尿量减少」：这是 AKI 与 CKD 的分水岭。
       * 只写 pe:abdomen.* 或 aux:肌酐 是不行的——慢肾衰的病人肌酐也高，
       * 用它当必要条件等于「查了肾功就是 AKI」。 */
      must: ['ros:gu.oliguria'],
      need: 3,
      /* 只留真正区分「急性容量不足性肾损伤」的条目：
       *   ros:gu.oliguria + aux:肌酐 —— 肾损伤本身
       *   skin.elasticity 减退 + renalBP 偏低 —— 容量不足的体征
       *   ros:gi.diarrhea —— 肾前性诱因
       * 特意不放 ros:gi.vomiting 和 pev:general.face=急性病容：
       * 泌尿系结石、有机磷中毒的病历里也都有这两条，放进来会让
       * 「急性肾损伤」抢到它们的 top1（实测过多一次）。
       * need 由 2 提到 3，同理——命中 2 条太容易。 */
      match: ['ros:gu.oliguria', 'aux:肌酐',
        'pev:skin.elasticity=皮肤弹性减退',
        'pev:special_nephrology.renalBP=血压偏低',
        'ros:gi.diarrhea'],
      hint: '尿量减少伴肌酐升高，且有腹泻、呕吐、进食少等容量不足诱因，需考虑急性肾损伤（肾前性可能大）。',
      note: '可补充：血肌酐动态（48h 内升高幅度）、尿量记录、尿钠/尿渗透压（鉴别肾前性与肾性）、补液试验后复查、泌尿系超声除外梗阻。'
    },
    {
      id: 'nephrotic', name: '肾病综合征',
      depts: ['nephrology', 'pediatrics', 'general'],
      must: ['ros:gu.edemaGu','pe:spine.limbs'],
      need: 2,
      /* 原来只有 4 条 match，和 CKD 打平（都 1.50），排序时被排在前面的 CKD 顶掉。
       * 补的三条都是肾病综合征自己的特征：颜面水肿（肾病源性水肿从眼睑开始）、
       * 移动性浊音阳性（大量蛋白尿低蛋白血症常伴腹水）、尿蛋白——
       * 而不是靠削弱 CKD 来「让位」。 */
      match: ['ros:gu.edemaGu', 'ros:gu.oliguria', 'pev:spine.limbs=双下肢凹陷性水肿', 'aux:尿常规',
        'aux:尿蛋白', 'pev:special_nephrology.renalFacialEdema=颜面水肿',
        'pev:abdomen.abdPercussion=移动性浊音阳性'],
      hint: '大量蛋白尿、低蛋白血症、明显水肿、高脂血症四联征，需考虑肾病综合征。',
      note: '可补充：24h尿蛋白定量、血清白蛋白、血脂、肾功能、免疫学检查。'
    },
    {
      id: 'uti', name: '泌尿系感染',
      depts: ['nephrology', 'general', 'emergency', 'gynecology'],
      must: ['ros:gu.dysuria','pe:abdomen.abdPercussion'],
      need: 2,
      match: ['ros:gu.dysuria', 'vital:tempUp', 'ros:resp.fever',
        'pev:abdomen.abdPercussion=双肾区叩击痛'],
      hint: '尿频尿急尿痛伴发热或肾区叩击痛，需考虑泌尿系感染。',
      note: '可补充：尿常规、尿培养+药敏、血常规、泌尿系超声。'
    },
    {
      id: 'stone', name: '泌尿系结石',
      depts: ['nephrology', 'surgery', 'emergency'],
      must: ['ros:gu.flankPain','ros:gu.hematuria','pe:abdomen.abdPercussion'],
      need: 1,
      match: ['ros:gu.flankPain', 'ros:gu.hematuria', 'pev:abdomen.abdPercussion=双肾区叩击痛'],
      hint: '突发腰腹部绞痛向会阴放射、伴血尿，需考虑泌尿系结石。',
      note: '可补充：尿常规、泌尿系超声、腹部CT（平扫）、肾功能。'
    },

    /* ------------------------------ 内分泌 ------------------------------ */
    {
      id: 'dm', name: '糖尿病',
      depts: ['endocrinology', 'general', 'cardiology', 'nephrology', 'neurology'],
      must: ['ros:endocrine.polydipsia','ros:endocrine.polyuriaEndo','pmh:糖尿病'],
      need: 2,
      match: ['ros:endocrine.polydipsia', 'ros:endocrine.polyuriaEndo', 'ros:endocrine.weightLoss',
        'pmh:糖尿病', 'vital:bmiHigh'],
      hint: '多饮多尿多食伴体重下降，需考虑糖尿病。',
      note: '可补充：空腹血糖、HbA1c、OGTT、尿酮体、血脂、眼底及神经病变筛查。'
    },
    {
      id: 'dka', name: '糖尿病酮症酸中毒',
      depts: ['endocrinology', 'emergency'],
      must: ['pmh:糖尿病'],
      need: 2,
      match: ['pmh:糖尿病', 'ros:gi.nausea', 'ros:gi.vomiting', 'vital:tachy', 'ros:endocrine.polyuriaEndo'],
      hint: '糖尿病患者出现恶心呕吐、脱水、深大呼吸，需警惕糖尿病酮症酸中毒。',
      note: '可补充：血气分析、血酮体、电解质、血糖、尿酮、肾功能。'
    },
    {
      id: 'hyperthyroid', name: '甲状腺功能亢进症',
      depts: ['endocrinology', 'cardiology', 'general'],
      must: ['ros:endocrine.heatIntolerance','pe:neck.thyroid'],
      need: 2,
      match: ['ros:endocrine.heatIntolerance', 'ros:endocrine.weightLoss', 'ros:cardio.palpitation',
        'pev:neck.thyroid=甲状腺Ⅰ度肿大', 'pev:neck.thyroid=甲状腺Ⅱ度肿大', 'pev:neck.thyroid=甲状腺Ⅲ度肿大'],
      hint: '怕热多汗、心悸、消瘦伴甲状腺肿大，需考虑甲状腺功能亢进症。',
      note: '可补充：FT3/FT4/TSH、TRAb、甲状腺超声、心电图。'
    },
    {
      id: 'hypothyroid', name: '甲状腺功能减退症',
      depts: ['endocrinology', 'general'],
      must: ['ros:endocrine.coldIntolerance','pe:neck.thyroid'],
      need: 2,
      match: ['ros:endocrine.coldIntolerance', 'ros:hemat.fatigue', 'ros:endocrine.weightGain',
        'pev:neck.thyroid=甲状腺Ⅰ度肿大', 'pev:neck.thyroid=甲状腺Ⅱ度肿大'],
      hint: '怕冷、乏力、体重增加、皮肤干燥，需考虑甲状腺功能减退症。',
      note: '可补充：FT3/FT4/TSH、甲状腺抗体、血脂、心电图。'
    },
    {
      id: 'cushing', name: '库欣综合征',
      depts: ['endocrinology', 'general'],
      must: ['pe:general.face','pe:special_endocrinology.endoExtra'],
      need: 1,
      match: ['pev:general.face=满月面容', 'pev:special_endocrinology.endoExtra=满月脸、水牛背'],
      hint: '满月脸、水牛背、向心性肥胖，需考虑库欣综合征（或长期使用糖皮质激素）。',
      note: '可补充：24h尿游离皮质醇、午夜血皮质醇、小剂量地塞米松抑制试验、垂体MRI。'
    },
    {
      id: 'thyroidNodule', name: '甲状腺结节',
      /* 不写 'general'：颈前肿块本身很局限，没必要让所有科室都冒出这条。 */
      depts: ['surgery', 'endocrinology'],
      /* 必要条件用「颈前肿块」或「触到结节」这种指向性证据，
       * 不要用 pe:neck.thyroid —— 甲状腺触诊是颈部的常规查体项，
       * 写了「甲状腺无肿大」也会产生这个 key，等于「查了颈就算结节」。 */
      must: ['ros:endocrine.neckMass', 'pev:neck.thyroid=甲状腺可触及结节'],
      need: 2,
      match: ['ros:endocrine.neckMass', 'pev:neck.thyroid=甲状腺可触及结节', 'aux:超声'],
      hint: '颈前肿块、随吞咽上下移动或查体触及甲状腺结节，需考虑甲状腺结节，注意评估良恶性。',
      note: '可补充：甲状腺超声（TI-RADS 分级）、TSH、必要时细针穿刺细胞学（FNA）、颈部淋巴结评估。'
    },

    /* ------------------------------ 血液 ------------------------------ */
    {
      id: 'anemia', name: '贫血',
      depts: ['hematology', 'general', 'digestive', 'gynecology', 'pediatrics'],
      must: ['ros:hemat.anemia','pe:skin.color','aux:血红蛋白'],
      /* need 必须是 2：贫血是「证据型」诊断，光有乏力不能算。
       * 原来 need:1 + match 里的 ros:hemat.fatigue，让任何慢性病病历
       * （子宫肌瘤、白血病、甲状腺结节、宫外孕）都先闪出「贫血」，
       * 把真正的诊断挤到后面。乏力也一并删掉——它没有鉴别价值。 */
      need: 2,
      match: ['ros:hemat.anemia', 'pev:skin.color=皮肤黏膜苍白', 'aux:血红蛋白',
        'pev:general.face=贫血面容', 'pev:special_hematology.hemAnemia=睑结膜苍白'],
      hint: '面色苍白、睑结膜苍白伴血红蛋白下降，需考虑贫血，并进一步明确病因（缺铁性/巨幼细胞性/失血性等）。',
      note: '可补充：血常规+网织红细胞、铁代谢、叶酸/B12、大便隐血、必要时胃肠镜及妇科评估。'
    },
    {
      id: 'leukemia', name: '白血病 / 血液系统恶性肿瘤',
      depts: ['hematology', 'pediatrics', 'general'],
      must: ['ros:hemat.bleeding','ros:hemat.bruise','ros:hemat.lymphNode','ros:hemat.bonePain','pe:special_hematology.hemExtra'],
      need: 2,
      /* 加了胸骨压痛与肝脾肿大两条。原来这四条 match 在白血病病例上只能
       * 拿到 2.0 分，和「贫血」打成平手——而 anemia 规则排在前面，平手时
       * 它赢，于是白血病模板的第一条提示是「贫血」。胸骨压痛是白血病最
       * 有指向性的体征，肝脾肿大叫得上，两条一起加进来才压得住贫血。
       * 这两条在单纯贫血、ITP 的病例里都不出现，不会反抢别人的榜。 */
      match: ['ros:hemat.bleeding', 'ros:hemat.bruise', 'ros:hemat.lymphNode', 'ros:hemat.bonePain',
        'pev:special_hematology.hemExtra=胸骨压痛',
        'pev:special_hematology.hemSternum=胸骨中下段压痛',
        'pev:special_hematology.hemHepatospleen=脾肋下可触及',
        'pev:skin.lymph=双侧颈部可触及肿大淋巴结'],
      hint: '发热、出血倾向、淋巴结肿大、胸骨压痛，需警惕造血系统恶性肿瘤。',
      note: '可补充：血常规+外周血涂片、骨髓穿刺+活检、免疫分型、染色体/FISH、乳酸脱氢酶。'
    },
    {
      id: 'itp', name: '血小板减少相关出血',
      depts: ['hematology', 'general'],
      must: ['pe:skin.rash','ros:hemat.bruise'],
      /* need 原来是 1。白血病病人也会有出血点和瘀斑，这两条 match 它全中，
       * 3 条 ÷ 1 = 3.0 分，稳稳压过白血病自己的分数，于是白血病模板的第一条
       * 提示永远是「血小板减少相关出血」。ITP 的出血是「只有出血、没有别的」，
       * 光靠皮肤出血点和瘀斑两条不足以把它排到最前，改成 2 更贴合实际。 */
      need: 2,
      match: ['ros:hemat.bleeding', 'ros:hemat.bruise', 'pev:skin.rash=可见瘀点瘀斑'],
      hint: '皮肤黏膜出血点、瘀斑，需考虑血小板减少相关疾病。',
      note: '可补充：血常规+血小板计数、凝血功能、外周血涂片、自身抗体、必要时骨髓检查。'
    },

    /* ------------------------------ 神经 ------------------------------ */
    {
      id: 'stroke', name: '脑卒中',
      depts: ['neurology', 'emergency', 'general'],
      must: ['ros:nervous.weakness','ros:nervous.speech','ros:nervous.numbness','pe:special_neurology.neuroExtra3'],
      need: 2,
      match: ['ros:nervous.weakness', 'ros:nervous.speech', 'ros:nervous.numbness', 'vital:bpUp',
        'ros:nervous.headache', 'pmh:脑卒中',
        'pev:special_neurology.neuroExtra3=偏瘫', 'pev:special_neurology.neuroExtra3=四肢肌力4级'],
      hint: '突发偏侧肢体无力/麻木、言语不清，需警惕脑卒中。',
      note: '可补充：头颅CT（先除外出血）→MRI/DWI、NIHSS 评分、血糖血脂、心电监测；注意静脉溶栓时间窗。'
    },
    {
      id: 'meningitis', name: '中枢神经系统感染',
      depts: ['neurology', 'pediatrics', 'emergency'],
      must: ['ros:nervous.headache','pe:neck.neckResist','pe:nervousPE.nerve'],
      need: 2,
      match: ['vital:tempUp', 'ros:nervous.headache', 'ros:nervous.seizure',
        'pev:neck.neckResist=颈抵抗阳性', 'pev:nervousPE.nerve=脑膜刺激征阳性',
        'pev:nervousPE.nerve=病理反射阳性'],
      hint: '发热、头痛、呕吐伴颈抵抗或脑膜刺激征，需考虑中枢神经系统感染。',
      note: '可补充：腰椎穿刺+脑脊液常规/生化/涂片/培养、头颅影像、血培养、CRP/PCT。'
    },
    {
      id: 'dementia', name: '认知障碍 / 痴呆',
      depts: ['neurology', 'general'],
      must: ['ros:nervous.memoryLoss','pe:special_neurology.neuroExtra1'],
      need: 2,
      match: ['ros:nervous.memoryLoss', 'ros:nervous.incontinence', 'age:elderly',
        'pev:special_neurology.neuroExtra1=记忆力减退'],
      hint: '进行性记忆力减退、生活能力下降，需考虑认知障碍；注意与抑郁、谵妄鉴别。',
      note: '可补充：MMSE/MoCA、头颅MRI（海马萎缩）、甲状腺功能、维生素B12、梅毒血清学。'
    },
    {
      id: 'vertigo', name: '眩晕 / 前庭疾病',
      depts: ['neurology', 'general'],
      must: ['ros:nervous.vertigo','ros:nervous.tinnitus'],
      need: 1,
      match: ['ros:nervous.vertigo', 'ros:nervous.dizziness', 'ros:nervous.tinnitus'],
      hint: '眩晕伴耳鸣或听力下降，需考虑前庭周围性病变，注意排除中枢性眩晕。',
      note: '可补充：Dix-Hallpike 试验、听力检查、头颅MRI、必要时前庭功能检查。'
    },
    {
      id: 'gb', name: '吉兰-巴雷综合征',
      depts: ['neurology', 'pediatrics', 'emergency'],
      must: ['pe:special_neurology.neuroDeepReflex','ros:nervous.weakness'],
      need: 3,
      /* 与脑卒中的鉴别点是「腱反射」：卒中上运动神经元损害 → 腱反射亢进、病理征阳性；
       * 吉兰-巴雷是周围神经脱髓鞘 → 腱反射减弱或消失、无病理征。
       * 所以 match 只认深反射减弱/消失、弛缓性肌力下降、手套袜套样感觉减退，
       * 刻意不放 ros:nervous.speech 与 pev:nervousPE.nerve=病理反射阳性 这类卒中特征。
       * need 取 3：单靠「无力 + 麻木」两条会与糖尿病周围神经病变、甲减混淆。 */
      match: ['ros:nervous.weakness', 'ros:nervous.numbness',
        'pev:special_neurology.neuroDeepReflex=深反射消失',
        'pev:nervousPE.tendonReflex=腱反射普遍减弱',
        'pev:special_neurology.neuroExtra3=肌张力减低',
        'pev:special_neurology.neuroExtra4=手套袜套样感觉减退',
        'pev:spine.limbMuscle=双上肢肌力正常、双下肢肌力减退',
        'pev:spine.limbs=四肢肌力减退',
        'aux:脑脊液', 'aux:肌电图'],
      hint: '对称性弛缓性肢体无力、腱反射减弱或消失，起病前有感染史，需考虑吉兰-巴雷综合征。',
      note: '可补充：腰椎穿刺（蛋白-细胞分离）、肌电图及神经传导速度、肺功能（评估呼吸肌）、心电监护。'
    },

    /* ------------------------------ 风湿 ------------------------------ */
    {
      id: 'ra', name: '类风湿关节炎',
      depts: ['general', 'surgery', 'hematology'],
      must: ['ros:joint.jointPain','ros:joint.morningStiff'],
      need: 2,
      match: ['ros:joint.jointPain', 'ros:joint.morningStiff', 'pev:spine.limbs=关节红肿畸形'],
      hint: '对称性小关节肿痛、晨僵大于1小时，需考虑类风湿关节炎。',
      note: '可补充：RF、抗CCP抗体、ESR、CRP、双手X线/超声、骨密度。'
    },
    {
      id: 'gout', name: '痛风性关节炎',
      depts: ['general', 'surgery', 'nephrology'],
      must: ['ros:joint.jointPain','pmh:痛风'],
      need: 2,
      match: ['pmh:痛风', 'ros:joint.jointPain', 'pev:spine.limbs=关节红肿畸形'],
      hint: '突发单关节红肿热痛，第一跖趾关节多见，需考虑痛风。',
      note: '可补充：血尿酸、关节超声（双轨征）、急性期 ESR/CRP、肾功能。'
    },

    /* ------------------------------ 外科 ------------------------------ */
    {
      id: 'fracture', name: '骨折 / 创伤',
      depts: ['surgery', 'emergency'],
      must: ['trauma:有','pe:special_emergency.emExtra2'],
      need: 2,
      match: ['trauma:有', 'ros:joint.backPain', 'pev:spine.spineCol=脊柱侧弯',
        'pev:spine.spineCol=胸腰椎压痛', 'pev:special_emergency.emExtra2=骨折表现'],
      hint: '外伤后局部疼痛、肿胀、活动受限或畸形，需考虑骨折，注意有无血管神经损伤。',
      note: '可补充：患处正侧位X线（必要时CT）、神经血管检查、开放性伤口评估与破伤风处理。'
    },
    {
      id: 'hernia', name: '腹外疝',
      depts: ['surgery', 'general'],
      must: ['pe:special_surgery.surgExtra2'],
      need: 1,
      match: ['pev:special_surgery.surgExtra2=腹股沟区可触及肿块',
        'pev:special_surgery.surgExtra2=肿块有咳嗽冲击感'],
      hint: '腹股沟区可复性肿块、站立或咳嗽时增大，需考虑腹外疝。',
      note: '可补充：站立位/卧位专科查体、腹股沟超声、排除嵌顿。'
    },

    /* ------------------------------ 妇产 ------------------------------ */
    {
      id: 'pregnancy', name: '妊娠相关（须首先排除）',
      depts: ['gynecology', 'obstetrics', 'emergency', 'general'],
      must: ['menstruation:delay'],
      need: 2,
      match: ['gender:女', 'age:fertile', 'menstruation:delay', 'ros:gi.vomiting', 'ros:gi.nausea'],
      hint: '育龄女性出现停经、恶心呕吐或下腹痛，必须先排除妊娠（包括宫外孕）。',
      note: '可补充：尿/血 hCG、妇科超声；出现剧烈腹痛、休克需警惕宫外孕破裂。'
    },
    {
      id: 'pid', name: '盆腔炎性疾病',
      depts: ['gynecology', 'general'],
      must: ['ros:gu.discharge','pe:abdomen.abdPalpation'],
      need: 2,
      match: ['ros:gi.abdominalPain', 'ros:gu.discharge', 'vital:tempUp',
        'pev:abdomen.abdPalpation=右下腹压痛、反跳痛',
        'pev:special_gynecology.gynExtra1=阴道分泌物增多'],
      hint: '下腹痛、阴道分泌物增多伴发热，需考虑盆腔炎性疾病。',
      note: '可补充：妇科双合诊、分泌物培养、血常规+CRP、盆腔超声；注意与其他急腹症鉴别。'
    },
    {
      id: 'myoma', name: '子宫肌瘤',
      depts: ['gynecology'],
      /* 原来根本没有这条规则，子宫肌瘤的病人只能被「贫血」认领——因为肌瘤
       * 最常见的表现就是经量增多导致的贫血，贫血规则 need 1 就够，稳稳排第一。
       * 但那是并发症，不是诊断。判别靠的是子宫本身的体征：增大、表面不平、
       * 下腹部摸到包块。这三条在单纯贫血的病人身上不会出现。 */
      must: ['pe:special_gynecology.gynUterus', 'pe:special_gynecology.gynAbdomen', 'pe:abdomen.abdPalpation'],
      need: 2,
      match: ['pev:special_gynecology.gynUterus=子宫增大',
        'pev:special_gynecology.gynAbdomen=下腹部可触及包块',
        'pev:abdomen.abdPalpation=可触及腹部包块',
        'ros:hemat.bleeding',
        'aux:超声'],
      hint: '经量增多、经期延长伴子宫增大或下腹部包块，需考虑子宫肌瘤。',
      note: '可补充：妇科超声（首选）、血常规评估贫血程度、必要时宫腔镜或 MRI；与子宫腺肌病、卵巢肿瘤鉴别。'
    },
    {
      id: 'ectopic', name: '异位妊娠',
      depts: ['gynecology', 'emergency'],
      /* 同上，原来没有规则，异位妊娠模板的第一条提示是「贫血」。异位妊娠
       * 的关键是「停经 + 一侧下腹痛 + 宫颈举痛/附件包块」，出血到贫血只是
       * 后果。妊娠相关那条规则 need 2、只看 gender/age/停经/恶心，任何育龄
       * 女性腹痛都会中；这条要靠妇科查体把它顶下去。 */
      must: ['menstruation:delay', 'pe:special_gynecology.gynCervix', 'pe:special_gynecology.gynAdnexa'],
      need: 2,
      match: ['menstruation:delay',
        'pev:special_gynecology.gynCervix=宫颈举痛',
        'pev:special_gynecology.gynAdnexa=右附件区可触及包块',
        'pev:special_gynecology.gynExtra2=附件区压痛',
        'pev:abdomen.abdPercussion=移动性浊音阳性',
        'ros:cardio.syncope'],
      hint: '育龄女性停经后一侧下腹痛、宫颈举痛或附件包块，须首先排除异位妊娠。',
      note: '可补充：血 β-hCG + 孕酮、经阴道超声、后穹窿穿刺；血流动力学不稳者按急症处理。'
    },
    {
      id: 'preeclampsia', name: '妊娠期高血压疾病 / 子痫前期',
      depts: ['obstetrics'],
      must: ['aux:尿蛋白','ros:nervous.visualBlur','ros:nervous.headache','ros:nervous.visualBlur'],
      need: 2,
      match: ['vital:bpUp', 'ros:nervous.headache', 'aux:尿蛋白', 'ros:nervous.visualBlur'],
      hint: '妊娠20周后血压升高伴蛋白尿或头痛、视物模糊，需警惕子痫前期。',
      note: '可补充：尿蛋白定量、肝肾功能、凝血功能、血小板、胎儿超声及胎心监护。'
    },
    {
      id: 'pregDiabetes', name: '妊娠期糖尿病',
      depts: ['obstetrics', 'endocrinology'],
      must: ['ros:endocrine.polydipsia','vital:bmiHigh'],
      need: 2,
      match: ['vital:bmiHigh', 'age:elderly', 'ros:endocrine.polydipsia', 'ros:endocrine.polyuriaEndo'],
      hint: '孕期体重增长过快、多饮多尿或有糖尿病高危因素，需筛查妊娠期糖尿病。',
      note: '可补充：OGTT（24-28周）、空腹血糖、HbA1c、胎儿超声评估。'
    },

    /* ------------------------------ 儿科 ------------------------------ */
    {
      id: 'pedPneumonia', name: '小儿肺炎',
      depts: ['pediatrics'],
      /* must 里原来还有一条 age:child。模板不许写 basic.age（学生的病人不是模板
       * 里的病人），所以 age:child 在套用模板的病历上永远拿不到，那一条是死的。
       * 儿科本身已经限定了人群，肺部的体征才是真正的判别依据。 */
      must: ['pe:chest.lungAuscultation'],
      need: 3,
      /* 补了两条儿科专科体征。cap（成人社区获得性肺炎）在儿科科室也放行，
       * 它的 match 有 9 条，能拿到 1.67 分，而小儿肺炎原来只有 1.33 分——
       * 儿科肺炎模板的第一条提示因此是「社区获得性肺炎」。呼吸急促和咽部
       * 体征在成人肺炎里不会写成这样，加上去正好把两者分开。 */
      match: ['vital:tempUp', 'ros:resp.cough', 'ros:resp.dyspnea',
        'ros:resp.sputum',
        'pev:chest.lungAuscultation=双肺可闻及湿性啰音', 'pev:chest.lungAuscultation=右下肺可闻及湿性啰音',
        'pev:special_pediatrics.pedResp=呼吸急促',
        'pev:special_pediatrics.pedExtra3=咽充血，扁桃体肿大'],
      hint: '患儿发热、咳嗽、气促，肺部闻及固定湿啰音，需考虑小儿肺炎。',
      note: '可补充：血常规+CRP、胸片、呼吸道病原学（支原体、RSV、流感）、评估有无低氧血症。'
    },
    {
      id: 'pedDiarrhea', name: '小儿腹泻病 / 脱水',
      depts: ['pediatrics', 'emergency'],
      must: ['ros:gi.diarrhea'],
      need: 2,
      match: ['ros:gi.diarrhea', 'ros:gi.vomiting', 'vital:tachy', 'pev:special_pediatrics.pedExtra2=毛细血管充盈时间延长'],
      hint: '患儿腹泻呕吐伴尿量减少、精神差，需评估脱水程度。',
      note: '可补充：大便常规+轮状病毒/诺如病毒、电解质、血气、体重变化、尿量记录。'
    },
    {
      id: 'febrileSz', name: '热性惊厥',
      depts: ['pediatrics'],
      must: ['ros:nervous.seizure'],
      need: 2,
      /* 原来 match 只有『抽搐 + 体温升高』，而体温走 vital:tempUp —— 模板不写生命体征，
       * 于是这条规则在模板场景下只能命中 1 条、永远差一条，属于结构性不可达。
       * 补 ros:resp.fever 与 cc:发热：两者都是「发热」这件事在不同录入位置的等价表达，
       * 不改变临床含义（热性惊厥的前提本来就是发热）。 */
      match: ['ros:nervous.seizure', 'vital:tempUp', 'ros:resp.fever', 'cc:发热'],
      hint: '发热伴抽搐，需考虑热性惊厥，同时排除中枢神经系统感染。',
      note: '可补充：详细惊厥发作描述、血糖电解质、头颅影像（有指征时）、脑电图（反复发作时）。'
    },

    /* ------------------------------ 急诊 ------------------------------ */
    {
      id: 'organophosphate', name: '有机磷中毒',
      /* 不写 'general'：有机磷中毒是急诊/理化因素范畴，让所有科室都提示没有意义。 */
      depts: ['emergency'],
      must: ['ros:nervous.tremor','aux:胆碱酯酶'],
      need: 4,
      /* 特征性三联：① 有机磷接触后出现毒蕈碱样（流涎、大汗、腹泻、视物模糊）
       * ② 烟碱样（肌纤维颤动，走 ros:nervous.tremor）③ 中枢抑制（GCS 下降、嗜睡）。
       * 胆碱酯酶降低是唯一能定性的客观指标，所以放在 must 里。
       * 注意：schema 的 head.eyes 与 special_emergency.emConscious 都没有「瞳孔缩小」
       * 这个选项，缩瞳只能写在主诉/现病史/系统回顾的文字里，规则这边不能用 pe 键表达。
       * need 取 4：只靠「震颤 + 胆碱酯酶」两条容易被甲亢（震颤）等病历蹭到。 */
      match: ['ros:nervous.tremor', 'aux:胆碱酯酶',
        'pev:special_emergency.emExtra1=GCS评分下降',
        'pev:special_emergency.emConscious=嗜睡',
        'pev:general.conscious=嗜睡',
        'pev:special_emergency.emSkin=皮肤湿冷',
        'pev:special_emergency.emCirculation=脉搏细速',
        'ros:gi.diarrhea',
        'ros:nervous.visualBlur',
        'pev:chest.lungAuscultation=双肺可闻及湿性啰音'],
      hint: '有有机磷农药接触史，出现流涎、大汗、腹泻、肌纤维颤动、意识障碍，需考虑有机磷中毒。',
      note: '可补充：全血胆碱酯酶活性（确诊与分级）、血气分析、心电图（监测心律失常）、反复评估呼吸肌与意识。'
    },
    {
      id: 'sepsis', name: '脓毒症',
      depts: ['emergency', 'general', 'respiratory', 'digestive', 'surgery'],
      must: ['vital:tempUp','vital:tempDown','pmh:糖尿病'],
      need: 3,
      /* 光有体温和心率不能算脓毒症——那可能只是肺炎、胆管炎本身。
       * 必须同时有「感染证据」和「器官功能受损证据」，否则这条提示会把
       * 感染性疾病原发病误判成脓毒症，排在真正的诊断前面。
       * 感染证据：寒战、CRP/PCT 升高、白细胞异常（走 aux 关键词）；
       * 器官受损：低血压、意识改变、呼吸急促、乳酸升高。 */
      match: ['vital:tempUp', 'vital:tempDown', 'vital:tachy', 'vital:tachypnea',
        'vital:bpDown', 'ros:resp.chills',
        'aux:CRP', 'aux:降钙素原', 'aux:乳酸', 'aux:血培养',
        'pev:general.conscious=神志清楚，精神差',
        /* 急诊床旁能直接看到的器官灌注不足：休克指数、综合评估的休克表现、
         * 皮肤湿冷、脉搏细速。这 4 项只有真正按脓毒症/休克记录的病历才有，
         * 不会落在普通肺炎、胆囊炎的病历里。 */
        'pev:special_emergency.emShock=休克指数0.5～1.0',
        'pev:special_emergency.emExtra1=休克表现',
        'pev:special_emergency.emSkin=皮肤湿冷',
        'pev:special_emergency.emCirculation=脉搏细速'],
      hint: '感染灶 + 心率增快、呼吸急促、血压下降或意识改变，需警惕脓毒症（qSOFA）。',
      note: '可补充：血培养（抗菌药物使用前）、乳酸、血常规+CRP+PCT、器官功能评估、液体复苏评估。'
    },
    {
      id: 'shock', name: '休克（需紧急处理）',
      depts: ['emergency', 'cardiology', 'general'],
      must: ['vital:bpDown','pev:skin.color=口唇及肢端发绀','pev:general.conscious=神志清楚，精神差','pev:general.conscious=嗜睡','pev:general.conscious=昏睡'],
      need: 2,
      /* 原来 match 里 5 条有 3 条是 vital:*，而模板不写生命体征 → 只有 2 条能命中，
       * 与一堆科室级规则同分 s=1.00，排序上永远被压在后面。
       * 这里补的 4 条都是「灌注不足」的床旁证据，写在查体里而不是生命体征里：
       * 休克指数、休克表现（急诊综合评估）、皮肤湿冷、脉搏细速。
       * 它们只在真正记为休克/脓毒症的病历里出现，不会命中普通内科病例。 */
      match: ['vital:bpDown', 'vital:tachy', 'vital:tachypnea',
        'pev:skin.color=口唇及肢端发绀', 'pev:general.conscious=神志清楚，精神差',
        'pev:special_emergency.emShock=休克指数>1.0',
        'pev:special_emergency.emExtra1=休克表现',
        'pev:special_emergency.emSkin=皮肤湿冷',
        'pev:special_emergency.emCirculation=脉搏细速'],
      hint: '血压下降、心率增快、皮肤湿冷、意识改变，提示存在休克，需立即处理。',
      note: '建议立即：建立静脉通路、心电监护、血气+乳酸、床旁超声评估容量状态、明确休克类型。'
    },

    /* ------------------------------ 精神 ------------------------------ */

    /* 精神科规则的总原则：
     * ① depts 一律只写 ['psychiatry']。analyze() 的 inDept 是
     *    `deptKey === 'general' || depts.includes(deptKey) || depts.includes('general')`，
     *    一旦写上 'general'，这些规则就会在**所有科室**的病历里出现——
     *    内科病人随口一句「最近睡不好、有点焦虑」就会被提示「焦虑障碍」。
     * ② 「情绪低落」「焦虑」这类词没有鉴别力，几乎任何病人都可能写上一句，
     *    所以必须条件（must）只认有定位价值的精神检查阳性，
     *    且 need 取 3 以上，靠单条 core 症状撑不起诊断。 */
    {
      id: 'depression', name: '抑郁发作',
      depts: ['psychiatry'],
      /* ICD-10/DSM-5 都要求「核心症状」：心境低落或兴趣与愉快感丧失，
       * 二者至少其一。故 must 只放 moodLow 与 interestLoss，
       * 不把 energyLoss/appetiteChange 这些附加症状当必要条件。 */
      must: ['ros:nervous.moodLow', 'ros:nervous.interestLoss'],
      /* need 取 3：只写「情绪低落」一条时 m=1、撑不住，避免内科病历里
       * 一句「心情不好」就冒出抑郁发作（护栏自测项之一）。 */
      need: 3,
      match: ['ros:nervous.moodLow', 'ros:nervous.interestLoss',
        'ros:nervous.energyLoss', 'ros:nervous.suicidal',
        'ros:nervous.appetiteChange', 'ros:nervous.insomnia',
        'ros:nervous.memoryLoss',
        'pev:special_psychiatry.psyMood=情感低落',
        'pev:special_psychiatry.psyInsight=自知力完整，承认有病并愿意接受治疗',
        'pev:special_psychiatry.psyCognition=近事记忆力减退',
        'pev:special_psychiatry.psyBehavior=意志减退，生活懒散'],
      hint: '持续的情绪低落与兴趣减退，伴精力下降、睡眠或食欲改变，需考虑抑郁发作；注意评估自杀风险。',
      note: '可补充：病程是否≥2周、HAMD/PHQ-9 评分、甲状腺功能排除甲减、既往躁狂史（排除双相）。'
    },
    {
      id: 'schizophrenia', name: '精神分裂症',
      depts: ['psychiatry'],
      /* 必要条件必须是「阳性精神病性症状」：幻觉，或妄想（任一型）。
       * 「被害妄想」与「有关系妄想」是 psyThoughtContent 的两个不同取值，
       * pev: 是整串精确匹配，不能合成一条，必须分开写。
       * 注意 schema 里的原值是「有关系妄想」，不是「关系妄想」——
       * 少一个字这里就永远命不中（脚本逐个比对过选项表）。 */
      must: ['ros:nervous.hallucination',
        'pev:special_psychiatry.psyPerception=幻听',
        'pev:special_psychiatry.psyThoughtContent=被害妄想',
        'pev:special_psychiatry.psyThoughtContent=有关系妄想'],
      need: 2,
      match: ['ros:nervous.hallucination',
        'pev:special_psychiatry.psyPerception=幻听',
        'pev:special_psychiatry.psyThoughtContent=被害妄想',
        'pev:special_psychiatry.psyThoughtContent=有关系妄想',
        'pev:special_psychiatry.psyThoughtForm=思维散漫',
        'pev:special_psychiatry.psyThoughtForm=思维破裂',
        'pev:special_psychiatry.psyInsight=自知力缺失，否认有病',
        'pev:special_psychiatry.psyBehavior=冲动毁物行为',
        'pev:special_psychiatry.psyAppearance=接触被动，问话少答',
        'pev:special_psychiatry.psyAppearance=接触违拗，拒绝检查',
        'ros:nervous.behaviorAbnormal', 'ros:nervous.speech'],
      hint: '幻觉、妄想等精神病性症状，伴自知力缺失，需考虑精神分裂症。',
      note: '可补充：病程≥6 个月、PANSS 评分、排除物质所致精神障碍与器质性精神障碍。'
    },
    {
      id: 'bipolar', name: '双相情感障碍（躁狂发作）',
      depts: ['psychiatry'],
      /* 关键鉴别：躁狂的 must 只放「躁狂三联」——情感高涨、思维奔逸、活动增多。
       * 不把 ros:nervous.moodLow 写进 must：抑郁发作同样有 moodLow，
       * 放进来会让单纯抑郁发作同时满足双相的条件，把抑郁的 top1 顶掉。
       * 「既往抑郁发作」这条线索通过 match 里的 moodLow 计分，
       * 由 hint 提示医生去追问，而不是让它当必要条件。 */
      must: ['pev:special_psychiatry.psyMood=情感高涨',
        'pev:special_psychiatry.psyThoughtForm=思维奔逸',
        'pev:special_psychiatry.psyBehavior=意志增强，活动增多'],
      need: 2,
      match: ['pev:special_psychiatry.psyMood=情感高涨',
        'pev:special_psychiatry.psyThoughtForm=思维奔逸',
        'pev:special_psychiatry.psyBehavior=意志增强，活动增多',
        'pev:special_psychiatry.psyMood=情感不稳，易激惹',
        'pev:special_psychiatry.psySpeech=语速增快，言语增多',
        'pev:special_psychiatry.psyThoughtContent=夸大妄想',
        'ros:nervous.moodLow',
        'ros:nervous.energyLoss',
        'cc:情绪高涨', 'cc:易激惹', 'cc:言语增多'],
      hint: '情感高涨、思维奔逸、活动增多（躁狂三联），需考虑双相情感障碍躁狂发作；' +
        '需追问既往是否有抑郁发作、发作间期是否完全缓解以支持双相诊断。',
      note: '可补充：YMRS 评分、既往发作史与发作间期社会功能、排除甲状腺功能亢进与物质所致。'
    },
    {
      id: 'anxiety', name: '焦虑障碍',
      depts: ['psychiatry'],
      /* 必要条件：焦虑体验本身或精神检查里的「焦虑紧张」。
       * 刻意不把心悸、震颤、出汗这些躯体症状写进 must——它们在
       * 心内科、内分泌科病历里到处都是，一进 must 就会全科乱冒。 */
      must: ['ros:nervous.anxiety', 'pev:special_psychiatry.psyMood=焦虑紧张'],
      need: 2,
      /* match 只留 5 条：两条必要条件 + 睡眠障碍、震颤、精力下降。
       * 躯体症状（心悸/出汗）一律不收：它们在别的科也常见，
       * 塞进来会让心内科病历冒出「焦虑障碍」。 */
      match: ['ros:nervous.anxiety',
        'pev:special_psychiatry.psyMood=焦虑紧张',
        'ros:nervous.insomnia',
        'ros:nervous.tremor',
        'ros:nervous.energyLoss'],
      hint: '持续焦虑紧张伴睡眠障碍与自主神经症状，需考虑焦虑障碍。',
      note: '可补充：GAD-7 评分、病程≥6 个月、排除甲亢与心律失常。'
    }
  ];

  /* ---------------------- 查体项别名映射（P1-14） ---------------------- */

  /**
   * 查体项被拆分后，旧的聚合 key 仍然被规则引用，必须保持可用。
   *
   * 背景：为了让评分表里「按项给分」的查体能被逐项核对，abdomen / nervousPE /
   * spine 三组做了「保留父项 + 新增子项」的拆分。子项的默认值是空字符串，
   * 用户填了子项之后父项就一直是默认值，于是 `pe:abdomen.abdPalpation` 这类
   * 键永远不会产生——而「急性阑尾炎」「中枢神经系统感染」等规则的 must 正是它，
   * 结果会是**静默失效**：不报错，只是该提示的再也不提示。
   *
   * 两级映射：
   *   PE_ALIAS       key 级：子项阳性 → 激活父项的 pe: 键（满足 must）
   *   PE_VALUE_ALIAS 值级：把子项的具体阳性描述折算成父项规则认识的 pev: 值
   *                  （满足 match 计数），折算只做临床上一一对应的情形
   */
  const PE_ALIAS = {
    // 腹部触诊 4 子项 → 聚合父项 abdPalpation
    'abdomen.abdPalpSuperficial': ['abdomen.abdPalpation'],
    'abdomen.abdPalpDeep': ['abdomen.abdPalpation'],
    'abdomen.liverPalpation': ['abdomen.abdPalpation'],
    'abdomen.spleenPalpation': ['abdomen.abdPalpation'],
    // 触诊补充 4 子项（教材《诊断学》第10版腹部触诊书写清单里的胆囊/肾/膀胱/液波震颤）
    // 同属「腹部触诊」这一大类，阳性同样说明触诊查出了问题
    'abdomen.gallbladderPalpation': ['abdomen.abdPalpation'],
    'abdomen.kidneyPalpation': ['abdomen.abdPalpation'],
    'abdomen.bladderPalpation': ['abdomen.abdPalpation'],
    'abdomen.fluidThrill': ['abdomen.abdPalpation'],
    // 振水音是听诊项目（教材归在腹部听诊），映射到 abdAuscultation 而不是触诊
    'abdomen.succussionSplash': ['abdomen.abdAuscultation'],
    // 神经反射 4 子项 → 聚合父项 nerve
    'nervousPE.tendonReflex': ['nervousPE.nerve'],
    'nervousPE.brudzinski': ['nervousPE.nerve'],
    'nervousPE.kernig': ['nervousPE.nerve'],
    'nervousPE.babinski': ['nervousPE.nerve'],
    // 四肢 3 子项 → 聚合父项 limbs（膝跳反射/足背动脉/桡动脉无父项，不映射）
    'spine.limbMuscle': ['spine.limbs'],
    'spine.edemaAnkle': ['spine.limbs'],
    'spine.edemaPretibial': ['spine.limbs']
  };

  /**
   * 值级映射：把子项的具体阳性描述折算成父项规则认识的 pev: 值。
   *
   * 只收录「临床上一一对应、折算不会凭空增加事实」的情形：
   *   布氏征/克氏征阳性 ⇔ 脑膜刺激征阳性（这是定义）
   *   巴氏征阳性     ⇔ 病理反射阳性（这是定义）
   *   踝部/胫前凹陷性水肿 ⇔ 双下肢凹陷性水肿（部位包含关系）
   *   肌力 3/4 级     ⇔ 四肢肌力减退（这是定义）
   *
   * ★★ 腹部触诊刻意**不**折算——这是有意为之，不是遗漏，不要「修好」它 ★★
   *
   * 腹部子项（abdPalpSuperficial / abdPalpDeep / liverPalpation / spleenPalpation）
   * 只做了 key 级映射（PE_ALIAS，让规则 must 仍能命中），值级折算一律不做。
   *
   * 原因：父项的候选值写的是「右下腹压痛、反跳痛」，而子项往往只写了「压痛」。
   * 一旦按值折算，就等于替医生补上「反跳痛」这个**更严重的、实际没有检查**的体征。
   * 病历是医疗记录，工具可以少提示（漏报只是少一个提醒，医生自己会判断），
   * 但绝不能凭空生成没做过的查体发现（误报会直接写进病历、误导诊疗）。
   *
   * 代价很小且已验证：只填「右下腹浅触诊压痛」时，「急性阑尾炎」规则靠
   * must=['pe:abdomen.abdPalpation'] 仍能命中，match 计数靠
   * 「转移性右下腹痛」「发热」等其他条目已满足 need=2。
   *
   * 如果将来有人觉得「少折算一条是 bug」又想加回去，请先读上面这段：
   * 折算方向必须是「文字完全对应」，不允许从「压痛」推出「反跳痛」。
   * 目前只保留了 liverPalpation / spleenPalpation 两个文字完全对应的折算。
   */
  const PE_VALUE_ALIAS = {
    // 神经：布氏征/克氏征阳性 = 脑膜刺激征阳性；巴氏征阳性 = 病理反射阳性
    'nervousPE.brudzinski=布氏征阳性': ['pev:nervousPE.nerve=脑膜刺激征阳性'],
    'nervousPE.kernig=克氏征阳性': ['pev:nervousPE.nerve=脑膜刺激征阳性'],
    'nervousPE.babinski=巴氏征阳性': ['pev:nervousPE.nerve=病理反射阳性'],
    'nervousPE.babinski=双侧巴氏征阳性': ['pev:nervousPE.nerve=病理反射阳性'],
    // 四肢水肿：踝部/胫前凹陷性水肿即「双下肢凹陷性水肿」
    'spine.edemaAnkle=双侧踝部凹陷性水肿': ['pev:spine.limbs=双下肢凹陷性水肿'],
    'spine.edemaPretibial=双侧胫前凹陷性水肿': ['pev:spine.limbs=双下肢凹陷性水肿'],
    // 四肢肌力减退
    'spine.limbMuscle=四肢肌力4级': ['pev:spine.limbs=四肢肌力减退'],
    'spine.limbMuscle=四肢肌力3级': ['pev:spine.limbs=四肢肌力减退'],
    'spine.limbMuscle=双上肢肌力正常、双下肢肌力减退': ['pev:spine.limbs=四肢肌力减退'],
    // 腹部：只折算文字完全对应的情形（不补「反跳痛」）
    'abdomen.liverPalpation=肝肋下可触及': ['pev:abdomen.abdPalpation=肝肋下可触及'],
    'abdomen.spleenPalpation=脾肋下可触及': ['pev:abdomen.abdPalpation=脾肋下可触及']
  };

  /* ---------------------- 否定的作用范围 ---------------------- */
  //
  // 病历里「发热但无咳嗽」这种写法很常见：一句话里既有阳性也有阴性。
  // 早先的做法是「分句以否定词开头就丢掉整个分句」，于是「发热但无咳嗽」里的
  // 咳嗽照样被子串匹配命中、被算成阳性，「咳嗽但不发热」里的发热也一样——
  // 诊断提示据此多报一个候选、多给一分。单靠往否定词表里加词治不了这个病，
  // 因为问题不在词表，在于「这个『无』管到哪儿为止」没算清楚。
  //
  // 现在的规则（tests/generator.test.cjs 里每条都有对应断言）：
  //   · 句号、分号、换行是硬边界，否定不跨句；
  //   · 「但/但是/然而/不过/却/反而」是否定的转折，转折之后重新判定；
  //   · 顿号不算边界：「无咳嗽、咳痰」「否认咳嗽及咳痰」整段被否定，两项都不算阳性；
  //   · 逗号是边界但不继承否定：「无胸痛，咳嗽3天」里的咳嗽仍算阳性——
  //     病历里这种写法几乎总是「先列一串阴性、再说真正的阳性」；
  //   · 「伴/并/且/及/和/与/同时」只是并列连接词，剥掉它再看开头是不是否定词，
  //     所以「伴无咳嗽」「并否认咯血」照样算否定；
  //   · 症状后面的「不」不当否定用：「发热不退」「咳嗽不止」里的发热、咳嗽仍是阳性。
  const NEG_PREFIX = /^(?:无明显|无明|未见明显|未见异常|未出现|未见|否认有|否认|没有|无|未|不)/;
  // 这几个词以「不/无」开头但不是在否定症状，误判会把「不明原因发热」整段丢掉
  const NEG_EXCEPT = /^(?:不明原因|不明诱因|原因不明|不详|不洁|不规则)/;
  // 现病史起病那一栏几乎每份病历都以「无明显诱因出现…」「无诱因出现…」开头，
  // 这里的「无」否定的是诱因，不是后面的症状。先把这个短语剥掉再判，
  // 否则「无明显诱因出现发热3天」里的发热会被自己这句话吃掉——
  // 那等于所有正规写法的现病史都不产生关键词。
  const CAUSE_PHRASE = /^无(?:明显|何|任何)?(?:诱因|原因|明确诱因|明显原因)/;
  const TURN_WORD = /^(?:但是|但|然而|不过|却|反而)$/;
  const TURN_SPLIT = /(但是|但|然而|不过|却|反而)/;
  const CONNECT_HEAD = /^(?:同时|另外|此外|并且|伴有|伴|并|且|亦|也|还|仍|尚|又|和|及|与)/;
  // 「伴无咳嗽」这种连接词后面直接跟否定的情形，先在这里切开
  const CONNECT_NEG_SPLIT = /(?=(?:同时|另外|此外|伴有|伴|并|且)(?:无|未|不|否认|没有|未见))/;
  // 没有任何标点、阳性后面直接接否定的写法：「发热无咳嗽」「腹痛3天未缓解」。
  // 只在「无/未/否认/没有/未见」前切，不切「不」——「不适」「不良」「不断」
  // 里的「不」太多，切了会把正常句子切碎。
  // 「发热不退」「咳嗽不止」不受影响：切出来的后半段本来就不含症状词。
  const MID_NEG_SPLIT = /(?<=[^，,。；;、\s])(?=无|未|否认|没有|未见)/;

  function segIsNegated(seg) {
    let t = String(seg || '').trim();
    if (!t) return false;
    // 剥掉并列连接词，看真正的开头是什么
    for (let i = 0; i < 3; i++) {
      const m = t.match(CONNECT_HEAD);
      if (!m) break;
      t = t.slice(m[0].length).trim();
    }
    if (!t) return false;
    if (NEG_EXCEPT.test(t)) return false;
    // 「无诱因」「无明显原因」剥掉后看剩下的部分
    let rest = t;
    while (CAUSE_PHRASE.test(rest)) rest = rest.replace(CAUSE_PHRASE, '').trim();
    if (rest !== t) return rest ? NEG_PREFIX.test(rest) && !NEG_EXCEPT.test(rest) : false;
    return NEG_PREFIX.test(t);
  }

  function positiveNarrative(text) {
    const out = [];
    String(text || '').split(/[。；;\n]/).forEach(sentence => {
      // 先按转折词切开：转折之后重新判定，所以直接切成互不影响的几块
      const chunks = [];
      let buf = '';
      sentence.split(TURN_SPLIT).forEach(piece => {
        if (TURN_WORD.test(piece)) { chunks.push(buf); buf = ''; }
        else buf += piece;
      });
      chunks.push(buf);
      chunks.forEach(chunk => {
        // 逗号是边界但不继承否定；顿号留在段内，整段一起判
        String(chunk || '').split(/[，,]/).forEach(rawSeg => {
          String(rawSeg || '').split(CONNECT_NEG_SPLIT).forEach(seg => {
            // 再切一次「阳性后面紧跟否定」的写法，切出来的后半段会在
            // segIsNegated 里被认成否定段
            String(seg || '').split(MID_NEG_SPLIT).forEach(sub => {
              const t = String(sub || '').trim();
              if (!t) return;
              if (segIsNegated(t)) return;
              out.push(t);
            });
          });
        });
      });
    });
    return out.join('，');
  }

  /* ---------------------- 从病历中抽取"发现" ---------------------- */

  function extractFindings(r) {
    const F = new Set();
    const b = r.basic || {};

    // 主诉 + 现病史关键词
    // 字段之间用「。」连接：字段边界就是句子边界，一个字段里的「无」不可能跑到
    // 下一个字段去否定那里的阳性（主诉写「发热3天」、现病史写「无明显诱因」，
    // 发热不该被那个「无」吃掉）。
    // 刻意不纳入 hpi.negativeDiscriminating：它是整段阴性病史。
    const rawText = [
      b.chiefComplaint || '',
      (r.hpi || {}).onset || '', (r.hpi || {}).cause || '',
      (r.hpi || {}).symptoms || '', (r.hpi || {}).relief || '',
      (r.hpi || {}).evolution || '', (r.hpi || {}).accompanying || ''
    ].join('。');
    const textAll = positiveNarrative(rawText);

    const ccKeys = ['发热', '咳嗽', '咳痰', '咯血', '呼吸困难', '气促', '喘息', '胸闷', '胸痛',
      '心悸', '上腹痛', '腹痛', '转移性右下腹痛', '右上腹痛', '腹泻', '呕吐', '腹胀', '黑便',
      '呕血', '黄疸', '水肿', '血尿', '头痛', '头晕', '乏力', '消瘦',
      /* 精神科症状词：原表 28 个词全是内外科症状，「情绪低落、兴趣减退」这类
       * 精神科主诉一个字都命中不了，精神科规则的 cc: 特征等于不存在。
       * 这些词都不含「痛」字，不会被下面 flatCC 的「X痛→痛」归一化破坏。
       * 「体重下降」同时收「体重减轻」：口语写法两种都常见。 */
      '情绪低落', '兴趣减退', '快感缺失', '精力下降', '乏力感', '失眠', '早醒',
      '自杀', '自伤', '幻觉', '幻听', '妄想', '被害妄想', '行为异常',
      '言语增多', '情绪高涨', '易激惹', '焦虑', '惊恐', '强迫', '记忆力下降',
      '食欲减退', '体重下降', '体重减轻'];

    // 主诉/现病史里的说法太活，「上腹部疼痛」「上腹隐痛」都不会包含子串「上腹痛」，
    // 于是最常见的上腹痛连 cc:上腹痛 都命不中，消化性溃疡一条规则都触发不了。
    // 这里先把写法拉平再匹配：腹部→腹、各种「X痛」→「痛」、疼痛→痛。
    // 只影响 cc: 关键词，不影响 pev: 的精确匹配。
    const flatCC = textAll
      .replace(/腹部/g, '腹')
      .replace(/疼痛/g, '痛')
      .replace(/(隐|胀|绞|刺|钝|烧灼|灼|刀割|撕裂|牵扯|压榨|闷|跳|酸|胀)痛/g, '痛');
    ccKeys.forEach(k => { if (flatCC.includes(k)) F.add('cc:' + k); });

    // 系统回顾阳性
    (SCHEMA.ROS || []).forEach(sys => {
      const store = (r.ros || {})[sys.key] || {};
      sys.symptoms.forEach(sym => {
        if ((store[sym.key] || {}).checked) F.add(`ros:${sys.key}.${sym.key}`);
      });
    });

    // 既往史
    Object.keys(((r.pmh || {}).diseaseChecks) || {}).forEach(k => {
      if (r.pmh.diseaseChecks[k]) F.add('pmh:' + k);
    });
    // 慢性病史手写文本也识别
    const pmhText = `${(r.pmh || {}).diseaseDetail || ''} ${(r.pmh || {}).special || ''}`;
    ['高血压', '糖尿病', '冠心病', '慢性肾脏病', '肝硬化', '病毒性肝炎', '脑卒中',
      '痛风', '甲状腺功能亢进', '甲状腺功能减退', '类风湿关节炎', '肺结核',
      /* 精神科既往史：复发率极高，「既往精神分裂症」「既往抑郁发作」是本次
       * 诊断的直接依据，不识别就等于让精神科病历丢掉最重要的那条线索。 */
      '精神分裂症', '抑郁症', '双相情感障碍', '躁狂', '焦虑症', '强迫症', '精神疾病']
      .forEach(dz => { if (pmhText.includes(dz)) F.add('pmh:' + dz); });

    // 个人史
    const per = r.personal || {};
    if (per.smoking === '有' || per.smoking === '已戒') F.add('smoke:有');
    if (per.smoking === '有' || per.smoking === '已戒') F.add('risk:smoke');
    if (per.drinking === '有' || per.drinking === '已戒') F.add('risk:alcohol');
    // 「外伤史」是自由文本，绝大多数人会写「否认外伤史」。
    // 旧实现只要非空就加 trauma:有，于是「否认外伤史」的病人被当成有外伤，
    // 骨折规则（must: trauma:有）就会凭空冒出来。必须认否定词。
    const traumaText = String((r.pmh || {}).trauma || '').trim();
    if (traumaText && !/^(否认|无|未|没有|不)/.test(traumaText)) F.add('trauma:有');

    // 生命体征
    // 有效值统一交给 GENERATOR.vitalNum 判断：它要求完整数字 + 在可信范围内。
    // 原来四处都是 parseFloat，于是 T 999℃ 会在体格检查里写成「T ／℃」
    // （buildVitals 已经挡了），却在诊断提示里给出 vital:tempUp，两边打架。
    const v = (r.pe || {}).vitals || {};
    const vital = k => (typeof GENERATOR !== 'undefined' && GENERATOR.vitalNum)
      ? GENERATOR.vitalNum(v, k) : null;
    const tv = vital('temperature');
    if (tv) {
      if (tv.num >= 37.3) F.add('vital:tempUp');
      if (tv.num <= 36) F.add('vital:tempDown');
    }
    const pv = vital('pulse');
    if (pv) {
      if (pv.num > 100) F.add('vital:tachy');
      if (pv.num < 60) F.add('vital:brady');
    }
    const rv = vital('respiration');
    if (rv && rv.num > 20) F.add('vital:tachypnea');
    const sv = vital('sbp'), dv = vital('dbp');
    if (sv) {
      if (sv.num >= 140) { F.add('vital:bpUp'); F.add('risk:htn'); }
      if (sv.num < 90) F.add('vital:bpDown');
    }
    if (dv && dv.num >= 90) F.add('vital:bpUp');
    const hv = vital('height'), wv = vital('weight');
    if (hv && wv) {
      const bmi = wv.num / Math.pow(hv.num / 100, 2);
      if (bmi >= 28) F.add('vital:bmiHigh');
      if (bmi < 18.5) F.add('vital:bmiLow');
    }

    // 体格检查：异常项用 pe: 与 pev: 两种键
    //
    // 两个必须在这里处理的兼容问题：
    //   ① 默认值比对不能用 `val === it.default`：t2 按评分表重写了腹部四项的默认
    //      文案，旧存档里存的是旧文案（legacyDefault），只比 default 会把一个完全
    //      正常的腹部读成 4 条阳性发现。统一交给 SCHEMA.peValueIsDefault。
    //   ② 查体项拆分后（父项保留 + 新增子项），用户改用子项时父项会保持默认值，
    //      于是 pe:组.父项 永远不产生，而 47 条规则里的 must 恰恰指着父项
    //      → 规则会静默失效（不报错、只是不再提示）。所以子项一旦是异常值，
    //      必须把对应的旧聚合 key 一并激活。映射表见 PE_ALIAS。
    // 统一去掉尾部标点后再生成 pev: 键。
    // 用户在文本框里补一个句号（"右下腹压痛、反跳痛。"）时，
    // 若用原始串拼 key，值别名映射会精确匹配失败，规则静默丢掉一条 match（评审 medium-3）。
    const normVal = s => String(s).trim().replace(/[，,；;。.、\s]+$/g, '');

    (SCHEMA.PE_COMMON || []).forEach(g => {
      g.items.forEach(it => {
        // 勾选制：这次没查的项不能参与任何记分。取消勾选 ≠ 检查正常，
        // 它只是「没查」——不写进病历，也不该给出诊断提示。
        if (SCHEMA.peChecked && !SCHEMA.peChecked(r, g.key, it.key)) return;
        const val = (GENERATOR.peValue ? GENERATOR.peValue(r, g.key, it) : '') || '';
        if (!val) return;
        if (SCHEMA.peValueIsDefault ? SCHEMA.peValueIsDefault(it, val) : (it.default && val === it.default)) return;
        // 子项默认值是空字符串，用户很可能直接选「正常」那条（item.normal）。
        // 选正常 = 没异常，不能产生 pe: / pev:，否则会凭空触发诊断提示。
        if (it.normal && normVal(val) === normVal(it.normal)) return;
        const v = normVal(val);
        if (!v) return;   // 只有一个标点的输入不算阳性
        F.add(`pe:${g.key}.${it.key}`);
        F.add(`pev:${g.key}.${it.key}=${v}`);
        // 子项阳性 → 同步激活旧聚合 key，并折算成父项规则认识的值
        const fullKey = `${g.key}.${it.key}`;
        (PE_ALIAS[fullKey] || []).forEach(parentRef => { F.add(`pe:${parentRef}`); });
        (PE_VALUE_ALIAS[`${fullKey}=${v}`] || []).forEach(k => F.add(k));
      });
    });
    const deptKey = b.department || 'general';
    const dept = (SCHEMA.DEPARTMENTS || []).find(d => d.key === deptKey);
    ((dept && dept.special) || []).forEach(sp => {
      (((SCHEMA.PE_SPECIAL[sp] || {}).items) || []).forEach(it => {
        // 同上：专科项默认未勾，没勾就是这次没查，不计分、不提示
        if (SCHEMA.peChecked && !SCHEMA.peChecked(r, 'special_' + sp, it.key)) return;
        const val = (GENERATOR.peValue ? GENERATOR.peValue(r, 'special_' + sp, it) : '') || '';
        if (!val) return;
        if (SCHEMA.peValueIsDefault ? SCHEMA.peValueIsDefault(it, val) : (it.default && val === it.default)) return;
        const v = normVal(val);
        if (!v) return;
        F.add(`pe:special_${sp}.${it.key}`);
        F.add(`pev:special_${sp}.${it.key}=${v}`);
      });
    });

    // 辅助检查关键词
    const auxText = (((r.auxiliary || {}).items) || [])
      .map(i => (i.name || '') + (i.result || '')).join(' ').toLowerCase();
    ['胸片', '超声', '心电图', '血常规', '尿常规', '淀粉酶', '脂肪酶', '血红蛋白', '尿蛋白', '大便',
      '胃镜', '幽门螺杆菌', '隐血', '腹部平片', '腹部ct',
      'CRP', '降钙素原', '乳酸', '血培养', '肌酐', '肝肾功能',
      /* 三个专科性很强的关键词：
       * 胆碱酯酶 → 有机磷中毒的解毒靶点，别处不会查；
       * 脑脊液、肌电图 → 吉兰-巴雷与中枢感染的客观依据（蛋白-细胞分离、传导速度减慢）。
       * 目前没有别的规则引用这三个 aux 键，所以只加词、不改任何既有规则得分。 */
      '胆碱酯酶', '脑脊液', '肌电图',
      /* 精神科：
       * 量表（HAMD/PHQ-9/PANSS/YMRS 等都是「××量表」或英文缩写）、
       * 甲状腺功能（抑郁/焦虑必须先排甲减甲亢）、血药浓度（锂盐/丙戊酸）、
       * 头颅 CT/MRI（排除器质性精神障碍）。
       * auxText 已 toLowerCase()，所以比较时统一 .toLowerCase()；生成的特征键
       * 保留原写法（aux:HAMD 等），与既有 aux:CRP 的写法一致。
       * 注意「头颅CT」会同时被下面那条 includes('ct') 加上通用的 aux:CT——
       * 这是既有行为，不改；精神科规则不引用 aux:CT，故不受影响。 */
      '甲状腺功能', '量表', 'HAMD', 'PHQ', 'PANSS', 'YMRS', '血药浓度', '头颅CT', '头颅MRI']
      .forEach(k => { if (auxText.includes(k.toLowerCase())) F.add('aux:' + (k === '腹部ct' ? 'CT' : k)); });
    if (auxText.includes('ct')) F.add('aux:CT');

    // 人口学
    if (b.gender === '女') F.add('gender:女');
    const age = parseInt(b.age, 10);
    if (!isNaN(age)) {
      if (age >= 65) F.add('age:elderly');
      if (age >= 14 && age <= 49) F.add('age:fertile');
      if (age < 14) F.add('age:child');
    }
    const lmp = (r.menstruation || {}).lmp || '';
    if (/停经|推迟|未至|闭经|未来/.test(lmp)) F.add('menstruation:delay');

    return F;
  }

  /**
   * 计算提示
   * @returns [{ id, name, hint, note, matched:[...], score, deptMatch }]
   */
  function analyze(r) {
    const F = extractFindings(r);
    const deptKey = (r.basic || {}).department || 'general';
    const out = [];
    RULES.forEach(rule => {
      // 科室过滤。`depts` 的本意是「这条规则适用于哪些科室」，'general' 是一位
      // 「通用科也适用」的标记，不是「到处都适用」的通行证。
      //
      // 这里原来写的是 `deptKey === 'general' || depts.includes(deptKey) || depts.includes('general')`，
      // 最后那个分支让凡是列了 'general' 的规则在所有科室都放行——37 条规则因此
      // 泄漏到不相干的科室（消化内科病历里弹「肾病综合征」，精神科弹「慢性肾脏病」，
      // 产科弹「化脓性阑尾炎」）。实测 220 条提示里 68 条是越界的（30.9%）。
      //
      // 现在分两种情况：
      //   · 学生选了通用科 —— 就是「还没定科室」，所有规则都该参与，全部放行；
      //   · 学生选了具体科室 —— 只有规则明确列了这个科室才算数。
      // 规则里的 'general' 只表示「通用科也适用」，不再有跨科室的效力。
      const depts = rule.depts || [];
      const inDept = deptKey === 'general' || depts.includes(deptKey);
      if (!inDept) return;

      const matched = rule.match.filter(m => F.has(m));
      if (matched.length < (rule.need || 2)) return;

      // 必要条件：必须命中其中至少一条，否则不提示（防止仅凭发热/心率就误报）
      if (rule.must && rule.must.length) {
        const mustHit = rule.must.some(m => F.has(m));
        if (!mustHit) return;
      }

      out.push({
        id: rule.id,
        name: rule.name,
        hint: rule.hint,
        note: rule.note,
        matched,
        score: matched.length / (rule.need || 2),
        deptMatch: deptKey === 'general' || depts.includes(deptKey)
      });
    });
    out.sort((a, b2) => (b2.deptMatch - a.deptMatch) || (b2.score - a.score));
    return out;
  }

  return { RULES, analyze, extractFindings, PE_ALIAS, PE_VALUE_ALIAS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HINTS;
}
