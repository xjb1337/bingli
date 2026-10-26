/* 模板病例：腹股沟斜疝（右侧，可复性）
 *
 * 依据《外科学》第10版 p381-391：
 *   易复性斜疝除腹股沟区有肿块和偶有胀痛外并无其他症状，肿块常在腹压增大时出现，
 *   多呈带蒂柄的梨形，可降至阴囊；平卧休息或用手推送可回纳消失（p385）。
 *   回纳后手指伸入浅环可感浅环扩大、腹壁软弱，嘱病人咳嗽时指尖有冲击感；
 *   压住深环再起立咳嗽，疝块并不出现（p385）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词。
 */
module.exports = {
  key: 'hernia',
  dept: 'surgery',
  name: '腹股沟斜疝（右侧，可复性）',
  alias: ['腹股沟斜疝', '腹股沟疝', '斜疝', '小肠疝气'],
  hint: '腹股沟区可复性肿块，站立咳嗽时出现，平卧回纳后咳嗽冲击感阳性',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南通',
      birthPlace: '江苏南通',
      occupation: '建筑工人',
      reliability: '可靠',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，另写 unit 会被默认值顶掉。
      chiefComplaint: '右侧腹股沟区可复性肿块2年'
    },
    hpi: {
      onset: '2年前发现右侧腹股沟区肿块，初起约核桃大小，无疼痛',
      // 以「后」结尾，normalizeCause 会补成「…后起病」，避免拼出「…为本次发病诱因」。
      // 诱因只写在这里，onset 里不再重复「站立及负重」，否则同一信息出现两次。
      cause: '长时间站立、行走及负重劳动后',
      symptoms: '肿块于腹压增大时出现，呈梨形，质软，站立时可降至右侧阴囊，平卧或用手推送后可回纳消失',
      relief: '平卧休息后肿块自行回纳，回纳后坠胀感随之消失',
      evolution: '2年来肿块逐渐增大至拳头大小，坠胀感较前加重，从未发生回纳困难',
      accompanying: '伴腹股沟区坠胀不适，长时间站立及行走后明显',
      negativeDiscriminating: '无发热，无腹痛及腹胀，无恶心呕吐及停止排气排便，无肿块红肿及触痛',
      treatment: '未曾服药及手术治疗，肿块从未发生不能回纳的情况，为进一步诊治来院',
      generalCondition: '发病以来精神、食欲、睡眠可，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { negative: true },
        nausea: { negative: true },
        vomiting: { negative: true },
        constipation: { negative: true },
        diarrhea: { negative: true },
        melena: { negative: true },
        bloating: { negative: true }
      },
      resp: {
        cough: { negative: true },
        sputum: { negative: true },
        dyspnea: { negative: true }
      },
      gu: {
        dysuria: { checked: true, detail: '排尿等待、尿线变细，夜尿增多' },
        hematuria: { negative: true },
        flankPain: { negative: true }
      },
      cardio: { palpitation: { negative: true } },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 前列腺增生: true },
      diseaseOther: '',
      diseaseDetail: '前列腺增生6年，间断排尿不畅，未规律服药',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期慢性咳嗽、长期便秘等使腹内压增高的病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏南通，否认疫区及地方病流行区居住史',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      habits: '饮食规律，长期从事重体力劳动',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '建筑工地作业，需反复弯腰负重'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健' },
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
      skin: { color: '全身皮肤黏膜无黄染、苍白、发绀', rash: '未见皮疹及出血点' },
      head: { eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏' },
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
      // 专科段只写本病相关：疝块可复性由 surgExtra2 的选项表达（该值是诊断提示的
      // 精确匹配点，不要改写措辞），其余阴性项按 def 抄，避免与通用查体重复。
      special_surgery: {
        surgExtra2: '腹股沟区可触及肿块',
        surgPeritoneum: '全腹无压痛、反跳痛及腹肌紧张',
        surgLymph: '引流区域淋巴结未触及肿大'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 142g/L，WBC 6.8×10⁹/L，N 62%，PLT 198×10⁹/L', date: '', hospital: '', no: '' },
        {
          name: '腹股沟区超声',
          result: '右侧腹股沟区可见疝囊回声，内为肠管及网膜组织，平卧推送后可回纳，疝环内径约2.4cm，未见嵌顿',
          date: '', hospital: '', no: ''
        },
        { name: '心电图', result: '窦性心律，未见ST-T改变', date: '', hospital: '', no: '' },
        { name: '凝血功能', result: 'PT 11.6s，APTT 30.2s，INR 1.02，纤维蛋白原 3.1g/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['右侧腹股沟斜疝（可复性）', '腹股沟管后壁缺损']
    }
  }
};
