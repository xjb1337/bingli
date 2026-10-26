/* 模板病例：支气管哮喘急性发作（中度）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：发作性喘息、胸闷、咳嗽，接触过敏原或冷空气诱发，夜间及凌晨加重，
 * 可自行缓解或经平喘药缓解，是哮喘最重要的临床特征。发作时双肺弥漫哮鸣音、呼气相延长。
 * 中度发作的判据是讲话时有中断、喜坐位、呼吸频率增加、可闻及响亮哮鸣音，
 * 尚能完成单句表达，没有意识改变与「沉默肺」。
 *
 * 说明：胸部查体的可选描述是固定词汇表，「呼气相延长」这类写法词表里没有，
 * 已写在 hint 里提示学生自己听、自己记，查体段只写词表里逐字有的那几条。
 * 生命体征（体温/脉搏/呼吸/血压/身高/体重）一律留空，由学生自己测、自己填。
 */
module.exports = {
  key: 'asthma',
  dept: 'respiratory',
  name: '支气管哮喘急性发作（中度）',
  alias: ['支气管哮喘', '哮喘', '哮喘急性发作', '过敏性哮喘', '支气管哮喘急性发作'],
  hint: '接触过敏原或冷空气后发作性喘息、胸闷，夜间及凌晨加重，可自行缓解；双肺弥漫哮鸣音伴呼气相延长，支气管舒张试验阳性',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '广东广州',
      birthPlace: '广东广州',
      occupation: '公司职员',
      reliability: '可靠',
      chiefComplaint: '发作性喘息伴胸闷3年，加重1天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '3年前春季花粉季首次出现发作性喘息、胸闷，此后每年春季及秋冬交替时反复发作，每次持续数十分钟至数小时，可自行或经吸入沙丁胺醇后缓解',
      cause: '本次发作前1天打扫房间、接触尘螨及冷空气，无呼吸道感染及剧烈运动，未服用阿司匹林类药物',
      symptoms: '喘息为呼气相为主的呼气性呼吸困难，伴双肺广泛哮鸣音，胸闷明显，讲话需停顿换气，夜间及凌晨2至4时加重，不能平卧，需坐起前倾位才能稍缓解',
      relief: '自用沙丁胺醇气雾剂吸入2喷后胸闷稍减轻，2小时后再次加重，间隔4小时共吸入6喷，缓解不完全',
      evolution: '入院前6小时喘息持续加重，讲话不成句，口唇发麻，家属送至急诊',
      accompanying: '伴咳嗽、咳少量白色黏痰，无明显发热',
      negativeDiscriminating: '无粉红色泡沫样痰，无夜间阵发性呼吸困难及双下肢水肿，无咯血及痰中带血，无午后低热及盗汗，无长期吸烟史，无胸痛及单侧下肢肿胀',
      treatment: '沙丁胺醇气雾剂每次2喷按需吸入，共6喷，缓解不完全；既往未规律吸入糖皮质激素，未口服白三烯受体拮抗剂',
      generalCondition: '发病以来精神紧张、焦虑，食欲减退，睡眠因夜间喘息明显受影响，大小便正常，体重无明显变化',
      extra: '急诊予吸入沙丁胺醇联合异丙托溴铵雾化、静脉甲泼尼龙40mg，并复查肺功能及血气'
    },
    ros: {
      resp: {
        wheeze: { checked: true, detail: '发作性喘息，呼气相为主，夜间及凌晨加重' },
        dyspnea: { checked: true, detail: '呼气性呼吸困难，讲话需停顿换气，不能平卧' },
        cough: { checked: true, detail: '干咳为主，夜间及晨起明显' },
        sputum: { checked: true, detail: '咳少量白色黏痰，不易咳出' },
        chestPainResp: { negative: true },
        hemoptysis: { negative: true },
        fever: { negative: true },
        nightSweat: { negative: true },
        nasalObstruction: { checked: true, detail: '每逢发作期伴鼻塞、打喷嚏' }
      },
      cardio: {
        palpitation: { checked: true, detail: '发作时心悸，与吸入沙丁胺醇有关' },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        chestPainCardio: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true }
      },
      endocrine: { weightLoss: { negative: true } },
      nervous: {
        anxiety: { checked: true, detail: '发作时紧张、焦虑' },
        insomnia: { checked: true, detail: '夜间喘息影响睡眠' }
      }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 哮喘: true },
      diseaseDetail: '支气管哮喘病史3年，未规律吸入糖皮质激素控制，每年急性发作3至4次，均经雾化平喘治疗缓解；否认高血压、糖尿病、冠心病史',
      longTermMeds: '沙丁胺醇气雾剂按需吸入，未规律使用吸入性糖皮质激素',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及有害气体接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期使用口服糖皮质激素及免疫抑制剂，否认阿司匹林及非甾体抗炎药诱发喘息史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '广东广州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认粉尘、石棉及放射性物质接触史',
      environment: '居所近期新换地毯，家中养猫，卧室尘螨较多',
      habits: '',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无工业毒物及粉尘接触，工作压力较大、作息不规律'
    },
    marriage: { status: '未婚', age: '', spouseHealth: '', sexLife: '', relation: '' },
    family: {
      diseaseChecks: { 哮喘: true },
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '母亲有支气管哮喘病史，否认其他家族成员类似疾病',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '强迫体位',
        face: '急性病容',
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
        lungInspect: '呼吸浅快',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺可闻及哮鸣音',
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
        respBreathSound: '可闻及干啰音',
        respChestExpansion: '肺下界移动度减小',
        respCyanosis: '无杵状指，无球结膜水肿'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 8.6×10⁹/L，嗜酸性粒细胞 0.62×10⁹/L，嗜酸性粒细胞百分比 9.8%，Hb 138g/L', date: '', hospital: '', no: '' },
        { name: '血清总IgE', result: '412IU/ml，尘螨特异性IgE 3级阳性，花粉特异性IgE 2级阳性', date: '', hospital: '', no: '' },
        { name: '肺功能（支气管舒张试验）', result: '舒张前FEV1 1.62L（占预计值58%），吸入沙丁胺醇400μg后20分钟FEV1 1.94L，改善18%、绝对值增加320ml，FEV1/FVC 62%，支气管舒张试验阳性', date: '', hospital: '', no: '' },
        { name: '动脉血气分析', result: 'pH 7.44，PaO2 72mmHg，PaCO2 34mmHg，SaO2 93%', date: '', hospital: '', no: '' },
        { name: '胸部X线片', result: '双肺透亮度略增高，肺纹理清晰，未见实变影及占位性病变，心影大小正常', date: '', hospital: '', no: '' }
      ]
    },
    summary: '患者因“发作性喘息伴胸闷3年，加重1天”入院。3年来每年春秋季反复发作性喘息、胸闷，接触尘螨及冷空气诱发，夜间及凌晨加重，可经平喘药缓解；1天前再次发作并持续加重，讲话需停顿换气，不能平卧。母亲有哮喘病史。查体：强迫体位，急性病容，呼吸浅快，双肺可闻及哮鸣音，可见辅助呼吸肌参与呼吸运动，肺下界移动度减小。血嗜酸性粒细胞 0.62×10⁹/L，总IgE 412IU/ml，尘螨特异性IgE阳性；支气管舒张试验FEV1改善18%、绝对值增加320ml。无粉红色泡沫样痰、无夜间阵发性呼吸困难及双下肢水肿，可与左心衰竭鉴别；无长期吸烟史及逐年加重病程，可与慢阻肺病鉴别',
    soap: {
      a: {
        basisDetail: [
          {
            diagnosis: '支气管哮喘急性发作（中度）',
            history: '发作性喘息、胸闷3年，接触尘螨及冷空气诱发，夜间及凌晨加重，可自行或经平喘药缓解；1天前再次发作，讲话需停顿换气，不能平卧',
            pe: '强迫体位，急性病容，呼吸浅快，双肺可闻及哮鸣音，可见辅助呼吸肌参与呼吸运动，肺下界移动度减小',
            aux: '血嗜酸性粒细胞 0.62×10⁹/L，血清总IgE 412IU/ml，尘螨及花粉特异性IgE阳性；支气管舒张试验FEV1改善18%且绝对值增加320ml，FEV1/FVC 62%'
          },
          {
            diagnosis: '变应性鼻炎',
            history: '每逢哮喘发作期伴鼻塞、打喷嚏，接触尘螨及花粉后加重',
            pe: '',
            aux: '尘螨特异性IgE 3级阳性，花粉特异性IgE 2级阳性'
          }
        ]
      }
    },
    diagnosis: {
      confirmed: ['支气管哮喘急性发作（中度）', '变应性鼻炎']
    }
  }
};
