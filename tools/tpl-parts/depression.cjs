/* 模板病例：抑郁发作（伴躯体症状）
 *
 * 诊断依据按 ICD-10 / DSM-5 的抑郁发作条目组织，本仓库教材语料（内科学/外科学/
 * 诊断学）没有精神科专章，故不标页码；症状学描述与病程要求（≥2 周）按通行标准。
 *
 * 写法要点：
 *   ① 主诉只能是症状学描述，不能出现「抑郁」「抑郁症」这类诊断名——
 *      validate() 的 DIAG_WORDS 虽未收录精神科诊断词，主诉写诊断名本身也不合规。
 *   ② 精神科的「查体」就是精神状况检查（MSE），故 pe 只写 special_psychiatry；
 *      通用查体（腹部触诊、心脏听诊之类）一律不勾写，只留 general.conscious
 *      ——「神志清楚」是精神检查能进行下去的前提，其余正常查体对精神科病历没有信息量。
 *   ③ pe.special_psychiatry 的每个值都逐字取自 tools/pe-options.txt 的 def=/opt=，
 *      一个字都没有改：check-templates 对这些值是精确字符串比对。
 *   ④ 精神科必须交代物质使用：personal.drugs 与 pmh.special 各写一处，
 *      吸烟/饮酒用三态（'有'/'无'/'已戒'），不能留空让病历变成「吸烟史：／」。
 *   ⑤ 辅助检查只用于排除器质性与物质所致（甲功、头颅影像）与病情评估（量表），
 *      不能写成「靠量表确诊」——抑郁发作是临床诊断。
 */
