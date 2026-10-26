/* 模板病例：甲状腺功能亢进症（Graves 病）
 *
 * 依据《内科学》第10版 p717-739（甲状腺功能亢进症）：
 *   临床表现由甲状腺毒症、甲状腺肿大和眼征三组表现组成（p724）。
 *   甲状腺毒症：怕热多汗、多食易饥、体重下降、心悸、手细颤、易激动、失眠、大便次数增多（p724）。
 *   甲状腺肿大：弥漫性、对称性肿大，质软，可闻及血管杂音、触及震颤（p725）。
 *   眼征：单纯性突眼（眼球轻度突出、Graefe 征、Stellwag 征）与浸润性突眼（p725-726）。
 *   特殊表现：胫前黏液性水肿、甲亢性心脏病（心房颤动）、周期性麻痹（p727）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'hyperthyroid',
  dept: 'endocrinology',
  name: '甲状腺功能亢进症（Graves 病）',
  alias: ['甲亢', '甲状腺功能亢进', 'Graves病', '毒性弥漫性甲状腺肿', '甲状腺机能亢进'],
  hint: '怕热多汗、多食易饥伴体重下降、心悸手抖，甲状腺弥漫性肿大伴血管杂音，双眼球突出',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '浙江杭州',
      birthPlace: '浙江杭州',
      occupation: '公司职员',
      reliability: '可靠',
      // 主诉只写症状+时间；「甲亢」「甲状腺功能亢进」都是诊断性词语（validate 会拦）。
      chiefComplaint: '怕热、多汗伴心悸、消瘦4个月'
    },
    hpi: {
      onset: '4个月前无明显诱因出现怕热多汗，同室温下较他人穿衣更少，稍活动即大汗',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因。
      cause: '无明显诱因，工作压力大及睡眠不足时症状加重',
      symptoms: '怕热多汗，喜冷饮，每日饮水约2500mL；食欲亢进，每日进食5～6餐仍感饥饿；心悸，静息心率自测约100次/分；双手持筷时抖动',
      relief: '未服药，未就诊，症状逐渐加重',
      evolution: '4个月内体重由58kg下降至49kg，伴易激动、失眠、大便次数增多至每日3～4次，成形；近1个月自觉双眼较前突出、畏光流泪',
      accompanying: '伴乏力、颈部增粗、月经量减少，无颈前疼痛，无吞咽困难及声音嘶哑',
      // 对应《内科学》p724-727：与糖尿病、亚急性甲状腺炎、桥本甲状腺炎、
      // 以及心脏疾病（心动过速、房颤）鉴别的关键点。
      negativeDiscriminating: '无明显多饮多尿，无颈前疼痛及触痛，无发热，无吞咽困难及声音嘶哑，无胸痛及夜间不能平卧，无双下肢水肿，无发作性肢体无力，无长期服用含碘药物及甲状腺激素史',
      treatment: '1周前门诊查甲状腺功能提示促甲状腺激素降低、游离甲状腺素升高，甲状腺超声提示弥漫性病变，为进一步诊治收入院；未用过抗甲状腺药物',
      // 「食欲亢进」已在 symptoms 写过，这里换成不同措辞，避免现病史重复分句。
      generalCondition: '发病以来精神易激动，进食量较前明显增加，睡眠差，大便每日3～4次，小便正常，体重下降约9kg',
      extra: ''
    },
    ros: {
      endocrine: {
        // 甲状腺毒症的核心表现，也是诊断提示 hyperthyroid 规则的 must 匹配点。
        heatIntolerance: { checked: true, detail: '怕热多汗，同室温下较他人穿衣少，稍活动即大汗' },
        weightLoss: { checked: true, detail: '4个月内体重由58kg下降至49kg' },
        // 多食易饥是甲状腺毒症的典型表现（《内科学》p724）。
        weightGain: { negative: true },
        coldIntolerance: { negative: true },
        neckMass: { checked: true, detail: '1个月前发现颈部较前增粗，无疼痛' },
        hairChange: { checked: true, detail: '近2个月脱发较前增多' },
        polydipsia: { negative: true },
        polyuriaEndo: { negative: true },
        growthChange: { negative: true }
      },
      cardio: {
        // 心悸是甲亢最常见的心血管表现，也是 acs/af 规则的匹配点（须写非默认值）。
        palpitation: { checked: true, detail: '静息时心率自测约100次/分，活动后心悸明显' },
        // 甲亢性心脏病可表现为房颤、心衰，须逐一问清（《内科学》p727）。
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true },
        cyanosis: { negative: true },
        intermittentClaudication: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '易疲劳，上三楼即需休息' },
        // 甲亢可伴白细胞减少，也需与其他消瘦病因鉴别。
        anemia: { negative: true },
        lymphNode: { negative: true }
      },
      nervous: {
        // 神经过敏、易激动、失眠、手细颤是甲状腺毒症的典型表现（《内科学》p724）。
        tremor: { checked: true, detail: '双手平伸时细颤，持筷及写字时明显' },
        insomnia: { checked: true, detail: '入睡困难，夜间易醒，每日睡眠约4小时' },
        anxiety: { checked: true, detail: '易激动、急躁，因小事与同事争执' },
        weakness: { checked: true, detail: '四肢近端乏力，上楼及下蹲后起身费力' },
        headache: { negative: true },
        dizziness: { negative: true },
        numbness: { negative: true },
        visualBlur: { negative: true },
        // 浸润性突眼可有眼胀、畏光、流泪（《内科学》p726）。
        eyePain: { checked: true, detail: '双眼畏光、流泪，视物时有异物感' },
        speech: { negative: true },
        seizure: { negative: true }
      },
      gi: {
        // 大便次数增多是甲状腺毒症的常见表现（《内科学》p724）。
        diarrhea: { checked: true, detail: '大便每日3～4次，成形，无黏液脓血' },
        appetiteLoss: { negative: true },
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        melena: { negative: true }
      },
      resp: {
        dyspnea: { negative: true },
        cough: { negative: true },
        fever: { negative: true },
        hemoptysis: { negative: true }
      },
      gu: {
        polyuria: { negative: true },
        nocturia: { negative: true },
        edemaGu: { negative: true },
        dysuria: { negative: true }
      },
      joint: {
        // 甲亢性周期性麻痹以低钾性弛缓性瘫痪为表现，须问清（《内科学》p727）。
        muscleWeak: { checked: true, detail: '双下肢近端无力，无发作性软瘫' },
        jointPain: { negative: true },
        backPain: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，可胜任日常工作',
      diseaseChecks: {},
      diseaseOther: '',
      diseaseDetail: '否认高血压、糖尿病、冠心病史；否认颈前疼痛及发热史',
      longTermMeds: '近半年未服用任何药物；否认服用含碘制剂、胺碘酮及甲状腺激素史',
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
      relatedHistory: '否认糖尿病史及明显多饮多尿，否认心悸伴胸痛史，否认家族性甲状腺疾病以外的自身免疫病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江杭州，否认疫区及地方病流行区长期居住史；本地非碘缺乏地区',
      travel: '',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认毒物、粉尘及放射性物质接触史',
      environment: '',
      habits: '工作节奏快、精神压力大，近半年经常熬夜加班，饮食不规律，喜食海带紫菜等含碘食物',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事财务工作6年，长期伏案、精神紧张，无粉尘及电离辐射接触'
    },
    marriage: { status: '未婚', sexLife: '无性生活史', relation: '与父母同住，关系融洽' },
    family: {
      diseaseChecks: { 甲状腺疾病: true },
      other: '',
      deceased: '父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '母亲患甲状腺功能亢进，已治愈',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        // 甲亢患者虽多食但体重下降，营养状态仍可表现为中等（《内科学》p724）。
        nutrition: '营养中等',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        // 甲亢面容是 pe-options 中的标准描述（《内科学》p725）。
        face: '甲亢面容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        // 甲亢多汗、皮肤温暖潮湿，pe-options 无对应项，此处记录无皮疹。
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        // 单纯性突眼：眼球轻度突出、睑裂增宽、Graefe 征（《内科学》p725-726）。
        eyes: '眼睑水肿',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '口腔黏膜无溃疡，舌质淡红、苔薄白'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        // 甲状腺弥漫性对称性肿大是 Graves 病的核心体征（《内科学》p725），
        // 也是 hyperthyroid 规则唯一可用的 pe: / pev: 匹配点。
        thyroid: '甲状腺Ⅱ度肿大',
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
        // 甲亢时心尖搏动可呈抬举性、范围增大（《内科学》p727）。
        heartPalpation: '可触及抬举性心尖搏动',
        heartPercussion: '心界不大',
        // 心率增快、第一心音亢进是甲亢的典型听诊所见；pe-options 的 chest 组无「心音亢进」，
        // 故此处记录心律齐、无病理性杂音，心率增快写在专科 cardioRate。
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        // 甲状腺毒症时肠鸣音可活跃、大便次数增多（《内科学》p724）。
        abdAuscultation: '肠鸣音活跃',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        // 甲亢性肌病及周期性麻痹表现为近端肌力下降（《内科学》p727）。
        limbMuscle: '四肢肌力4级'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        // 甲亢时腱反射活跃甚至亢进（《内科学》p724）。
        tendonReflex: '腱反射普遍亢进',
        babinski: '巴氏征阴性'
      },
      // 专科查体：不写 endoExtra（summaryOf 汇总项会让 endoSkin/endoBody 让位）。
      special_endocrinology: {
        endoBody: '消瘦',
        endoSkin: '皮肤无紫纹、痤疮及色素沉着，毛发分布正常',
        // 弥漫性肿大、质软、可闻及血管杂音、可触及震颤是 Graves 病的典型体征（p725）。
        endoThyroid: '甲状腺Ⅱ度肿大',
        // 双眼球突出 + Graefe 征阳性同样是 Graves 病的标志（p725-726）。
        endoEye: '双眼球突出',
        endoHandFoot: '手足无畸形，指端无增粗',
        endoWound: '全身皮肤完整，未见溃疡及伤口愈合不良'
      }
    },
    auxiliary: {
      items: [
        {
          name: '甲状腺功能',
          result: '促甲状腺激素 ＜0.005mIU/L（降低），游离甲状腺素 38.6pmol/L（升高），游离三碘甲状腺原氨酸 12.4pmol/L（升高）',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺自身抗体',
          result: '促甲状腺激素受体抗体 8.6IU/L（阳性，升高），甲状腺过氧化物酶抗体 126IU/mL（轻度升高），甲状腺球蛋白抗体 98IU/mL',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺超声',
          result: '甲状腺弥漫性肿大，实质回声减低、分布不均，血流信号丰富呈「火海征」；未见明确结节',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规及肝功能',
          result: '白细胞 5.2×10^9/L，中性粒细胞绝对值 2.9×10^9/L，血红蛋白 128g/L；丙氨酸氨基转移酶 42U/L，总胆红素 14μmol/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '心电图',
          result: '窦性心动过速，心率 108次/分，各导联 ST 段未见明显异常',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '甲状腺功能亢进症（Graves 病）',
        '甲状腺Ⅱ度肿大',
        '甲亢性肌病'
      ]
    }
  }
};
