/* 模板病例：甲状腺结节（TI-RADS 4a，拟手术）
 *
 * 依据《外科学》第10版 p271-283（颈部疾病）：
 *   甲状腺结节随吞咽上下活动，可扪及单个或多个结节，质地可韧可硬（p273）。
 *   颈部超声是重要的辅助检查手段，细针抽吸活检是甲状腺结节术前诊断的重要方法（p277）。
 *   TI-RADS 4a 属低度可疑恶性，结节＞1cm 时建议行细针穿刺细胞学检查。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词。
 */
module.exports = {
  key: 'thyroidNodule',
  dept: 'surgery',
  name: '甲状腺结节（TI-RADS 4a，拟手术）',
  alias: ['甲状腺结节', '甲状腺肿物', '颈前肿物', '甲状腺瘤'],
  hint: '颈前无痛性肿物缓慢增大，随吞咽上下移动，超声示低回声结节伴微钙化',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江宁波',
      birthPlace: '浙江宁波',
      occupation: '中学教师',
      reliability: '可靠',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，另写 unit 会被默认值顶掉。
      chiefComplaint: '发现颈前肿物1年'
    },
    hpi: {
      onset: '1年前洗脸时无意中发现颈前偏右肿物，约花生米大小，无疼痛及触痛',
      // 以「无诱因」开头，normalizeCause 判定为无诱因，返回空串，不会拼成「…发病诱因」。
      cause: '无诱因，无意中发现',
      symptoms: '肿物位于颈前偏右，缓慢增大，现约3cm大小，质韧，表面光滑，边界清楚，随吞咽上下移动，局部皮肤无红肿',
      relief: '未服用任何药物治疗，肿物无自行缩小',
      evolution: '近半年肿物增大较前明显',
      accompanying: '伴颈部轻度胀感，长时间讲话后明显',
      negativeDiscriminating: '无声音嘶哑，无吞咽困难及呼吸不畅，无怕热、多汗、心悸及手抖，无体重明显下降，无发热，无饮水呛咳',
      treatment: '2周前于我院门诊查甲状腺超声示右叶低回声结节，TI-RADS 4a，甲状腺功能正常；1周前行细针穿刺细胞学检查示Bethesda Ⅳ类，为进一步手术治疗收入院',
      generalCondition: '发病以来精神、食欲、睡眠可，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      endocrine: {
        neckMass: { checked: true, detail: '颈前偏右肿物，1年来缓慢增大' },
        weightLoss: { negative: true },
        weightGain: { negative: true },
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true },
        hairLoss: { negative: true },
        polydipsia: { negative: true }
      },
      resp: {
        dyspnea: { negative: true },
        cough: { negative: true },
        hoarseness: { negative: true }
      },
      cardio: {
        palpitation: { negative: true },
        chestPainCardio: { negative: true }
      },
      gi: {
        appetiteLoss: { negative: true },
        abdominalPain: { negative: true },
        nausea: { negative: true }
      },
      nervous: {
        tremor: { negative: true },
        weakness: { negative: true }
      },
      hemat: {
        fatigue: { negative: true },
        lymphNode: { negative: true }
      }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseOther: '',
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认颈部外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认童年期头颈部放射线照射史，否认甲状腺疾病家族史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江宁波，否认疫区及地方病流行区居住史',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      habits: '饮食规律，平素碘盐摄入正常，无偏食',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事教学工作，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
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
        posture: '自主体位',
        face: '面容自然',
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
        // 甲状腺结节的核心查体：值必须逐字取自该选项，也命中诊断提示的 pe:neck.thyroid。
        thyroid: '甲状腺可触及结节',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
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
      // 颈部淋巴结与手术区域皮肤是甲状腺手术前的常规查体，均为阴性，按 def 抄。
      special_surgery: {
        surgLymph: '引流区域淋巴结未触及肿大',
        surgExtra1: '手术区域皮肤完整，无红肿及分泌物'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        {
          name: '甲状腺功能',
          result: 'FT3 4.6pmol/L，FT4 15.2pmol/L，TSH 2.18mIU/L，均在正常范围；TGAb、TPOAb 阴性',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺及颈部超声',
          result: '右叶见低回声结节，大小约2.8cm×2.1cm，边界欠清，形态欠规则，内见点状强回声（微钙化），TI-RADS 4a；颈部未见肿大淋巴结',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺结节细针穿刺细胞学',
          result: '涂片细胞丰富，见异型滤泡上皮细胞，可疑乳头状癌，Bethesda Ⅳ类',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规',
          result: '血红蛋白 132g/L，WBC 6.2×10⁹/L，N 60%，PLT 224×10⁹/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '电子喉镜',
          result: '双侧声带活动对称，声门闭合良好，未见新生物',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: ['甲状腺结节（TI-RADS 4a）', '右甲状腺结节（Bethesda Ⅳ类）']
    }
  }
};
