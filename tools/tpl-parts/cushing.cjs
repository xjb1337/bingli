/* 模板病例：库欣综合征（垂体 ACTH 微腺瘤所致，Cushing 病）
 *
 * 依据《内科学》第10版 p740-754（库欣综合征）：
 *   典型表现：向心性肥胖、满月脸、水牛背、多血质外貌、紫纹
 *   （多见于下腹部及大腿内侧，宽＞1cm、呈紫红色）、痤疮、多毛（p742-743）。
 *   其他：高血压、糖耐量减低、低钾血症、骨质疏松、女性月经紊乱、近端肌无力、
 *   易感染、精神症状（p743）。
 *   实验室：24 小时尿游离皮质醇升高、血皮质醇昼夜节律消失、
 *   小剂量地塞米松抑制试验不被抑制（p745-746）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'cushing',
  dept: 'endocrinology',
  name: '库欣综合征（Cushing 病）',
  alias: ['库欣综合征', '皮质醇增多症', 'Cushing综合征', '肾上腺皮质功能亢进', '库欣病'],
  hint: '向心性肥胖、满月脸水牛背，腹部紫纹、痤疮多毛，血压升高伴月经紊乱，血皮质醇节律消失',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '山东济南',
      birthPlace: '山东济南',
      occupation: '会计',
      reliability: '可靠',
      // 主诉只写症状+时间；「库欣综合征」「皮质醇增多症」都是诊断性词语（validate 会拦）。
      chiefComplaint: '体重增加伴面圆、腹部紫纹1年半'
    },
    hpi: {
      onset: '1年半前无明显诱因出现体重逐渐增加，1年半内由55kg增至72kg，以躯干及颜面为主，四肢相对不增粗',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因。
      cause: '无明显诱因，未服用糖皮质激素及含激素类保健品',
      symptoms: '面颊变圆、面色红润，颈后脂肪垫增厚；腹部及大腿内侧出现紫红色条纹，宽约1.5cm；皮肤易出现瘀斑，轻微碰撞即青紫',
      relief: '未服药，自行控制饮食及增加运动后体重仍继续上升',
      evolution: '近1年出现月经周期延长至40～60天、经量减少；四肢近端乏力，下蹲后起身困难；情绪易激动，偶有失眠',
      accompanying: '伴口干、多饮，夜尿1～2次，腰背部酸痛，无头痛及视野缺损，无阵发性剧烈头痛伴大汗',
      // 对应《内科学》p743-746：与单纯性肥胖、假性库欣状态（酒精性、抑郁症）、
      // 异位 ACTH 综合征、肾上腺腺瘤鉴别的关键点。
      negativeDiscriminating: '无阵发性剧烈头痛伴大汗及血压骤升，无颈前疼痛及怕热多汗，无长期饮酒史，无长期服用糖皮质激素及含激素外用制剂史，无体重下降及发热盗汗，无肉眼血尿及尿量明显减少，无视野缺损及溢乳',
      treatment: '2个月前门诊查血皮质醇升高、昼夜节律消失，肾上腺 CT 未见异常，为进一步诊治收入院',
      generalCondition: '发病以来精神可，食欲亢进，睡眠一般，大小便正常，体重增加约17kg',
      extra: ''
    },
    ros: {
      endocrine: {
        // 向心性肥胖、体重增加是库欣综合征最突出的表现（《内科学》p742）。
        weightGain: { checked: true, detail: '1年半内体重由55kg增至72kg，以躯干及颜面为主，四肢相对不增粗' },
        // 多毛、痤疮、脱发与雄激素增多有关（《内科学》p743）。
        hairChange: { checked: true, detail: '面部及躯干毛发增多变粗，唇周出现细须' },
        weightLoss: { negative: true },
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true },
        neckMass: { negative: true },
        polydipsia: { checked: true, detail: '近半年口干多饮，每日饮水约2500mL' },
        polyuriaEndo: { checked: true, detail: '夜尿1～2次，尿量偏多' }
      },
      cardio: {
        // 库欣综合征合并高血压者达 80%（《内科学》p743）。
        palpitation: { checked: true, detail: '活动后心悸，静息时可感心跳' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { checked: true, detail: '双下肢轻度水肿，午后为著' },
        syncope: { negative: true },
        cyanosis: { negative: true }
      },
      // 注：SCHEMA.ROS 没有独立的「皮肤」系统，瘀斑、皮疹、瘙痒等皮肤相关症状
      // 统一归在血液系统（hemat）里，所以这里不再单独写 ros.skin。
      hemat: {
        // 紫纹与皮肤菲薄、易瘀斑是库欣综合征的特征性皮损（《内科学》p742）。
        bruise: { checked: true, detail: '轻微碰撞即出现皮下瘀斑，分布于四肢' },
        fatigue: { checked: true, detail: '四肢近端乏力，下蹲后起身及上楼困难' },
        // 皮质醇增多易合并感染（《内科学》p743）。
        anemia: { negative: true },
        bleeding: { negative: true },
        bonePain: { checked: true, detail: '腰背部持续性酸痛，久坐及弯腰时加重' },
        pruritus: { negative: true },
        rash: { negative: true },
        pallorSkin: { negative: true }
      },
      nervous: {
        // 库欣综合征常见情绪改变、失眠（《内科学》p743）。
        moodLow: { negative: true },
        anxiety: { checked: true, detail: '情绪易激动、烦躁，因小事与家人争吵' },
        insomnia: { checked: true, detail: '入睡困难，夜间易醒' },
        // 垂体大腺瘤可压迫视交叉导致视野缺损（《内科学》p745），本例为微腺瘤，须记录阴性。
        visualBlur: { negative: true },
        headache: { negative: true },
        dizziness: { negative: true },
        weakness: { checked: true, detail: '全身乏力，以近端为主' },
        numbness: { negative: true },
        memoryLoss: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        constipation: { checked: true, detail: '大便2～3天一次，偏干' },
        melena: { negative: true },
        bloating: { checked: true, detail: '餐后腹胀，腹部膨隆明显' }
      },
      gu: {
        // 女性库欣综合征常有月经紊乱（《内科学》p743）。
        polyuria: { checked: true, detail: '尿量偏多，夜尿1～2次' },
        edemaGu: { checked: true, detail: '双下肢轻度水肿' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { negative: true },
        nocturia: { checked: true, detail: '夜尿1～2次' }
      },
      resp: {
        cough: { negative: true },
        fever: { negative: true },
        dyspnea: { negative: true },
        hemoptysis: { negative: true }
      },
      joint: {
        // 骨质疏松是库欣综合征常见并发症（《内科学》p743）。
        backPain: { checked: true, detail: '腰背部酸痛，久坐及弯腰时加重，无放射痛' },
        muscleWeak: { checked: true, detail: '双下肢近端无力，蹲起困难' },
        jointPain: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，否认高血压、糖尿病史',
      diseaseChecks: { 高血压: true },
      diseaseOther: '',
      // 库欣综合征多为继发性高血压，须交代发现时间与治疗情况（《内科学》p743）。
      diseaseDetail: '1年前体检发现血压升高，最高 160/100mmHg，未规律服药；否认糖皮质激素长期使用史',
      longTermMeds: '苯磺酸氨氯地平片 5mg 每日1次（近半年，间断）',
      infection: '否认肝炎、结核、伤寒等传染病史；近1年易感冒',
      surgery: '否认手术史；否认垂体及肾上腺手术史',
      trauma: '否认外伤史；否认脊柱压缩性骨折史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      allergenChecks: {},
      allergenOther: '',
      allergenReactionChecks: {},
      allergyReaction: '',
      relatedHistory: '否认长期外用含糖皮质激素药膏史，否认关节腔内注射激素史，否认哮喘及风湿病长期激素治疗史；否认长期饮酒史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '山东济南，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认毒物、粉尘及放射性物质接触史',
      environment: '',
      habits: '长期伏案工作，活动量少，饮食偏咸、喜甜食，近1年体重持续增加',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事会计工作14年，长期伏案、精神紧张，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '近1年性欲减退，同房次数减少', relation: '和睦' },
    family: {
      diseaseChecks: { 高血压: true, 糖尿病: true },
      other: '',
      deceased: '父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '母亲患高血压、糖尿病',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        // 库欣综合征典型体型为向心性肥胖（《内科学》p742）。
        nutrition: '肥胖',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        // 满月脸是库欣综合征的标志性面容，pe-options 的 general.face 中有独立选项，
        // 同时命中 cushing 规则的 pev:general.face=满月面容。
        face: '满月面容',
        cooperation: '查体合作'
      },
      skin: {
        // 多血质外貌、皮肤菲薄（《内科学》p742）。
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        // 皮肤易瘀斑是库欣综合征的表现（《内科学》p742）。
        rash: '可见瘀点瘀斑',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        // 满月脸伴眼睑水肿、面部多血质（《内科学》p742）。
        eyes: '眼睑水肿',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '口腔黏膜无溃疡，舌质淡红、苔薄白',
        hair: '毛发分布异常'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        // 甲状腺不大，用以排除甲减所致的水肿与体重增加（鉴别诊断要求）。
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
        // 继发性高血压病程仅 1 年余、最高 160/100mmHg，尚未形成明显的左心室扩大，
        // 叩诊心界不大；这样也不会把「高血压病」规则的特征拉进来抢主诊断位次。
        heartPercussion: '心界不大',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        // 向心性肥胖 → 腹部膨隆，腹壁脂肪增厚（《内科学》p742）。
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        // 紫纹多见于下腹部，触诊时注意腹壁柔软度与压痛。
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        // 骨质疏松可致胸腰椎叩击痛，甚至压缩性骨折（《内科学》p743）。
        spineCol: '脊柱后凸',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        // 库欣综合征的近端肌病表现为肌力下降（《内科学》p743）。
        limbMuscle: '四肢肌力4级',
        edemaAnkle: '双侧踝部凹陷性水肿'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        babinski: '巴氏征阴性',
        // 垂体大腺瘤可有视野缺损，本例微腺瘤无此表现（《内科学》p745）。
        tendonReflex: '双侧肱二头肌、膝腱、跟腱反射正常对称'
      },
      // 专科查体：不写 endoExtra（它是 summaryOf=endoSkin,endoBody 的汇总项，
      // 写了会让这两个明细项让位不输出）。
      special_endocrinology: {
        // 「满月脸、水牛背」是库欣综合征最典型的专科描述（《内科学》p742）。
        // 这一项同时命中 cushing 规则的第二条 match（pev:special_endocrinology.endoExtra），
        // 让它排在糖尿病规则之前（本例外周血糖偏高，容易被糖尿病规则抢到第一位）。
        endoExtra: '满月脸、水牛背',
        // 向心性肥胖（《内科学》p742）。
        endoBody: '向心性肥胖',
        // 紫纹是库欣综合征特征性皮损，宽＞1cm、紫红色（《内科学》p742）。
        endoSkin: '可见紫纹',
        endoThyroid: '甲状腺不大，质软，未触及结节，未闻及血管杂音',
        endoEye: '双眼球无突出，眼征阴性',
        endoHandFoot: '手足无畸形，指端无增粗',
        endoWound: '全身皮肤完整，未见溃疡及伤口愈合不良',
        // 血压升高但不用数字（《内科学》p743）。
        endoPulseBP: '血压升高'
      }
    },
    auxiliary: {
      items: [
        {
          name: '血皮质醇昼夜节律',
          result: '8:00 血皮质醇 682nmol/L（升高），16:00 为 610nmol/L，24:00 为 528nmol/L，昼夜节律消失',
          date: '', hospital: '', no: ''
        },
        {
          name: '24小时尿游离皮质醇',
          result: '24小时尿游离皮质醇 486μg/24h（明显升高，参考范围 20～90μg/24h）',
          date: '', hospital: '', no: ''
        },
        {
          name: '小剂量及大剂量地塞米松抑制试验',
          result: '小剂量（2mg/日×2天）抑制后血皮质醇 420nmol/L，未被抑制；大剂量（8mg/日×2天）抑制后降至 96nmol/L，抑制率＞50%',
          date: '', hospital: '', no: ''
        },
        {
          name: '血促肾上腺皮质激素及垂体磁共振',
          result: '8:00 血促肾上腺皮质激素 12.6pmol/L（正常高限或轻度升高）；垂体磁共振增强见垂体右翼 6mm 微腺瘤',
          date: '', hospital: '', no: ''
        },
        {
          name: '血糖、血脂及血钾',
          result: '空腹血糖 6.8mmol/L，糖化血红蛋白 6.4%；总胆固醇 6.6mmol/L，低密度脂蛋白胆固醇 4.3mmol/L；血钾 3.2mmol/L',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '库欣综合征（Cushing 病，垂体 ACTH 微腺瘤）',
        '继发性高血压',
        '糖耐量减低',
        '低钾血症'
      ]
    }
  }
};
