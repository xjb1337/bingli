/* 模板病例：支气管扩张症伴咯血（右下肺，铜绿假单胞菌感染）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：童年麻疹肺炎或百日咳后反复咳嗽咳大量脓痰，痰液收集后分层
 * （上层泡沫、中层浑浊黏液、下层脓性成分、最下层坏死组织），间断咯血；
 * 病变部位固定，下肺可闻及固定性湿啰音，久病者出现杵状指。
 * HRCT 见柱状或囊状扩张、印戒征，是确诊依据；痰培养常见铜绿假单胞菌。
 *
 * 说明：胸部查体的可选描述是固定词汇表，「固定性湿啰音」这类写法词表里没有，
 * 已写在 hint 里提示学生自己听、自己记，查体段只写词表里逐字有的那几条。
 * 生命体征（体温/脉搏/呼吸/血压/身高/体重）一律留空，由学生自己测、自己填。
 */
module.exports = {
  key: 'bronchiectasis',
  dept: 'respiratory',
  name: '支气管扩张症伴咯血',
  alias: ['支气管扩张', '支气管扩张症', '支扩', '咯血', '干性支气管扩张'],
  hint: '幼年麻疹肺炎后反复咳嗽、咳大量脓痰，晨起为著、痰液静置后分层，间断咯血；下肺可闻及固定性湿啰音，可见杵状指，HRCT示柱状及囊状扩张',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '四川成都',
      birthPlace: '四川成都',
      occupation: '小学教师',
      reliability: '可靠',
      chiefComplaint: '反复咳嗽咳脓痰10年，咯血3天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '10余年前起反复咳嗽、咳痰，多于晨起及体位改变时明显，每次痰量约100ml，为黄色脓痰，静置后分为三层，每年发作3至5次，每次持续2至4周，抗感染治疗后可缓解',
      cause: '幼年曾患麻疹肺炎，住院治疗半个月；本次发作前3天受凉，无醉酒及误吸，无肺结核接触史',
      symptoms: '咳嗽为阵发性连声咳，晨起及卧床翻身时加重，痰量增至每日约200ml，为黄绿色脓痰，黏稠有臭味；咯血为痰中带血至整口鲜血，每日3至5次，每次约20至30ml，色鲜红，无血块',
      relief: '自服云南白药及头孢克洛后咯血略减少，咳嗽咳痰无缓解',
      evolution: '入院前1天咯血增至每次约50ml，伴胸闷、心慌，遂来急诊',
      accompanying: '伴低热，体温波动于37.5至38.0度，乏力、食欲减退',
      negativeDiscriminating: '无午后高热及寒战，无盗汗及明显消瘦，无胸痛及呼吸困难，无下肢水肿及长期卧床史，无鼻出血及牙龈出血，无皮肤瘀点瘀斑',
      treatment: '本次发作后口服头孢克洛0.25g每日3次共5天、云南白药胶囊2粒每日3次共3天，咯血减少但痰量未减；既往急性加重期曾静脉使用头孢他啶2g每日2次，疗程10天，疗效可',
      generalCondition: '发病以来精神一般，食欲减退，睡眠因咳嗽及咯血受影响，大小便正常，体重无明显变化',
      extra: '入院后留取痰培养及痰抗酸染色，完善HRCT，予体位引流及止血治疗'
    },
    ros: {
      resp: {
        cough: { checked: true, detail: '反复咳嗽10余年，晨起及体位改变时加重' },
        sputum: { checked: true, detail: '每日约200ml黄绿色脓痰，静置后分层' },
        hemoptysis: { checked: true, detail: '间断咯血3天，每日3至5次，每次约20至50ml，色鲜红' },
        fever: { checked: true, detail: '低热，体温波动于37.5至38.0度' },
        chestPainResp: { negative: true },
        dyspnea: { negative: true },
        nightSweat: { negative: true },
        wheeze: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '咯血后心慌' },
        edemaCardio: { negative: true },
        cyanosis: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        hematemesis: { negative: true }
      },
      hemat: {
        bleeding: { checked: true, detail: '咯血，无鼻出血及牙龈出血' },
        purpura: { negative: true },
        epistaxis: { negative: true }
      },
      endocrine: { weightLoss: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '幼年患麻疹肺炎，住院治疗半个月；否认高血压、糖尿病、冠心病史；否认结核及病毒性肝炎病史',
      longTermMeds: '无长期口服药物',
      infection: '否认结核、肝炎等传染病史，否认结核病人密切接触史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及有害气体接触史',
      vaccine: '按计划预防接种，未接种流感疫苗及肺炎链球菌疫苗',
      allergy: '无',
      relatedHistory: '否认长期使用糖皮质激素及免疫抑制剂，否认幼年反复下呼吸道感染以外的其他诱因',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '四川成都，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认粉尘、石棉及放射性物质接触史',
      environment: '',
      habits: '',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '小学教师，无工业毒物及粉尘接触，常年用嗓、工作环境人员密集'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中类似疾病患者',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '慢性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺可闻及湿性啰音',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
      },
      special_respiratory: {
        respAccessory: '未见辅助呼吸肌参与呼吸运动，三凹征阴性',
        respCyanosis: '杵状指'
      }
    },
    auxiliary: {
      items: [
        { name: '胸部HRCT', result: '右下肺基底段见多发柱状及囊状支气管扩张，管壁增厚，呈印戒征及双轨征，周围见斑片状渗出影，未见空洞及胸膜腔积液', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 12.8×10⁹/L，中性粒细胞 78.2%，Hb 118g/L，PLT 246×10⁹/L', date: '', hospital: '', no: '' },
        { name: '痰培养', result: '检出铜绿假单胞菌，对哌拉西林他唑巴坦、头孢他啶、环丙沙星敏感', date: '', hospital: '', no: '' },
        { name: '痰抗酸染色', result: '三次痰涂片抗酸染色均阴性', date: '', hospital: '', no: '' },
        { name: '动脉血气分析', result: 'pH 7.42，PaO2 78mmHg，PaCO2 38mmHg，SaO2 96%', date: '', hospital: '', no: '' }
      ]
    },
    summary: '患者因“反复咳嗽、咳大量脓痰10余年，间断咯血3天”入院。10余年来反复咳嗽，晨起为著，每日痰量约100ml，为黄色脓痰、静置后分层；3天前受凉后痰量增至每日约200ml并转为黄绿色脓痰，间断咯血，每次约20至50ml，伴低热。幼年曾患麻疹肺炎。查体：营养不良，慢性病容，双肺可闻及湿性啰音，可见杵状指。HRCT示右下肺基底段柱状及囊状支气管扩张伴周围渗出；痰培养检出铜绿假单胞菌；痰抗酸染色三次阴性；血Hb 118g/L。无午后高热及盗汗、无消瘦明显，痰抗酸染色阴性，可与肺结核鉴别；无胸痛及呼吸困难、无下肢水肿及长期卧床史，可与肺栓塞鉴别',
    soap: {
      a: {
        basisDetail: [
          {
            diagnosis: '支气管扩张症伴咯血',
            history: '幼年患麻疹肺炎；10余年来反复咳嗽、咳大量脓痰，晨起为著、痰液静置后分层；3天前受凉后痰量增多、转为黄绿色脓痰，间断咯血，每次约20至50ml',
            pe: '营养不良，慢性病容，双肺可闻及湿性啰音，可见杵状指',
            aux: '胸部HRCT示右下肺基底段多发柱状及囊状支气管扩张，呈印戒征及双轨征，周围见斑片状渗出；痰培养检出铜绿假单胞菌'
          },
          {
            diagnosis: '铜绿假单胞菌肺炎',
            history: '受凉后痰量增多、转为黄绿色脓痰，伴低热',
            pe: '双肺可闻及湿性啰音',
            aux: '痰培养检出铜绿假单胞菌，对哌拉西林他唑巴坦、头孢他啶敏感；血WBC 12.8×10⁹/L、中性粒细胞78.2%'
          },
          {
            diagnosis: '轻度贫血',
            history: '长期反复咯血及慢性感染消耗',
            pe: '',
            aux: '血常规Hb 118g/L，PLT 246×10⁹/L'
          }
        ]
      }
    },
    diagnosis: {
      confirmed: ['支气管扩张症伴咯血', '铜绿假单胞菌肺炎', '轻度贫血']
    }
  }
};
