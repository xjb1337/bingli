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
      must: ['ros:general.nightSweat','ros:general.weightLoss','ros:resp.hemoptysis','pmh:肺结核'],
      need: 2,
      match: ['ros:general.nightSweat', 'ros:general.weightLoss', 'ros:general.fever',
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
      must: ['vital:bpUp'],
      need: 1,
      match: ['vital:bpUp'],
      hint: '血压升高需考虑原发性高血压，注意排除继发性因素。',
      note: '可补充：不同日多次测量、24h动态血压、尿常规、肾功能、眼底检查、心脏超声、血脂血糖。'
    },
    {
      id: 'valve', name: '心脏瓣膜病',
      depts: ['cardiology', 'general'],
      must: ['pe:chest.heartAuscultation'],
      need: 1,
      match: ['pev:chest.heartAuscultation=心尖区可闻及收缩期杂音',
        'pev:chest.heartAuscultation=主动脉瓣区可闻及舒张期杂音'],
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
      must: ['cc:上腹痛','ros:gi.vomiting','aux:淀粉酶','aux:脂肪酶'],
      need: 2,
      match: ['cc:上腹痛', 'cc:腹痛', 'ros:gi.vomiting', 'risk:alcohol', 'aux:淀粉酶', 'aux:脂肪酶',
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
        'pev:abdomen.abdPalpation=上腹部压痛，无反跳痛', 'pev:abdomen.abdPercussion=肝区叩击痛'],
      hint: '进食油腻后右上腹痛、放射至右肩背，需考虑胆囊炎/胆石症。',
      note: '可补充：腹部超声（首选）、血常规、肝功能、胆红素、腹部CT。'
    },
    {
      id: 'appendicitis', name: '急性阑尾炎',
      depts: ['surgery', 'emergency', 'general'],
      must: ['pe:abdomen.abdPalpation'],
      need: 2,
      match: ['cc:转移性右下腹痛', 'ros:general.fever', 'vital:tempUp',
        'pev:abdomen.abdPalpation=右下腹压痛、反跳痛', 'pev:abdomen.abdPalpation=全腹压痛、反跳痛，腹肌紧张'],
      hint: '转移性右下腹痛伴右下腹固定压痛/反跳痛，需考虑急性阑尾炎。',
      note: '可补充：血常规、腹部超声或CT、尿常规；育龄女性加做尿妊娠试验。'
    },
    {
      id: 'obstruction', name: '肠梗阻',
      depts: ['surgery', 'emergency', 'general'],
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
        'pev:abdomen.abdInspect=腹部膨隆'],
      hint: '肝病背景 + 腹水、侧支循环开放，需考虑肝硬化。',
      note: '可补充：肝功能、凝血功能、血氨、腹部超声（门脉宽度、脾大）、胃镜评估静脉曲张。'
    },

    /* ------------------------------ 肾脏 ------------------------------ */
    {
      id: 'ckd', name: '慢性肾脏病',
      depts: ['nephrology', 'general', 'endocrinology', 'cardiology'],
      must: ['ros:gu.oliguria','ros:gu.hematuria','pe:abdomen.abdPercussion','pmh:慢性肾脏病'],
      need: 2,
      match: ['ros:gu.oliguria', 'ros:gu.edemaGu', 'ros:gu.hematuria', 'pmh:慢性肾脏病',
        'pmh:糖尿病', 'pmh:高血压', 'pev:abdomen.abdPercussion=双肾区叩击痛'],
      hint: '水肿、尿量改变、肾区叩击痛或高血压/糖尿病病史，需考虑慢性肾脏病。',
      note: '可补充：尿常规+尿沉渣、尿蛋白/肌酐比、血肌酐+eGFR、泌尿系超声。'
    },
    {
      id: 'nephrotic', name: '肾病综合征',
      depts: ['nephrology', 'pediatrics', 'general'],
      must: ['ros:gu.edemaGu','pe:spine.limbs'],
      need: 2,
      match: ['ros:gu.edemaGu', 'ros:gu.oliguria', 'pev:spine.limbs=双下肢凹陷性水肿', 'aux:尿常规'],
      hint: '大量蛋白尿、低蛋白血症、明显水肿、高脂血症四联征，需考虑肾病综合征。',
      note: '可补充：24h尿蛋白定量、血清白蛋白、血脂、肾功能、免疫学检查。'
    },
    {
      id: 'uti', name: '泌尿系感染',
      depts: ['nephrology', 'general', 'emergency', 'gynecology'],
      must: ['ros:gu.dysuria','pe:abdomen.abdPercussion'],
      need: 2,
      match: ['ros:gu.dysuria', 'vital:tempUp', 'ros:general.fever',
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
      match: ['ros:endocrine.polydipsia', 'ros:endocrine.polyuriaEndo', 'ros:general.weightLoss',
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
      match: ['ros:endocrine.heatIntolerance', 'ros:general.weightLoss', 'ros:cardio.palpitation',
        'pev:neck.thyroid=甲状腺Ⅰ度肿大', 'pev:neck.thyroid=甲状腺Ⅱ度肿大', 'pev:neck.thyroid=甲状腺Ⅲ度肿大'],
      hint: '怕热多汗、心悸、消瘦伴甲状腺肿大，需考虑甲状腺功能亢进症。',
      note: '可补充：FT3/FT4/TSH、TRAb、甲状腺超声、心电图。'
    },
    {
      id: 'hypothyroid', name: '甲状腺功能减退症',
      depts: ['endocrinology', 'general'],
      must: ['ros:endocrine.coldIntolerance','pe:neck.thyroid'],
      need: 2,
      match: ['ros:endocrine.coldIntolerance', 'ros:general.fatigue', 'ros:general.weightGain',
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

    /* ------------------------------ 血液 ------------------------------ */
    {
      id: 'anemia', name: '贫血',
      depts: ['hematology', 'general', 'digestive', 'gynecology', 'pediatrics'],
      must: ['ros:hemat.anemia','pe:skin.color','aux:血红蛋白'],
      need: 1,
      match: ['ros:hemat.anemia', 'pev:skin.color=皮肤黏膜苍白', 'ros:general.fatigue', 'aux:血红蛋白'],
      hint: '乏力、面色苍白，需考虑贫血，并进一步明确病因（缺铁性/巨幼细胞性/失血性等）。',
      note: '可补充：血常规+网织红细胞、铁代谢、叶酸/B12、大便隐血、必要时胃肠镜及妇科评估。'
    },
    {
      id: 'leukemia', name: '白血病 / 血液系统恶性肿瘤',
      depts: ['hematology', 'pediatrics', 'general'],
      must: ['ros:hemat.bleeding','ros:hemat.bruise','ros:hemat.lymphNode','ros:hemat.bonePain','pe:special_hematology.hemExtra'],
      need: 2,
      match: ['ros:hemat.bleeding', 'ros:hemat.bruise', 'ros:hemat.lymphNode', 'ros:hemat.bonePain',
        'pev:special_hematology.hemExtra=胸骨压痛', 'pev:skin.lymph=双侧颈部可触及肿大淋巴结'],
      hint: '发热、出血倾向、淋巴结肿大、胸骨压痛，需警惕造血系统恶性肿瘤。',
      note: '可补充：血常规+外周血涂片、骨髓穿刺+活检、免疫分型、染色体/FISH、乳酸脱氢酶。'
    },
    {
      id: 'itp', name: '血小板减少相关出血',
      depts: ['hematology', 'general'],
      must: ['pe:skin.rash','ros:hemat.bruise'],
      need: 1,
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
        'ros:head.headache', 'pmh:脑卒中',
        'pev:special_neurology.neuroExtra3=偏瘫', 'pev:special_neurology.neuroExtra3=四肢肌力4级'],
      hint: '突发偏侧肢体无力/麻木、言语不清，需警惕脑卒中。',
      note: '可补充：头颅CT（先除外出血）→MRI/DWI、NIHSS 评分、血糖血脂、心电监测；注意静脉溶栓时间窗。'
    },
    {
      id: 'meningitis', name: '中枢神经系统感染',
      depts: ['neurology', 'pediatrics', 'emergency'],
      must: ['ros:head.headache','pe:neck.neckResist','pe:nervousPE.nerve'],
      need: 2,
      match: ['vital:tempUp', 'ros:head.headache', 'ros:nervous.seizure',
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
      must: ['ros:head.vertigo','ros:head.tinnitus'],
      need: 1,
      match: ['ros:head.vertigo', 'ros:head.dizziness', 'ros:head.tinnitus'],
      hint: '眩晕伴耳鸣或听力下降，需考虑前庭周围性病变，注意排除中枢性眩晕。',
      note: '可补充：Dix-Hallpike 试验、听力检查、头颅MRI、必要时前庭功能检查。'
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
      id: 'preeclampsia', name: '妊娠期高血压疾病 / 子痫前期',
      depts: ['obstetrics'],
      must: ['aux:尿蛋白','ros:head.visionBlur','ros:head.headache','ros:head.visualBlur'],
      need: 2,
      match: ['vital:bpUp', 'ros:head.headache', 'aux:尿蛋白', 'ros:head.visualBlur'],
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
      must: ['age:child','pe:chest.lungAuscultation'],
      need: 3,
      match: ['vital:tempUp', 'ros:resp.cough', 'ros:resp.hyperpnea', 'ros:resp.dyspnea',
        'ros:resp.sputum',
        'pev:chest.lungAuscultation=双肺可闻及湿性啰音', 'pev:chest.lungAuscultation=右下肺可闻及湿性啰音'],
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
      match: ['ros:nervous.seizure', 'vital:tempUp'],
      hint: '发热伴抽搐，需考虑热性惊厥，同时排除中枢神经系统感染。',
      note: '可补充：详细惊厥发作描述、血糖电解质、头颅影像（有指征时）、脑电图（反复发作时）。'
    },

    /* ------------------------------ 急诊 ------------------------------ */
    {
      id: 'sepsis', name: '脓毒症',
      depts: ['emergency', 'general', 'respiratory', 'digestive', 'surgery'],
      must: ['vital:tempUp','vital:tempDown','pmh:糖尿病'],
      need: 3,
      match: ['vital:tempUp', 'vital:tachy', 'vital:tachypnea', 'ros:general.chills',
        'pev:general.conscious=神志清楚，精神差'],
      hint: '感染灶 + 心率增快、呼吸急促、意识改变，需警惕脓毒症（qSOFA）。',
      note: '可补充：血培养（抗菌药物使用前）、乳酸、血常规+CRP+PCT、器官功能评估、液体复苏评估。'
    },
    {
      id: 'shock', name: '休克（需紧急处理）',
      depts: ['emergency', 'cardiology', 'general'],
      must: ['vital:bpDown','pev:skin.color=口唇及肢端发绀','pev:general.conscious=神志清楚，精神差','pev:general.conscious=嗜睡','pev:general.conscious=昏睡'],
      need: 2,
      match: ['vital:bpDown', 'vital:tachy', 'vital:tachypnea',
        'pev:skin.color=口唇及肢端发绀', 'pev:general.conscious=神志清楚，精神差'],
      hint: '血压下降、心率增快、皮肤湿冷、意识改变，提示存在休克，需立即处理。',
      note: '建议立即：建立静脉通路、心电监护、血气+乳酸、床旁超声评估容量状态、明确休克类型。'
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

  /* ---------------------- 从病历中抽取"发现" ---------------------- */

  function extractFindings(r) {
    const F = new Set();
    const b = r.basic || {};

    // 主诉 + 现病史关键词
    // 注意：先剔除否定从句（"无咯血、盗汗""否认胸痛"），否则阴性描述会被误判为阳性
    // 刻意不纳入 hpi.negativeDiscriminating：它是整段阴性病史，"无咯血、盗汗、消瘦"
    // 按顿号切开后「盗汗」「消瘦」会丢掉否定前缀，反而被误判成阳性。
    const rawText = [
      b.chiefComplaint || '',
      (r.hpi || {}).onset || '', (r.hpi || {}).cause || '',
      (r.hpi || {}).symptoms || '', (r.hpi || {}).relief || '',
      (r.hpi || {}).evolution || '', (r.hpi || {}).accompanying || ''
    ].join('，');
    const NEG_RE = /^(无|未|不|否认|没有|未见|未出现|无明显|无明|否认有)/;
    const textAll = rawText
      .split(/[，,。；;、\n]/)
      .filter(clause => clause.trim() && !NEG_RE.test(clause.trim()))
      .join('，');

    const ccKeys = ['发热', '咳嗽', '咳痰', '咯血', '呼吸困难', '气促', '喘息', '胸闷', '胸痛',
      '心悸', '上腹痛', '腹痛', '转移性右下腹痛', '右上腹痛', '腹泻', '呕吐', '腹胀', '黑便',
      '呕血', '黄疸', '水肿', '血尿', '头痛', '头晕', '乏力', '消瘦'];
    ccKeys.forEach(k => { if (textAll.includes(k)) F.add('cc:' + k); });

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
      '痛风', '甲状腺功能亢进', '甲状腺功能减退', '类风湿关节炎', '肺结核']
      .forEach(dz => { if (pmhText.includes(dz)) F.add('pmh:' + dz); });

    // 个人史
    const per = r.personal || {};
    if (per.smoking === '有' || per.smoking === '已戒') F.add('smoke:有');
    if (per.smoking === '有' || per.smoking === '已戒') F.add('risk:smoke');
    if (per.drinking === '有' || per.drinking === '已戒') F.add('risk:alcohol');
    if (String((r.pmh || {}).trauma || '').trim()) F.add('trauma:有');

    // 生命体征
    const v = (r.pe || {}).vitals || {};
    const t = parseFloat(v.temperature);
    if (!isNaN(t)) {
      if (t >= 37.3) F.add('vital:tempUp');
      if (t <= 36) F.add('vital:tempDown');
    }
    const p = parseFloat(v.pulse);
    if (!isNaN(p)) {
      if (p > 100) F.add('vital:tachy');
      if (p < 60) F.add('vital:brady');
    }
    const rr = parseFloat(v.respiration);
    if (!isNaN(rr) && rr > 20) F.add('vital:tachypnea');
    const sbp = parseFloat(v.sbp), dbp = parseFloat(v.dbp);
    if (!isNaN(sbp)) {
      if (sbp >= 140) { F.add('vital:bpUp'); F.add('risk:htn'); }
      if (sbp < 90) F.add('vital:bpDown');
    }
    if (!isNaN(dbp) && dbp >= 90) F.add('vital:bpUp');
    const hgt = parseFloat(v.height), wgt = parseFloat(v.weight);
    if (!isNaN(hgt) && !isNaN(wgt) && hgt > 0) {
      const bmi = wgt / Math.pow(hgt / 100, 2);
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
    ['胸片', '超声', '心电图', '血常规', '尿常规', '淀粉酶', '脂肪酶', '血红蛋白', '尿蛋白', '大便']
      .forEach(k => { if (auxText.includes(k)) F.add('aux:' + k); });
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
      // 专科规则：本科室或通用科才提示（儿科/妇产等规则不会出现在内科病历里）
      const depts = rule.depts || [];
      const inDept = deptKey === 'general' || depts.includes(deptKey) || depts.includes('general');
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
