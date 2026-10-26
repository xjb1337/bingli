/* 模板病例：自发性气胸（右侧，闭合性）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：瘦高体型青年男性，安静或轻微活动时突发一侧胸痛，随即出现气促，
 * 是原发性自发性气胸的典型起病。体征取决于积气量：患侧胸廓饱满、呼吸运动与语颤减弱、
 * 叩诊呈过清音、呼吸音减弱或消失，大量气胸时气管向健侧移位。
 * X 线见外凸弧形气胸线、气胸线外肺纹理消失，是确诊依据；肺压缩程度按侧胸壁至肺边缘的距离估算。
 *
 * 说明：教材描述的是「叩诊鼓音」「呼吸音消失」，词汇表里对应的是「局部叩诊过清音」与
 * 「双肺呼吸音减弱」，查体段只用词表里逐字有的写法，气管移位写在体征里可查的那一项。
 * 生命体征（体温/脉搏/呼吸/血压/身高/体重）一律留空，由学生自己测、自己填。
 */
module.exports = {
  key: 'ptx',
  dept: 'respiratory',
  name: '自发性气胸（右侧，闭合性）',
  alias: ['气胸', '自发性气胸', '原发性自发性气胸', '闭合性气胸', '肺压缩'],
  hint: '瘦高青年突发一侧胸痛后气促，患侧胸廓饱满、语颤减弱、叩诊过清音、呼吸音减弱，气管向健侧移位，胸片见外带无肺纹理、肺压缩约 60%',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '山东济南',
      birthPlace: '山东济南',
      occupation: '大学生',
      reliability: '可靠',
      chiefComplaint: '突发右侧胸痛伴气促6小时',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '6小时前在教室自习安静状态下突发右侧胸部尖锐刺痛，持续约数分钟后稍缓解，随即出现气促',
      cause: '发病前无剧烈运动、无外伤及用力屏气，无咳嗽及发热，近期备考熬夜、睡眠不足',
      symptoms: '胸痛位于右侧前胸及腋下，为尖锐刺痛，吸气及咳嗽时加重，可放射至右肩部；气促与活动相关，平地行走数十米即需停下休息，卧床时可稍缓解，无端坐呼吸',
      relief: '卧床休息后气促稍减轻，胸痛无缓解',
      evolution: '入院前2小时气促加重，讲话需停顿，同事送至急诊',
      accompanying: '伴干咳，无痰，轻度心慌',
      negativeDiscriminating: '无发热及寒战，无咳脓痰及咯血，无粉红色泡沫样痰，无夜间阵发性呼吸困难及双下肢水肿，无长期卧床及单侧下肢肿胀史，无胸部外伤及剧烈运动史，无既往类似发作',
      treatment: '急诊予鼻导管吸氧及镇痛对症处理，未使用抗生素及支气管扩张剂，胸片后行胸腔穿刺抽气',
      generalCondition: '发病以来精神紧张，食欲尚可，睡眠因胸痛及气促受影响，大小便正常，体重无明显变化',
      extra: '急诊胸片示右侧气胸，肺压缩约60%，纵隔向左侧移位，遂收入院行胸腔闭式引流'
    },
    ros: {
      resp: {
        chestPainResp: { checked: true, detail: '突发右侧前胸及腋下尖锐刺痛，吸气及咳嗽时加重，可放射至右肩' },
        dyspnea: { checked: true, detail: '活动后气促，平地行走数十米需停下休息，讲话需停顿' },
        cough: { checked: true, detail: '干咳，无痰' },
        hemoptysis: { negative: true },
        sputum: { negative: true },
        fever: { negative: true },
        wheeze: { negative: true },
        nightSweat: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '轻度心慌' },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true }
      },
      endocrine: { weightLoss: { negative: true } },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病史；否认慢性支气管炎、哮喘及肺结核病史；否认既往气胸发作史',
      longTermMeds: '无长期口服药物',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认胸部外伤及肋骨骨折史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及有害气体接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认吸烟及被动吸烟史，否认家族中气胸及结缔组织疾病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '山东济南，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认粉尘、石棉及放射性物质接触史',
      environment: '',
      habits: '',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '在校大学生，无工业毒物及粉尘接触，近期备考、久坐、作息不规律'
    },
    marriage: { status: '未婚', age: '', spouseHealth: '', sexLife: '', relation: '' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中类似疾病患者',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '急性病容',
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
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管向左侧移位'
      },
      chest: {
        chestShape: '胸廓不对称',
        lungInspect: '呼吸运动减弱',
        lungPalpation: '语颤减弱',
        lungAuscultation: '呼吸音减弱',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
      },
      special_respiratory: {
        respShape: '一侧呼吸运动减弱',
        respAccessory: '可见辅助呼吸肌参与呼吸运动',
        respPercussion: '局部叩诊过清音',
        respVocalFremitus: '患侧语音震颤减弱',
        respChestExpansion: '一侧肺下界移动度消失',
        respBreathSound: '双肺呼吸音减弱',
        respCyanosis: '无杵状指，无球结膜水肿'
      }
    },
    auxiliary: {
      items: [
        { name: '胸部X线片', result: '右侧胸腔外带见无肺纹理透亮区，内缘见外凸弧形气胸线，右肺被压缩至肺门旁、压缩约60%，纵隔及气管向左侧移位，左肺未见异常', date: '', hospital: '', no: '' },
        { name: '胸部CT（平扫）', result: '右侧胸腔大量积气，右肺压缩约60%，右肺尖见数个小肺大疱，未见明显肺实质浸润及胸膜腔积液', date: '', hospital: '', no: '' },
        { name: '动脉血气分析', result: 'pH 7.46，PaO2 68mmHg，PaCO2 34mmHg，SaO2 94%', date: '', hospital: '', no: '' },
        { name: '血常规及凝血功能', result: 'WBC 9.2×10⁹/L，中性粒细胞 72.6%，Hb 146g/L，PLT 226×10⁹/L；PT 11.8秒，APTT 28.6秒', date: '', hospital: '', no: '' }
      ]
    },
    summary: '患者因“突发右侧胸痛伴气促6小时”入院。6小时前安静状态下突发右侧前胸尖锐刺痛，吸气及咳嗽时加重，随即出现气促，平地行走数十米即需休息；既往体健，无胸部外伤及剧烈运动史。查体：急性病容，气管向左侧移位，胸廓不对称，右侧呼吸运动及语颤减弱，局部叩诊过清音，双肺呼吸音减弱，患侧肺下界移动度消失，可见辅助呼吸肌参与呼吸运动。胸片示右侧外带无肺纹理透亮区、外凸弧形气胸线，右肺压缩约60%，纵隔向左侧移位；CT示右肺尖小肺大疱。无发热及咳脓痰、无咯血，可与肺炎鉴别；无粉红色泡沫样痰、无夜间阵发性呼吸困难及双下肢水肿，可与急性左心衰竭鉴别',
    soap: {
      a: {
        basisDetail: [
          {
            diagnosis: '自发性气胸（右侧，闭合性）',
            history: '瘦高体型青年，安静状态下突发右侧前胸尖锐刺痛，吸气及咳嗽时加重，随即出现气促；既往无胸部外伤及剧烈运动史，无类似发作史',
            pe: '急性病容，气管向左侧移位，胸廓不对称，右侧呼吸运动及语颤减弱，局部叩诊过清音，双肺呼吸音减弱，患侧肺下界移动度消失',
            aux: '胸部X线片示右侧胸腔外带无肺纹理透亮区、外凸弧形气胸线，右肺压缩约60%，纵隔及气管向左侧移位；胸部CT示右肺尖小肺大疱'
          },
          {
            diagnosis: '低氧血症',
            history: '气促，平地行走数十米即需休息，讲话需停顿',
            pe: '急性病容，可见辅助呼吸肌参与呼吸运动',
            aux: '动脉血气分析 pH 7.46，PaO2 68mmHg，PaCO2 34mmHg，SaO2 94%'
          }
        ]
      }
    },
    diagnosis: {
      confirmed: ['自发性气胸（右侧，闭合性）', '低氧血症']
    }
  }
};
