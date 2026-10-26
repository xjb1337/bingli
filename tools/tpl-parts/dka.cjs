/* 模板病例：2型糖尿病 糖尿病酮症酸中毒（中度）
 *
 * 依据《内科学》第10版 p764-768（糖尿病酮症酸中毒 DKA）：
 *   多见于1型糖尿病，2型糖尿病在感染、胰岛素中断、饮食失调等诱因下亦可发生。
 *   早期「三多一少」症状加重；随后出现食欲减退、恶心、呕吐，常伴腹痛（可被误诊为急腹症）；
 *   呼吸深快，呼气中有烂苹果味（丙酮味）；脱水明显时皮肤弹性差、眼球下陷、心率增快、血压下降；
 *   进一步发展出现嗜睡、意识障碍以至昏迷（p765-766）。
 *   诊断标准：血糖 13.9～33.3mmol/L，血酮体升高，血 pH＜7.3，碳酸氢根降低，尿酮体阳性（p766）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'dka',
  dept: 'endocrinology',
  name: '2型糖尿病 糖尿病酮症酸中毒（中度）',
  alias: ['糖尿病酮症酸中毒', 'DKA', '酮症酸中毒', '糖尿病急性并发症'],
  hint: '糖尿病史伴感染诱因，多尿烦渴加重后出现恶心呕吐、深大呼吸伴烂苹果味、皮肤弹性差、尿酮体强阳性',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '四川成都',
      birthPlace: '四川成都',
      occupation: '个体经营者',
      reliability: '基本可靠',
      // 主诉只写症状+时间。注意「糖尿病」与「酮症酸中毒」都是诊断性词语，不能进主诉。
      chiefComplaint: '口干多饮加重1周，恶心呕吐伴乏力2天'
    },
    hpi: {
      onset: '患糖尿病6年，平素口服二甲双胍 0.5g 每日3次，血糖未规律监测；1周前受凉后出现咳嗽、咽痛',
      // 「无明显诱因」不适用：本例诱因明确（上呼吸道感染 + 自行停用降糖药），
      // 直接写诱因，normalizeCause 会原样带入现病史。
      cause: '1周前受凉后上呼吸道感染，同时因食欲差自行停用二甲双胍3天',
      symptoms: '口干多饮较前明显加重，每日饮水约4000mL，夜尿5～6次，尿量多；2天前出现恶心、频繁呕吐，呕吐物为胃内容物，非喷射性，无咖啡样物',
      relief: '自行停用降糖药并减少进食，症状无缓解；家中自测指尖血糖显示「HI」（超出仪器上限）',
      evolution: '今日晨起精神萎靡、嗜睡，呼之能应但答话迟缓，家属诉呼吸深大、呼气有烂苹果味，遂急诊入院',
      accompanying: '伴明显乏力、头晕、口渴，尿量较前减少，无发热，无腹痛腹泻，无胸痛',
      // 对应《内科学》p766：DKA 需与低血糖昏迷、高渗高血糖状态、乳酸性酸中毒、
      // 以及以呕吐腹痛为表现的急腹症、脑血管意外鉴别。
      negativeDiscriminating: '无腹痛及腹部压痛，无腹泻，无呕血及黑便，无发热寒战，无胸痛及心悸，无偏瘫失语及肢体抽搐，无近期大量饮酒史，无服用双胍类药物过量史',
      treatment: '入院前未补液，未用胰岛素；急诊查指尖血糖「HI」，尿酮体 +++，血气分析提示代谢性酸中毒，予生理盐水补液并转入病房',
      // 「尿量较前减少」已在 accompanying 写过，这里换成不同措辞，避免现病史重复分句。
      generalCondition: '发病以来精神萎靡，食欲差，睡眠增多，近1天尿量明显少于平日，2天未排便，体重1周内下降约3kg',
      extra: ''
    },
    ros: {
      endocrine: {
        // 「三多一少」加重是 DKA 的前驱表现（《内科学》p765），也是 dm 规则的匹配点。
        polydipsia: { checked: true, detail: '口干多饮明显加重，每日饮水约4000mL' },
        polyuriaEndo: { checked: true, detail: '夜尿5～6次，尿量多，近1天尿量较前减少' },
        weightLoss: { checked: true, detail: '1周内体重下降约3kg' },
        polyphagia: { negative: true },
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true },
        neckMass: { negative: true }
      },
      gi: {
        // DKA 的典型消化道表现（《内科学》p765），同时是诊断提示 dka 规则的匹配点。
        nausea: { checked: true, detail: '持续恶心，进食即感恶心' },
        vomiting: { checked: true, detail: '2天来呕吐5～6次，为胃内容物，非喷射性，无咖啡样物' },
        // 呕吐伴腹痛易误诊为急腹症，本例明确否认，是重要的鉴别阴性（《内科学》p766）。
        abdominalPain: { negative: true },
        diarrhea: { negative: true },
        hematemesis: { negative: true },
        melena: { negative: true },
        appetiteLoss: { checked: true, detail: '近2天几乎未进食' },
        constipation: { checked: true, detail: '2天未排便' }
      },
      gu: {
        oliguria: { checked: true, detail: '近1天尿量较前明显减少' },
        polyuria: { checked: true, detail: '前期尿量明显增多' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        edemaGu: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '活动后心悸，静息时亦有心跳加快感' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true }
      },
      resp: {
        // 深大呼吸（Kussmaul 呼吸）是 DKA 的标志（《内科学》p765）。
        dyspnea: { checked: true, detail: '呼吸深大而快，呼气有烂苹果味，无呼吸困难及端坐呼吸' },
        cough: { checked: true, detail: '1周前受凉后干咳，无痰' },
        fever: { negative: true },
        sputum: { negative: true },
        hemoptysis: { negative: true },
        pleurisy: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '全身乏力明显，起床及行走需人搀扶' },
        anemia: { negative: true }
      },
      nervous: {
        // 意识改变是 DKA 分度的依据之一（《内科学》p766）。
        sleepDisorder: { checked: true, detail: '近1天嗜睡，呼之能应但答话迟缓' },
        dizziness: { checked: true, detail: '体位变动时头晕' },
        headache: { negative: true },
        numbness: { negative: true },
        weakness: { checked: true, detail: '四肢乏力，持物不稳' },
        speech: { negative: true },
        seizure: { negative: true },
        visualBlur: { negative: true }
      },
      joint: {
        jointPain: { negative: true },
        muscleWeak: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，6年前确诊糖尿病',
      // dka 规则的 must 就是 pmh:糖尿病，同时 dm 规则也把它算作匹配项。
      diseaseChecks: { 糖尿病: true },
      diseaseOther: '',
      diseaseDetail: '2型糖尿病6年，长期口服二甲双胍 0.5g 每日3次，未规律监测血糖，最近一次糖化血红蛋白 9.1%（半年前）',
      longTermMeds: '二甲双胍片 0.5g 每日3次（入院前自行停用3天）；未用过胰岛素',
      infection: '否认肝炎、结核、伤寒等传染病史；1周前有上呼吸道感染史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史；否认大量饮酒史',
      vaccine: '按计划预防接种',
      allergy: '无',
      allergenChecks: {},
      allergenOther: '',
      allergenReactionChecks: {},
      allergyReaction: '',
      relatedHistory: '否认胰腺炎病史，否认长期服用糖皮质激素史，否认甲状腺及肾上腺疾病史，否认肾脏疾病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '四川成都，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '有',
      smokingAmount: '吸烟20年，每日约10支，未戒烟',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认毒物、粉尘及放射性物质接触史',
      environment: '',
      habits: '经营小超市，作息不规律，饮食以米面为主，近1周因咽痛进食明显减少',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '个体经营20年，长期久坐、作息不规律，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶体健', sexLife: '近1周因乏力未同房', relation: '和睦' },
    family: {
      diseaseChecks: { 糖尿病: true },
      other: '',
      deceased: '父亲因糖尿病肾病去世，享年72岁；母亲健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '父亲及一姐均患糖尿病',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        // 精神萎靡、嗜睡是 DKA 意识障碍的早期表现（《内科学》p765）。
        // 注意：此处不写「神志清楚，精神差」，避免给休克规则送去 must 命中。
        conscious: '嗜睡',
        posture: '被动体位',
        // 脱水、循环衰竭时呈急性病容（《内科学》p765）。
        face: '急性病容',
        cooperation: '查体欠合作'
      },
      skin: {
        // 中重度脱水：皮肤弹性差、黏膜干燥（《内科学》p765）。
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        // 眼球下陷是重度脱水的体征（《内科学》p765）；本例为中度，记录眼睑无水肿、瞳孔正常。
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '咽充血，扁桃体肿大',
        // 口腔黏膜干燥是脱水的重要旁证。
        teeth: '舌质红、少苔'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        thyroid: '甲状腺无肿大',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        // Kussmaul 呼吸：呼吸深大（《内科学》p765），pe-options 中对应「呼吸深大」。
        lungInspect: '呼吸深大',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        heartPalpation: '心尖搏动无抬举性，未触及震颤',
        heartPercussion: '心界不大',
        // 心率增快是 DKA 的代偿表现（《内科学》p765）。
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        // 呕吐、脱水可有上腹轻压痛，但无反跳痛、无肌紧张，用以排除急腹症（《内科学》p766）。
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        limbMuscle: '四肢肌力4级'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        // 意识障碍但无局灶体征，用以与脑血管意外鉴别（《内科学》p766）。
        babinski: '巴氏征阴性',
        kernig: '克氏征阴性',
        brudzinski: '布氏征阴性'
      },
      // 专科查体：不写 endoExtra（summaryOf 汇总项会让明细让位）。
      special_endocrinology: {
        endoBody: '体型匀称，脂肪分布正常，无向心性肥胖',
        // 皮肤弹性减退已写在 skin 组；此处记录无紫纹、无色素沉着。
        endoSkin: '皮肤无紫纹、痤疮及色素沉着，毛发分布正常',
        endoThyroid: '甲状腺不大，质软，未触及结节，未闻及血管杂音',
        endoEye: '双眼球无突出，眼征阴性',
        endoHandFoot: '手足无畸形，指端无增粗',
        // 糖尿病足筛查：入院时皮肤完整、无溃疡（《内科学》p776）。
        endoWound: '全身皮肤完整，未见溃疡及伤口愈合不良'
      }
    },
    auxiliary: {
      items: [
        {
          name: '血气分析',
          result: 'pH 7.18，二氧化碳分压 24mmHg，碳酸氢根 9.2mmol/L，剩余碱 -16mmol/L，提示代谢性酸中毒（阴离子间隙升高）',
          date: '', hospital: '', no: ''
        },
        {
          name: '血糖及血酮体',
          result: '随机血糖 28.6mmol/L，血酮体 6.2mmol/L（升高），糖化血红蛋白 9.8%',
          date: '', hospital: '', no: ''
        },
        {
          name: '尿常规',
          result: '尿糖 ++++，尿酮体 +++，尿蛋白 +，镜检未见红细胞及白细胞',
          date: '', hospital: '', no: ''
        },
        {
          name: '血电解质及肾功能',
          result: '血钾 4.6mmol/L，血钠 132mmol/L，血氯 98mmol/L；血肌酐 118μmol/L，尿素氮 11.2mmol/L，估算肾小球滤过率 62mL/(min·1.73m²)',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规及C反应蛋白',
          result: '白细胞 15.6×10^9/L，中性粒细胞百分比 84%，血红蛋白 138g/L；C反应蛋白 32mg/L，降钙素原 0.42ng/mL',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '2型糖尿病 糖尿病酮症酸中毒（中度）',
        '上呼吸道感染',
        '高脂血症'
      ]
    }
  }
};
