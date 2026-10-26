/* 模板病例：甲状腺功能减退症（原发性，桥本甲状腺炎所致）
 *
 * 依据《内科学》第10版 p717-739（甲状腺功能减退症）：
 *   一般表现：畏寒、乏力、手足肿胀感、嗜睡、记忆力减退、少汗、体重增加、便秘（p731）。
 *   黏液性水肿面容：表情呆滞、面色苍白、颜面及眼睑水肿、唇厚舌大（p731）。
 *   皮肤：干燥、粗糙、脱屑、毛发稀疏脱落、手掌足掌姜黄色（p731）。
 *   神经精神：反应迟钝、嗜睡、记忆力减退、腱反射迟钝（p731-732）。
 *   实验室：血清促甲状腺激素升高而游离甲状腺素降低是原发性甲减的诊断依据（p733）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'hypothyroid',
  dept: 'endocrinology',
  name: '甲状腺功能减退症（原发性，桥本甲状腺炎）',
  alias: ['甲减', '甲状腺功能减退', '桥本甲状腺炎', '黏液性水肿', '甲状腺机能减退'],
  hint: '畏寒乏力、嗜睡、体重增加伴便秘，颜面眼睑水肿、皮肤干燥、毛发稀疏，甲状腺Ⅰ度肿大质韧',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河北石家庄',
      birthPlace: '河北石家庄',
      occupation: '中学后勤职员',
      reliability: '可靠',
      // 主诉只写症状+时间；「甲减」「甲状腺功能减退」是诊断性词语（validate 会拦）。
      chiefComplaint: '畏寒、乏力伴嗜睡、体重增加1年'
    },
    hpi: {
      onset: '1年前无明显诱因出现畏寒、乏力，同室温下较他人穿衣更厚，冬季尤甚',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因。
      cause: '无明显诱因，劳累及受凉后症状加重',
      symptoms: '畏寒怕冷，手足发凉；乏力，做家务即感疲倦；白天嗜睡，每日午后需卧床1～2小时；记忆力明显下降，常忘记刚交代的事情',
      relief: '未服药，仅自行增加衣物，症状无缓解',
      evolution: '1年内体重由60kg增加至68kg，便秘2～3天一次，大便干结；皮肤干燥脱屑，脱发增多；近2个月家属发现其反应迟缓、言语变慢',
      accompanying: '伴颜面及眼睑水肿、声音低哑、月经量增多，无颈前疼痛，无心悸，无怕热多汗',
      // 对应《内科学》p731-733：与肾病综合征（水肿）、贫血、抑郁症、
      // 以及垂体性甲减鉴别的关键点。
      negativeDiscriminating: '无怕热多汗及多食易饥，无心悸及手抖，无胸痛及夜间不能平卧，无尿量减少及泡沫尿，无肉眼血尿，无皮肤黄染，无颈前疼痛及发热，无服用抗甲状腺药物及颈部放射治疗史，无情绪高涨与抑郁交替发作',
      treatment: '1周前单位体检发现促甲状腺激素升高，为进一步诊治收入院；既往未用过甲状腺激素替代治疗',
      // 「便秘2～3天一次」已在 evolution 写过，这里换成不同措辞，避免现病史重复分句。
      generalCondition: '发病以来精神差、反应迟缓，食欲减退，睡眠增多，排便费力且次数减少，体重增加约8kg',
      extra: ''
    },
    ros: {
      endocrine: {
        // 畏寒是甲减最特征性的主诉，也是 hypothyroid 规则的 must 匹配点。
        coldIntolerance: { checked: true, detail: '畏寒怕冷，同室温下较他人穿衣更厚，手足常年发凉' },
        weightGain: { checked: true, detail: '1年内体重由60kg增加至68kg，食欲减退但体重仍增' },
        heatIntolerance: { negative: true },
        weightLoss: { negative: true },
        // 桥本甲状腺炎可有甲状腺肿大、质韧（《内科学》p731）。
        neckMass: { checked: true, detail: '近1年颈部稍增粗，无疼痛及压迫感' },
        hairChange: { checked: true, detail: '头发干燥、脱发明显，眉毛外侧变稀疏' },
        polydipsia: { negative: true },
        polyuriaEndo: { negative: true },
        polyphagia: { negative: true },
        growthChange: { negative: true }
      },
      hemat: {
        // 乏力是甲减最常见的非特异症状（《内科学》p731），
        // 同时是 hypothyroid 规则 match 列表里的 ros:hemat.fatigue。
        fatigue: { checked: true, detail: '全身乏力，做家务即感疲倦，需频繁休息' },
        // 甲减常合并正细胞正色素性贫血（《内科学》p731）。
        anemia: { checked: true, detail: '面色苍白、头晕，血常规提示轻度贫血' },
        pruritus: { checked: true, detail: '皮肤干燥瘙痒，冬季加重，无皮疹' },
        pallorSkin: { checked: true, detail: '面色及手掌苍白' }
      },
      nervous: {
        // 反应迟钝、嗜睡、记忆力减退是甲减的神经精神表现（《内科学》p731-732）。
        memoryLoss: { checked: true, detail: '记忆力明显减退，常忘记刚交代的事情' },
        sleepDisorder: { checked: true, detail: '白天嗜睡，每日午后需卧床1～2小时' },
        dizziness: { checked: true, detail: '起身时头晕，无黑矇' },
        headache: { negative: true },
        numbness: { checked: true, detail: '双手腕部麻木，夜间为著' },
        weakness: { checked: true, detail: '四肢乏力，提重物费力' },
        speech: { checked: true, detail: '言语变慢、吐字不清，家属诉声音低哑' },
        moodLow: { checked: true, detail: '情绪低落、兴趣减退，但与情绪高涨交替发作无关' },
        visualBlur: { negative: true },
        seizure: { negative: true }
      },
      cardio: {
        // 甲减可致心动过缓、心包积液（《内科学》p731），须问清并记阴性。
        palpitation: { negative: true },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true },
        cyanosis: { negative: true }
      },
      gi: {
        // 便秘是甲减的典型表现（《内科学》p731）。
        constipation: { checked: true, detail: '便秘2～3天一次，大便干结，需用开塞露' },
        appetiteLoss: { checked: true, detail: '食欲减退，进食量较前减少约三分之一' },
        bloating: { checked: true, detail: '餐后腹胀，无腹痛' },
        abdominalPain: { negative: true },
        nausea: { negative: true },
        vomiting: { negative: true },
        diarrhea: { negative: true }
      },
      gu: {
        // 甲减时肾小球滤过率下降，水排泄减少可致轻度水肿（《内科学》p731）。
        edemaGu: { checked: true, detail: '晨起眼睑水肿，傍晚减轻' },
        oliguria: { negative: true },
        polyuria: { negative: true },
        nocturia: { negative: true },
        dysuria: { negative: true },
        hematuria: { negative: true }
      },
      resp: {
        cough: { negative: true },
        dyspnea: { negative: true },
        fever: { negative: true },
        pleurisy: { negative: true }
      },
      joint: {
        jointPain: { checked: true, detail: '双膝关节酸痛，活动后加重，无红肿' },
        muscleWeak: { checked: true, detail: '四肢近端肌力下降，下蹲后起身困难' },
        morningStiff: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，可胜任后勤工作',
      diseaseChecks: { 贫血: true },
      diseaseOther: '',
      diseaseDetail: '轻度贫血2年，未查明原因，间断口服铁剂效果不佳；否认甲状腺疾病诊治史',
      longTermMeds: '琥珀酸亚铁片 0.1g 每日2次（间断）；未用过甲状腺激素及抗甲状腺药物',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史；否认颈部手术及放射治疗史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      allergenChecks: {},
      allergenOther: '',
      allergenReactionChecks: {},
      allergyReaction: '',
      relatedHistory: '否认冠心病、肾病综合征及慢性肾脏病史；否认垂体瘤及头颅放射治疗史；否认产后大出血史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '河北石家庄，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认毒物、粉尘及放射性物质接触史',
      environment: '',
      habits: '生活规律，饮食偏清淡，活动量少，近1年怕冷不愿外出',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事学校后勤工作22年，以室内保洁及库房管理为主，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '23', spouseHealth: '配偶体健', sexLife: '近半年性欲减退，同房次数减少', relation: '和睦' },
    family: {
      diseaseChecks: { 甲状腺疾病: true },
      other: '',
      deceased: '父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '姐姐患桥本甲状腺炎',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '肥胖',
        // 反应迟钝、嗜睡是甲减的神经精神表现（《内科学》p731）。
        conscious: '神志清楚，精神差',
        posture: '自主体位',
        // 黏液性水肿面容：表情呆滞、颜面水肿（《内科学》p731）。
        // pe-options 的 general.face 无「黏液性水肿面容」，最接近的是「慢性病容」。
        face: '慢性病容',
        cooperation: '查体合作'
      },
      skin: {
        // 甲减皮肤苍白、干燥、粗糙（《内科学》p731）。
        color: '皮肤黏膜苍白',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        // 颜面及眼睑水肿是甲减的特征性体征（《内科学》p731）。
        eyes: '眼睑水肿',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        // 舌体肥大是甲减体征之一；pe-options 的 teeth 组无此选项，故记录口腔黏膜无溃疡。
        teeth: '口腔黏膜无溃疡，舌质淡红、苔薄白'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        // 桥本甲状腺炎多表现为甲状腺轻中度肿大、质韧（《内科学》p731-733），
        // 同时是 hypothyroid 规则唯一可用的 pe: / pev: 匹配点。
        thyroid: '甲状腺Ⅰ度肿大',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        // 甲减时心尖搏动减弱（《内科学》p731）；pe-options 的 chest 组无此选项，
        // 记录为无抬举性、未触及震颤。
        heartPalpation: '心尖搏动无抬举性，未触及震颤',
        // 甲减性心脏病可致心界扩大、心包积液（《内科学》p731）；本例心界不大。
        heartPercussion: '心界不大',
        // 心动过缓、心音低钝是甲减的典型听诊所见（《内科学》p731）。
        heartAuscultation: '心音低钝'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        // 甲减时肠鸣音减弱、便秘（《内科学》p731）。
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        // 甲减性肌病及黏液性水肿可致近端肌力下降（《内科学》p731）。
        limbMuscle: '四肢肌力4级',
        edemaPretibial: '双侧胫前凹陷性水肿'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        // 腱反射迟钝、松弛期延长是甲减的特征性体征（《内科学》p732）。
        tendonReflex: '腱反射普遍减弱',
        babinski: '巴氏征阴性'
      },
      // 专科查体：不写 endoExtra（summaryOf 汇总项会让 endoSkin/endoBody 让位）。
      special_endocrinology: {
        endoBody: '体型匀称，脂肪分布正常，无向心性肥胖',
        // 皮肤干燥粗糙、毛发稀疏是甲减典型皮肤改变（《内科学》p731）。
        endoSkin: '皮肤无紫纹、痤疮及色素沉着，毛发分布正常',
        endoThyroid: '甲状腺Ⅰ度肿大',
        // 甲减一般无突眼，须明确记录以与甲亢鉴别（《内科学》p731）。
        endoEye: '双眼球无突出，眼征阴性',
        endoHandFoot: '手足无畸形，指端无增粗',
        endoWound: '全身皮肤完整，未见溃疡及伤口愈合不良'
      }
    },
    auxiliary: {
      items: [
        {
          name: '甲状腺功能',
          result: '促甲状腺激素 24.8mIU/L（升高），游离甲状腺素 6.2pmol/L（降低），游离三碘甲状腺原氨酸 2.8pmol/L（降低）',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺自身抗体',
          result: '甲状腺过氧化物酶抗体 ＞600IU/mL（明显升高），甲状腺球蛋白抗体 428IU/mL（升高），促甲状腺激素受体抗体阴性',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺超声',
          result: '甲状腺体积稍增大，实质回声增粗、分布不均，呈网格状改变，血流信号不丰富；未见明确结节',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规及血脂',
          result: '血红蛋白 102g/L，红细胞平均体积 88fL；总胆固醇 7.4mmol/L，甘油三酯 2.4mmol/L，低密度脂蛋白胆固醇 4.9mmol/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '心电图及心脏超声',
          result: '心电图：窦性心动过缓，心率 54次/分，肢体导联低电压；心脏超声：心包腔少量积液（左室后壁后方 5mm），左心室射血分数 62%',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '甲状腺功能减退症（原发性，桥本甲状腺炎）',
        '轻度贫血',
        '高脂血症'
      ]
    }
  }
};
