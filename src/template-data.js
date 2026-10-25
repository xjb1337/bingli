/* 模板病例数据 —— 由 tools/gen-templates.js 从 tools/tpl-parts/*.cjs 生成，请勿手改。
 *
 * 改模板的正确方式：改 tools/tpl-parts/<key>.cjs，然后 node tools/gen-templates.js。
 * 共 6 个模板：chole, cirrhosis, obstruction, pancreatitis, pud, ugib
 */
var TEMPLATE_DATA = [
  {
    "key": "chole",
    "dept": "digestive",
    "name": "急性结石性胆囊炎",
    "alias": [
      "急性胆囊炎",
      "胆囊炎",
      "胆囊结石",
      "胆石症",
      "胆绞痛"
    ],
    "hint": "进食油腻后右上腹痛向右肩背放射，Murphy 征阳性，超声见胆囊壁增厚与结石",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "小学教师",
        "reliability": "可靠",
        "chiefComplaint": "右上腹疼痛伴恶心呕吐2天",
        "chiefComplaintDuration": "2",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "2天前晚餐进食油炸食物后1小时出现右上腹持续性胀痛，阵发性加重，程度中等",
        "cause": "既往体检发现胆囊结石5年",
        "symptoms": "疼痛位于右上腹，向右肩及右腰背部放射，改变体位及弯腰均不能缓解，右上腹拒按",
        "relief": "自服「消炎利胆片」及局部热敷后无明显缓解",
        "evolution": "1天前疼痛加重，牵涉至右肩背，夜间因疼痛不能入睡，遂来院急诊",
        "accompanying": "伴恶心、呕吐胃内容物2次，呕吐后腹痛稍减轻；自觉发热，未测体温；无寒战",
        "negativeDiscriminating": "无皮肤及巩膜黄染，无皮肤瘙痒，无寒战高热，无呕血黑便，无腹泻，无尿频尿痛，无胸痛",
        "treatment": "急诊予禁食、解痉、静脉抗感染（头孢呋辛+甲硝唑），现疼痛较前减轻",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠差，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "右上腹持续胀痛，向右肩背放射"
          },
          "nausea": {
            "checked": true
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐胃内容物2次，吐后稍减轻"
          },
          "bloating": {
            "checked": true,
            "detail": "进食后明显"
          },
          "reflux": {
            "checked": true,
            "detail": "餐后为主"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "进食油腻后明显厌恶"
          },
          "jaundiceGi": {
            "negative": true
          },
          "jaundice": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "体温未测"
          },
          "chills": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "negative": true
          },
          "pallorSkin": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "胆囊结石": true
        },
        "diseaseDetail": "5年前体检超声发现胆囊结石，最大约1.2cm，偶有餐后右上腹不适，未行手术",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "胆囊结石为本次急性胆囊炎的直接病因",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "喜食油腻及油炸食物，运动少",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事小学教学工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "肥胖",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "上腹部压痛，无反跳痛"
        },
        "special_digestive": {
          "giTenderness": "右上腹压痛，胆囊点压痛",
          "giRebound": "局部腹肌紧张",
          "giGallbladderPalp": "Murphy征阳性",
          "giLiverPalp": "肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛",
          "giBowelSound": "未闻及振水音及血管杂音"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "腹部超声",
            "result": "胆囊9.2×4.0cm，壁厚0.6cm，呈双层；腔内见多枚强回声伴声影，最大约1.2cm，颈部一枚结石嵌顿；胆总管内径0.5cm，未见结石；胰腺未见异常",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 14.6×10⁹/L，N 87%，Hb 138g/L，PLT 232×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝功能",
            "result": "ALT 46U/L，AST 38U/L，TBil 22μmol/L，DBil 8μmol/L，Alb 41g/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部CT",
            "result": "胆囊增大，壁增厚水肿，胆囊周围脂肪间隙模糊，腔内见高密度结石影；未见胆总管扩张",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性结石性胆囊炎",
          "胆囊结石"
        ]
      }
    }
  },
  {
    "key": "cirrhosis",
    "dept": "digestive",
    "name": "肝硬化失代偿期（腹水）",
    "alias": [
      "肝硬化",
      "腹水",
      "肝腹水",
      "失代偿期肝硬化",
      "乙型肝炎肝硬化",
      "门脉高压"
    ],
    "hint": "乙型肝炎病史，腹胀、尿少、双下肢水肿，脾大，移动性浊音阳性",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "退休工人",
        "reliability": "可靠",
        "chiefComplaint": "腹胀伴双下肢水肿",
        "chiefComplaintDuration": "1",
        "chiefComplaintDurationUnit": "月"
      },
      "hpi": {
        "onset": "1个月前无明显诱因出现腹胀，进食后加重，夜间平卧时明显，同时发现双踝部水肿，晨轻暮重",
        "cause": "既往乙型病毒性肝炎20年，近3个月自行停用恩替卡韦，未再复查肝功能",
        "symptoms": "腹胀进行性加重，腹围渐增大，尿量减至每日约800ml，双下肢凹陷性水肿由踝部向上发展至胫前",
        "relief": "自服呋塞米20mg每日1次共3天，尿量增多、腹胀略减轻，停药后反复",
        "evolution": "近1周腹胀明显加重，进食量减至平时一半，平地行走即感气促，夜间需垫高枕头方能入睡",
        "accompanying": "伴乏力、食欲减退，刷牙时偶有牙龈出血，无鼻衄",
        "negativeDiscriminating": "无呕血、黑便，无发热、腹痛，无皮肤瘙痒及陶土样大便，无神志淡漠、计算力下降及扑翼样震颤",
        "treatment": "门诊予螺内酯40mg每日1次、呋塞米20mg每日1次口服，未行腹腔穿刺放液",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠差，尿量减少，体重较前增加约4kg",
        "extra": ""
      },
      "ros": {
        "gi": {
          "bloating": {
            "checked": true,
            "detail": "腹胀进行性加重，进食后明显"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "进食量减至平时一半"
          },
          "jaundiceGi": {
            "checked": true,
            "detail": "家属发现巩膜轻度发黄"
          },
          "jaundice": {
            "checked": true,
            "detail": "巩膜及皮肤轻度黄染"
          },
          "abdominalPain": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          }
        },
        "cardio": {
          "edemaCardio": {
            "checked": true,
            "detail": "双下肢凹陷性水肿，晨轻暮重"
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "每日尿量约800ml"
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "明显乏力，日常活动受限"
          },
          "bleeding": {
            "checked": true,
            "detail": "刷牙时牙龈渗血，量少可自止"
          },
          "epistaxis": {
            "negative": true
          },
          "purpura": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "平地行走即气促，平卧加重"
          },
          "fever": {
            "negative": true
          }
        },
        "nervous": {
          "sleepDisorder": {
            "checked": true,
            "detail": "夜间腹胀影响入睡"
          },
          "tremor": {
            "negative": true
          },
          "memoryLoss": {
            "negative": true
          }
        },
        "endocrine": {
          "weightGain": {
            "checked": true,
            "detail": "1个月内体重增加约4kg"
          }
        }
      },
      "pmh": {
        "health": "一般",
        "diseaseChecks": {
          "病毒性肝炎": true
        },
        "diseaseDetail": "20年前体检发现 HBsAg 阳性，诊断「乙型病毒性肝炎」，未规律抗病毒治疗；5年前查腹部超声提示「肝实质回声增粗、脾大」，诊断「乙型肝炎肝硬化」，间断服恩替卡韦，近3个月自行停药",
        "longTermMeds": "恩替卡韦0.5mg每日1次，间断服用，近3个月已停",
        "infection": "乙型病毒性肝炎20年，否认结核、疟疾等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认长期饮酒及肝毒性药物、毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "乙型肝炎后肝硬化是本次腹水、脾大及凝血功能减退的基础病因",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "已戒",
        "smokingAmount": "吸烟30年，每日约20支，5年前已戒烟",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "",
        "environment": "",
        "habits": "饮食偏咸，喜食腌制食品，近1个月因腹胀进食明显减少",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "退休前从事机械加工工作，无粉尘、毒物及放射性物质接触史"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健，HBsAg 阴性",
        "sexLife": "近半年性欲减退，近1个月因腹胀进一步减少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "病毒性肝炎": true,
          "恶性肿瘤": true
        },
        "other": "",
        "deceased": "父亲因肝癌去世，68岁；母亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "",
        "infectionHistory": "母亲 HBsAg 阳性，家族中乙型肝炎呈聚集现象"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "慢性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜黄染",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "巩膜黄染"
        },
        "neck": {
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "移动性浊音阳性"
        },
        "spine": {
          "limbs": "双下肢凹陷性水肿"
        },
        "special_digestive": {
          "giExtra": "肝颈静脉回流征阴性",
          "giAbdShape": "腹壁静脉曲张，血流方向自下而上",
          "giTenderness": "上腹部压痛",
          "giLiverPalp": "肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛",
          "giSpleenPalp": "脾肋下可触及，质硬",
          "giFluidThrill": "液波震颤阳性",
          "giShiftingDullness": "移动性浊音阳性"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 3.2×10⁹/L，N 58%，Hb 106g/L，PLT 62×10⁹/L，三系减少",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝功能",
            "result": "ALT 68U/L，AST 94U/L，Alb 27g/L，TBil 46μmol/L，DBil 26μmol/L，ALP 168U/L，GGT 132U/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "PT 17.8s，较正常对照延长 4.2s，INR 1.52，APTT 41s",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "乙肝五项",
            "result": "HBsAg 阳性，HBeAg 阴性，抗-HBe 阳性，抗-HBc 阳性，抗-HBs 阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "HBV-DNA",
            "result": "3.6×10⁵ IU/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲胎蛋白",
            "result": "38ng/ml（轻度升高）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "肝体积缩小，表面呈锯齿状，实质回声增粗不均，门静脉内径 1.4cm，血流速度减慢；脾 15.2×6.8cm；腹腔内见大量无回声区，最深约 9.8cm",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胃镜",
            "result": "食管中下段可见 3 条曲张静脉，呈串珠样，红色征阳性（中度）；胃底未见明显曲张；门脉高压性胃病（轻度）",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "乙型肝炎后肝硬化失代偿期",
          "腹腔积液",
          "食管胃底静脉曲张（中度）",
          "脾功能亢进",
          "低白蛋白血症"
        ]
      }
    }
  },
  {
    "key": "obstruction",
    "dept": "digestive",
    "name": "急性肠梗阻（粘连性）",
    "alias": [
      "肠梗阻",
      "粘连性肠梗阻",
      "机械性肠梗阻",
      "肠粘连",
      "痛吐胀闭"
    ],
    "hint": "腹部手术史，阵发性腹痛、呕吐、腹胀、停止排气排便，肠鸣音活跃、可闻及金属音",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "建筑工人",
        "reliability": "可靠",
        "chiefComplaint": "腹痛伴腹胀、呕吐",
        "chiefComplaintDuration": "2",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "2天前进食大量粗纤维食物后出现脐周阵发性绞痛，每5～10分钟发作一次，每次持续约1分钟，间歇期完全缓解",
        "cause": "5年前曾行开腹阑尾切除术，术后常有腹部隐痛；本次发病前曾进食大量粗纤维食物并受凉",
        "symptoms": "腹痛发作时脐周鼓起包块、可见肠型，疼痛缓解后包块消失；伴腹胀，进行性加重，腹围增大",
        "relief": "屈膝侧卧位、腹部热敷可稍缓解，腹痛间歇期完全无痛",
        "evolution": "1天前开始呕吐，初始为胃内容物，后为黄绿色液体，混有粪渣、有粪臭味，共呕吐4次，量共约600ml；起病后未再排气排便，腹胀进行性加重",
        "accompanying": "伴恶心、呕吐，呕吐后腹痛可短暂减轻；伴口干、尿少，无发热、寒战",
        "negativeDiscriminating": "无发热、寒战，无呕血、黑便及血便，无尿频尿痛，无腰背部放射痛，无停止排便后腹块固定不动",
        "treatment": "急诊予禁食、胃肠减压（引出黄绿色液体约400ml）、静脉补液及抗感染治疗，腹痛较前减轻，仍未排气排便",
        "generalCondition": "发病以来精神差，未进食，睡眠差，近1日尿量约400ml，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "脐周阵发性绞痛，发作时可见肠型"
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐4次，初为胃内容物，后为黄绿色液体、有粪臭味"
          },
          "nausea": {
            "checked": true,
            "detail": "腹痛发作时伴恶心"
          },
          "bloating": {
            "checked": true,
            "detail": "腹胀进行性加重，腹围增大"
          },
          "constipation": {
            "checked": true,
            "detail": "起病后停止排气排便2天"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "完全无食欲"
          },
          "diarrhea": {
            "negative": true
          },
          "hematochezia": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "近1日尿量约400ml"
          },
          "dysuria": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "乏力，活动后明显"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "5年前因「急性阑尾炎」行开腹阑尾切除术，术后恢复可，右下腹留纵行手术瘢痕；否认其他手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "腹部手术史形成的肠粘连是本次肠梗阻的解剖基础",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟12年，每日约20支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮啤酒每周2～3次，每次约500ml",
        "drugs": "",
        "environment": "",
        "habits": "饮食偏粗糙，进食速度快，饮水少，饭后常立即从事体力劳动",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事建筑施工作业，体力劳动强度大，无粉尘及放射性物质接触史"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "强迫体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音活跃",
          "abdPercussion": "鼓音区缩小"
        },
        "special_digestive": {
          "giAbdShape": "可见胃肠型及蠕动波",
          "giTenderness": "脐周压痛",
          "giRebound": "全腹无反跳痛，腹肌柔软",
          "giBowelSound": "可闻及金属音",
          "giRectal": "直肠指检未触及肿物，指套无染血"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "腹部立位平片",
            "result": "中腹部可见多个阶梯状气液平面，小肠肠管明显扩张、最大内径约 3.5cm，结肠内气体减少",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部CT",
            "result": "小肠肠管扩张积液，移行带位于右下腹回盲部附近，局部肠管与前腹壁粘连，其远端肠管萎陷；未见明确肿物及肠壁缺血征象；腹腔少量积液",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 11.2×10⁹/L，N 78%，Hb 148g/L，PLT 226×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "电解质",
            "result": "K⁺ 3.2mmol/L，Na⁺ 134mmol/L，Cl⁻ 92mmol/L，提示低钾低氯",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肾功能",
            "result": "Cr 88μmol/L，BUN 8.6mmol/L，乳酸 1.6mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "腹腔内见扩张肠管，内容物呈往返运动，肠蠕动增强；腹腔少量无回声区",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性肠梗阻（粘连性，不完全性）",
          "低钾血症",
          "阑尾切除术后"
        ]
      }
    }
  },
  {
    "key": "pancreatitis",
    "dept": "digestive",
    "name": "急性胰腺炎（胆源性）",
    "alias": [
      "急性胰腺炎",
      "胰腺炎",
      "胆源性胰腺炎",
      "胆石性胰腺炎",
      "AP"
    ],
    "hint": "饱餐或饮酒后上腹持续剧痛，向腰背放射，弯腰抱膝减轻，呕吐后不缓解",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "上腹部疼痛伴恶心呕吐10小时",
        "chiefComplaintDuration": "10",
        "chiefComplaintDurationUnit": "小时"
      },
      "hpi": {
        "onset": "10小时前晚餐饱食并饮白酒约150ml后出现上腹部持续性剧痛，呈刀割样，程度剧烈，难以忍受",
        "cause": "既往胆囊结石病史",
        "symptoms": "疼痛位于中上腹，向左腰背部放射，呈束带状，弯腰抱膝位可稍减轻，平卧及伸腰时加重",
        "relief": "自服「山莨菪碱」后腹痛无缓解",
        "evolution": "腹痛逐渐加重，频繁呕吐，呕吐后腹痛不见减轻，遂来急诊",
        "accompanying": "伴恶心、呕吐胃内容物5～6次，量不多，无咖啡样物；伴腹胀，无发热、寒战",
        "negativeDiscriminating": "无呕血、黑便，无腹泻，无黄疸，无胸闷、胸痛，无尿频尿痛",
        "treatment": "急诊予禁食、胃肠减压、乳酸钠林格液静脉补液、盐酸布桂嗪止痛，现疼痛较前减轻",
        "generalCondition": "发病以来精神差，未进食，睡眠差，小便量偏少，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "中上腹刀割样持续痛，向腰背放射"
          },
          "nausea": {
            "checked": true
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐胃内容物5～6次，吐后腹痛不缓解"
          },
          "bloating": {
            "checked": true,
            "detail": "起病后逐渐加重"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "完全无食欲"
          },
          "hematemesis": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          },
          "reflux": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "chills": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "negative": true
          },
          "pallorSkin": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "胆囊结石": true
        },
        "diseaseDetail": "3年前体检超声发现胆囊结石，最大直径约1.5cm，偶有右上腹隐痛，未行手术",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期服用糖皮质激素、噻嗪类利尿剂及硫唑嘌呤等药物史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "有",
        "drinkingAmount": "饮白酒每周4～5次，每次约150～250ml，发病前1天曾一次饮白酒约500ml",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "长期饮食不规律，喜油腻食物，常有暴饮暴食",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "28",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "强迫体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "上腹部压痛，无反跳痛"
        },
        "special_digestive": {
          "giTenderness": "上腹部压痛",
          "giRebound": "局部腹肌紧张",
          "giLiverPalp": "肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛",
          "giGallbladderPalp": "胆囊未触及，Murphy征阴性，无胆囊触痛",
          "giBowelSound": "肠鸣音减弱"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血淀粉酶",
            "result": "1180U/L（参考值35～135U/L，超过正常上限3倍以上）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血脂肪酶",
            "result": "1640U/L（参考值0～60U/L，超过正常上限3倍以上）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 13.8×10⁹/L，N 86%，Hb 152g/L，PLT 218×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部CT（增强）",
            "result": "胰腺体积弥漫增大，实质密度不均，胰周脂肪间隙模糊并见条片状液性渗出，未见明确坏死区；胆囊内见高密度结石影，胆总管未见扩张",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "胆囊8.6×3.8cm，壁厚0.3cm，腔内见多枚强回声伴声影，最大约1.5cm；胰腺显示不清（肠气干扰）",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性胰腺炎（胆源性，轻症）",
          "胆囊结石"
        ]
      }
    }
  },
  {
    "key": "pud",
    "dept": "digestive",
    "name": "消化性溃疡（十二指肠球部溃疡）",
    "alias": [
      "十二指肠溃疡",
      "胃溃疡",
      "消化性溃疡",
      "DU",
      "GU"
    ],
    "hint": "慢性、周期性、节律性上腹痛，空腹痛、夜间痛，进食后缓解",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "反复上腹部疼痛",
        "chiefComplaintDuration": "2",
        "chiefComplaintDurationUnit": "年"
      },
      "hpi": {
        "onset": "2年前无明显诱因出现上腹部疼痛，位于剑突下偏右，呈烧灼样，程度中等，可忍受",
        "cause": "多于季节交替、劳累及精神紧张时发作，进食辛辣食物后可诱发",
        "symptoms": "疼痛多于餐后2～4小时出现，即空腹及夜间明显，进食或服用抗酸药后可缓解，每次持续约半小时至1小时，每周发作2～3次",
        "relief": "进食、服用奥美拉唑后可缓解",
        "evolution": "近1个月发作较前频繁，疼痛程度加重，夜间常被痛醒",
        "accompanying": "伴反酸、嗳气，无恶心呕吐",
        "negativeDiscriminating": "无呕血、黑便，无发热、黄疸，无体重明显下降",
        "treatment": "曾于当地医院查胃镜示「十二指肠球部溃疡」，予奥美拉唑20mg每日1次口服，疗程6周，服药期间症状缓解，停药后复发",
        "generalCondition": "发病以来精神、食欲尚可，睡眠因夜间疼痛受影响，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "剑突下偏右烧灼样痛，空腹痛、夜间痛"
          },
          "reflux": {
            "checked": true,
            "detail": "伴反酸、嗳气"
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "negative": true
          },
          "pallorSkin": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期服用非甾体抗炎药及糖皮质激素史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟10年，每日约10支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮白酒每周2～3次，每次约100ml",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "饮食不规律，工作压力较大",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "27",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性"
        },
        "special_digestive": {
          "giTenderness": "上腹部压痛",
          "giRebound": "全腹无反跳痛，腹肌柔软",
          "giLiverPalp": "肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛",
          "giBowelSound": "未闻及振水音及血管杂音"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 128g/L，WBC 6.8×10⁹/L，N 63%，PLT 210×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "粪便隐血",
            "result": "阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胃镜",
            "result": "十二指肠球部前壁可见一直径约1.0cm溃疡，覆白苔，周边黏膜充血水肿，球部变形；胃窦黏膜轻度充血",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "幽门螺杆菌检测（13C尿素呼气试验）",
            "result": "阳性，DOB 18.6",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "十二指肠球部溃疡（活动期，A1期）",
          "幽门螺杆菌感染",
          "慢性非萎缩性胃炎"
        ]
      }
    }
  },
  {
    "key": "ugib",
    "dept": "digestive",
    "name": "上消化道出血（消化性溃疡并出血）",
    "alias": [
      "上消化道出血",
      "消化道出血",
      "溃疡出血",
      "十二指肠溃疡并出血",
      "UGIB"
    ],
    "hint": "呕血、柏油样黑便，伴头晕心慌、贫血貌、肠鸣音活跃，需考虑消化性溃疡并上消化道出血",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "呕血、黑便",
        "chiefComplaintDuration": "2",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "2天前无明显诱因出现柏油样黑便，共3次，每次量约150～200g",
        "cause": "发病前1周因膝关节疼痛自行口服布洛芬缓释胶囊0.3g每日2次、阿司匹林肠溶片100mg每日1次",
        "symptoms": "黑便质稀、有腥臭味；1天前呕吐咖啡渣样胃内容物2次，共约150ml，呕吐后上腹部烧灼感稍减轻",
        "relief": "平卧休息后头晕可稍缓解，黑便及呕吐未见停止",
        "evolution": "2天来黑便次数增多、转为稀糊状，头晕乏力加重，起身时眼前发黑，无晕厥",
        "accompanying": "伴上腹部隐痛、反酸、心慌、出冷汗、口干",
        "negativeDiscriminating": "无剧烈腹痛及腹膜刺激征，无咯血、牙龈出血及皮下瘀斑，无血尿，无体重明显下降",
        "treatment": "未就诊，未服止血、抑酸药，仅进食少量米汤",
        "generalCondition": "发病以来精神差，食欲下降，睡眠差，尿量减少，体重无明显下降",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "上腹部隐痛，多于空腹及夜间明显，进食后可缓解"
          },
          "reflux": {
            "checked": true,
            "detail": "多于餐后及夜间出现，服抑酸药后可稍缓解"
          },
          "nausea": {
            "checked": true,
            "detail": "未再呕吐，进食后上腹饱胀"
          },
          "hematemesis": {
            "checked": true,
            "detail": "呕吐咖啡渣样胃内容物2次，共约150ml"
          },
          "melena": {
            "checked": true,
            "detail": "排柏油样黑便3次，质稀"
          },
          "hematochezia": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲明显减退"
          }
        },
        "hemat": {
          "anemia": {
            "checked": true,
            "detail": "活动后加重，休息后可稍缓解"
          },
          "bleeding": {
            "negative": true
          },
          "bruise": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          }
        },
        "cardio": {
          "syncope": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "多于体位改变时出现，伴眼前发黑"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "消化性溃疡": true
        },
        "diseaseDetail": "2年来反复上腹部疼痛，多于空腹及夜间发作，进食后可缓解，未系统诊治；否认其他慢性病史",
        "longTermMeds": "近1年因膝关节疼痛间断口服布洛芬缓释胶囊0.3g每日2次，近3个月自行加服阿司匹林肠溶片100mg每日1次，否认糖皮质激素服用史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "长期服用非甾体抗炎药及阿司匹林，为本次溃疡出血的重要诱因",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州，否认疫区及地方病流行区旅居史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "饮食欠规律，三餐不定时，夜间常加餐，工作压力较大",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘、毒物及放射性物质接触史"
      },
      "marriage": {
        "status": "已婚",
        "age": "25",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中消化性溃疡及消化道肿瘤病史",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "自主体位",
          "face": "贫血面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音活跃",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "上腹部压痛，无反跳痛"
        },
        "special_digestive": {
          "giLiverPalp": "肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛",
          "giSpleenPalp": "脾脏未触及，脾区无摩擦感",
          "giRectal": "直肠指检未触及肿物，指套无染血"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "血红蛋白 76g/L，RBC 2.68×10¹²/L，MCV 82fl，MCH 26pg；WBC 8.6×10⁹/L，N 71%；PLT 246×10⁹/L；网织红细胞 4.2%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "粪便隐血",
            "result": "阳性（＋＋）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "PT 12.6s，APTT 30.2s，INR 1.05",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝肾功能及电解质",
            "result": "ALT 21U/L，AST 26U/L，总胆红素 14.6μmol/L，白蛋白 38g/L；BUN 11.2mmol/L，Cr 78μmol/L，K⁺ 3.6mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胃镜",
            "result": "十二指肠球部前壁可见1.2cm×1.0cm溃疡，表面覆血痂，周边黏膜充血水肿，球部变形；胃腔内见少量咖啡色液体；胃窦黏膜轻度充血。Forrest Ⅱb级",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "幽门螺杆菌检测（胃镜下活检快速尿素酶试验）",
            "result": "阳性",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "十二指肠球部溃疡并出血（Forrest Ⅱb级）",
          "失血性贫血（中度）",
          "幽门螺杆菌感染",
          "慢性非萎缩性胃炎"
        ]
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATE_DATA;
}
