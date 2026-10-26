/* 模板病例：股骨颈骨折（左侧，Garden Ⅲ型）
 *
 * 依据《外科学》第10版 p652-667（骨折概述）、p689-714（下肢骨关节损伤）：
 *   股骨颈骨折伤后髋部疼痛、不能站立行走，患肢出现外旋畸形，一般为45°～60°；
 *   伤后很少出现髋部肿胀及瘀斑，可有局部压痛及轴向叩击痛，肢体测量可发现伤肢短缩（p693）。
 *   Garden 分型：Ⅲ型为完全骨折、部分移位，股骨头与股骨颈仍有接触（p693）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词。
 */
module.exports = {
  key: 'fracture',
  dept: 'surgery',
  name: '股骨颈骨折（左侧，Garden Ⅲ型）',
  alias: ['股骨颈骨折', '髋部骨折', '股骨颈断裂', 'Garden骨折'],
  hint: '跌倒后左髋部疼痛不能站立，患肢短缩并外旋，纵向叩击痛阳性',
  record: {
    basic: {
      marital: '丧偶',
      nationality: '汉族',
      nativePlace: '江苏扬州',
      birthPlace: '江苏扬州',
      occupation: '退休教师',
      reliability: '可靠',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，另写 unit 会被默认值顶掉。
      chiefComplaint: '跌倒后左髋部疼痛、不能站立行走3小时'
    },
    hpi: {
      onset: '3小时前感左髋部剧烈疼痛，不能站立及行走',
      // 受伤经过放在诱因里（以「后」结尾 → normalizeCause 补成「…后起病」），
      // onset 只留时间与症状，避免「滑倒」在两句里各写一遍。
      cause: '于家中地面湿滑处跌倒、左髋部着地后',
      symptoms: '疼痛位于左髋部及腹股沟区，呈持续性胀痛，活动患肢及翻身时明显加剧，患肢不能主动抬起',
      relief: '平卧制动后疼痛稍减轻，口服布洛芬缓释胶囊0.3g后无明显缓解',
      evolution: '疼痛持续不减，逐渐出现左下肢外旋畸形，家属观察较对侧短缩约2cm、外旋约45°',
      accompanying: '伴左髋部活动受限及烦躁不安',
      negativeDiscriminating: '无昏迷及逆行性遗忘，无头痛及喷射性呕吐，无胸痛及呼吸困难，无双下肢麻木及大小便失禁',
      treatment: '2小时前由家属送至我院急诊，予下肢制动、布洛芬缓释胶囊0.3g口服1次，摄X线片示左股骨颈骨折，为进一步手术治疗收入院',
      generalCondition: '发病以来精神欠佳，未进食，睡眠差，小便未解，大便未解，体重无明显变化',
      extra: ''
    },
    ros: {
      joint: {
        // 高龄骨质疏松病人近两年本就有腰部酸痛，与本次外伤无关，如实记录。
        backPain: { checked: true, detail: '近2年腰部酸胀，劳累后加重，未系统诊治' },
        jointPain: { checked: true, detail: '左髋部持续性胀痛，活动患肢时加剧' },
        morningStiff: { negative: true },
        muscleWeak: { checked: true, detail: '左下肢不能主动抬起' }
      },
      nervous: {
        numbness: { negative: true },
        weakness: { checked: true, detail: '左下肢不能负重，余肢体肌力正常' },
        headache: { negative: true },
        vertigo: { negative: true }
      },
      gi: {
        abdominalPain: { negative: true },
        nausea: { negative: true },
        vomiting: { negative: true },
        melena: { negative: true },
        constipation: { negative: true }
      },
      resp: {
        cough: { negative: true },
        dyspnea: { negative: true },
        chestPainResp: { negative: true },
        fever: { negative: true }
      },
      cardio: {
        palpitation: { negative: true },
        chestPainCardio: { negative: true },
        syncope: { negative: true }
      },
      gu: {
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { negative: true }
      }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 高血压: true },
      diseaseOther: '',
      diseaseDetail: '高血压12年，口服氨氯地平5mg每日1次，血压控制在正常范围；近2年骨密度检查提示骨量减少，未规律补钙',
      longTermMeds: '氨氯地平5mg每日1次口服，碳酸钙D3片每日1片',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      // 外伤史是本例的关键既往信息，必须写具体经过而不是「否认外伤史」。
      trauma: '3小时前于家中平地滑倒致左髋部着地，既往无重大外伤及骨折史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期服用糖皮质激素史，否认反复跌倒史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏扬州，否认疫区及地方病流行区居住史',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      habits: '饮食清淡，户外活动较少，日照不足',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '已退休，居家活动为主，室内地面偶有湿滑'
    },
    marriage: { status: '丧偶', age: '23', spouseHealth: '配偶已故，死因不详' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父亲因脑卒中去世，母亲因股骨颈骨折后卧床并发肺部感染去世',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神可',
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏'
      },
      neck: { neckResist: '颈软，无抵抗' },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常'
      },
      // 患肢短缩、外旋的量化描述写在现病史；查体段只取选项里的定性表述，
      // 肢体畸形、关节活动受限、患肢血运三项正是股骨颈骨折的查体要点。
      special_surgery: {
        surgTrauma: '肢体畸形',
        surgJoint: '关节活动受限',
        surgVessel: '患肢远端动脉搏动可及，毛细血管充盈良好，皮温正常'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        {
          name: '左髋关节X线正侧位片',
          result: '左股骨颈可见骨折线，断端部分移位，股骨头与股骨颈仍有接触，符合 Garden Ⅲ型，髋关节间隙正常',
          date: '', hospital: '', no: ''
        },
        {
          name: '髋关节CT三维重建',
          result: '左股骨颈头下型骨折，骨折端嵌插并部分移位，股骨头未见塌陷，髋臼未见骨折',
          date: '', hospital: '', no: ''
        },
        { name: '血常规', result: 'Hb 108g/L，WBC 8.6×10⁹/L，N 74%，PLT 196×10⁹/L', date: '', hospital: '', no: '' },
        { name: '凝血功能', result: 'PT 12.4s，APTT 31.8s，INR 1.05，纤维蛋白原 4.2g/L，D-二聚体 3.6mg/L', date: '', hospital: '', no: '' },
        { name: '心电图', result: '窦性心律，未见明显ST-T改变', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['左股骨颈骨折（Garden Ⅲ型）', '骨质疏松症']
    }
  }
};