module.exports = {
  key: 'depression',
  dept: 'psychiatry',
  name: '抑郁发作（伴躯体症状）',
  alias: ['抑郁发作', '抑郁症', '抑郁障碍', '中度抑郁'],
  hint: '持续情绪低落、兴趣减退伴精力下降，睡眠与食欲改变，需评估自杀风险',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江杭州',
      birthPlace: '浙江杭州',
      occupation: '公司会计',
      reliability: '可靠',
      // 精神科病史陈述者要写清：抑郁发作患者多能自行叙述，故为患者本人。
      informant: '患者本人',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，
      // CORE.fillBlanks 只填空值，另写 unit 会被默认值顶掉（外科那批已踩过）。
      chiefComplaint: '情绪低落、兴趣减退3个月'
    },
    hpi: {
      onset: '3个月前逐渐出现情绪低落，整日闷闷不乐，对以往感兴趣的事提不起劲',
      // 以「后」结尾，normalizeCause 才会补成「…后起病」；
      // 若写成名词短语，会被拼成「X为本次发病诱因」。
      cause: '工作调整及与同事发生争执后',
      symptoms: '晨起时情绪最低落，午后稍减轻，自觉脑子反应变慢、思考费力，注意力不集中，常独自落泪',
      relief: '休息及家人陪伴时略有好转，未服抗抑郁药',
      evolution: '近1个月加重，已请假在家，有时整日卧床，不愿与人接触',
      accompanying: '伴入睡困难及早醒，夜间睡约3小时即醒后难以再入睡；食欲明显减退，进食量约为病前一半',
      // 有鉴别意义的阴性：排除器质性、物质所致与躁狂发作（双相筛查）。
      negativeDiscriminating: '无发热、头痛及呕吐，无抽搐及意识丧失，无饮酒及药物滥用史，无持续情绪高涨或言语增多',
      treatment: '2个月前于当地医院查甲状腺功能正常、头颅MRI未见异常，予舍曲林50mg每日1次口服，2周后因恶心自行停药',
      generalCondition: '发病以来精神差，食欲减退，睡眠差，生活尚能自理，体重较病前明显下降',
      extra: ''
    },
    ros: {
      // 精神科系统回顾重点是 nervous：ICD-10 的抑郁发作要求「心境低落或兴趣减退」
      // 至少其一，故 moodLow 与 interestLoss 都必须明确问到（阳性或阴性都要有结论）。
      nervous: {
        moodLow: { checked: true, detail: '整日闷闷不乐，晨重暮轻，常独自落泪' },
        interestLoss: { checked: true, detail: '以往喜欢的散步、看电视剧均提不起兴趣' },
        energyLoss: { checked: true, detail: '稍活动即感疲乏，日常家务难以完成' },
        // 自杀风险是精神科病历必须留痕的一项，不能只写「无」了事，要写清想法与行为。
        suicidal: { checked: true, detail: '近1个月反复想到「活着没意思」，曾一次自行加量服用舍曲林被家人发现，无自伤行为' },
        appetiteChange: { checked: true, detail: '进食量约为病前一半，体重较病前明显下降' },
        insomnia: { checked: true, detail: '入睡需2小时以上，凌晨3时左右早醒' },
        memoryLoss: { checked: true, detail: '常忘记刚说过的话，需家人提醒' },
        anxiety: { negative: true },
        hallucination: { negative: true },
        behaviorAbnormal: { negative: true },
        headache: { negative: true },
        dizziness: { negative: true },
        tremor: { negative: true }
      },
      // 其余系统只写问过的阴性项，未问的整键不写（不写 ≠ 阴性）。
      resp: { fever: { negative: true }, cough: { negative: true } },
      cardio: { palpitation: { negative: true } },
      gi: { abdominalPain: { negative: true }, vomiting: { negative: true } },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史，否认颅脑外伤及癫痫史',
      longTermMeds: '否认长期服用激素、镇静催眠药及利血平等药物史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认中毒史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认既往类似发作史，否认既往躁狂或轻躁狂发作史',
      otherTreatDiseases: '',
      // 物质使用：精神科必须问到，写在「其它」行（generator 渲染为「其它：…」）。
      special: '已自行停用舍曲林2个月，其间未使用酒精及其他精神活性物质'
    },
    personal: {
      residence: '浙江杭州，否认疫区及地方病流行区居住史',
      smoking: '无',
      drinking: '无',
      // 毒物/物质接触史：精神科用它交代酒精与成瘾物质，不能留空。
      drugs: '否认乙醇依赖及吸毒、滥用镇静催眠药物史',
      // habits 会被 generator 原样输出成一行，故这里不重复写病前性格
      // （性格已单列在 premorbidPersonality），只写生活作息与社交习惯。
      habits: '生活作息规律，社交活动少，业余多在家看书，近3个月因精力下降几乎不外出',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '财务工作，近半年工作强度增大，无粉尘及毒物接触',
      // 病前性格与发病前应激事件是精神科病历的两项必备内容（便于判断素质因素与诱因）。
      premorbidPersonality: '内向、少言，做事追求完美，遇事多独自承受，不轻易向他人倾诉',
      stressEvent: '3个月前科室岗位调整，工作量明显增加，并与同事发生过一次激烈争执'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', relation: '和睦' },
    family: {
      // 情感障碍有明确家族聚集性，家族史必须勾到「精神病」。
      diseaseChecks: { 精神病: true },
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病病史',
      similarDisease: '母亲有抑郁发作史，曾服抗抑郁药治疗，现病情稳定',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病家族史'
    },
    pe: {
      // 精神科不写生命体征（学生自己测），其余通用查体一律不勾写。
      vitals: {},
      general: { conscious: '神志清楚，精神差' },
      special_psychiatry: {
        psyAppearance: '衣着整洁，接触主动，合作',
        psyOrientation: '定向力完整，意识清晰',
        psySpeech: '语速缓慢，语音低微',
        psyThoughtForm: '思维连贯，逻辑正常',
        psyThoughtContent: '未引出妄想',
        psyPerception: '未引出幻觉',
        psyMood: '情感低落',
        psyCognition: '近事记忆力减退',
        psyInsight: '自知力完整，承认有病并愿意接受治疗',
        psyBehavior: '意志减退，生活懒散'
      }
    },
    auxiliary: {
      items: [
        // 甲功与影像的目的是排除器质性/内分泌所致，不是诊断依据。
        { name: '甲状腺功能', result: 'FT3 4.6pmol/L，FT4 15.2pmol/L，TSH 2.1mIU/L，均在正常范围', date: '', hospital: '', no: '' },
        { name: '头颅MRI', result: '脑实质未见异常信号，垂体形态正常，未见占位', date: '', hospital: '', no: '' },
        { name: '心电图', result: '窦性心律，大致正常心电图', date: '', hospital: '', no: '' },
        // 量表只作病情严重程度评估与随访基线，诊断仍依据病史与精神检查。
        { name: '汉密尔顿抑郁量表（HAMD-17）', result: '总分24分，提示中度抑郁，供病情评估与随访比较', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['抑郁发作（伴躯体症状）', '睡眠障碍']
    }
  }
};
