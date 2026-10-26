/* 模板病例：2型糖尿病伴糖尿病周围神经病变、血糖控制不佳
 *
 * 依据《内科学》第10版 p755-790（糖尿病）：
 *   代谢紊乱症候群：「三多一少」，即多尿、多饮、多食和体重下降（p760）。
 *   慢性并发症：糖尿病周围神经病变最常见，表现为对称性肢体麻木、疼痛、感觉异常，
 *   呈手套或袜套样分布，下肢较上肢重（p772）。
 *   体征：早期多无明显体征；周围神经病变可有痛觉、温度觉、触觉减退，腱反射减弱或消失，
 *   足背动脉搏动减弱提示合并下肢动脉病变（p772-776）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'dm',
  dept: 'endocrinology',
  name: '2型糖尿病伴糖尿病周围神经病变',
  alias: ['糖尿病', '2型糖尿病', 'T2DM', '糖尿病周围神经病变', '血糖控制不佳'],
  hint: '多饮多尿伴体重下降，双下肢对称性麻木、袜套样感觉减退，腱反射减弱，糖化血红蛋白显著升高',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南京',
      birthPlace: '江苏南京',
      occupation: '退休工人',
      reliability: '可靠',
      // 主诉只写症状+时间；「糖尿病」三字是诊断性词语，写进主诉会被 validate 拦下。
      chiefComplaint: '多饮、多尿伴体重下降3个月'
    },
    hpi: {
      onset: '3个月前无明显诱因出现口渴多饮，夜尿增至3～4次',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因。
      cause: '无明显诱因，进食甜食及主食量增加后症状更明显',
      symptoms: '口渴喜冷饮，每日饮水约3000mL；尿量增多，夜尿3～4次，尿色清；多食易饥，但体重反而下降',
      relief: '未服药，仅自行减少主食，症状无缓解',
      evolution: '3个月内体重由72kg下降至65kg；近2个月出现双足麻木、蚁走感，自足趾向上发展至踝部，夜间为著',
      accompanying: '伴乏力、视物模糊、皮肤瘙痒，无恶心呕吐，无腹痛，无发热',
      // 对应《内科学》p760-776：与1型糖尿病、甲状腺功能亢进、尿崩症、
      // 以及糖尿病急性并发症（酮症酸中毒、高渗高血糖状态）鉴别的关键点。
      // 「多食」在 symptoms 与 ros.endocrine.polyphagia 里都是阳性，这里不能写成否定，
      // 否则现病史与系统回顾自相矛盾。甲亢方向的鉴别改用「怕热多汗、心悸、手抖」表述。
      negativeDiscriminating: '无怕热多汗、心悸及双手震颤，无烦渴伴头痛及视野缺损，无恶心呕吐及深大呼吸，无烂苹果味口气，无腹痛，无发热，无肢体无力及行走不稳，无间歇性跛行及静息痛，无足部溃疡',
      treatment: '1周前社区体检空腹血糖 13.8mmol/L，糖化血红蛋白 9.6%，为进一步诊治收入院；既往未用过胰岛素及口服降糖药',
      generalCondition: '发病以来精神稍差，食欲亢进，睡眠欠佳，大小便正常，体重下降约7kg',
      extra: ''
    },
    ros: {
      endocrine: {
        // 「三多一少」的核心表现，也是诊断提示 dm 规则的匹配点。
        polydipsia: { checked: true, detail: '口渴多饮，每日饮水约3000mL，喜冷饮' },
        polyuriaEndo: { checked: true, detail: '尿量增多，夜尿3～4次，尿色清' },
        polyphagia: { checked: true, detail: '多食易饥，每日主食量增加约100g' },
        weightLoss: { checked: true, detail: '3个月内体重由72kg下降至65kg' },
        // 甲亢是「多食消瘦」最重要的鉴别诊断，逐项问清并记阴性。
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true },
        neckMass: { negative: true },
        hairChange: { negative: true },
        weightGain: { negative: true },
        growthChange: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        appetiteLoss: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true }
      },
      gu: {
        nocturia: { checked: true, detail: '夜尿3～4次，量多' },
        polyuria: { checked: true, detail: '日尿量明显增多，尿色清' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { negative: true },
        edemaGu: { negative: true }
      },
      cardio: {
        palpitation: { negative: true },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true },
        intermittentClaudication: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '近3个月乏力明显，日常家务即感疲倦' },
        pruritus: { checked: true, detail: '全身皮肤瘙痒，夜间为著，无皮疹' },
        anemia: { negative: true }
      },
      nervous: {
        // 糖尿病周围神经病变的典型描述：对称性、自远端向近端、袜套样分布（p772）。
        numbness: { checked: true, detail: '双足麻木、蚁走感，自足趾向上发展至踝部，呈袜套样，夜间为著' },
        visualBlur: { checked: true, detail: '近1个月视物模糊，时轻时重' },
        dizziness: { negative: true },
        headache: { negative: true },
        weakness: { negative: true },
        tremor: { negative: true },
        speech: { negative: true },
        sleepDisorder: { checked: true, detail: '夜尿频繁影响睡眠' }
      },
      resp: {
        cough: { negative: true },
        fever: { negative: true },
        dyspnea: { negative: true }
      },
      joint: {
        jointPain: { negative: true },
        muscleWeak: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，否认高血压、冠心病史',
      diseaseChecks: { 糖尿病: true, 高脂血症: true },
      diseaseOther: '',
      diseaseDetail: '3个月前体检首次发现血糖升高，此前从未检测血糖；高脂血症2年，未治疗',
      longTermMeds: '阿托伐他汀钙片 20mg 每晚1次（近2年）；未用过降糖药物',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史；否认足部溃疡及外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      allergenChecks: {},
      allergenOther: '',
      allergenReactionChecks: {},
      allergyReaction: '',
      relatedHistory: '否认胰腺炎及胰腺手术史，否认长期服用糖皮质激素及噻嗪类利尿剂史，否认甲状腺疾病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏南京，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认毒物、粉尘及放射性物质接触史',
      environment: '',
      habits: '喜食甜食及精制主食，每日主食约350g，平素活动量少，体重最高78kg',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事机械加工工作35年，已退休5年；工作中无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶患高血压，规律服药', sexLife: '近1年因乏力减少', relation: '和睦' },
    family: {
      diseaseChecks: { 糖尿病: true, 高血压: true },
      other: '',
      deceased: '父亲因糖尿病并发症去世，享年68岁；母亲健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '母亲及一兄均患糖尿病',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        // 体重下降但 BMI 仍偏高，符合2型糖尿病超重体型（《内科学》p760）。
        nutrition: '肥胖',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        // 糖尿病皮肤瘙痒及易合并感染，须记录皮损情况。
        rash: '可见散在皮疹',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        // 糖尿病视网膜病变筛查：眼底检查是入院常规（《内科学》p774）。
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '口腔黏膜无溃疡，舌质淡红、苔薄白'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        // 甲状腺肿大是「多食消瘦」的重要鉴别点，须明确记录（《内科学》p717）。
        thyroid: '甲状腺无肿大',
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
        heartPalpation: '心尖搏动无抬举性，未触及震颤',
        heartPercussion: '心界不大',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        // 腹型肥胖是2型糖尿病的典型体型（《内科学》p760）。
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        // 下肢动脉病变筛查：足背动脉搏动减弱提示合并下肢动脉粥样硬化（《内科学》p776）。
        dorsalisPedis: '双侧足背动脉搏动减弱'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        // 糖尿病周围神经病变：腱反射减弱或消失（《内科学》p772）。
        tendonReflex: '腱反射普遍减弱',
        babinski: '巴氏征阴性'
      },
      // 专科查体：不写 endoExtra（它是 summaryOf=endoSkin,endoBody 的汇总项，会挤掉明细）。
      special_endocrinology: {
        endoBody: '向心性肥胖',
        endoSkin: '皮肤无紫纹、痤疮及色素沉着，毛发分布正常',
        endoThyroid: '甲状腺不大，质软，未触及结节，未闻及血管杂音',
        endoEye: '双眼球无突出，眼征阴性',
        endoHandFoot: '手足无畸形，指端无增粗',
        // 糖尿病足筛查的核心：皮肤完整性与足部溃疡（《内科学》p776）。
        endoWound: '全身皮肤完整，未见溃疡及伤口愈合不良'
      }
    },
    auxiliary: {
      items: [
        {
          name: '空腹及餐后2小时血糖',
          result: '空腹血糖 13.8mmol/L，餐后2小时血糖 21.4mmol/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '糖化血红蛋白',
          result: 'HbA1c 9.6%，提示近3个月血糖控制不佳',
          date: '', hospital: '', no: ''
        },
        {
          name: '尿常规及尿微量白蛋白/肌酐比值',
          result: '尿糖 +++，尿酮体阴性，尿蛋白阴性；尿微量白蛋白/肌酐比值 18mg/g，在正常范围',
          date: '', hospital: '', no: ''
        },
        {
          name: '血脂及肝肾功能',
          result: '总胆固醇 6.4mmol/L，甘油三酯 2.9mmol/L，低密度脂蛋白胆固醇 4.2mmol/L；血肌酐 76μmol/L，尿素氮 5.4mmol/L；丙氨酸氨基转移酶 32U/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '肌电图',
          result: '双侧腓总神经、胫神经运动传导速度减慢，双侧腓肠神经感觉传导波幅降低，提示周围神经损害',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '2型糖尿病',
        '糖尿病周围神经病变',
        '高脂血症'
      ]
    }
  }
};
