/* 模板病例：慢性阻塞性肺疾病急性加重（AECOPD）合并Ⅱ型呼吸衰竭
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：长期吸烟 + 慢性咳嗽咳痰 20 年 + 逐年加重的活动后气促，是慢阻肺病的典型自然史；
 * 急性加重的判据是气促加重、痰量增多、痰变脓三项同时恶化。体征是桶状胸、语颤减弱、
 * 叩诊过清音、肺下界下移、呼吸音减弱伴呼气相延长。
 * Ⅱ型呼吸衰竭按动脉血气判断：海平面静息呼吸空气时 PaO2＜60mmHg 且 PaCO2＞50mmHg。
 *
 * 说明：胸部查体的可选描述是固定词汇表，「呼气相延长」「心浊音界缩小」这类写法词表里没有，
 * 呼气相延长写在 hint 里提醒学生自己听、自己记，查体段只写词表里逐字有的那几条。
 * 生命体征（体温/脉搏/呼吸/血压/身高/体重）一律留空，由学生自己测、自己填。
 */
module.exports = {
  key: 'copd',
  dept: 'respiratory',
  name: '慢性阻塞性肺疾病急性加重（Ⅱ型呼吸衰竭）',
  alias: ['慢阻肺', 'COPD', 'AECOPD', '慢性阻塞性肺疾病', '肺气肿', 'Ⅱ型呼吸衰竭'],
  hint: '长期吸烟、慢性咳嗽咳痰 20 年，近 1 周气促加重痰变脓；桶状胸、语颤减弱、叩诊过清音、呼吸音减弱且呼气相延长，血气提示二氧化碳潴留',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河北唐山',
      birthPlace: '河北唐山',
      occupation: '退休工人',
      reliability: '可靠',
      chiefComplaint: '反复咳嗽、咳痰20年，气促加重1周',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '20年前无明显诱因出现反复咳嗽、咳白色黏液痰，多于冬春季节及受凉后发作，每年累计3个月以上，连续2年以上',
      cause: '本次加重前1周受凉，无醉酒及误吸，无粉尘及刺激性气体急性接触史',
      symptoms: '咳嗽为晨起及夜间为著的连声咳，痰量由每日约20ml增至每日约60ml，由白色黏液痰转为黄色脓痰，黏稠不易咳出；气促由原先平地快走时出现，加重至穿衣、洗漱等日常活动即感呼吸困难，伴喘息及胸闷',
      relief: '自行加用沙丁胺醇气雾剂吸入后气促可短暂减轻，数小时后再次加重',
      evolution: '入院前3天出现嗜睡、反应迟钝，夜间不能平卧，需高枕卧位，遂由家属送来急诊',
      accompanying: '伴食欲明显减退、乏力，无发热及寒战',
      negativeDiscriminating: '无咯血及痰中带血，无夜间阵发性呼吸困难及双下肢水肿，无胸痛及晕厥，无长期卧床及单侧下肢肿胀史，无午后低热及盗汗',
      treatment: '长期口服氨茶碱0.1g每日3次、间断吸入沙丁胺醇气雾剂；本次加重后于社区医院予头孢呋辛1.5g每日2次静脉滴注3天，口服泼尼松30mg每日1次连用5天，气促未见缓解',
      generalCondition: '发病以来精神差、嗜睡，食欲明显减退，睡眠因气促不能平卧而变差，小便量偏少，大便3日未解，体重近半年下降约3kg',
      extra: '入院后予低流量鼻导管吸氧，复查动脉血气并行无创通气评估'
    },
    ros: {
      resp: {
        cough: { checked: true, detail: '反复咳嗽20年，晨起及夜间为著，近1周加重' },
        sputum: { checked: true, detail: '痰量由每日约20ml增至约60ml，由白色黏液痰转为黄色脓痰' },
        dyspnea: { checked: true, detail: '气促进行性加重，穿衣洗漱即感呼吸困难，夜间不能平卧' },
        wheeze: { checked: true, detail: '喘息、胸闷，活动后明显' },
        hemoptysis: { negative: true },
        chestPainResp: { negative: true },
        nightSweat: { negative: true },
        fever: { negative: true }
      },
      cardio: {
        palpitation: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true }
      },
      endocrine: { weightLoss: { checked: true, detail: '近半年体重下降约3kg' } },
      nervous: {
        sleepDisorder: { checked: true, detail: '近3天嗜睡、反应迟钝' },
        headache: { negative: true }
      }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 慢性阻塞性肺疾病: true, 高血压: true },
      diseaseDetail: '慢性阻塞性肺疾病病史20年，近3年每年急性加重2至3次，曾因气促加重住院2次；高血压病史10年，长期口服缬沙坦80mg每日1次，血压控制尚可；否认糖尿病、冠心病史',
      longTermMeds: '氨茶碱0.1g每日3次口服，缬沙坦80mg每日1次口服，沙丁胺醇气雾剂按需吸入',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及有害气体接触史',
      vaccine: '按计划预防接种，近3年未接种流感疫苗及肺炎链球菌疫苗',
      allergy: '无',
      relatedHistory: '否认长期使用糖皮质激素及免疫抑制剂，否认职业性粉尘及棉尘长期接触史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '河北唐山，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟40年，每日约30支，未戒烟，累计约60包年',
      drinking: '有',
      drinkingAmount: '饮白酒20年，每日约100ml，未戒酒',
      drugs: '否认粉尘、石棉及放射性物质接触史',
      environment: '',
      habits: '',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事煤矿井下运输工作30年，有长期煤尘接触史，现已退休10年'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母已故，父亲因脑卒中去世，母亲因心脏病去世，死亡年龄不详',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中类似疾病患者',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '嗜睡',
        posture: '被动体位',
        face: '慢性病容',
        cooperation: '查体欠合作'
      },
      skin: {
        color: '口唇及肢端发绀',
        rash: '未见皮疹及出血点',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '口唇发绀'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '桶状胸',
        lungInspect: '呼吸运动减弱',
        lungPalpation: '语颤减弱',
        lungPercussion: '双肺叩诊过清音',
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
        respAccessory: '可见辅助呼吸肌参与呼吸运动',
        respChestExpansion: '肺下界移动度减小',
        respBreathSound: '双肺呼吸音减弱',
        respCyanosis: '口唇发绀'
      }
    },
    auxiliary: {
      items: [
        { name: '动脉血气分析（呼吸空气）', result: 'pH 7.32，PaO2 52mmHg，PaCO2 68mmHg，HCO3⁻ 32mmol/L，BE 5mmol/L，SaO2 86%', date: '', hospital: '', no: '' },
        { name: '肺功能（支气管舒张试验后）', result: 'FEV1/FVC 52%，FEV1占预计值45%，残气量占肺总量比值增高，支气管舒张试验阴性', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 11.6×10⁹/L，中性粒细胞 82.4%，Hb 148g/L，PLT 196×10⁹/L', date: '', hospital: '', no: '' },
        { name: '胸部X线片', result: '双肺透亮度增高，肺纹理增粗紊乱，肋间隙增宽，双侧膈肌低平，心影狭长', date: '', hospital: '', no: '' },
        { name: '痰培养', result: '检出肺炎克雷伯菌，对头孢哌酮舒巴坦、左氧氟沙星敏感', date: '', hospital: '', no: '' }
      ]
    },
    summary: '患者因“反复咳嗽、咳痰20年，气促加重1周”入院。20年来反复咳嗽咳痰，冬春季为著；1周前受凉后气促进行性加重，痰量增多并由白转黄，夜间不能平卧，近3天出现嗜睡。吸烟40年，每日约30支。查体：嗜睡，口唇发绀，桶状胸，语颤减弱，双肺叩诊过清音、可闻及湿性啰音，呼吸音减弱，肺下界移动度减小，可见辅助呼吸肌参与呼吸运动。血气 pH 7.32、PaO2 52mmHg、PaCO2 68mmHg；肺功能 FEV1/FVC 52%；胸片示肺气肿征。无咯血、无夜间阵发性呼吸困难及双下肢水肿，可与左心衰竭鉴别；无午后低热及盗汗，可与肺结核鉴别',
    soap: {
      a: {
        basisDetail: [
          {
            diagnosis: '慢性阻塞性肺疾病急性加重',
            history: '吸烟40年、每日约30支，慢性咳嗽咳痰20年、每年累计3个月以上；近1周受凉后气促加重、痰量增多并由白色黏液痰转为黄色脓痰，伴喘息胸闷',
            pe: '桶状胸，语颤减弱，双肺叩诊过清音，双肺可闻及湿性啰音，呼吸音减弱，肺下界移动度减小，可见辅助呼吸肌参与呼吸运动',
            aux: '肺功能 FEV1/FVC 52%、FEV1占预计值45%，支气管舒张试验阴性；胸部X线片示双肺透亮度增高、肋间隙增宽、膈肌低平'
          },
          {
            diagnosis: 'Ⅱ型呼吸衰竭',
            history: '气促进行性加重，夜间不能平卧，近3天嗜睡、反应迟钝',
            pe: '嗜睡，口唇发绀，可见辅助呼吸肌参与呼吸运动',
            aux: '动脉血气分析（呼吸空气）pH 7.32，PaO2 52mmHg，PaCO2 68mmHg，SaO2 86%'
          },
          {
            diagnosis: '高血压病2级（高危）',
            history: '高血压病史10年，长期口服缬沙坦80mg每日1次，血压控制尚可',
            pe: '',
            aux: ''
          }
        ]
      }
    },
    diagnosis: {
      confirmed: ['慢性阻塞性肺疾病急性加重', 'Ⅱ型呼吸衰竭', '高血压病2级（高危）']
    }
  }
};
