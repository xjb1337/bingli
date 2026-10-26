/* 模板病例：阿尔茨海默病（中度）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：隐袭起病、进行性加重的近事记忆障碍，逐渐累及语言、视空间与执行功能，
 * 伴人格改变与日常生活能力下降；查体无局灶性神经体征是本病的「阴性证据」；
 * 量表（MMSE、MoCA）与海马萎缩影像支持诊断，确诊需病理。
 */
module.exports = {
  key: 'dementia',
  dept: 'neurology',
  name: '阿尔茨海默病（中度）',
  alias: ['阿尔茨海默病', '老年性痴呆', 'AD', '痴呆'],
  hint: '隐袭起病的近事记忆减退进行性加重，伴认知功能下降，无局灶性神经体征',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江杭州',
      birthPlace: '浙江杭州',
      occupation: '退休教师',
      reliability: '由家属代述，基本可靠',
      chiefComplaint: '近事记忆减退2年，加重伴迷路3个月',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '年'
    },
    hpi: {
      onset: '2年前无明显诱因出现近事记忆减退，起初为忘记刚放下的物品、重复问同一件事，家人以为是年纪大未在意',
      cause: '无明确诱因；否认头部外伤、煤气中毒及脑炎病史',
      symptoms: '记忆减退以近事为主，远事如年轻时经历尚能清楚回忆；近3个月出现外出后找不到回家的路，曾在小区附近迷路2次；不会使用手机拨号，把盐当糖放进菜里',
      relief: '无缓解因素',
      evolution: '症状缓慢进行性加重，近半年生活需他人提醒，洗漱、穿衣需督促，偶有将衣物穿反',
      accompanying: '伴性格改变，较前固执、易怒，怀疑家人藏其物品；夜间睡眠差，白天嗜睡',
      negativeDiscriminating: '无肢体瘫痪及麻木，无言语不能，无吞咽困难及饮水呛咳，无肢体抖动，无走路不稳，无幻觉及妄想内容泛化，无发热',
      treatment: '曾在社区医院就诊，查头颅CT示脑萎缩，未予特殊治疗；近1个月自行服用银杏叶提取物，症状无改善',
      generalCondition: '发病以来精神一般，食欲尚可，睡眠昼夜颠倒，大小便偶有失禁，体重无明显变化',
      extra: '家属陪同就诊，能配合完成量表评定'
    },
    ros: {
      nervous: {
        memoryLoss: { checked: true, detail: '近事记忆减退2年，远事记忆相对保留' },
        moodLow: { checked: true, detail: '情绪低落，兴趣减少' },
        sleepDisorder: { checked: true, detail: '夜间睡眠差，白天嗜睡' },
        hallucination: { negative: true },
        seizure: { negative: true },
        weakness: { negative: true },
        numbness: { negative: true },
        speech: { negative: true },
        tremor: { negative: true },
        incontinence: { checked: true, detail: '偶有尿失禁' },
        headache: { negative: true }
      },
      cardio: { palpitation: { negative: true } },
      resp: { fever: { negative: true }, cough: { negative: true } },
      gi: { appetiteLoss: { checked: true, detail: '进食量较前减少' }, constipation: { checked: true, detail: '3～4日一行' } }
    },
    pmh: {
      health: '既往体健，生活自理至2年前',
      diseaseChecks: { 高血压: true },
      diseaseDetail: '高血压病史12年，最高血压160/90mmHg，长期口服缬沙坦80mg每日1次，血压控制在140/85mmHg左右；否认糖尿病、脑卒中病史',
      longTermMeds: '缬沙坦80mg每日1次口服；银杏叶提取物片2片每日3次口服（近1个月自服）',
      infection: '否认肝炎、结核等传染病史',
      surgery: '50年前行阑尾切除术',
      trauma: '否认头部外伤史',
      transfusion: '否认输血史',
      poisoning: '否认一氧化碳中毒史',
      vaccine: '按计划预防接种',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认甲状腺疾病、维生素B12缺乏及梅毒病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江杭州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认铅、汞等重金属接触史',
      environment: '',
      habits: '退休后以居家为主，社交活动少，近2年不再参加老年大学活动',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '退休前从事中学语文教学工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健，共同生活', sexLife: '近2年无', relation: '和睦' },
    family: {
      diseaseChecks: { 遗传性疾病: true },
      other: '母亲70岁起出现记忆减退，80岁确诊痴呆',
      deceased: '父亲因肺癌去世，78岁；母亲健在，现年84岁',
      threeGeneration: '两系三代有痴呆家族史',
      similarDisease: '母亲有类似疾病史',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        babinski: '巴氏征阴性'
      },
      special_neurology: {
        neuroExtra1: '记忆力减退',
        neuroExtra2: '十二对颅神经检查未见异常',
        neuroExtra3: '四肢肌张力正常，肌力正常，未见肌萎缩',
        neuroExtra4: '痛温觉、触觉、深感觉检查未见异常',
        neuroExtra5: '指鼻试验、跟膝胫试验稳准，Romberg征阴性',
        neuroPathologic: 'Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性',
        neuroMeningeal: '颈项强直阴性，Kernig征阴性，Brudzinski征阴性',
        neuroGait: '步态正常，行走平稳'
      }
    },
    auxiliary: {
      items: [
        { name: 'MMSE', result: '18分（定向力5分、记忆3分、注意与计算2分、回忆1分、语言7分），受教育程度初中以上', date: '', hospital: '', no: '' },
        { name: 'MoCA', result: '14分（视空间与执行2分、命名2分、注意2分、语言1分、抽象1分、延迟回忆0分、定向4分）', date: '', hospital: '', no: '' },
        { name: '头颅MRI（海马相）', result: '双侧海马萎缩，内侧颞叶萎缩评分（MTA）3级，脑沟增宽，脑室扩大，未见急性梗死灶', date: '', hospital: '', no: '' },
        { name: '甲状腺功能及维生素B12', result: 'TSH 2.1mIU/L，FT3、FT4正常；维生素B12 386pmol/L，均在正常范围', date: '', hospital: '', no: '' },
        { name: '日常生活能力量表（ADL）', result: '32分，洗澡、穿衣、理财需他人帮助', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['阿尔茨海默病（中度）', '高血压病2级（高危）', '便秘']
    }
  }
};
