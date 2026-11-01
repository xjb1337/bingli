/* 模板病例数据 —— 由 tools/gen-templates.js 从 tools/tpl-parts/*.cjs 生成，请勿手改。
 *
 * 改模板的正确方式：改 tools/tpl-parts/<key>.cjs，然后 node tools/gen-templates.js。
 * 共 57 个模板：acs, af, aki, anemia, appendicitis, asthma, bipolar, bronchiectasis, cap, chole, cholelith, cirrhosis, ckd, copd, cushing, dementia, depression, dka, dm, ectopic, febrileSz, fracture, gb, hernia, hf, htn, hyperthyroid, hypothyroid, itp, leukemia, lungNodule, meningitis, myoma, nephrotic, obstruction, organophosphate, pancreatitis, pedDiarrhea, pedPneumonia, peritonitis, pid, preeclampsia, pregDiabetes, pregnancy, ptx, pud, schizophrenia, sepsis, shock, stone, stroke, tb, thyroidNodule, ugib, uti, valve, vertigo
 */
var TEMPLATE_DATA = [
  {
    "key": "acs",
    "dept": "cardiology",
    "name": "急性ST段抬高型心肌梗死（下壁）",
    "alias": [
      "急性心肌梗死",
      "心梗",
      "STEMI",
      "冠心病",
      "冠状动脉粥样硬化性心脏病"
    ],
    "hint": "突发持续性胸骨后压榨样疼痛，含服硝酸甘油不缓解，伴大汗、恶心，心电图Ⅱ、Ⅲ、aVF 导联 ST 段抬高",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河北石家庄",
        "birthPlace": "河北石家庄",
        "occupation": "个体经营者",
        "reliability": "可靠",
        "chiefComplaint": "突发胸骨后压榨样疼痛3小时"
      },
      "hpi": {
        "onset": "3小时前于睡眠中突发胸骨后压榨样疼痛，无明确诱因，持续不缓解",
        "cause": "无诱因，于夜间睡眠中突然出现",
        "symptoms": "疼痛位于胸骨后中下段，范围约手掌大小，向左肩、左上肢内侧及下颌放射，呈压榨样，程度剧烈，难以忍受",
        "relief": "自行含服硝酸甘油片 0.5mg 共2次，间隔5分钟，疼痛未见缓解；休息后亦无减轻",
        "evolution": "疼痛持续约3小时无间歇，程度无减轻",
        "accompanying": "伴大汗淋漓、恶心、呕吐胃内容物1次，伴胸闷、气短、心悸及濒死感",
        "negativeDiscriminating": "无撕裂样疼痛向背部放射，无咯血及晕厥，无发热及咳嗽咳痰，无深呼吸时疼痛加重，无上腹部压痛及反跳痛，无呕血黑便，无夜间阵发性呼吸困难及双下肢水肿",
        "treatment": "院前予阿司匹林肠溶片 300mg 嚼服、替格瑞洛片 180mg 负荷剂量口服，硝酸甘油片含服2次无效；急救中心心电图示Ⅱ、Ⅲ、aVF 导联 ST 段弓背向上抬高，为进一步诊治收入院",
        "generalCondition": "发病以来精神差，因疼痛不能平卧，未进饮食，未解大小便，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "cardio": {
          "chestPainCardio": {
            "checked": true,
            "detail": "胸骨后压榨样疼痛，向左肩及左上肢内侧放射，持续3小时不缓解"
          },
          "palpitation": {
            "checked": true,
            "detail": "心悸伴濒死感"
          },
          "cyanosis": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          },
          "edemaSys": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "伴气短，平卧时明显，坐起后稍减轻"
          },
          "cough": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "伴恶心"
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐胃内容物1次，量约100mL"
          },
          "abdominalPain": {
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
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "发病后明显乏力、大汗"
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "伴头晕，无黑矇"
          },
          "syncopeNerve": {
            "negative": true
          },
          "headache": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，可从事体力劳动",
        "diseaseChecks": {
          "高血压": true,
          "糖尿病": true,
          "高脂血症": true
        },
        "diseaseOther": "",
        "diseaseDetail": "高血压病史10年，最高血压 165/95mmHg，长期口服缬沙坦胶囊 80mg 每日1次；2型糖尿病史5年，口服二甲双胍缓释片 0.5g 每日2次，空腹血糖波动在 7.0～8.5mmol/L；高脂血症3年，未规律服药",
        "longTermMeds": "缬沙坦胶囊 80mg 每日1次（10年）；二甲双胍缓释片 0.5g 每日2次（5年）；阿托伐他汀钙片 20mg 每晚1次（间断服用）",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认既往心绞痛发作史，否认风湿热、心肌炎及心肌病病史，否认长期大量饮酒史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "河北石家庄，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "有",
        "smokingAmount": "吸烟30年，每日约20支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮白酒每周3～4次，每次约100mL，共20年",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "饮食偏油腻，口味偏咸，平素运动少，睡眠不规律",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "经营小商店，长期站立，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶患高血压，规律服药",
        "sexLife": "近半年因劳累较少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true,
          "糖尿病": true,
          "冠心病": true
        },
        "other": "",
        "deceased": "父亲因脑卒中去世，享年72岁；母亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "父亲生前有高血压、糖尿病及冠心病史",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
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
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心音低钝"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "dorsalisPedis": "双侧足背动脉搏动对称有力"
        },
        "special_cardiology": {
          "cardioApex": "心尖搏动位置正常，搏动范围无明显扩大",
          "cardioThrill": "心尖搏动无抬举感，未触及震颤及心包摩擦感",
          "cardioBorder": "心浊音界各径线在正常范围",
          "cardioRate": "心动过速",
          "cardioHeartSound": "第一心音减弱",
          "cardioMurmur": "各瓣膜听诊区未闻及病理性杂音",
          "cardioPericardium": "未闻及心包摩擦音",
          "cardioJVP": "肝颈静脉回流征阴性",
          "cardioPeripheralSign": "水冲脉、枪击音、毛细血管搏动征、交替脉、奇脉均阴性"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "心电图",
            "result": "窦性心律，心率 98次/分，Ⅱ、Ⅲ、aVF 导联 ST 段弓背向上抬高 0.2～0.4mV，伴病理性Q波形成，Ⅰ、aVL 导联 ST 段压低",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心肌损伤标志物",
            "result": "肌钙蛋白I 12.6ng/mL（参考值＜0.04ng/mL），肌酸激酶同工酶 186U/L，肌红蛋白 420ng/mL，均显著升高",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "血红蛋白 142g/L，白细胞 12.8×10⁹/L，中性粒细胞 82%，血小板 246×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血脂",
            "result": "总胆固醇 6.8mmol/L，甘油三酯 2.4mmol/L，低密度脂蛋白胆固醇 4.6mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心脏超声",
            "result": "左心室下壁及后壁运动幅度减弱，左心室射血分数 52%，各瓣膜未见明显反流，未见心包积液",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性ST段抬高型心肌梗死（下壁，Killip Ⅰ级）",
          "冠状动脉粥样硬化性心脏病",
          "高血压病2级（很高危）",
          "2型糖尿病",
          "高脂血症"
        ]
      }
    }
  },
  {
    "key": "af",
    "dept": "cardiology",
    "name": "非瓣膜性心房颤动（CHA₂DS₂-VASc 4 分）",
    "alias": [
      "心房颤动",
      "房颤",
      "AF",
      "心律失常",
      "阵发性心房颤动"
    ],
    "hint": "阵发性心悸伴胸闷，心律绝对不齐、第一心音强弱不等、脉搏短绌，心电图见 f 波、R-R 间期绝对不齐",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "山东济南",
        "birthPlace": "山东济南",
        "occupation": "退休教师",
        "reliability": "可靠",
        "chiefComplaint": "阵发性心悸伴胸闷2年"
      },
      "hpi": {
        "onset": "2年前无明显诱因出现阵发性心悸，每次持续数十分钟至数小时，可自行终止，发作时自数脉搏快而不齐",
        "cause": "无明显诱因，多于劳累及情绪激动后发作",
        "symptoms": "发作时心悸明显，心率快而不规则，伴胸闷、乏力，偶有头晕，无黑矇及晕倒",
        "relief": "发作时静坐休息或深呼吸后可逐渐缓解；曾自服美托洛尔片 25mg 1次，心悸可减轻",
        "evolution": "近1年发作次数增多，由每月1～2次增至每周2～3次；近1周发作持续不缓解，心悸伴胸闷明显加重",
        "accompanying": "伴活动后气短、乏力、睡眠差，无胸痛及大汗",
        "negativeDiscriminating": "无胸痛及压榨样不适，无大汗及濒死感，无黑矇及晕厥，无发热，无怕热多汗及手抖，无体重明显下降，无咯血及下肢水肿，无夜间阵发性呼吸困难",
        "treatment": "2年来间断口服美托洛尔缓释片 47.5mg 每日1次，发作频繁时加服普罗帕酮片 150mg，心悸可部分缓解；未规律抗凝治疗；1周前门诊心电图证实为心房颤动，为进一步诊治收入院",
        "generalCondition": "发病以来精神一般，食欲可，睡眠差（夜间心悸易醒），大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "阵发性心悸，发作时心率快而不规则，自数脉搏有漏搏感"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          },
          "edemaSys": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "发作时及活动后气短，休息可缓解"
          },
          "cough": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "gi": {
          "appetiteLoss": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          }
        },
        "gu": {
          "nocturia": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "活动后乏力，上两层楼即需休息"
          }
        },
        "endocrine": {
          "heatIntolerance": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          },
          "polyphagia": {
            "negative": true
          },
          "hairLoss": {
            "negative": true
          },
          "neckMass": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "发作时轻度头晕，持续数分钟，无黑矇"
          },
          "syncopeNerve": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "insomnia": {
            "checked": true,
            "detail": "夜间心悸易醒，入睡困难"
          }
        }
      },
      "pmh": {
        "health": "既往体健，可胜任日常工作",
        "diseaseChecks": {
          "高血压": true
        },
        "diseaseOther": "",
        "diseaseDetail": "高血压病史8年，最高血压 158/92mmHg，长期口服苯磺酸氨氯地平片 5mg 每日1次，血压控制在 135/80mmHg 左右",
        "longTermMeds": "苯磺酸氨氯地平片 5mg 每日1次（8年）；美托洛尔缓释片 47.5mg 每日1次（2年，间断）",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认风湿热及心脏瓣膜病史，否认甲状腺功能亢进病史，否认长期大量饮酒史，否认睡眠呼吸暂停诊断史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "山东济南，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "饮食清淡，平素饮浓茶每日2～3杯，睡眠欠佳",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事中学语文教学35年，已退休5年，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "25",
        "spouseHealth": "配偶体健",
        "sexLife": "近2年较少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true,
          "冠心病": true
        },
        "other": "",
        "deceased": "母亲因脑卒中去世，享年76岁；父亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "母亲生前有高血压及心房颤动病史",
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
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律不齐，可闻及早搏"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "radialPulse": "脉搏短绌",
          "dorsalisPedis": "双侧足背动脉搏动对称有力"
        },
        "special_cardiology": {
          "cardioApex": "心尖搏动位置正常，搏动范围无明显扩大",
          "cardioThrill": "心尖搏动无抬举感，未触及震颤及心包摩擦感",
          "cardioBorder": "心浊音界各径线在正常范围",
          "cardioRate": "心律不齐，心房颤动",
          "cardioHeartSound": "第一心音减弱",
          "cardioMurmur": "各瓣膜听诊区未闻及病理性杂音",
          "cardioPericardium": "未闻及心包摩擦音",
          "cardioJVP": "肝颈静脉回流征阴性",
          "cardioPeripheralSign": "水冲脉、枪击音、毛细血管搏动征、交替脉、奇脉均阴性"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "心电图",
            "result": "P 波消失，代之以大小不等、形态各异的 f 波，频率约 420次/分；R-R 间期绝对不规则；心室率约 118次/分；未见 ST 段抬高",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动态心电图",
            "result": "全程心房颤动，总心搏 112400 次，平均心室率 96次/分，最快 156次/分，最慢 62次/分，未见长于 2.0 秒的停搏",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心脏超声",
            "result": "左心房前后径 44mm，左心室舒张末期内径 50mm，左心室射血分数 58%；各瓣膜未见明显增厚及反流；未见心包积液；左心耳未见明确血栓",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺功能",
            "result": "FT3 4.4pmol/L，FT4 16.1pmol/L，TSH 2.36mIU/L，均在正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "凝血酶原时间 12.1秒，国际标准化比值 1.02，活化部分凝血活酶时间 32秒，D-二聚体 0.42mg/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "非瓣膜性心房颤动（CHA₂DS₂-VASc 4 分，HAS-BLED 1 分）",
          "高血压病2级（高危）"
        ]
      }
    }
  },
  {
    "key": "aki",
    "dept": "nephrology",
    "name": "急性肾损伤（肾前性）",
    "alias": [
      "急性肾损伤",
      "急性肾衰竭",
      "肾前性氮质血症",
      "AKI"
    ],
    "hint": "腹泻后少尿、肌酐短期上升，尿钠降低，补液后尿量恢复、肌酐回落",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河南周口",
        "birthPlace": "河南周口",
        "occupation": "农民",
        "reliability": "可靠",
        "chiefComplaint": "腹泻3天，尿量减少2天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "3天前食用剩菜后出现腹泻，每日解黄色稀水样便8～10次，量多，无脓血及黏液",
        "cause": "起病前有明确不洁饮食史；发病后因恶心纳差几乎未进食，饮水亦少，每日入量不足500ml",
        "symptoms": "2天前起尿量明显减少，每日仅排尿1～2次，总量约300～400ml，尿色深黄；伴口干、乏力、头晕，站立时眼前发黑",
        "relief": "自行口服蒙脱石散3g每日3次、口服补液盐1袋冲服，腹泻次数减至每日3～4次，尿量无明显增加",
        "evolution": "入院前1天几乎无尿，仅约150ml，乏力加重，不能下床活动，由家属送来急诊",
        "accompanying": "伴恶心、食欲明显减退、口渴喜冷饮",
        "negativeDiscriminating": "无肉眼血尿及尿中泡沫增多，无排尿困难及尿频尿急，无腰痛及肾区叩击痛，无呕吐，无排尿疼痛，无皮疹、关节痛及发热，无水肿，无近期使用非甾体抗炎药、氨基糖苷类及造影剂史，无鱼胆及毒蕈食用史，无剧烈肌痛及酱油色尿",
        "treatment": "院外口服蒙脱石散3g每日3次共2天、口服补液盐共3袋，腹泻减轻但尿量未恢复；入院后予0.9%氯化钠注射液静脉补液并监测出入量，未使用利尿剂及肾毒性药物",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠尚可，大便每日3～4次稀水样，体重3天内下降2.5kg",
        "extra": "入院后留置导尿准确记录每小时尿量，补液后第1个24小时尿量增至1800ml"
      },
      "ros": {
        "gi": {
          "diarrhea": {
            "checked": true,
            "detail": "每日8～10次黄色稀水样便，量多，无脓血"
          },
          "nausea": {
            "checked": true,
            "detail": "伴恶心，未呕吐"
          },
          "vomiting": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "几乎未进食"
          },
          "abdominalPain": {
            "checked": true,
            "detail": "脐周阵发性隐痛，便后减轻"
          },
          "melena": {
            "negative": true
          },
          "hematochezia": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "每日尿量300～400ml，入院前1天仅约150ml"
          },
          "hematuria": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          },
          "polyuria": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "chills": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "站立时心慌"
          },
          "syncope": {
            "checked": true,
            "detail": "起立时眼前发黑，未摔倒"
          },
          "edemaCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "体位改变时头晕、眼前发黑"
          },
          "headache": {
            "negative": true
          },
          "insomnia": {
            "negative": true
          }
        },
        "endocrine": {
          "polydipsia": {
            "checked": true,
            "detail": "口渴明显，喜冷饮"
          },
          "polyuriaEndo": {
            "negative": true
          },
          "weightLoss": {
            "checked": true,
            "detail": "3天内体重下降2.5kg"
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "全身乏力，不能下床"
          }
        },
        "joint": {
          "muscleWeak": {
            "checked": true,
            "detail": "双下肢无力"
          },
          "jointPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、慢性肾脏病、痛风及前列腺增生病史；既往血肌酐正常",
        "longTermMeds": "无长期服药史；发病后服蒙脱石散及口服补液盐，否认服非甾体抗炎药、氨基糖苷类抗生素及中草药",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物、鱼胆及毒蕈接触史",
        "vaccine": "按计划预防接种",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认近期造影剂检查史；否认剧烈运动及挤压伤史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于河南周口，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认有毒有害物质接触史",
        "environment": "",
        "habits": "平时饮水量约1500ml/日，饮食规律；近期因腹泻进食显著减少",
        "sexualHistory": "已婚，否认不洁性接触史",
        "occupationEnv": "务农，无粉尘及毒物接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "自主体位",
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
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "thyroid": "甲状腺无肿大"
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
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "edemaAnkle": "双侧踝部无水肿",
          "edemaPretibial": "双侧胫前无水肿"
        },
        "special_nephrology": {
          "renalFacialEdema": "颜面无水肿，双眼睑无水肿",
          "renalLegEdema": "双下肢无水肿",
          "renalPercussion": "双肾区无叩击痛",
          "renalTenderPoint": "季肋点、上输尿管点、中输尿管点均无压痛",
          "renalBladder": "膀胱未触及，耻骨上区无压痛",
          "renalCardio": "双肺未闻及湿啰音，未闻及心包摩擦音",
          "renalBP": "血压偏低"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血生化（入院时）",
            "result": "血肌酐 265μmol/L，尿素氮 18.6mmol/L，血钾 3.4mmol/L，血钠 132mmol/L，二氧化碳结合力 20mmol/L；既往体检血肌酐 78μmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规及尿钠",
            "result": "尿比重 1.028，尿蛋白 微量，尿潜血 阴性，未见管型；尿钠 12mmol/L，尿肌酐 8600μmol/L，滤过钠排泄分数 0.6%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 9.8×10⁹/L，N 72%，Hb 148g/L，HCT 0.48，PLT 226×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "泌尿系超声",
            "result": "双肾大小形态正常，皮髓质分界清晰，集合系统未见分离，双侧输尿管未见扩张，膀胱充盈良好，残余尿约20ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "补液后复查血生化",
            "result": "补液第2天尿量 1800ml/24h，血肌酐降至 132μmol/L，尿素氮 9.2mmol/L，血钾 3.9mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性肾损伤（肾前性）",
          "急性肠炎",
          "低钾血症"
        ]
      }
    }
  },
  {
    "key": "anemia",
    "dept": "hematology",
    "name": "缺铁性贫血（重度）",
    "alias": [
      "缺铁性贫血",
      "IDA",
      "小细胞低色素性贫血",
      "营养性缺铁性贫血"
    ],
    "hint": "乏力、头晕、面色苍白，小细胞低色素性贫血伴铁蛋白降低 —— 缺铁性贫血",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河北保定",
        "birthPlace": "河北保定",
        "occupation": "纺织厂工人",
        "reliability": "可靠",
        "chiefComplaint": "乏力、头晕伴面色苍白",
        "chiefComplaintDuration": "3",
        "chiefComplaintDurationUnit": "月"
      },
      "hpi": {
        "onset": "3个月前无明显诱因出现乏力，劳累后加重，休息后可稍缓解，未予重视",
        "cause": "平素以素食为主，长期饮浓茶，无偏食及异食癖，无长期服用非甾体抗炎药史",
        "symptoms": "乏力逐渐加重，伴头晕、眼花、耳鸣，登二层楼即感心悸、气短；同事发现其面色渐苍白，指甲变平",
        "relief": "卧床休息后头晕可稍减轻，未曾服用铁剂以外的补血药物",
        "evolution": "近半个月乏力明显加重，日常家务亦感吃力，双踝部出现轻度水肿，晨轻暮重",
        "accompanying": "伴注意力不集中、易烦躁，偶有口角皲裂，进食固体食物时感吞咽不畅",
        "negativeDiscriminating": "无黑便、呕血，无牙龈出血及皮肤瘀斑，无发热、盗汗，无体重明显下降",
        "treatment": "2个月前于当地医院查血常规示血红蛋白78g/L，自行服用琥珀酸亚铁0.1g每日3次口服，疗程4周，服药后头晕稍好转，未复查血常规",
        "generalCondition": "发病以来精神稍差，食欲欠佳，睡眠一般，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "hemat": {
          "anemia": {
            "checked": true,
            "detail": "活动后乏力、面色苍白3个月"
          },
          "fatigue": {
            "checked": true,
            "detail": "易疲倦，登二层楼即感心悸气短"
          },
          "pallorSkin": {
            "checked": true,
            "detail": "同事发现面色渐苍白，甲床色淡"
          },
          "bleeding": {
            "negative": true
          },
          "bruise": {
            "negative": true
          },
          "epistaxis": {
            "negative": true
          },
          "transfusion": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "活动后气短"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸"
          }
        },
        "gi": {
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲欠佳，进食量较前减少约三分之一"
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "起身及劳累时头晕、眼花"
          },
          "tinnitus": {
            "checked": true,
            "detail": "双耳间歇性低调耳鸣"
          }
        },
        "endocrine": {
          "weightLoss": {
            "negative": true
          }
        },
        "gu": {
          "hematuria": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史，否认痔疮及消化性溃疡病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射性物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期饮浓茶外的其他偏嗜，否认消化道息肉及肿瘤家族史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于河北保定，否认疫区及地方病流行区久居史",
        "maternal": "",
        "birth": "足月顺产，出生体重正常",
        "feeding": "婴幼儿期母乳喂养，辅食添加较晚",
        "growth": "生长发育与同龄人相仿",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "素食10余年，每日饮浓茶约1000ml，饮食结构单一",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "纺织车间工作，有棉尘接触，无放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "31",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "否"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有类似贫血患者",
        "infectionHistory": "否认结核、肝炎等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "贫血面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "hair": "毛发稀疏",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心尖区可闻及收缩期杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "双下肢凹陷性水肿"
        },
        "special_hematology": {
          "hemAnemia": "睑结膜苍白",
          "hemBleeding": "皮肤黏膜未见瘀点、瘀斑及紫癜",
          "hemNode": "全身浅表淋巴结未触及肿大",
          "hemSternum": "胸骨无压痛",
          "hemGum": "牙龈无增生、渗血",
          "hemHepatospleen": "肝脾肋下未触及",
          "hemBoneTender": "四肢长骨及关节无压痛"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 62g/L，RBC 3.1×10¹²/L，MCV 71fl，MCH 20pg，MCHC 285g/L，WBC 5.6×10⁹/L，PLT 246×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "铁代谢（血清铁、铁蛋白、总铁结合力）",
            "result": "血清铁 5.2μmol/L，铁蛋白 8μg/L，总铁结合力 82μmol/L，转铁蛋白饱和度 8%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "骨髓穿刺+铁染色",
            "result": "增生活跃，红系增生明显，中晚幼红细胞体积小、胞浆少，呈「核老浆幼」；骨髓小粒可染铁消失，铁粒幼细胞 5%",
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
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "缺铁性贫血（重度）",
          "铁缺乏症"
        ]
      }
    }
  },
  {
    "key": "appendicitis",
    "dept": "surgery",
    "name": "急性阑尾炎（急性化脓性阑尾炎）",
    "alias": [
      "急性阑尾炎",
      "阑尾炎",
      "化脓性阑尾炎",
      "盲肠炎"
    ],
    "hint": "转移性右下腹痛，麦氏点固定压痛伴反跳痛，伴恶心呕吐、低热",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南京",
        "birthPlace": "江苏南京",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "转移性右下腹疼痛18小时"
      },
      "hpi": {
        "onset": "18小时前出现上腹部疼痛，位于剑突下及脐周，程度中等，可忍受",
        "cause": "剧烈活动及进食后",
        "symptoms": "约6小时后转移并固定于右下腹，呈持续性胀痛，阵发性加重，行走、咳嗽及翻身时加剧",
        "relief": "静卧屈膝位时稍减轻，服山莨菪碱后无明显缓解",
        "evolution": "腹痛逐渐加重，12小时前出现发热，无寒战",
        "accompanying": "伴恶心、呕吐胃内容物2次，伴食欲明显减退",
        "negativeDiscriminating": "无尿频、尿急、尿痛，无腰背部放射痛，无腹泻及黑便，无呕血，无皮肤巩膜黄染",
        "treatment": "8小时前于社区卫生服务中心就诊，查血常规示白细胞及中性粒细胞比例升高，予头孢呋辛酯0.25g每日2次口服、山莨菪碱10mg肌内注射1次，腹痛无缓解，为进一步诊治来院",
        "generalCondition": "发病以来精神欠佳，食欲减退，睡眠差，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "持续性胀痛，阵发性加重，行走、咳嗽时加剧"
          },
          "nausea": {
            "checked": true
          },
          "vomiting": {
            "checked": true,
            "detail": "胃内容物2次，呕吐后腹痛不缓解"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近期明显减退，厌油腻"
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
            "checked": true,
            "detail": "12小时前起，未测体温"
          },
          "chills": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期服用泻药及非甾体抗炎药史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏南京，否认疫区及地方病流行区居住史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "habits": "三餐尚规律，近期工作较忙",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "28",
        "spouseHealth": "配偶体健"
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
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckResist": "颈软，无抵抗"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "右下腹压痛、反跳痛"
        },
        "special_surgery": {
          "surgPeritoneum": "局部压痛伴反跳痛",
          "surgAbdomenMass": "腹部未触及包块",
          "surgLymph": "引流区域淋巴结未触及肿大"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 138g/L，WBC 15.6×10⁹/L，N 88%，PLT 226×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白",
            "result": "62mg/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规",
            "result": "未见红细胞、白细胞及蛋白",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "右下腹可见阑尾直径约9mm，壁增厚呈双层，周围少量积液，未见结石影",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性化脓性阑尾炎",
          "局限性腹膜炎"
        ]
      }
    }
  },
  {
    "key": "asthma",
    "dept": "respiratory",
    "name": "支气管哮喘急性发作（中度）",
    "alias": [
      "支气管哮喘",
      "哮喘",
      "哮喘急性发作",
      "过敏性哮喘",
      "支气管哮喘急性发作"
    ],
    "hint": "接触过敏原或冷空气后发作性喘息、胸闷，夜间及凌晨加重，可自行缓解；双肺弥漫哮鸣音伴呼气相延长，支气管舒张试验阳性",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "广东广州",
        "birthPlace": "广东广州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "发作性喘息伴胸闷3年，加重1天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "3年前春季花粉季首次出现发作性喘息、胸闷，此后每年春季及秋冬交替时反复发作，每次持续数十分钟至数小时，可自行或经吸入沙丁胺醇后缓解",
        "cause": "本次发作前1天打扫房间、接触尘螨及冷空气，无呼吸道感染及剧烈运动，未服用阿司匹林类药物",
        "symptoms": "喘息为呼气相为主的呼气性呼吸困难，伴双肺广泛哮鸣音，胸闷明显，讲话需停顿换气，夜间及凌晨2至4时加重，不能平卧，需坐起前倾位才能稍缓解",
        "relief": "自用沙丁胺醇气雾剂吸入2喷后胸闷稍减轻，2小时后再次加重，间隔4小时共吸入6喷，缓解不完全",
        "evolution": "入院前6小时喘息持续加重，讲话不成句，口唇发麻，家属送至急诊",
        "accompanying": "伴咳嗽、咳少量白色黏痰，无明显发热",
        "negativeDiscriminating": "无粉红色泡沫样痰，无夜间阵发性呼吸困难及双下肢水肿，无咯血及痰中带血，无午后低热及盗汗，无长期吸烟史，无胸痛及单侧下肢肿胀",
        "treatment": "沙丁胺醇气雾剂每次2喷按需吸入，共6喷，缓解不完全；既往未规律吸入糖皮质激素，未口服白三烯受体拮抗剂",
        "generalCondition": "发病以来精神紧张、焦虑，食欲减退，睡眠因夜间喘息明显受影响，大小便正常，体重无明显变化",
        "extra": "急诊予吸入沙丁胺醇联合异丙托溴铵雾化、静脉甲泼尼龙40mg，并复查肺功能及血气"
      },
      "ros": {
        "resp": {
          "wheeze": {
            "checked": true,
            "detail": "发作性喘息，呼气相为主，夜间及凌晨加重"
          },
          "dyspnea": {
            "checked": true,
            "detail": "呼气性呼吸困难，讲话需停顿换气，不能平卧"
          },
          "cough": {
            "checked": true,
            "detail": "干咳为主，夜间及晨起明显"
          },
          "sputum": {
            "checked": true,
            "detail": "咳少量白色黏痰，不易咳出"
          },
          "chestPainResp": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          },
          "nasalObstruction": {
            "checked": true,
            "detail": "每逢发作期伴鼻塞、打喷嚏"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "发作时心悸，与吸入沙丁胺醇有关"
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "negative": true
          }
        },
        "nervous": {
          "anxiety": {
            "checked": true,
            "detail": "发作时紧张、焦虑"
          },
          "insomnia": {
            "checked": true,
            "detail": "夜间喘息影响睡眠"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "哮喘": true
        },
        "diseaseDetail": "支气管哮喘病史3年，未规律吸入糖皮质激素控制，每年急性发作3至4次，均经雾化平喘治疗缓解；否认高血压、糖尿病、冠心病史",
        "longTermMeds": "沙丁胺醇气雾剂按需吸入，未规律使用吸入性糖皮质激素",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及有害气体接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期使用口服糖皮质激素及免疫抑制剂，否认阿司匹林及非甾体抗炎药诱发喘息史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "广东广州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认粉尘、石棉及放射性物质接触史",
        "environment": "居所近期新换地毯，家中养猫，卧室尘螨较多",
        "habits": "",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无工业毒物及粉尘接触，工作压力较大、作息不规律"
      },
      "marriage": {
        "status": "未婚",
        "age": "",
        "spouseHealth": "",
        "sexLife": "",
        "relation": ""
      },
      "family": {
        "diseaseChecks": {
          "哮喘": true
        },
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "母亲有支气管哮喘病史，否认其他家族成员类似疾病",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "强迫体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸浅快",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺可闻及哮鸣音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_respiratory": {
          "respAccessory": "可见辅助呼吸肌参与呼吸运动",
          "respBreathSound": "可闻及干啰音",
          "respChestExpansion": "肺下界移动度减小",
          "respCyanosis": "无杵状指，无球结膜水肿"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 8.6×10⁹/L，嗜酸性粒细胞 0.62×10⁹/L，嗜酸性粒细胞百分比 9.8%，Hb 138g/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血清总IgE",
            "result": "412IU/ml，尘螨特异性IgE 3级阳性，花粉特异性IgE 2级阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肺功能（支气管舒张试验）",
            "result": "舒张前FEV1 1.62L（占预计值58%），吸入沙丁胺醇400μg后20分钟FEV1 1.94L，改善18%、绝对值增加320ml，FEV1/FVC 62%，支气管舒张试验阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动脉血气分析",
            "result": "pH 7.44，PaO2 72mmHg，PaCO2 34mmHg，SaO2 93%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部X线片",
            "result": "双肺透亮度略增高，肺纹理清晰，未见实变影及占位性病变，心影大小正常",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“发作性喘息伴胸闷3年，加重1天”入院。3年来每年春秋季反复发作性喘息、胸闷，接触尘螨及冷空气诱发，夜间及凌晨加重，可经平喘药缓解；1天前再次发作并持续加重，讲话需停顿换气，不能平卧。母亲有哮喘病史。查体：强迫体位，急性病容，呼吸浅快，双肺可闻及哮鸣音，可见辅助呼吸肌参与呼吸运动，肺下界移动度减小。血嗜酸性粒细胞 0.62×10⁹/L，总IgE 412IU/ml，尘螨特异性IgE阳性；支气管舒张试验FEV1改善18%、绝对值增加320ml。无粉红色泡沫样痰、无夜间阵发性呼吸困难及双下肢水肿，可与左心衰竭鉴别；无长期吸烟史及逐年加重病程，可与慢阻肺病鉴别",
      "soap": {
        "a": {
          "basisDetail": [
            {
              "diagnosis": "支气管哮喘急性发作（中度）",
              "history": "发作性喘息、胸闷3年，接触尘螨及冷空气诱发，夜间及凌晨加重，可自行或经平喘药缓解；1天前再次发作，讲话需停顿换气，不能平卧",
              "pe": "强迫体位，急性病容，呼吸浅快，双肺可闻及哮鸣音，可见辅助呼吸肌参与呼吸运动，肺下界移动度减小",
              "aux": "血嗜酸性粒细胞 0.62×10⁹/L，血清总IgE 412IU/ml，尘螨及花粉特异性IgE阳性；支气管舒张试验FEV1改善18%且绝对值增加320ml，FEV1/FVC 62%"
            },
            {
              "diagnosis": "变应性鼻炎",
              "history": "每逢哮喘发作期伴鼻塞、打喷嚏，接触尘螨及花粉后加重",
              "pe": "",
              "aux": "尘螨特异性IgE 3级阳性，花粉特异性IgE 2级阳性"
            }
          ]
        }
      },
      "diagnosis": {
        "confirmed": [
          "支气管哮喘急性发作（中度）",
          "变应性鼻炎"
        ]
      }
    }
  },
  {
    "key": "bipolar",
    "dept": "psychiatry",
    "name": "双相情感障碍（目前为躁狂发作）",
    "alias": [
      "双相情感障碍",
      "双相障碍",
      "躁狂发作",
      "躁郁症"
    ],
    "hint": "情感高涨、思维奔逸、活动增多（躁狂三联），睡眠需要减少、言行鲁莽",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "湖北武汉",
        "birthPlace": "湖北武汉",
        "occupation": "个体经营者",
        "reliability": "尚可靠",
        "informant": "患者配偶",
        "chiefComplaint": "情绪高涨、言语增多2周"
      },
      "hpi": {
        "onset": "2周前无诱因出现情绪异常高涨，自觉心情特别好，整日兴高采烈",
        "cause": "连续熬夜筹办店铺开业后",
        "symptoms": "言语明显增多，滔滔不绝，别人插不上话，话题随境转移；自觉脑子转得飞快，想法一个接一个",
        "relief": "无缓解方式，夜间仅睡2～3小时仍不觉疲乏",
        "evolution": "近1周加重，自认「能力超常」，计划同时开三家分店，4天内刷卡消费十余万元购设备",
        "accompanying": "易激惹，家人劝阻即发脾气摔物，但未伤人；食欲亢进，进食量明显增多",
        "negativeDiscriminating": "无发热、头痛、呕吐及抽搐，无颅脑外伤史，无饮酒及吸食冰毒等物质使用史，无甲状腺疾病史，本次发作前未服用激素及抗抑郁药",
        "treatment": "1周前于外院门诊，查甲状腺功能正常，予碳酸锂0.25g每日2次口服、喹硫平0.1g每晚口服，服药不规律，症状未控制",
        "generalCondition": "发病以来精神兴奋，睡眠需要明显减少，食欲亢进，体重无明显下降，工作与社交活动显著增多",
        "extra": ""
      },
      "ros": {
        "nervous": {
          "behaviorAbnormal": {
            "checked": true,
            "detail": "四处筹款扩张店铺，夜间外出不归，驾车超速"
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "每夜仅睡2～3小时，醒后精力充沛"
          },
          "hallucination": {
            "negative": true
          },
          "anxiety": {
            "negative": true
          },
          "tremor": {
            "checked": true,
            "detail": "双手细颤，持筷时明显"
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "memoryLoss": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸，休息可缓解"
          }
        },
        "gi": {
          "appetiteLoss": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史，否认甲状腺疾病及颅脑外伤史",
        "longTermMeds": "否认长期服用激素、抗抑郁药及其他药物史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认一氧化碳中毒及重金属接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "3年前曾有一次持续4个月的抑郁发作，表现为情绪低落、兴趣减退、整日卧床，于外院诊断「抑郁发作」并服舍曲林治疗，后自行停药，其间无躁狂或轻躁狂发作",
        "otherTreatDiseases": "",
        "special": "否认长期饮酒史，否认吸食冰毒、大麻等精神活性物质史，否认咖啡因大量摄入"
      },
      "personal": {
        "residence": "湖北武汉，否认疫区及地方病流行区居住史",
        "smoking": "有",
        "smokingAmount": "每日约20支，共12年",
        "drinking": "已戒",
        "drinkingAmount": "戒酒3年，此前每周饮白酒约500ml",
        "drugs": "否认吸毒及滥用镇静催眠药物史",
        "habits": "平素作息规律，应酬较多；近2周几乎不眠，夜间外出谈生意，电话不断",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "经营服装店，近1个月筹备新店开业，作息不规律，无粉尘及毒物接触",
        "premorbidPersonality": "外向、健谈、精力旺盛，做事急躁、好胜心强，情绪起伏较明显",
        "stressEvent": "2周前为筹备新店连续熬夜，与合伙人就资金问题发生争执"
      },
      "marriage": {
        "status": "已婚",
        "age": "27",
        "spouseHealth": "配偶体健",
        "relation": "近1个月因消费与投资问题多次争吵"
      },
      "family": {
        "diseaseChecks": {
          "精神病": true
        },
        "other": "",
        "deceased": "父亲因意外事故去世，时年 58 岁",
        "threeGeneration": "两系三代否认遗传性疾病病史",
        "similarDisease": "父亲生前有「情绪大起大落」表现，未就诊；胞兄有抑郁发作史，服抗抑郁药治疗",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病家族史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "conscious": "神志清楚，精神可"
        },
        "special_psychiatry": {
          "psyAppearance": "衣着整洁，接触主动，合作",
          "psyOrientation": "定向力完整，意识清晰",
          "psySpeech": "语速增快，言语增多",
          "psyThoughtForm": "思维奔逸",
          "psyThoughtContent": "夸大妄想",
          "psyPerception": "未引出幻觉",
          "psyMood": "情感高涨",
          "psyCognition": "记忆、计算与理解力尚可",
          "psyInsight": "自知力部分存在",
          "psyBehavior": "意志增强，活动增多"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "甲状腺功能",
            "result": "FT3 5.2pmol/L，FT4 17.4pmol/L，TSH 1.6mIU/L，均在正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血锂浓度",
            "result": "0.42mmol/L，处于治疗参考范围下限",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅MRI",
            "result": "脑实质未见异常信号，未见占位性病变",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心动过速，QT间期0.36s，未见明显ST-T改变",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "杨氏躁狂评定量表（YMRS）",
            "result": "总分32分，提示明显躁狂症状，供病情评估与随访比较",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "双相情感障碍，目前为躁狂发作",
          "既往抑郁发作"
        ]
      }
    }
  },
  {
    "key": "bronchiectasis",
    "dept": "respiratory",
    "name": "支气管扩张症伴咯血",
    "alias": [
      "支气管扩张",
      "支气管扩张症",
      "支扩",
      "咯血",
      "干性支气管扩张"
    ],
    "hint": "幼年麻疹肺炎后反复咳嗽、咳大量脓痰，晨起为著、痰液静置后分层，间断咯血；下肺可闻及固定性湿啰音，可见杵状指，HRCT示柱状及囊状扩张",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "四川成都",
        "birthPlace": "四川成都",
        "occupation": "小学教师",
        "reliability": "可靠",
        "chiefComplaint": "反复咳嗽咳脓痰10年，咯血3天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "10余年前起反复咳嗽、咳痰，多于晨起及体位改变时明显，每次痰量约100ml，为黄色脓痰，静置后分为三层，每年发作3至5次，每次持续2至4周，抗感染治疗后可缓解",
        "cause": "幼年曾患麻疹肺炎，住院治疗半个月；本次发作前3天受凉，无醉酒及误吸，无肺结核接触史",
        "symptoms": "咳嗽为阵发性连声咳，晨起及卧床翻身时加重，痰量增至每日约200ml，为黄绿色脓痰，黏稠有臭味；咯血为痰中带血至整口鲜血，每日3至5次，每次约20至30ml，色鲜红，无血块",
        "relief": "自服云南白药及头孢克洛后咯血略减少，咳嗽咳痰无缓解",
        "evolution": "入院前1天咯血增至每次约50ml，伴胸闷、心慌，遂来急诊",
        "accompanying": "伴低热，体温波动于37.5至38.0度，乏力、食欲减退",
        "negativeDiscriminating": "无午后高热及寒战，无盗汗及明显消瘦，无胸痛及呼吸困难，无下肢水肿及长期卧床史，无鼻出血及牙龈出血，无皮肤瘀点瘀斑",
        "treatment": "本次发作后口服头孢克洛0.25g每日3次共5天、云南白药胶囊2粒每日3次共3天，咯血减少但痰量未减；既往急性加重期曾静脉使用头孢他啶2g每日2次，疗程10天，疗效可",
        "generalCondition": "发病以来精神一般，食欲减退，睡眠因咳嗽及咯血受影响，大小便正常，体重无明显变化",
        "extra": "入院后留取痰培养及痰抗酸染色，完善HRCT，予体位引流及止血治疗"
      },
      "ros": {
        "resp": {
          "cough": {
            "checked": true,
            "detail": "反复咳嗽10余年，晨起及体位改变时加重"
          },
          "sputum": {
            "checked": true,
            "detail": "每日约200ml黄绿色脓痰，静置后分层"
          },
          "hemoptysis": {
            "checked": true,
            "detail": "间断咯血3天，每日3至5次，每次约20至50ml，色鲜红"
          },
          "fever": {
            "checked": true,
            "detail": "低热，体温波动于37.5至38.0度"
          },
          "chestPainResp": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "咯血后心慌"
          },
          "edemaCardio": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          }
        },
        "hemat": {
          "bleeding": {
            "checked": true,
            "detail": "咯血，无鼻出血及牙龈出血"
          },
          "purpura": {
            "negative": true
          },
          "epistaxis": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "幼年患麻疹肺炎，住院治疗半个月；否认高血压、糖尿病、冠心病史；否认结核及病毒性肝炎病史",
        "longTermMeds": "无长期口服药物",
        "infection": "否认结核、肝炎等传染病史，否认结核病人密切接触史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及有害气体接触史",
        "vaccine": "按计划预防接种，未接种流感疫苗及肺炎链球菌疫苗",
        "allergy": "无",
        "relatedHistory": "否认长期使用糖皮质激素及免疫抑制剂，否认幼年反复下呼吸道感染以外的其他诱因",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "四川成都，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认粉尘、石棉及放射性物质接触史",
        "environment": "",
        "habits": "",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "小学教师，无工业毒物及粉尘接触，常年用嗓、工作环境人员密集"
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
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "慢性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺可闻及湿性啰音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_respiratory": {
          "respAccessory": "未见辅助呼吸肌参与呼吸运动，三凹征阴性",
          "respCyanosis": "杵状指"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "胸部HRCT",
            "result": "右下肺基底段见多发柱状及囊状支气管扩张，管壁增厚，呈印戒征及双轨征，周围见斑片状渗出影，未见空洞及胸膜腔积液",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 12.8×10⁹/L，中性粒细胞 78.2%，Hb 118g/L，PLT 246×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "痰培养",
            "result": "检出铜绿假单胞菌，对哌拉西林他唑巴坦、头孢他啶、环丙沙星敏感",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "痰抗酸染色",
            "result": "三次痰涂片抗酸染色均阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动脉血气分析",
            "result": "pH 7.42，PaO2 78mmHg，PaCO2 38mmHg，SaO2 96%",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“反复咳嗽、咳大量脓痰10余年，间断咯血3天”入院。10余年来反复咳嗽，晨起为著，每日痰量约100ml，为黄色脓痰、静置后分层；3天前受凉后痰量增至每日约200ml并转为黄绿色脓痰，间断咯血，每次约20至50ml，伴低热。幼年曾患麻疹肺炎。查体：营养不良，慢性病容，双肺可闻及湿性啰音，可见杵状指。HRCT示右下肺基底段柱状及囊状支气管扩张伴周围渗出；痰培养检出铜绿假单胞菌；痰抗酸染色三次阴性；血Hb 118g/L。无午后高热及盗汗、无消瘦明显，痰抗酸染色阴性，可与肺结核鉴别；无胸痛及呼吸困难、无下肢水肿及长期卧床史，可与肺栓塞鉴别",
      "soap": {
        "a": {
          "basisDetail": [
            {
              "diagnosis": "支气管扩张症伴咯血",
              "history": "幼年患麻疹肺炎；10余年来反复咳嗽、咳大量脓痰，晨起为著、痰液静置后分层；3天前受凉后痰量增多、转为黄绿色脓痰，间断咯血，每次约20至50ml",
              "pe": "营养不良，慢性病容，双肺可闻及湿性啰音，可见杵状指",
              "aux": "胸部HRCT示右下肺基底段多发柱状及囊状支气管扩张，呈印戒征及双轨征，周围见斑片状渗出；痰培养检出铜绿假单胞菌"
            },
            {
              "diagnosis": "铜绿假单胞菌肺炎",
              "history": "受凉后痰量增多、转为黄绿色脓痰，伴低热",
              "pe": "双肺可闻及湿性啰音",
              "aux": "痰培养检出铜绿假单胞菌，对哌拉西林他唑巴坦、头孢他啶敏感；血WBC 12.8×10⁹/L、中性粒细胞78.2%"
            },
            {
              "diagnosis": "轻度贫血",
              "history": "长期反复咯血及慢性感染消耗",
              "pe": "",
              "aux": "血常规Hb 118g/L，PLT 246×10⁹/L"
            }
          ]
        }
      },
      "diagnosis": {
        "confirmed": [
          "支气管扩张症伴咯血",
          "铜绿假单胞菌肺炎",
          "轻度贫血"
        ]
      }
    }
  },
  {
    "key": "cap",
    "dept": "respiratory",
    "name": "社区获得性肺炎（右下肺）",
    "alias": [
      "社区获得性肺炎",
      "CAP",
      "肺炎链球菌肺炎",
      "大叶性肺炎",
      "右下肺炎"
    ],
    "hint": "受凉后高热寒战、咳嗽咳黄脓痰、患侧胸痛，右下肺湿啰音伴语颤增强、叩诊浊音",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南京",
        "birthPlace": "江苏南京",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "发热伴咳嗽、咳痰5天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "5天前淋雨受凉后出现发热，起病急，体温最高39.4度，伴畏寒、寒战，同日出现咳嗽、咳痰",
        "cause": "起病前1天有淋雨及受凉史，无醉酒、呕吐及误吸，近期无外出旅行及禽类接触史",
        "symptoms": "咳嗽为阵发性连声咳，咳黄色脓痰，每日约30ml，痰液黏稠不易咳出；发热以午后及夜间为著，服退热药后可短暂下降，数小时后复升；胸痛位于右侧下胸部，深呼吸及咳嗽时加重",
        "relief": "自服布洛芬混悬液后体温可短暂下降，咳嗽及胸痛无缓解",
        "evolution": "入院前2天热峰进一步升高，咳痰量增多，静息时亦有气促，平地行走百余米即感呼吸困难，遂来我院急诊",
        "accompanying": "伴乏力、食欲减退，无恶心及呕吐",
        "negativeDiscriminating": "无咯血及痰中带血，无夜间盗汗及明显消瘦，无尿频、尿急、尿痛，无下肢水肿及长期卧床史，无胸痛放射至肩背",
        "treatment": "社区诊所予阿莫西林胶囊0.5g每日3次口服，连用4天，体温未降至正常，咳嗽咳痰无好转",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠因发热及咳嗽受影响，小便正常，大便偏干，体重无明显下降",
        "extra": "入院后留取痰培养、血培养及痰抗酸染色，暂未使用抗结核药物"
      },
      "ros": {
        "resp": {
          "cough": {
            "checked": true,
            "detail": "阵发性连声咳，咳黄色脓痰"
          },
          "sputum": {
            "checked": true,
            "detail": "黄色脓痰，每日约30ml，黏稠不易咳出"
          },
          "fever": {
            "checked": true,
            "detail": "体温最高39.4度，午后及夜间为著"
          },
          "chills": {
            "checked": true,
            "detail": "起病时伴畏寒、寒战"
          },
          "chestPainResp": {
            "checked": true,
            "detail": "右侧下胸部疼痛，深呼吸及咳嗽时加重"
          },
          "dyspnea": {
            "checked": true,
            "detail": "活动后气促，平地行走百余米即感呼吸困难"
          },
          "hemoptysis": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "高血压": true
        },
        "diseaseDetail": "高血压病史8年，长期口服苯磺酸氨氯地平5mg每日1次，血压控制尚可；否认糖尿病、冠心病史",
        "longTermMeds": "苯磺酸氨氯地平5mg每日1次口服，服药规律",
        "infection": "否认肝炎、结核等传染病史，否认结核病人密切接触史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及有害气体接触史",
        "vaccine": "按计划预防接种，未接种肺炎链球菌疫苗及流感疫苗",
        "allergy": "无",
        "relatedHistory": "否认长期使用糖皮质激素及免疫抑制剂，否认酗酒",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏南京，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟20年，每日约20支，未戒烟",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认粉尘、石棉及放射性物质接触史",
        "environment": "",
        "habits": "",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无工业毒物及粉尘接触，工作节奏紧张、久坐、饮水量少"
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
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "咽充血，扁桃体肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸浅快",
          "lungPalpation": "语颤增强",
          "lungPercussion": "局部叩诊浊音",
          "lungAuscultation": "右下肺可闻及湿性啰音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_respiratory": {
          "respVocalResonance": "患侧语音共振增强",
          "respChestExpansion": "肺下界移动度减小",
          "respCyanosis": "无杵状指，无球结膜水肿"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 14.2×10⁹/L，中性粒细胞 88.6%，Hb 132g/L，PLT 218×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白及降钙素原",
            "result": "CRP 86mg/L，PCT 1.8ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部CT（平扫）",
            "result": "右下肺见大片状高密度实变影，内见支气管充气征，边界模糊，右侧胸膜腔少量积液",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "痰培养",
            "result": "检出肺炎链球菌，对青霉素、头孢曲松敏感",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动脉血气分析",
            "result": "pH 7.45，PaO2 68mmHg，PaCO2 36mmHg，HCO3⁻ 24mmol/L，SaO2 94%",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“发热伴咳嗽、咳痰5天”入院。5天前淋雨受凉后急起发热，体温最高39.4度，伴畏寒、寒战，咳黄色脓痰，右侧下胸部疼痛，深呼吸及咳嗽时加重，活动后气促。既往高血压病史8年。查体：急性病容，咽充血，右下肺语颤增强、局部叩诊浊音、可闻及湿性啰音，患侧语音共振增强。血常规示白细胞及中性粒细胞比例升高，CRP 86mg/L，PCT 1.8ng/ml；胸部CT示右下肺大片实变影伴支气管充气征；痰培养检出肺炎链球菌。无咯血、无夜间盗汗及消瘦，无下肢水肿及长期卧床史，可与肺结核、肺栓塞等鉴别",
      "soap": {
        "a": {
          "basisDetail": [
            {
              "diagnosis": "社区获得性肺炎（右下肺，非重症）",
              "history": "淋雨受凉后急起发热，体温最高39.4度，伴畏寒、寒战，咳黄色脓痰，右侧下胸部疼痛，深呼吸及咳嗽时加重，活动后气促；无咯血、无夜间盗汗及消瘦，无下肢水肿及长期卧床史",
              "pe": "急性病容，右下肺语颤增强、局部叩诊浊音、可闻及湿性啰音，患侧语音共振增强",
              "aux": "血常规WBC 14.2×10⁹/L、中性粒细胞88.6%，CRP 86mg/L，PCT 1.8ng/ml；胸部CT示右下肺大片实变影伴支气管充气征；痰培养检出肺炎链球菌"
            },
            {
              "diagnosis": "高血压病2级（高危）",
              "history": "高血压病史8年，长期口服苯磺酸氨氯地平5mg每日1次，血压控制尚可",
              "pe": "",
              "aux": ""
            }
          ]
        }
      },
      "diagnosis": {
        "confirmed": [
          "社区获得性肺炎（右下肺，非重症）",
          "高血压病2级（高危）"
        ]
      }
    }
  },
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
    "key": "cholelith",
    "dept": "surgery",
    "name": "胆总管结石伴急性胆管炎",
    "alias": [
      "胆总管结石",
      "胆管结石",
      "急性胆管炎",
      "胆道感染"
    ],
    "hint": "右上腹绞痛伴寒战高热与黄疸（Charcot 三联征），Murphy 征阳性",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏徐州",
        "birthPlace": "江苏徐州",
        "occupation": "个体工商户",
        "reliability": "可靠",
        "chiefComplaint": "右上腹绞痛伴寒战发热、皮肤黄染3天"
      },
      "hpi": {
        "onset": "3天前出现右上腹绞痛，呈阵发性，向右肩背部放射，程度剧烈，难以忍受",
        "cause": "进食油腻食物后",
        "symptoms": "持续约半小时后自行缓解，每日发作3～4次，发作时伴恶心、呕吐胃内容物",
        "relief": "改变体位及呕吐后无明显缓解，肌内注射解痉药后可短暂减轻",
        "evolution": "2天前出现寒战、发热，同日发现皮肤及巩膜黄染，尿色加深如浓茶，腹痛转为持续性胀痛",
        "accompanying": "伴皮肤瘙痒，伴尿色加深及大便颜色变浅",
        "negativeDiscriminating": "无胸痛及心悸，无呕血及黑便，无腹泻，无尿频尿急尿痛，无意识模糊",
        "treatment": "1天前于当地卫生院予头孢曲松2g静脉滴注每日1次、间苯三酚40mg静脉滴注，腹痛稍减轻但仍有发热，为进一步诊治来院",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠差，小便色深，大便色浅，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "右上腹绞痛，向右肩背部放射"
          },
          "nausea": {
            "checked": true,
            "detail": "发作时明显"
          },
          "vomiting": {
            "checked": true,
            "detail": "胃内容物，非喷射性"
          },
          "jaundiceGi": {
            "checked": true,
            "detail": "2天前出现，尿色加深"
          },
          "jaundice": {
            "checked": true,
            "detail": "皮肤及巩膜黄染"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "进食油腻食物后加重"
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
          },
          "reflux": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "2天前起，伴寒战"
          },
          "chills": {
            "checked": true,
            "detail": "发热前明显"
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          }
        },
        "hemat": {
          "bleeding": {
            "negative": true
          },
          "bruise": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "与腹痛同时出现，向右肩背部放射"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "胆囊结石": true
        },
        "diseaseOther": "",
        "diseaseDetail": "胆囊结石5年，间断右上腹隐痛，未手术",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期饮酒及服用肝毒性药物史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏徐州，否认疫区及地方病流行区居住史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "habits": "平素喜食油腻食物，早餐常不规律",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "经营店铺，无粉尘及毒物接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "25",
        "spouseHealth": "配偶体健"
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
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜黄染",
          "rash": "未见皮疹及出血点"
        },
        "head": {
          "eyes": "巩膜黄染"
        },
        "neck": {
          "neckResist": "颈软，无抵抗"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "肝区叩击痛",
          "abdPalpation": "上腹部压痛，无反跳痛"
        },
        "special_surgery": {
          "surgPeritoneum": "局部压痛伴反跳痛",
          "surgAbdomenMass": "腹部未触及包块",
          "surgLymph": "引流区域淋巴结未触及肿大"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 126g/L，WBC 18.2×10⁹/L，N 90%，PLT 176×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝功能",
            "result": "TBIL 68μmol/L，DBIL 46μmol/L，ALT 186U/L，AST 132U/L，ALP 268U/L，GGT 412U/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "肝外胆管扩张，内径约12mm，管腔内可见强回声伴声影，胆囊壁增厚，胆囊内多发结石",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "MRCP",
            "result": "胆总管下段见充盈缺损，胆总管及肝内胆管扩张，未见胰管扩张",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白",
            "result": "148mg/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "胆总管结石伴急性胆管炎",
          "胆囊结石伴慢性胆囊炎"
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
        "cause": "近3个月自行停用恩替卡韦，乙型肝炎病毒复制活跃，且未再复查肝功能",
        "symptoms": "腹胀进行性加重，腹围渐增大，尿量减至每日约800ml，双下肢凹陷性水肿由踝部向上发展至胫前",
        "relief": "自服利尿剂后尿量增多、腹胀略减轻，停药后反复",
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
          "spider": "可见蜘蛛痣，肝掌阳性",
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
          "edemaAnkle": "双侧踝部凹陷性水肿",
          "edemaPretibial": "双侧胫前凹陷性水肿"
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
    "key": "ckd",
    "dept": "nephrology",
    "name": "慢性肾脏病4期（糖尿病肾病）",
    "alias": [
      "慢性肾脏病",
      "糖尿病肾病",
      "CKD",
      "慢性肾功能不全",
      "尿毒症前期"
    ],
    "hint": "长期糖尿病史，夜尿增多、乏力纳差伴水肿，eGFR 持续下降、双肾缩小",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "退休工人",
        "reliability": "可靠",
        "chiefComplaint": "夜尿增多伴双下肢水肿1个月",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "月"
      },
      "hpi": {
        "onset": "1个月前无明显诱因发现双足踝部水肿，晨轻暮重，休息一夜后可减轻；同时夜尿次数增至3～4次，夜尿量多于白天",
        "cause": "无明确诱因；近1个月因牙痛自服布洛芬3天。糖尿病饮食控制不严，近半年空腹血糖多在9～11mmol/L",
        "symptoms": "水肿由双足踝向上发展至双小腿，呈凹陷性，指压后留痕；尿中泡沫增多，静置后不易消散；夜尿3～4次，每次约300ml",
        "relief": "抬高下肢及减少饮水后水肿略减轻",
        "evolution": "近2周乏力加重，上两层楼即感气短，食欲明显减退，晨起恶心，未呕吐",
        "accompanying": "伴头晕、皮肤瘙痒",
        "negativeDiscriminating": "无肉眼血尿，无排尿疼痛及烧灼感，无腰痛及肾区绞痛，无关节肿痛及皮疹，无颜面蝶形红斑，无近期咽部感染史，无剧烈腹痛及腹泻",
        "treatment": "长期口服二甲双胍0.5g每日3次、格列美脲2mg每日1次，近半年未复查肾功能；1个月前查血肌酐302μmol/L，未系统诊治。本次入院后停用二甲双胍，改为胰岛素控制血糖",
        "generalCondition": "发病以来精神差，食欲减退，睡眠尚可，夜尿增多，大便干结2～3日一行，体重近3个月下降3kg",
        "extra": "入院后完善eGFR、尿蛋白定量、甲状旁腺激素及肾脏超声，评估并发症"
      },
      "ros": {
        "gu": {
          "nocturia": {
            "checked": true,
            "detail": "夜尿3～4次，夜尿量多于白天"
          },
          "polyuria": {
            "checked": true,
            "detail": "24小时尿量约2200ml"
          },
          "edemaGu": {
            "checked": true,
            "detail": "双下肢凹陷性水肿"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          }
        },
        "gi": {
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲明显减退，进食量约为平时一半"
          },
          "nausea": {
            "checked": true,
            "detail": "晨起恶心，未呕吐"
          },
          "vomiting": {
            "negative": true
          },
          "constipation": {
            "checked": true,
            "detail": "大便2～3日一行，干结"
          },
          "abdominalPain": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "乏力，活动耐量下降"
          },
          "anemia": {
            "checked": true,
            "detail": "面色及睑结膜苍白"
          },
          "pruritus": {
            "checked": true,
            "detail": "全身皮肤瘙痒，夜间明显"
          },
          "pallorSkin": {
            "checked": true,
            "detail": "皮肤黏膜苍白"
          }
        },
        "cardio": {
          "edemaCardio": {
            "checked": true,
            "detail": "双下肢水肿"
          },
          "palpitation": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          }
        },
        "endocrine": {
          "polyuriaEndo": {
            "checked": true,
            "detail": "夜尿及日间尿量增多"
          },
          "polydipsia": {
            "checked": true,
            "detail": "口干多饮，每日饮水约2500ml"
          },
          "weightLoss": {
            "checked": true,
            "detail": "近3个月体重下降3kg"
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "起身时头晕"
          },
          "headache": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，可从事体力劳动",
        "diseaseChecks": {
          "糖尿病": true,
          "高血压": true,
          "慢性肾脏病": true
        },
        "diseaseDetail": "2型糖尿病15年，长期口服二甲双胍及格列美脲，未规律监测血糖；高血压病史8年，最高血压165/95mmHg，口服氨氯地平5mg每日1次；1个月前外院查血肌酐302μmol/L，未规律随访",
        "longTermMeds": "二甲双胍0.5g每日3次口服（入院后停用）、格列美脲2mg每日1次口服、氨氯地平5mg每日1次口服、碳酸钙D3片1片每日1次口服",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及肾毒性药物长期接触史；近1个月曾服布洛芬3天",
        "vaccine": "按计划预防接种；未接种流感疫苗",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认反复扁桃体炎、紫癜及关节痛病史；否认家族中多囊肾病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认马兜铃酸类中草药及解热镇痛药长期服用史",
        "environment": "",
        "habits": "饮食偏咸，喜食腌制食品，糖尿病饮食执行不严",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "退休前从事机械加工工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶患高血压，规律服药",
        "sexLife": "近2年减少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "糖尿病": true,
          "高血压": true
        },
        "other": "兄长患2型糖尿病20年，未规律复查肾功能",
        "deceased": "父亲因脑卒中去世，71岁；母亲健在",
        "threeGeneration": "两系三代有多人患糖尿病及高血压，否认多囊肾等遗传性肾病",
        "similarDisease": "否认家族中有类似肾脏疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神差",
          "posture": "自主体位",
          "face": "贫血面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑水肿",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartPercussion": "心界向左下扩大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "双下肢凹陷性水肿"
        },
        "special_nephrology": {
          "renalFacialEdema": "双眼睑水肿",
          "renalLegEdema": "双下肢凹陷性水肿",
          "renalSkin": "睑结膜苍白",
          "renalPercussion": "双肾区无叩击痛",
          "renalBladder": "膀胱未触及，耻骨上区无压痛",
          "renalBP": "血压升高"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "肾功能",
            "result": "血肌酐386μmol/L，尿素氮 15.8mmol/L，尿酸 486μmol/L，eGFR 14ml/min/1.73m²",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "Hb 92g/L，RBC 3.1×10¹²/L，MCV 88fl，WBC 6.2×10⁹/L，PLT 198×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规及尿白蛋白/肌酐比值",
            "result": "尿蛋白 3+，尿潜血 1+，尿沉渣红细胞 3/HP；尿白蛋白/肌酐比值 1280mg/g",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "钙磷代谢及甲状旁腺激素",
            "result": "血钙 1.98mmol/L，血磷 1.86mmol/L，PTH 286pg/ml，25羟维生素D 12ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "泌尿系超声",
            "result": "双肾缩小，右肾 8.2cm×3.6cm，左肾 8.4cm×3.8cm，皮质变薄、回声增强，皮髓质分界不清，双肾血流稀疏",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "慢性肾脏病4期（糖尿病肾病）",
          "2型糖尿病",
          "肾性贫血",
          "慢性肾脏病矿物质及骨异常"
        ]
      }
    }
  },
  {
    "key": "copd",
    "dept": "respiratory",
    "name": "慢性阻塞性肺疾病急性加重（Ⅱ型呼吸衰竭）",
    "alias": [
      "慢阻肺",
      "COPD",
      "AECOPD",
      "慢性阻塞性肺疾病",
      "肺气肿",
      "Ⅱ型呼吸衰竭"
    ],
    "hint": "长期吸烟、慢性咳嗽咳痰 20 年，近 1 周气促加重痰变脓；桶状胸、语颤减弱、叩诊过清音、呼吸音减弱且呼气相延长，血气提示二氧化碳潴留",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河北唐山",
        "birthPlace": "河北唐山",
        "occupation": "退休工人",
        "reliability": "可靠",
        "chiefComplaint": "反复咳嗽、咳痰20年，气促加重1周",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "20年前无明显诱因出现反复咳嗽、咳白色黏液痰，多于冬春季节及受凉后发作，每年累计3个月以上，连续2年以上",
        "cause": "本次加重前1周受凉，无醉酒及误吸，无粉尘及刺激性气体急性接触史",
        "symptoms": "咳嗽为晨起及夜间为著的连声咳，痰量由每日约20ml增至每日约60ml，由白色黏液痰转为黄色脓痰，黏稠不易咳出；气促由原先平地快走时出现，加重至穿衣、洗漱等日常活动即感呼吸困难，伴喘息及胸闷",
        "relief": "自行加用沙丁胺醇气雾剂吸入后气促可短暂减轻，数小时后再次加重",
        "evolution": "入院前3天出现嗜睡、反应迟钝，夜间不能平卧，需高枕卧位，遂由家属送来急诊",
        "accompanying": "伴食欲明显减退、乏力，无发热及寒战",
        "negativeDiscriminating": "无咯血及痰中带血，无夜间阵发性呼吸困难及双下肢水肿，无胸痛及晕厥，无长期卧床及单侧下肢肿胀史，无午后低热及盗汗",
        "treatment": "长期口服氨茶碱0.1g每日3次、间断吸入沙丁胺醇气雾剂；本次加重后于社区医院予头孢呋辛1.5g每日2次静脉滴注3天，口服泼尼松30mg每日1次连用5天，气促未见缓解",
        "generalCondition": "发病以来精神差、嗜睡，食欲明显减退，睡眠因气促不能平卧而变差，小便量偏少，大便3日未解，体重近半年下降约3kg",
        "extra": "入院后予低流量鼻导管吸氧，复查动脉血气并行无创通气评估"
      },
      "ros": {
        "resp": {
          "cough": {
            "checked": true,
            "detail": "反复咳嗽20年，晨起及夜间为著，近1周加重"
          },
          "sputum": {
            "checked": true,
            "detail": "痰量由每日约20ml增至约60ml，由白色黏液痰转为黄色脓痰"
          },
          "dyspnea": {
            "checked": true,
            "detail": "气促进行性加重，穿衣洗漱即感呼吸困难，夜间不能平卧"
          },
          "wheeze": {
            "checked": true,
            "detail": "喘息、胸闷，活动后明显"
          },
          "hemoptysis": {
            "negative": true
          },
          "chestPainResp": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "checked": true,
            "detail": "近半年体重下降约3kg"
          }
        },
        "nervous": {
          "sleepDisorder": {
            "checked": true,
            "detail": "近3天嗜睡、反应迟钝"
          },
          "headache": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "慢性阻塞性肺疾病": true,
          "高血压": true
        },
        "diseaseDetail": "慢性阻塞性肺疾病病史20年，近3年每年急性加重2至3次，曾因气促加重住院2次；高血压病史10年，长期口服缬沙坦80mg每日1次，血压控制尚可；否认糖尿病、冠心病史",
        "longTermMeds": "氨茶碱0.1g每日3次口服，缬沙坦80mg每日1次口服，沙丁胺醇气雾剂按需吸入",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及有害气体接触史",
        "vaccine": "按计划预防接种，近3年未接种流感疫苗及肺炎链球菌疫苗",
        "allergy": "无",
        "relatedHistory": "否认长期使用糖皮质激素及免疫抑制剂，否认职业性粉尘及棉尘长期接触史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "河北唐山，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟40年，每日约30支，未戒烟，累计约60包年",
        "drinking": "有",
        "drinkingAmount": "饮白酒20年，每日约100ml，未戒酒",
        "drugs": "否认粉尘、石棉及放射性物质接触史",
        "environment": "",
        "habits": "",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事煤矿井下运输工作30年，有长期煤尘接触史，现已退休10年"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母已故，父亲因脑卒中去世，母亲因心脏病去世，死亡年龄不详",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "嗜睡",
          "posture": "被动体位",
          "face": "慢性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "口唇及肢端发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "口唇发绀"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "桶状胸",
          "lungInspect": "呼吸运动减弱",
          "lungPalpation": "语颤减弱",
          "lungPercussion": "双肺叩诊过清音",
          "lungAuscultation": "双肺可闻及湿性啰音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_respiratory": {
          "respAccessory": "可见辅助呼吸肌参与呼吸运动",
          "respChestExpansion": "肺下界移动度减小",
          "respBreathSound": "双肺呼吸音减弱",
          "respCyanosis": "口唇发绀"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "动脉血气分析（呼吸空气）",
            "result": "pH 7.32，PaO2 52mmHg，PaCO2 68mmHg，HCO3⁻ 32mmol/L，BE 5mmol/L，SaO2 86%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肺功能（支气管舒张试验后）",
            "result": "FEV1/FVC 52%，FEV1占预计值45%，残气量占肺总量比值增高，支气管舒张试验阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 11.6×10⁹/L，中性粒细胞 82.4%，Hb 148g/L，PLT 196×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部X线片",
            "result": "双肺透亮度增高，肺纹理增粗紊乱，肋间隙增宽，双侧膈肌低平，心影狭长",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "痰培养",
            "result": "检出肺炎克雷伯菌，对头孢哌酮舒巴坦、左氧氟沙星敏感",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“反复咳嗽、咳痰20年，气促加重1周”入院。20年来反复咳嗽咳痰，冬春季为著；1周前受凉后气促进行性加重，痰量增多并由白转黄，夜间不能平卧，近3天出现嗜睡。吸烟40年，每日约30支。查体：嗜睡，口唇发绀，桶状胸，语颤减弱，双肺叩诊过清音、可闻及湿性啰音，呼吸音减弱，肺下界移动度减小，可见辅助呼吸肌参与呼吸运动。血气 pH 7.32、PaO2 52mmHg、PaCO2 68mmHg；肺功能 FEV1/FVC 52%；胸片示肺气肿征。无咯血、无夜间阵发性呼吸困难及双下肢水肿，可与左心衰竭鉴别；无午后低热及盗汗，可与肺结核鉴别",
      "soap": {
        "a": {
          "basisDetail": [
            {
              "diagnosis": "慢性阻塞性肺疾病急性加重",
              "history": "吸烟40年、每日约30支，慢性咳嗽咳痰20年、每年累计3个月以上；近1周受凉后气促加重、痰量增多并由白色黏液痰转为黄色脓痰，伴喘息胸闷",
              "pe": "桶状胸，语颤减弱，双肺叩诊过清音，双肺可闻及湿性啰音，呼吸音减弱，肺下界移动度减小，可见辅助呼吸肌参与呼吸运动",
              "aux": "肺功能 FEV1/FVC 52%、FEV1占预计值45%，支气管舒张试验阴性；胸部X线片示双肺透亮度增高、肋间隙增宽、膈肌低平"
            },
            {
              "diagnosis": "Ⅱ型呼吸衰竭",
              "history": "气促进行性加重，夜间不能平卧，近3天嗜睡、反应迟钝",
              "pe": "嗜睡，口唇发绀，可见辅助呼吸肌参与呼吸运动",
              "aux": "动脉血气分析（呼吸空气）pH 7.32，PaO2 52mmHg，PaCO2 68mmHg，SaO2 86%"
            },
            {
              "diagnosis": "高血压病2级（高危）",
              "history": "高血压病史10年，长期口服缬沙坦80mg每日1次，血压控制尚可",
              "pe": "",
              "aux": ""
            }
          ]
        }
      },
      "diagnosis": {
        "confirmed": [
          "慢性阻塞性肺疾病急性加重",
          "Ⅱ型呼吸衰竭",
          "高血压病2级（高危）"
        ]
      }
    }
  },
  {
    "key": "cushing",
    "dept": "endocrinology",
    "name": "库欣综合征（Cushing 病）",
    "alias": [
      "库欣综合征",
      "皮质醇增多症",
      "Cushing综合征",
      "肾上腺皮质功能亢进",
      "库欣病"
    ],
    "hint": "向心性肥胖、满月脸水牛背，腹部紫纹、痤疮多毛，血压升高伴月经紊乱，血皮质醇节律消失",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "山东济南",
        "birthPlace": "山东济南",
        "occupation": "会计",
        "reliability": "可靠",
        "chiefComplaint": "体重增加伴面圆、腹部紫纹1年半"
      },
      "hpi": {
        "onset": "1年半前无明显诱因出现体重逐渐增加，1年半内由55kg增至72kg，以躯干及颜面为主，四肢相对不增粗",
        "cause": "无明显诱因，未服用糖皮质激素及含激素类保健品",
        "symptoms": "面颊变圆、面色红润，颈后脂肪垫增厚；腹部及大腿内侧出现紫红色条纹，宽约1.5cm；皮肤易出现瘀斑，轻微碰撞即青紫",
        "relief": "未服药，自行控制饮食及增加运动后体重仍继续上升",
        "evolution": "近1年出现月经周期延长至40～60天、经量减少；四肢近端乏力，下蹲后起身困难；情绪易激动，偶有失眠",
        "accompanying": "伴口干、多饮，夜尿1～2次，腰背部酸痛，无头痛及视野缺损，无阵发性剧烈头痛伴大汗",
        "negativeDiscriminating": "无阵发性剧烈头痛伴大汗及血压骤升，无颈前疼痛及怕热多汗，无长期饮酒史，无长期服用糖皮质激素及含激素外用制剂史，无体重下降及发热盗汗，无肉眼血尿及尿量明显减少，无视野缺损及溢乳",
        "treatment": "2个月前门诊查血皮质醇升高、昼夜节律消失，肾上腺 CT 未见异常，为进一步诊治收入院",
        "generalCondition": "发病以来精神可，食欲亢进，睡眠一般，大小便正常，体重增加约17kg",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "weightGain": {
            "checked": true,
            "detail": "1年半内体重由55kg增至72kg，以躯干及颜面为主，四肢相对不增粗"
          },
          "hairChange": {
            "checked": true,
            "detail": "面部及躯干毛发增多变粗，唇周出现细须"
          },
          "weightLoss": {
            "negative": true
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          },
          "neckMass": {
            "negative": true
          },
          "polydipsia": {
            "checked": true,
            "detail": "近半年口干多饮，每日饮水约2500mL"
          },
          "polyuriaEndo": {
            "checked": true,
            "detail": "夜尿1～2次，尿量偏多"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸，静息时可感心跳"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "checked": true,
            "detail": "双下肢轻度水肿，午后为著"
          },
          "syncope": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          }
        },
        "hemat": {
          "bruise": {
            "checked": true,
            "detail": "轻微碰撞即出现皮下瘀斑，分布于四肢"
          },
          "fatigue": {
            "checked": true,
            "detail": "四肢近端乏力，下蹲后起身及上楼困难"
          },
          "anemia": {
            "negative": true
          },
          "bleeding": {
            "negative": true
          },
          "bonePain": {
            "checked": true,
            "detail": "腰背部持续性酸痛，久坐及弯腰时加重"
          },
          "pruritus": {
            "negative": true
          },
          "rash": {
            "negative": true
          },
          "pallorSkin": {
            "negative": true
          }
        },
        "nervous": {
          "moodLow": {
            "negative": true
          },
          "anxiety": {
            "checked": true,
            "detail": "情绪易激动、烦躁，因小事与家人争吵"
          },
          "insomnia": {
            "checked": true,
            "detail": "入睡困难，夜间易醒"
          },
          "visualBlur": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "weakness": {
            "checked": true,
            "detail": "全身乏力，以近端为主"
          },
          "numbness": {
            "negative": true
          },
          "memoryLoss": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "constipation": {
            "checked": true,
            "detail": "大便2～3天一次，偏干"
          },
          "melena": {
            "negative": true
          },
          "bloating": {
            "checked": true,
            "detail": "餐后腹胀，腹部膨隆明显"
          }
        },
        "gu": {
          "polyuria": {
            "checked": true,
            "detail": "尿量偏多，夜尿1～2次"
          },
          "edemaGu": {
            "checked": true,
            "detail": "双下肢轻度水肿"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "nocturia": {
            "checked": true,
            "detail": "夜尿1～2次"
          }
        },
        "resp": {
          "cough": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "腰背部酸痛，久坐及弯腰时加重，无放射痛"
          },
          "muscleWeak": {
            "checked": true,
            "detail": "双下肢近端无力，蹲起困难"
          },
          "jointPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，否认高血压、糖尿病史",
        "diseaseChecks": {
          "高血压": true
        },
        "diseaseOther": "",
        "diseaseDetail": "1年前体检发现血压升高，最高 160/100mmHg，未规律服药；否认糖皮质激素长期使用史",
        "longTermMeds": "苯磺酸氨氯地平片 5mg 每日1次（近半年，间断）",
        "infection": "否认肝炎、结核、伤寒等传染病史；近1年易感冒",
        "surgery": "否认手术史；否认垂体及肾上腺手术史",
        "trauma": "否认外伤史；否认脊柱压缩性骨折史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认长期外用含糖皮质激素药膏史，否认关节腔内注射激素史，否认哮喘及风湿病长期激素治疗史；否认长期饮酒史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "山东济南，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认毒物、粉尘及放射性物质接触史",
        "environment": "",
        "habits": "长期伏案工作，活动量少，饮食偏咸、喜甜食，近1年体重持续增加",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事会计工作14年，长期伏案、精神紧张，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "近1年性欲减退，同房次数减少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true,
          "糖尿病": true
        },
        "other": "",
        "deceased": "父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "母亲患高血压、糖尿病",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "肥胖",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "满月面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "可见瘀点瘀斑",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑水肿",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白",
          "hair": "毛发分布异常"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱后凸",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "limbMuscle": "四肢肌力4级",
          "edemaAnkle": "双侧踝部凹陷性水肿"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性",
          "tendonReflex": "双侧肱二头肌、膝腱、跟腱反射正常对称"
        },
        "special_endocrinology": {
          "endoExtra": "满月脸、水牛背",
          "endoBody": "向心性肥胖",
          "endoSkin": "可见紫纹",
          "endoThyroid": "甲状腺不大，质软，未触及结节，未闻及血管杂音",
          "endoEye": "双眼球无突出，眼征阴性",
          "endoHandFoot": "手足无畸形，指端无增粗",
          "endoWound": "全身皮肤完整，未见溃疡及伤口愈合不良",
          "endoPulseBP": "血压升高"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血皮质醇昼夜节律",
            "result": "8:00 血皮质醇 682nmol/L（升高），16:00 为 610nmol/L，24:00 为 528nmol/L，昼夜节律消失",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "24小时尿游离皮质醇",
            "result": "24小时尿游离皮质醇 486μg/24h（明显升高，参考范围 20～90μg/24h）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "小剂量及大剂量地塞米松抑制试验",
            "result": "小剂量（2mg/日×2天）抑制后血皮质醇 420nmol/L，未被抑制；大剂量（8mg/日×2天）抑制后降至 96nmol/L，抑制率＞50%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血促肾上腺皮质激素及垂体磁共振",
            "result": "8:00 血促肾上腺皮质激素 12.6pmol/L（正常高限或轻度升高）；垂体磁共振增强见垂体右翼 6mm 微腺瘤",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血糖、血脂及血钾",
            "result": "空腹血糖 6.8mmol/L，糖化血红蛋白 6.4%；总胆固醇 6.6mmol/L，低密度脂蛋白胆固醇 4.3mmol/L；血钾 3.2mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "库欣综合征（Cushing 病，垂体 ACTH 微腺瘤）",
          "继发性高血压",
          "糖耐量减低",
          "低钾血症"
        ]
      }
    }
  },
  {
    "key": "dementia",
    "dept": "neurology",
    "name": "阿尔茨海默病（中度）",
    "alias": [
      "阿尔茨海默病",
      "老年性痴呆",
      "AD",
      "痴呆"
    ],
    "hint": "隐袭起病的近事记忆减退进行性加重，伴认知功能下降，无局灶性神经体征",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江杭州",
        "birthPlace": "浙江杭州",
        "occupation": "退休教师",
        "reliability": "由家属代述，基本可靠",
        "chiefComplaint": "近事记忆减退2年，加重伴迷路3个月",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "年"
      },
      "hpi": {
        "onset": "2年前无明显诱因出现近事记忆减退，起初为忘记刚放下的物品、重复问同一件事，家人以为是年纪大未在意",
        "cause": "无明确诱因；否认头部外伤、煤气中毒及脑炎病史",
        "symptoms": "记忆减退以近事为主，远事如年轻时经历尚能清楚回忆；近3个月出现外出后找不到回家的路，曾在小区附近迷路2次；不会使用手机拨号，把盐当糖放进菜里",
        "relief": "无缓解因素",
        "evolution": "症状缓慢进行性加重，近半年生活需他人提醒，洗漱、穿衣需督促，偶有将衣物穿反",
        "accompanying": "伴性格改变，较前固执、易怒，怀疑家人藏其物品；夜间睡眠差，白天嗜睡",
        "negativeDiscriminating": "无肢体瘫痪及麻木，无言语不能，无吞咽困难及饮水呛咳，无肢体抖动，无走路不稳，无幻觉及妄想内容泛化，无发热",
        "treatment": "曾在社区医院就诊，查头颅CT示脑萎缩，未予特殊治疗；近1个月自行服用银杏叶提取物，症状无改善",
        "generalCondition": "发病以来精神一般，食欲尚可，睡眠昼夜颠倒，大小便偶有失禁，体重无明显变化",
        "extra": "家属陪同就诊，能配合完成量表评定"
      },
      "ros": {
        "nervous": {
          "memoryLoss": {
            "checked": true,
            "detail": "近事记忆减退2年，远事记忆相对保留"
          },
          "moodLow": {
            "checked": true,
            "detail": "情绪低落，兴趣减少"
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "夜间睡眠差，白天嗜睡"
          },
          "hallucination": {
            "negative": true
          },
          "seizure": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "tremor": {
            "negative": true
          },
          "incontinence": {
            "checked": true,
            "detail": "偶有尿失禁"
          },
          "headache": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "gi": {
          "appetiteLoss": {
            "checked": true,
            "detail": "进食量较前减少"
          },
          "constipation": {
            "checked": true,
            "detail": "3～4日一行"
          }
        }
      },
      "pmh": {
        "health": "既往体健，生活自理至2年前",
        "diseaseChecks": {
          "高血压": true
        },
        "diseaseDetail": "高血压病史12年，最高血压160/90mmHg，长期口服缬沙坦80mg每日1次，血压控制在140/85mmHg左右；否认糖尿病、脑卒中病史",
        "longTermMeds": "缬沙坦80mg每日1次口服；银杏叶提取物片2片每日3次口服（近1个月自服）",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "50年前行阑尾切除术",
        "trauma": "否认头部外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认一氧化碳中毒史",
        "vaccine": "按计划预防接种",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认甲状腺疾病、维生素B12缺乏及梅毒病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江杭州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认铅、汞等重金属接触史",
        "environment": "",
        "habits": "退休后以居家为主，社交活动少，近2年不再参加老年大学活动",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "退休前从事中学语文教学工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "25",
        "spouseHealth": "配偶体健，共同生活",
        "sexLife": "近2年无",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "遗传性疾病": true
        },
        "other": "母亲70岁起出现记忆减退，80岁确诊痴呆",
        "deceased": "父亲因肺癌去世，78岁；母亲健在，现年84岁",
        "threeGeneration": "两系三代有痴呆家族史",
        "similarDisease": "母亲有类似疾病史",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性"
        },
        "special_neurology": {
          "neuroExtra1": "记忆力减退",
          "neuroExtra2": "十二对颅神经检查未见异常",
          "neuroExtra3": "四肢肌张力正常，肌力正常，未见肌萎缩",
          "neuroExtra4": "痛温觉、触觉、深感觉检查未见异常",
          "neuroExtra5": "指鼻试验、跟膝胫试验稳准，Romberg征阴性",
          "neuroPathologic": "Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性",
          "neuroMeningeal": "颈项强直阴性，Kernig征阴性，Brudzinski征阴性",
          "neuroGait": "步态正常，行走平稳"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "MMSE",
            "result": "18分（定向力5分、记忆3分、注意与计算2分、回忆1分、语言7分），受教育程度初中以上",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "MoCA",
            "result": "14分（视空间与执行2分、命名2分、注意2分、语言1分、抽象1分、延迟回忆0分、定向4分）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅MRI（海马相）",
            "result": "双侧海马萎缩，内侧颞叶萎缩评分（MTA）3级，脑沟增宽，脑室扩大，未见急性梗死灶",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺功能及维生素B12",
            "result": "TSH 2.1mIU/L，FT3、FT4正常；维生素B12 386pmol/L，均在正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "日常生活能力量表（ADL）",
            "result": "32分，洗澡、穿衣、理财需他人帮助",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "阿尔茨海默病（中度）",
          "高血压病2级（高危）",
          "便秘"
        ]
      }
    }
  },
  {
    "key": "depression",
    "dept": "psychiatry",
    "name": "抑郁发作（伴躯体症状）",
    "alias": [
      "抑郁发作",
      "抑郁症",
      "抑郁障碍",
      "中度抑郁"
    ],
    "hint": "持续情绪低落、兴趣减退伴精力下降，睡眠与食欲改变，需评估自杀风险",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江杭州",
        "birthPlace": "浙江杭州",
        "occupation": "公司会计",
        "reliability": "可靠",
        "informant": "患者本人",
        "chiefComplaint": "情绪低落、兴趣减退3个月"
      },
      "hpi": {
        "onset": "3个月前逐渐出现情绪低落，整日闷闷不乐，对以往感兴趣的事提不起劲",
        "cause": "工作调整及与同事发生争执后",
        "symptoms": "晨起时情绪最低落，午后稍减轻，自觉脑子反应变慢、思考费力，注意力不集中，常独自落泪",
        "relief": "休息及家人陪伴时略有好转，未服抗抑郁药",
        "evolution": "近1个月加重，已请假在家，有时整日卧床，不愿与人接触",
        "accompanying": "伴入睡困难及早醒，夜间睡约3小时即醒后难以再入睡；食欲明显减退，进食量约为病前一半",
        "negativeDiscriminating": "无发热、头痛及呕吐，无抽搐及意识丧失，无饮酒及药物滥用史，无持续情绪高涨或言语增多",
        "treatment": "2个月前于当地医院查甲状腺功能正常、头颅MRI未见异常，予舍曲林50mg每日1次口服，2周后因恶心自行停药",
        "generalCondition": "发病以来精神差，食欲减退，睡眠差，生活尚能自理，体重较病前明显下降",
        "extra": ""
      },
      "ros": {
        "nervous": {
          "moodLow": {
            "checked": true,
            "detail": "整日闷闷不乐，晨重暮轻，常独自落泪"
          },
          "interestLoss": {
            "checked": true,
            "detail": "以往喜欢的散步、看电视剧均提不起兴趣"
          },
          "energyLoss": {
            "checked": true,
            "detail": "稍活动即感疲乏，日常家务难以完成"
          },
          "suicidal": {
            "checked": true,
            "detail": "近1个月反复想到「活着没意思」，曾一次自行加量服用舍曲林被家人发现，无自伤行为"
          },
          "appetiteChange": {
            "checked": true,
            "detail": "进食量约为病前一半，体重较病前明显下降"
          },
          "insomnia": {
            "checked": true,
            "detail": "入睡需2小时以上，凌晨3时左右早醒"
          },
          "memoryLoss": {
            "checked": true,
            "detail": "常忘记刚说过的话，需家人提醒"
          },
          "anxiety": {
            "negative": true
          },
          "hallucination": {
            "negative": true
          },
          "behaviorAbnormal": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "tremor": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "gi": {
          "abdominalPain": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史，否认颅脑外伤及癫痫史",
        "longTermMeds": "否认长期服用激素、镇静催眠药及利血平等药物史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认中毒史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认既往类似发作史，否认既往躁狂或轻躁狂发作史",
        "otherTreatDiseases": "",
        "special": "已自行停用舍曲林2个月，其间未使用酒精及其他精神活性物质"
      },
      "personal": {
        "residence": "浙江杭州，否认疫区及地方病流行区居住史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认乙醇依赖及吸毒、滥用镇静催眠药物史",
        "habits": "生活作息规律，社交活动少，业余多在家看书，近3个月因精力下降几乎不外出",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "财务工作，近半年工作强度增大，无粉尘及毒物接触",
        "premorbidPersonality": "内向、少言，做事追求完美，遇事多独自承受，不轻易向他人倾诉",
        "stressEvent": "3个月前科室岗位调整，工作量明显增加，并与同事发生过一次激烈争执"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "精神病": true
        },
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病病史",
        "similarDisease": "母亲有抑郁发作史，曾服抗抑郁药治疗，现病情稳定",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病家族史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "conscious": "神志清楚，精神差"
        },
        "special_psychiatry": {
          "psyAppearance": "衣着整洁，接触主动，合作",
          "psyOrientation": "定向力完整，意识清晰",
          "psySpeech": "语速缓慢，语音低微",
          "psyThoughtForm": "思维连贯，逻辑正常",
          "psyThoughtContent": "未引出妄想",
          "psyPerception": "未引出幻觉",
          "psyMood": "情感低落",
          "psyCognition": "近事记忆力减退",
          "psyInsight": "自知力完整，承认有病并愿意接受治疗",
          "psyBehavior": "意志减退，生活懒散"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "甲状腺功能",
            "result": "FT3 4.6pmol/L，FT4 15.2pmol/L，TSH 2.1mIU/L，均在正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅MRI",
            "result": "脑实质未见异常信号，垂体形态正常，未见占位",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，大致正常心电图",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "汉密尔顿抑郁量表（HAMD-17）",
            "result": "总分24分，提示中度抑郁，供病情评估与随访比较",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "抑郁发作（伴躯体症状）",
          "睡眠障碍"
        ]
      }
    }
  },
  {
    "key": "dka",
    "dept": "endocrinology",
    "name": "2型糖尿病 糖尿病酮症酸中毒（中度）",
    "alias": [
      "糖尿病酮症酸中毒",
      "DKA",
      "酮症酸中毒",
      "糖尿病急性并发症"
    ],
    "hint": "糖尿病史伴感染诱因，多尿烦渴加重后出现恶心呕吐、深大呼吸伴烂苹果味、皮肤弹性差、尿酮体强阳性",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "四川成都",
        "birthPlace": "四川成都",
        "occupation": "个体经营者",
        "reliability": "基本可靠",
        "chiefComplaint": "口干多饮加重1周，恶心呕吐伴乏力2天"
      },
      "hpi": {
        "onset": "患糖尿病6年，平素口服二甲双胍 0.5g 每日3次，血糖未规律监测；1周前受凉后出现咳嗽、咽痛",
        "cause": "1周前受凉后上呼吸道感染，同时因食欲差自行停用二甲双胍3天",
        "symptoms": "口干多饮较前明显加重，每日饮水约4000mL，夜尿5～6次，尿量多；2天前出现恶心、频繁呕吐，呕吐物为胃内容物，非喷射性，无咖啡样物",
        "relief": "自行停用降糖药并减少进食，症状无缓解；家中自测指尖血糖显示「HI」（超出仪器上限）",
        "evolution": "今日晨起精神萎靡、嗜睡，呼之能应但答话迟缓，家属诉呼吸深大、呼气有烂苹果味，遂急诊入院",
        "accompanying": "伴明显乏力、头晕、口渴，尿量较前减少，无发热，无腹痛腹泻，无胸痛",
        "negativeDiscriminating": "无腹痛及腹部压痛，无腹泻，无呕血及黑便，无发热寒战，无胸痛及心悸，无偏瘫失语及肢体抽搐，无近期大量饮酒史，无服用双胍类药物过量史",
        "treatment": "入院前未补液，未用胰岛素；急诊查指尖血糖「HI」，尿酮体 +++，血气分析提示代谢性酸中毒，予生理盐水补液并转入病房",
        "generalCondition": "发病以来精神萎靡，食欲差，睡眠增多，近1天尿量明显少于平日，2天未排便，体重1周内下降约3kg",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "polydipsia": {
            "checked": true,
            "detail": "口干多饮明显加重，每日饮水约4000mL"
          },
          "polyuriaEndo": {
            "checked": true,
            "detail": "夜尿5～6次，尿量多，近1天尿量较前减少"
          },
          "weightLoss": {
            "checked": true,
            "detail": "1周内体重下降约3kg"
          },
          "polyphagia": {
            "negative": true
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          },
          "neckMass": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "持续恶心，进食即感恶心"
          },
          "vomiting": {
            "checked": true,
            "detail": "2天来呕吐5～6次，为胃内容物，非喷射性，无咖啡样物"
          },
          "abdominalPain": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近2天几乎未进食"
          },
          "constipation": {
            "checked": true,
            "detail": "2天未排便"
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "近1天尿量较前明显减少"
          },
          "polyuria": {
            "checked": true,
            "detail": "前期尿量明显增多"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸，静息时亦有心跳加快感"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "呼吸深大而快，呼气有烂苹果味，无呼吸困难及端坐呼吸"
          },
          "cough": {
            "checked": true,
            "detail": "1周前受凉后干咳，无痰"
          },
          "fever": {
            "negative": true
          },
          "sputum": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "全身乏力明显，起床及行走需人搀扶"
          },
          "anemia": {
            "negative": true
          }
        },
        "nervous": {
          "sleepDisorder": {
            "checked": true,
            "detail": "近1天嗜睡，呼之能应但答话迟缓"
          },
          "dizziness": {
            "checked": true,
            "detail": "体位变动时头晕"
          },
          "headache": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "weakness": {
            "checked": true,
            "detail": "四肢乏力，持物不稳"
          },
          "speech": {
            "negative": true
          },
          "seizure": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "muscleWeak": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，6年前确诊糖尿病",
        "diseaseChecks": {
          "糖尿病": true
        },
        "diseaseOther": "",
        "diseaseDetail": "2型糖尿病6年，长期口服二甲双胍 0.5g 每日3次，未规律监测血糖，最近一次糖化血红蛋白 9.1%（半年前）",
        "longTermMeds": "二甲双胍片 0.5g 每日3次（入院前自行停用3天）；未用过胰岛素",
        "infection": "否认肝炎、结核、伤寒等传染病史；1周前有上呼吸道感染史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史；否认大量饮酒史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认胰腺炎病史，否认长期服用糖皮质激素史，否认甲状腺及肾上腺疾病史，否认肾脏疾病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "四川成都，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "有",
        "smokingAmount": "吸烟20年，每日约10支，未戒烟",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认毒物、粉尘及放射性物质接触史",
        "environment": "",
        "habits": "经营小超市，作息不规律，饮食以米面为主，近1周因咽痛进食明显减少",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "个体经营20年，长期久坐、作息不规律，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶体健",
        "sexLife": "近1周因乏力未同房",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "糖尿病": true
        },
        "other": "",
        "deceased": "父亲因糖尿病肾病去世，享年72岁；母亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "父亲及一姐均患糖尿病",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "嗜睡",
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "咽充血，扁桃体肿大",
          "teeth": "舌质红、少苔"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸深大",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "limbMuscle": "四肢肌力4级"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性",
          "kernig": "克氏征阴性",
          "brudzinski": "布氏征阴性"
        },
        "special_endocrinology": {
          "endoBody": "体型匀称，脂肪分布正常，无向心性肥胖",
          "endoSkin": "皮肤无紫纹、痤疮及色素沉着，毛发分布正常",
          "endoThyroid": "甲状腺不大，质软，未触及结节，未闻及血管杂音",
          "endoEye": "双眼球无突出，眼征阴性",
          "endoHandFoot": "手足无畸形，指端无增粗",
          "endoWound": "全身皮肤完整，未见溃疡及伤口愈合不良"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血气分析",
            "result": "pH 7.18，二氧化碳分压 24mmHg，碳酸氢根 9.2mmol/L，剩余碱 -16mmol/L，提示代谢性酸中毒（阴离子间隙升高）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血糖及血酮体",
            "result": "随机血糖 28.6mmol/L，血酮体 6.2mmol/L（升高），糖化血红蛋白 9.8%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规",
            "result": "尿糖 ++++，尿酮体 +++，尿蛋白 +，镜检未见红细胞及白细胞",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血电解质及肾功能",
            "result": "血钾 4.6mmol/L，血钠 132mmol/L，血氯 98mmol/L；血肌酐 118μmol/L，尿素氮 11.2mmol/L，估算肾小球滤过率 62mL/(min·1.73m²)",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及C反应蛋白",
            "result": "白细胞 15.6×10^9/L，中性粒细胞百分比 84%，血红蛋白 138g/L；C反应蛋白 32mg/L，降钙素原 0.42ng/mL",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "2型糖尿病 糖尿病酮症酸中毒（中度）",
          "上呼吸道感染",
          "高脂血症"
        ]
      }
    }
  },
  {
    "key": "dm",
    "dept": "endocrinology",
    "name": "2型糖尿病伴糖尿病周围神经病变",
    "alias": [
      "糖尿病",
      "2型糖尿病",
      "T2DM",
      "糖尿病周围神经病变",
      "血糖控制不佳"
    ],
    "hint": "多饮多尿伴体重下降，双下肢对称性麻木、袜套样感觉减退，腱反射减弱，糖化血红蛋白显著升高",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南京",
        "birthPlace": "江苏南京",
        "occupation": "退休工人",
        "reliability": "可靠",
        "chiefComplaint": "多饮、多尿伴体重下降3个月"
      },
      "hpi": {
        "onset": "3个月前无明显诱因出现口渴多饮，夜尿增至3～4次",
        "cause": "无明显诱因，进食甜食及主食量增加后症状更明显",
        "symptoms": "口渴喜冷饮，每日饮水约3000mL；尿量增多，夜尿3～4次，尿色清；多食易饥，但体重反而下降",
        "relief": "未服药，仅自行减少主食，症状无缓解",
        "evolution": "3个月内体重由72kg下降至65kg；近2个月出现双足麻木、蚁走感，自足趾向上发展至踝部，夜间为著",
        "accompanying": "伴乏力、视物模糊、皮肤瘙痒，无恶心呕吐，无腹痛，无发热",
        "negativeDiscriminating": "无怕热多汗、心悸及双手震颤，无烦渴伴头痛及视野缺损，无恶心呕吐及深大呼吸，无烂苹果味口气，无腹痛，无发热，无肢体无力及行走不稳，无间歇性跛行及静息痛，无足部溃疡",
        "treatment": "1周前社区体检空腹血糖 13.8mmol/L，糖化血红蛋白 9.6%，为进一步诊治收入院；既往未用过胰岛素及口服降糖药",
        "generalCondition": "发病以来精神稍差，食欲亢进，睡眠欠佳，大小便正常，体重下降约7kg",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "polydipsia": {
            "checked": true,
            "detail": "口渴多饮，每日饮水约3000mL，喜冷饮"
          },
          "polyuriaEndo": {
            "checked": true,
            "detail": "尿量增多，夜尿3～4次，尿色清"
          },
          "polyphagia": {
            "checked": true,
            "detail": "多食易饥，每日主食量增加约100g"
          },
          "weightLoss": {
            "checked": true,
            "detail": "3个月内体重由72kg下降至65kg"
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          },
          "neckMass": {
            "negative": true
          },
          "hairChange": {
            "negative": true
          },
          "weightGain": {
            "negative": true
          },
          "growthChange": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          }
        },
        "gu": {
          "nocturia": {
            "checked": true,
            "detail": "夜尿3～4次，量多"
          },
          "polyuria": {
            "checked": true,
            "detail": "日尿量明显增多，尿色清"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "近3个月乏力明显，日常家务即感疲倦"
          },
          "pruritus": {
            "checked": true,
            "detail": "全身皮肤瘙痒，夜间为著，无皮疹"
          },
          "anemia": {
            "negative": true
          }
        },
        "nervous": {
          "numbness": {
            "checked": true,
            "detail": "双足麻木、蚁走感，自足趾向上发展至踝部，呈袜套样，夜间为著"
          },
          "visualBlur": {
            "checked": true,
            "detail": "近1个月视物模糊，时轻时重"
          },
          "dizziness": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "tremor": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "夜尿频繁影响睡眠"
          }
        },
        "resp": {
          "cough": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "muscleWeak": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，否认高血压、冠心病史",
        "diseaseChecks": {
          "糖尿病": true,
          "高脂血症": true
        },
        "diseaseOther": "",
        "diseaseDetail": "3个月前体检首次发现血糖升高，此前从未检测血糖；高脂血症2年，未治疗",
        "longTermMeds": "阿托伐他汀钙片 20mg 每晚1次（近2年）；未用过降糖药物",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史；否认足部溃疡及外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认胰腺炎及胰腺手术史，否认长期服用糖皮质激素及噻嗪类利尿剂史，否认甲状腺疾病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏南京，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认毒物、粉尘及放射性物质接触史",
        "environment": "",
        "habits": "喜食甜食及精制主食，每日主食约350g，平素活动量少，体重最高78kg",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事机械加工工作35年，已退休5年；工作中无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶患高血压，规律服药",
        "sexLife": "近1年因乏力减少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "糖尿病": true,
          "高血压": true
        },
        "other": "",
        "deceased": "父亲因糖尿病并发症去世，享年68岁；母亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "母亲及一兄均患糖尿病",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "肥胖",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "可见散在皮疹",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "dorsalisPedis": "双侧足背动脉搏动减弱"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "tendonReflex": "腱反射普遍减弱",
          "babinski": "巴氏征阴性"
        },
        "special_endocrinology": {
          "endoBody": "向心性肥胖",
          "endoSkin": "皮肤无紫纹、痤疮及色素沉着，毛发分布正常",
          "endoThyroid": "甲状腺不大，质软，未触及结节，未闻及血管杂音",
          "endoEye": "双眼球无突出，眼征阴性",
          "endoHandFoot": "手足无畸形，指端无增粗",
          "endoWound": "全身皮肤完整，未见溃疡及伤口愈合不良"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "空腹及餐后2小时血糖",
            "result": "空腹血糖 13.8mmol/L，餐后2小时血糖 21.4mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "糖化血红蛋白",
            "result": "HbA1c 9.6%，提示近3个月血糖控制不佳",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规及尿微量白蛋白/肌酐比值",
            "result": "尿糖 +++，尿酮体阴性，尿蛋白阴性；尿微量白蛋白/肌酐比值 18mg/g，在正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血脂及肝肾功能",
            "result": "总胆固醇 6.4mmol/L，甘油三酯 2.9mmol/L，低密度脂蛋白胆固醇 4.2mmol/L；血肌酐 76μmol/L，尿素氮 5.4mmol/L；丙氨酸氨基转移酶 32U/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肌电图",
            "result": "双侧腓总神经、胫神经运动传导速度减慢，双侧腓肠神经感觉传导波幅降低，提示周围神经损害",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "2型糖尿病",
          "糖尿病周围神经病变",
          "高脂血症"
        ]
      }
    }
  },
  {
    "key": "ectopic",
    "dept": "gynecology",
    "name": "异位妊娠（输卵管妊娠）",
    "alias": [
      "异位妊娠",
      "宫外孕",
      "输卵管妊娠",
      "宫外孕破裂",
      "EP"
    ],
    "hint": "停经、一侧下腹撕裂样痛、少量阴道流血，宫颈举痛、附件区包块，后穹隆穿刺抽出不凝血",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "informant": "本人",
        "chiefComplaint": "停经45天，下腹痛2天，阴道少量流血1天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "平素月经规律，周期28天，末次月经2025年9月10日，停经至今45天未行经；停经38天时自测尿妊娠试验阳性，未行超声检查。2天前搬抬重物后出现右下腹持续性隐痛，阵发性加重",
        "cause": "本次妊娠未采取避孕措施，为非计划妊娠；既往人工流产史致输卵管慢性炎症、管腔通而不畅，可诱发本病",
        "symptoms": "1天前腹痛由隐痛转为撕裂样剧痛，向肛门及腰骶部放射，站立、咳嗽及排大便时明显加剧，每次持续数十分钟，间歇期仍有坠痛",
        "relief": "卧床休息后腹痛无缓解，屈曲卧位可略减轻，服用布洛芬缓释胶囊0.3g后疼痛无明显改善",
        "evolution": "腹痛呈持续性并阵发性加剧，入院前6小时疼痛扩散至全下腹，出现头晕、眼前发黑，曾短暂意识丧失约1分钟并自行恢复，此后乏力进行性加重",
        "accompanying": "伴肛门坠胀感及里急后重样排便感，伴恶心、呕吐胃内容物2次，伴心慌、出冷汗",
        "negativeDiscriminating": "无发热、寒战，无腹泻，无尿频、尿急、尿痛，无呕血及黑便，无外阴瘙痒及阴道异常分泌物，无乳房胀痛及泌乳",
        "treatment": "1天前于当地医院就诊，查尿妊娠试验阳性，血β-hCG 2860mIU/ml，经阴道超声示宫腔内未见孕囊、右附件区混合回声包块；予静脉输注复方氯化钠注射液500ml留观，未行手术及输血，腹痛无缓解",
        "generalCondition": "发病以来精神差，食欲明显下降，睡眠差，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "右下腹持续性隐痛转为撕裂样剧痛，向肛门及腰骶部放射"
          },
          "nausea": {
            "checked": true,
            "detail": "腹痛发作时恶心明显，进食后加重"
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐胃内容物2次，量少"
          },
          "constipation": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematochezia": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近2天几乎未进食"
          },
          "jaundiceGi": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "checked": true,
            "detail": "近1天尿量偏少，色深"
          },
          "flankPain": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "checked": true,
            "detail": "活动后气促，平卧时明显"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "腹痛加剧时心慌、出冷汗"
          },
          "syncope": {
            "checked": true,
            "detail": "1天前体位改变后短暂意识丧失约1分钟，自行恢复"
          },
          "edemaCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "checked": true,
            "detail": "口唇、睑结膜及甲床色淡"
          },
          "fatigue": {
            "checked": true,
            "detail": "近1天乏力明显，轻微活动即感疲惫"
          },
          "bleeding": {
            "checked": true,
            "detail": "阴道少量暗红色流血，淋漓不尽"
          },
          "bruise": {
            "negative": true
          },
          "purpura": {
            "negative": true
          },
          "bonePain": {
            "negative": true
          }
        },
        "endocrine": {
          "polyuriaEndo": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "起身时头晕、站立不稳"
          },
          "visualBlur": {
            "checked": true,
            "detail": "头晕时眼前发黑，数秒后缓解"
          },
          "syncopeNerve": {
            "checked": true,
            "detail": "与体位改变相关的短暂意识丧失1次"
          },
          "headache": {
            "negative": true
          },
          "seizure": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "因腹痛及恐惧夜间难以入睡"
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "腰骶部酸胀，与下腹痛同时出现"
          },
          "jointPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史；否认盆腔炎性疾病史",
        "surgery": "3年前因早孕行人工流产术1次，否认其他手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射线接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认不洁性接触史，配偶固定，否认多个性伴侣",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州",
        "travel": "否认疫区及传染病接触史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物滥用史",
        "environment": "",
        "habits": "工作久坐，作息欠规律，近半年有搬抬重物等体力劳动",
        "sexualHistory": "已婚，配偶固定，婚后性生活正常，否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘、毒物及放射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "有",
        "age": "13",
        "cycle": "28",
        "duration": "5",
        "quantity": "中等",
        "color": "暗红",
        "clot": "无",
        "leukorrhea": "平素量少，色白，无异味；近1天为少量暗红色血性分泌物",
        "lmp": "2025年9月10日，停经至今45天未行经",
        "menopauseAge": "",
        "dysmenorrhea": "无"
      },
      "childbirth": {
        "applicable": "有",
        "fullTerm": "0",
        "premature": "0",
        "abortion": "1",
        "alive": "0",
        "gravida": "2",
        "para": "0",
        "details": "3年前人工流产1次，本次为第2次妊娠，孕早期即出现腹痛及阴道流血",
        "lastBirth": "",
        "contraception": "未避孕"
      },
      "family": {
        "diseaseChecks": {},
        "other": "父母体健",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有异位妊娠及不孕症患者",
        "infectionHistory": "否认结核、肝炎等传染病接触史"
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
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "移动性浊音阳性",
          "abdPalpation": "右下腹压痛、反跳痛"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_gynecology": {
          "gynCervix": "宫颈举痛",
          "gynExtra2": "附件区压痛",
          "gynAdnexa": "右附件区可触及包块",
          "gynAbdomen": "下腹部压痛",
          "gynBreast": "双侧乳房对称，未触及肿块，乳头无溢液"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血β-hCG",
            "result": "2860mIU/ml；48小时前为1980mIU/ml，上升幅度不足66%，倍增时间延长",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血清孕酮",
            "result": "8.6ng/ml，低于同孕周正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "经阴道超声",
            "result": "宫腔内未见孕囊，子宫内膜厚12mm；右附件区可见3.2cm×2.6cm混合回声包块，边界欠清，其内见无回声区；盆腔游离积液，深约3.5cm，透声差",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "Hb 92g/L，RBC 3.12×10¹²/L，WBC 9.8×10⁹/L，N 71.2%，PLT 236×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "后穹隆穿刺",
            "result": "抽出暗红色不凝血5ml，放置6分钟不凝固",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "异位妊娠（右侧输卵管妊娠）",
          "腹腔内出血",
          "失血性贫血（中度）"
        ]
      }
    }
  },
  {
    "key": "febrileSz",
    "dept": "pediatrics",
    "name": "热性惊厥（单纯型，2岁）",
    "alias": [
      "热性惊厥",
      "高热惊厥",
      "单纯型热性惊厥",
      "惊厥"
    ],
    "hint": "发热初期突发全身抽搐，双眼上翻、四肢强直抖动，数分钟内自行缓解",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "幼儿",
        "reliability": "可靠",
        "informant": "母亲",
        "chiefComplaint": "发热1天，抽搐1次",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "1天前受凉后出现发热，体温最高39.5℃，伴流涕，精神稍差；6小时前体温升至39.5℃时突发抽搐",
        "cause": "发病前有上呼吸道感染接触史，抽搐于体温快速上升期出现，无外伤及误服药物史",
        "symptoms": "抽搐表现为双眼向上凝视、呼之不应、四肢对称性强直抖动，口周发绀，牙关紧闭，无口吐白沫及大小便失禁",
        "relief": "予侧卧、松解衣领并温水擦浴后，抽搐持续约2分钟后自行缓解；退热后未再发作",
        "evolution": "抽搐缓解后入睡约20分钟，醒后神志清楚，能认人、能说简单词语，肢体活动对称，无残留无力",
        "accompanying": "伴流涕、轻咳，伴食欲下降，无呕吐及腹泻；抽搐后测体温39.5℃",
        "negativeDiscriminating": "无反复抽搐及抽搐持续状态，无喷射性呕吐，无颈项强直，无皮疹，无腹泻，无头部外伤史，既往无热性惊厥及癫痫病史",
        "treatment": "抽搐当时未予止惊药物，缓解后予对乙酰氨基酚混悬液1.5ml口服，约40分钟后体温降至38.2℃；起病以来口服小儿豉翘清热颗粒，疗效一般",
        "generalCondition": "发病以来精神稍差，食欲下降，睡眠可，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "nervous": {
          "seizure": {
            "checked": true,
            "detail": "发热39.5℃时突发全身抽搐1次，持续约2分钟，双眼上翻、四肢强直抖动、口周发绀"
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "抽搐后入睡约20分钟，夜间睡眠易惊醒"
          },
          "weakness": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "memoryLoss": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "发热1天，最高体温39.5℃"
          },
          "cough": {
            "checked": true,
            "detail": "轻咳，每日数次，无痰"
          },
          "nasalObstruction": {
            "checked": true,
            "detail": "鼻塞、流清涕"
          },
          "soreThroat": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "sputum": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "chills": {
            "checked": true,
            "detail": "体温上升时畏寒、寒战"
          }
        },
        "gi": {
          "vomiting": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近1天进食量减少约一半"
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "cyanosis": {
            "checked": true,
            "detail": "抽搐时口周发绀，缓解后消失"
          },
          "edemaCardio": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "negative": true
          },
          "rash": {
            "negative": true
          },
          "bleeding": {
            "negative": true
          },
          "lymphNode": {
            "negative": true
          }
        },
        "endocrine": {
          "polydipsia": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认癫痫、脑炎、脑膜炎及颅脑外伤史，否认既往热性惊厥发作史，否认智力及运动发育落后",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、水痘等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认头部外伤及坠落史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及药物误服史",
        "vaccine": "按国家免疫规划接种，卡介苗、乙肝疫苗、脊灰疫苗、百白破疫苗、麻腮风疫苗、乙脑疫苗均已按程序完成",
        "allergy": "无",
        "relatedHistory": "否认家族性癫痫及热性惊厥史，否认近期疫苗接种后发热",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "maternal": "母孕期体健，无妊娠期高血压及糖尿病，无宫内感染及产伤史，孕足月",
        "birth": "足月顺产，出生体重3.4kg，出生时无窒息、无产伤及抢救史，Apgar评分正常",
        "feeding": "生后母乳喂养至8月龄，6月龄起添加辅食，现与家人同餐，食欲一般",
        "growth": "3月龄会抬头，6月龄会独坐，12月龄会独走，18月龄会说单词，现能说短句、能独走稳，生长发育与同龄儿相仿",
        "residence": "浙江温州",
        "travel": "否认疫区及外地旅居史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物接触史",
        "environment": "家中无吸烟者，居室通风良好，无宠物接触史",
        "habits": "作息规律，每日户外活动约1.5小时，夜间睡眠10～11小时",
        "sexualHistory": "",
        "occupationEnv": "幼儿，未入托"
      },
      "marriage": {
        "status": "未婚"
      },
      "family": {
        "diseaseChecks": {},
        "other": "父母体健，否认近亲结婚，否认家族性癫痫及热性惊厥史",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病、癫痫及智力低下病史",
        "similarDisease": "否认家族中有热性惊厥及癫痫患者",
        "infectionHistory": "否认家庭内结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_pediatrics": {
          "pedExtra1": "生长发育与同龄儿相仿",
          "pedExtra2": "皮肤无黄染、花纹，毛细血管充盈良好",
          "pedExtra3": "咽无充血，扁桃体无肿大",
          "pedGrowth": "身高、体重、头围在同龄儿正常范围内",
          "pedFontanel": "前囟已闭",
          "pedResp": "呼吸平稳，无三凹征，无鼻翼扇动",
          "pedHeart": "心率在正常范围，心音有力，律齐，未闻及杂音",
          "pedAbdomen": "腹部平软，肝脾未超出同龄儿正常范围",
          "pedNeuro": "原始反射已消失，脑膜刺激征阴性",
          "pedRickets": "未见方颅、肋骨串珠、手镯及足镯征"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 12.6×10⁹/L，N 68.4%，L 26.2%，Hb 122g/L，PLT 268×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白",
            "result": "12mg/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血生化",
            "result": "血糖 5.2mmol/L，血钙 2.32mmol/L，血钠 136mmol/L，血钾 4.1mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅CT",
            "result": "脑实质未见异常密度影，脑室系统大小形态正常，中线结构居中",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "脑电图",
            "result": "背景活动正常，未见痫样放电",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "热性惊厥（单纯型）",
          "急性上呼吸道感染"
        ]
      }
    }
  },
  {
    "key": "fracture",
    "dept": "surgery",
    "name": "股骨颈骨折（左侧，Garden Ⅲ型）",
    "alias": [
      "股骨颈骨折",
      "髋部骨折",
      "股骨颈断裂",
      "Garden骨折"
    ],
    "hint": "跌倒后左髋部疼痛不能站立，患肢短缩并外旋，纵向叩击痛阳性",
    "record": {
      "basic": {
        "marital": "丧偶",
        "nationality": "汉族",
        "nativePlace": "江苏扬州",
        "birthPlace": "江苏扬州",
        "occupation": "退休教师",
        "reliability": "可靠",
        "chiefComplaint": "跌倒后左髋部疼痛、不能站立行走3小时"
      },
      "hpi": {
        "onset": "3小时前感左髋部剧烈疼痛，不能站立及行走",
        "cause": "于家中地面湿滑处跌倒、左髋部着地后",
        "symptoms": "疼痛位于左髋部及腹股沟区，呈持续性胀痛，活动患肢及翻身时明显加剧，患肢不能主动抬起",
        "relief": "平卧制动后疼痛稍减轻，口服布洛芬缓释胶囊0.3g后无明显缓解",
        "evolution": "疼痛持续不减，逐渐出现左下肢外旋畸形，家属观察较对侧短缩约2cm、外旋约45°",
        "accompanying": "伴左髋部活动受限及烦躁不安",
        "negativeDiscriminating": "无昏迷及逆行性遗忘，无头痛及喷射性呕吐，无胸痛及呼吸困难，无双下肢麻木及大小便失禁",
        "treatment": "2小时前由家属送至我院急诊，予下肢制动、布洛芬缓释胶囊0.3g口服1次，摄X线片示左股骨颈骨折，为进一步手术治疗收入院",
        "generalCondition": "发病以来精神欠佳，未进食，睡眠差，小便未解，大便未解，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "近2年腰部酸胀，劳累后加重，未系统诊治"
          },
          "jointPain": {
            "checked": true,
            "detail": "左髋部持续性胀痛，活动患肢时加剧"
          },
          "morningStiff": {
            "negative": true
          },
          "muscleWeak": {
            "checked": true,
            "detail": "左下肢不能主动抬起"
          }
        },
        "nervous": {
          "numbness": {
            "negative": true
          },
          "weakness": {
            "checked": true,
            "detail": "左下肢不能负重，余肢体肌力正常"
          },
          "headache": {
            "negative": true
          },
          "vertigo": {
            "negative": true
          }
        },
        "gi": {
          "abdominalPain": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "constipation": {
            "negative": true
          }
        },
        "resp": {
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "chestPainResp": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "高血压": true
        },
        "diseaseOther": "",
        "diseaseDetail": "高血压12年，口服氨氯地平5mg每日1次，血压控制在正常范围；近2年骨密度检查提示骨量减少，未规律补钙",
        "longTermMeds": "氨氯地平5mg每日1次口服，碳酸钙D3片每日1片",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "3小时前于家中平地滑倒致左髋部着地，既往无重大外伤及骨折史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期服用糖皮质激素史，否认反复跌倒史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏扬州，否认疫区及地方病流行区居住史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "habits": "饮食清淡，户外活动较少，日照不足",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "已退休，居家活动为主，室内地面偶有湿滑"
      },
      "marriage": {
        "status": "丧偶",
        "age": "23",
        "spouseHealth": "配偶已故，死因不详"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父亲因脑卒中去世，母亲因股骨颈骨折后卧床并发肺部感染去世",
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
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckResist": "颈软，无抵抗"
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
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常"
        },
        "special_surgery": {
          "surgTrauma": "肢体畸形",
          "surgJoint": "关节活动受限",
          "surgVessel": "患肢远端动脉搏动可及，毛细血管充盈良好，皮温正常"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "左髋关节X线正侧位片",
            "result": "左股骨颈可见骨折线，断端部分移位，股骨头与股骨颈仍有接触，符合 Garden Ⅲ型，髋关节间隙正常",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "髋关节CT三维重建",
            "result": "左股骨颈头下型骨折，骨折端嵌插并部分移位，股骨头未见塌陷，髋臼未见骨折",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "Hb 108g/L，WBC 8.6×10⁹/L，N 74%，PLT 196×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "PT 12.4s，APTT 31.8s，INR 1.05，纤维蛋白原 4.2g/L，D-二聚体 3.6mg/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，未见明显ST-T改变",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "左股骨颈骨折（Garden Ⅲ型）",
          "骨质疏松症"
        ]
      }
    }
  },
  {
    "key": "gb",
    "dept": "neurology",
    "name": "吉兰-巴雷综合征",
    "alias": [
      "吉兰-巴雷综合征",
      "格林巴利综合征",
      "GBS",
      "急性炎性脱髓鞘性多发性神经病",
      "AIDP"
    ],
    "hint": "前驱感染后对称性弛缓性肢体无力，腱反射消失，脑脊液蛋白-细胞分离",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "安徽合肥",
        "birthPlace": "安徽合肥",
        "occupation": "建筑工人",
        "reliability": "可靠",
        "chiefComplaint": "双下肢无力进行性加重5天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "5天前晨起觉双足发麻、走路发飘，当日仍能坚持上班；次日出现双下肢无力，上楼需扶栏杆",
        "cause": "发病前2周有腹泻3天，每日排稀水样便4～5次，未服药自愈；未查大便常规",
        "symptoms": "无力自双足开始，对称性向上发展，现双下肢仅能在床面平移、不能抬离床面；持物时双手亦觉乏力，梳头、拧毛巾费力；四肢发麻呈手套袜套样分布，远端明显",
        "relief": "卧床休息无缓解",
        "evolution": "症状逐日加重，5天内由能独立行走发展至需人搀扶，近1天出现起床费力、抬头稍感吃力",
        "accompanying": "伴双小腿肌肉酸痛",
        "negativeDiscriminating": "无肢体抽搐，无视力下降及视物成双，无吞咽困难及饮水呛咳，无言语不清，无大小便失禁，无发热及头痛，无皮疹",
        "treatment": "当地医院予维生素B1、甲钴胺口服3天，症状仍进行性加重，遂转我院",
        "generalCondition": "发病以来神志清楚，食欲尚可，睡眠一般，小便正常，大便3日未解，体重无明显变化",
        "extra": "入院后监测肺活量，完善肌电图与腰椎穿刺"
      },
      "ros": {
        "nervous": {
          "weakness": {
            "checked": true,
            "detail": "双下肢无力进行性加重，双上肢亦觉乏力"
          },
          "numbness": {
            "checked": true,
            "detail": "四肢末端手套袜套样麻木"
          },
          "speech": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "seizure": {
            "negative": true
          },
          "tremor": {
            "negative": true
          },
          "incontinence": {
            "negative": true
          },
          "vertigo": {
            "negative": true
          },
          "hearingLoss": {
            "negative": true
          }
        },
        "gi": {
          "diarrhea": {
            "checked": true,
            "detail": "发病前2周腹泻3天，每日4～5次稀水样便"
          },
          "constipation": {
            "checked": true,
            "detail": "近3日未解大便"
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "偶觉心慌，未测心率"
          }
        },
        "joint": {
          "muscleWeak": {
            "checked": true,
            "detail": "双小腿肌肉酸痛"
          }
        }
      },
      "pmh": {
        "health": "平素体健，可从事重体力劳动",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、甲状腺疾病病史；否认反复手足麻木病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史；发病前2周有腹泻史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认有机磷农药、重金属及一氧化碳接触史；近期未食用来源不明食物",
        "vaccine": "按计划预防接种；近3个月未接种疫苗",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认长期饮酒史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于安徽合肥，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟15年，每日约15支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮白酒每周2次，每次约150ml",
        "drugs": "否认有毒有害物质接触史",
        "environment": "工作场所通风一般",
        "habits": "在外就餐较多，饮水以瓶装水及自来水为主",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "建筑工地作业，粉尘接触较多，无放射性物质接触"
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
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "被动体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "limbMuscle": "双上肢肌力正常、双下肢肌力减退"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "tendonReflex": "腱反射普遍减弱",
          "babinski": "巴氏征阴性",
          "kernig": "克氏征阴性"
        },
        "special_neurology": {
          "neuroExtra1": "言语流利，定向力、记忆力、计算力正常",
          "neuroExtra2": "十二对颅神经检查未见异常",
          "neuroExtra3": "肌张力减低",
          "neuroExtra4": "手套袜套样感觉减退",
          "neuroExtra5": "指鼻试验、跟膝胫试验稳准，Romberg征阴性",
          "neuroSuperficialReflex": "腹壁反射、提睾反射存在且对称",
          "neuroDeepReflex": "深反射消失",
          "neuroPathologic": "Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性",
          "neuroMeningeal": "颈项强直阴性，Kernig征阴性，Brudzinski征阴性",
          "neuroGait": "步态正常，行走平稳"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "腰椎穿刺（脑脊液）",
            "result": "初压140mmH₂O，外观清亮，白细胞5×10⁶/L，蛋白1.2g/L，葡萄糖3.6mmol/L，氯化物123mmol/L，蛋白-细胞分离",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肌电图及神经传导速度",
            "result": "双侧腓总神经、胫神经运动传导速度减慢至32～36m/s，远端潜伏期延长，F波潜伏期延长；感觉神经动作电位波幅下降",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及电解质",
            "result": "WBC 7.2×10⁹/L，N 62%，Hb 138g/L，K⁺ 3.8mmol/L，Na⁺ 138mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "粪便常规及培养",
            "result": "白细胞0～2/HP，培养未见沙门菌及志贺菌生长",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "吉兰-巴雷综合征（急性炎性脱髓鞘性多发性神经病）"
        ]
      }
    }
  },
  {
    "key": "hernia",
    "dept": "surgery",
    "name": "腹股沟斜疝（右侧，可复性）",
    "alias": [
      "腹股沟斜疝",
      "腹股沟疝",
      "斜疝",
      "小肠疝气"
    ],
    "hint": "腹股沟区可复性肿块，站立咳嗽时出现，平卧回纳后咳嗽冲击感阳性",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南通",
        "birthPlace": "江苏南通",
        "occupation": "建筑工人",
        "reliability": "可靠",
        "chiefComplaint": "右侧腹股沟区可复性肿块2年"
      },
      "hpi": {
        "onset": "2年前发现右侧腹股沟区肿块，初起约核桃大小，无疼痛",
        "cause": "长时间站立、行走及负重劳动后",
        "symptoms": "肿块于腹压增大时出现，呈梨形，质软，站立时可降至右侧阴囊，平卧或用手推送后可回纳消失",
        "relief": "平卧休息后肿块自行回纳，回纳后坠胀感随之消失",
        "evolution": "2年来肿块逐渐增大至拳头大小，坠胀感较前加重，从未发生回纳困难",
        "accompanying": "伴腹股沟区坠胀不适，长时间站立及行走后明显",
        "negativeDiscriminating": "无发热，无腹痛及腹胀，无恶心呕吐及停止排气排便，无肿块红肿及触痛",
        "treatment": "未曾服药及手术治疗，肿块从未发生不能回纳的情况，为进一步诊治来院",
        "generalCondition": "发病以来精神、食欲、睡眠可，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "bloating": {
            "negative": true
          }
        },
        "resp": {
          "cough": {
            "negative": true
          },
          "sputum": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "checked": true,
            "detail": "排尿等待、尿线变细，夜尿增多"
          },
          "hematuria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "前列腺增生": true
        },
        "diseaseOther": "",
        "diseaseDetail": "前列腺增生6年，间断排尿不畅，未规律服药",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期慢性咳嗽、长期便秘等使腹内压增高的病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏南通，否认疫区及地方病流行区居住史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "habits": "饮食规律，长期从事重体力劳动",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "建筑工地作业，需反复弯腰负重"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健"
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
          "rash": "未见皮疹及出血点"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckResist": "颈软，无抵抗"
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
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "special_surgery": {
          "surgExtra2": "腹股沟区可触及肿块",
          "surgPeritoneum": "全腹无压痛、反跳痛及腹肌紧张",
          "surgLymph": "引流区域淋巴结未触及肿大"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 142g/L，WBC 6.8×10⁹/L，N 62%，PLT 198×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹股沟区超声",
            "result": "右侧腹股沟区可见疝囊回声，内为肠管及网膜组织，平卧推送后可回纳，疝环内径约2.4cm，未见嵌顿",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，未见ST-T改变",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "PT 11.6s，APTT 30.2s，INR 1.02，纤维蛋白原 3.1g/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "右侧腹股沟斜疝（可复性）",
          "腹股沟管后壁缺损"
        ]
      }
    }
  },
  {
    "key": "hf",
    "dept": "cardiology",
    "name": "慢性心力衰竭急性加重（NYHA Ⅲ级）",
    "alias": [
      "心力衰竭",
      "心衰",
      "慢性心功能不全",
      "充血性心力衰竭",
      "CHF"
    ],
    "hint": "活动后气促伴双下肢水肿，夜间不能平卧、需垫高枕，颈静脉怒张、心界向左下扩大、双肺底湿啰音",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南通",
        "birthPlace": "江苏南通",
        "occupation": "退休工人",
        "reliability": "可靠",
        "chiefComplaint": "活动后气短伴双下肢水肿2年"
      },
      "hpi": {
        "onset": "2年前开始出现快步走或上三楼时气短，休息数分钟可缓解，未系统诊治",
        "cause": "无诱因，逐渐出现",
        "symptoms": "气短呈劳力性，活动耐量逐年下降；1年前起出现双下肢对称性凹陷性水肿，午后加重、晨起减轻；夜间需垫高枕入睡，近1周出现夜间憋醒，需坐起约半小时方能缓解",
        "relief": "曾于外院口服呋塞米片 20mg 每日1次、螺内酯片 20mg 每日1次，尿量增多后水肿可减轻，但停药即复发",
        "evolution": "近1周受凉后气短加重，平地慢走百余米即需停下休息，夜间不能平卧，需半卧位入睡",
        "accompanying": "伴夜间阵发性干咳、乏力、食欲减退、夜尿增多",
        "negativeDiscriminating": "无咯血及粉红色泡沫痰，无胸痛及压榨样不适，无发热，无午后低热及盗汗，无尿频尿急尿痛，无颜面部水肿，无皮肤黄染，无呕血黑便",
        "treatment": "入院前已口服呋塞米片 20mg 每日1次共7天、螺内酯片 20mg 每日1次共7天、单硝酸异山梨酯缓释片 40mg 每日1次共3个月，气短可部分缓解；未规律服用β受体阻滞剂及血管紧张素转换酶抑制剂",
        "generalCondition": "发病以来精神一般，食欲较前减少，睡眠差（夜间憋醒），大便正常，夜尿2～3次，体重近1个月增加约3kg",
        "extra": ""
      },
      "ros": {
        "cardio": {
          "orthopnea": {
            "checked": true,
            "detail": "夜间不能平卧，需垫高枕，近1周需半卧位入睡，夜间憋醒后坐起约半小时缓解"
          },
          "edemaCardio": {
            "checked": true,
            "detail": "双下肢对称性凹陷性水肿，午后加重、晨起减轻"
          },
          "palpitation": {
            "checked": true,
            "detail": "活动后感心悸，休息后可缓解"
          },
          "chestPainCardio": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          },
          "edemaSys": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "劳力性气短，平地慢走百余米即需休息"
          },
          "cough": {
            "checked": true,
            "detail": "夜间阵发性干咳，坐起后减轻"
          },
          "sputum": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "gi": {
          "appetiteLoss": {
            "checked": true,
            "detail": "近1个月食欲明显减退，进食量约为平日一半"
          },
          "bloating": {
            "checked": true,
            "detail": "饭后上腹胀满"
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          }
        },
        "gu": {
          "nocturia": {
            "checked": true,
            "detail": "夜尿2～3次，量中等"
          },
          "oliguria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "活动后乏力明显，日常家务受限"
          }
        },
        "nervous": {
          "insomnia": {
            "checked": true,
            "detail": "夜间憋醒后难以再次入睡"
          },
          "dizziness": {
            "negative": true
          },
          "syncopeNerve": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，可从事日常家务",
        "diseaseChecks": {
          "高血压": true,
          "冠心病": true,
          "高脂血症": true
        },
        "diseaseOther": "",
        "diseaseDetail": "高血压病史12年，最高血压 170/100mmHg，长期口服苯磺酸氨氯地平片 5mg 每日1次，血压控制在 140/85mmHg 左右；冠心病史6年，间断服用阿司匹林肠溶片 100mg 每日1次；高脂血症4年，未规律降脂治疗",
        "longTermMeds": "苯磺酸氨氯地平片 5mg 每日1次（12年）；阿司匹林肠溶片 100mg 每日1次（6年，间断）；呋塞米片 20mg 每日1次（近7天）",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认风湿热及心肌炎病史，否认长期饮酒史，否认甲状腺疾病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏南通，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "有",
        "smokingAmount": "吸烟40年，每日约20支，未戒烟",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "饮食偏咸，喜食腌制食品，平素活动量少",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "长期从事机械加工工作，已退休8年，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "近1年因气短较少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true,
          "冠心病": true
        },
        "other": "",
        "deceased": "父亲因急性心肌梗死去世，享年68岁；母亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "父亲生前有高血压及冠心病史",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
          "posture": "强迫体位",
          "face": "慢性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉怒张",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺可闻及湿性啰音",
          "heartInspect": "心尖搏动向左下移位",
          "heartPalpation": "可触及抬举性心尖搏动",
          "heartPercussion": "心界向左下扩大",
          "heartAuscultation": "心音低钝"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "双下肢凹陷性水肿",
          "dorsalisPedis": "双侧足背动脉搏动对称有力"
        },
        "special_cardiology": {
          "cardioApex": "心尖搏动向左下移位",
          "cardioThrill": "心尖搏动呈抬举样",
          "cardioBorder": "心界向左下扩大",
          "cardioRate": "心率正常，心律齐",
          "cardioHeartSound": "可闻及奔马律",
          "cardioMurmur": "各瓣膜听诊区未闻及病理性杂音",
          "cardioPericardium": "未闻及心包摩擦音",
          "cardioJVP": "肝颈静脉回流征阳性",
          "cardioEdema": "双下肢凹陷性水肿"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "B型利钠肽（BNP）",
            "result": "B型利钠肽 1280pg/mL，显著升高",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心脏超声",
            "result": "左心房前后径 46mm，左心室舒张末期内径 62mm，左心室射血分数 36%；室壁运动弥漫性减弱；二尖瓣轻度反流；下腔静脉增宽，呼吸变化率减低",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，心率 92次/分，Ⅱ、Ⅲ、aVF 导联呈 QS 型，ST-T 改变，左心室高电压",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部正位片",
            "result": "两肺纹理增多增粗，肺门影增大模糊，双侧肋膈角变钝，心影增大，心胸比 0.62",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "血红蛋白 128g/L，白细胞 6.8×10⁹/L，中性粒细胞 68%，血小板 216×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "慢性心力衰竭急性加重（NYHA Ⅲ级，射血分数降低）",
          "冠状动脉粥样硬化性心脏病",
          "高血压病2级（很高危）",
          "高脂血症"
        ]
      }
    }
  },
  {
    "key": "htn",
    "dept": "cardiology",
    "name": "高血压病3级（很高危）伴左心室肥厚",
    "alias": [
      "高血压",
      "原发性高血压",
      "高血压病",
      "高血压性心脏病"
    ],
    "hint": "头晕头痛、颈项板紧多年，血压长期 180/110mmHg 左右，心界向左下扩大、主动脉瓣区第二心音亢进",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河南郑州",
        "birthPlace": "河南郑州",
        "occupation": "机关干部",
        "reliability": "可靠",
        "chiefComplaint": "间断头晕、头痛8年，加重1周"
      },
      "hpi": {
        "onset": "8年前单位体检时发现血压升高，最高 180/110mmHg，当时无明显不适，未规律服药",
        "cause": "无明显诱因，多于劳累、熬夜及情绪激动后加重",
        "symptoms": "头晕呈头部昏沉感，多于晨起及午后出现，伴枕部胀痛、颈项板紧，每次持续约半小时至数小时，休息后可缓解",
        "relief": "曾口服硝苯地平控释片 30mg 每日1次，服药后头晕可缓解，因无明显不适自行停药多次",
        "evolution": "近1周工作紧张后头晕加重，每日发作2～3次，伴视物模糊一次，持续约1分钟后自行恢复",
        "accompanying": "伴心悸、乏力、睡眠欠佳，无恶心呕吐，无肢体活动障碍",
        "negativeDiscriminating": "无阵发性头痛伴心悸大汗，无发作性乏力及周期性麻痹，无向心性肥胖及满月脸，无颜面及双下肢水肿，无肉眼血尿及尿量减少，无胸痛及压榨样不适，无夜间不能平卧，无言语不清及肢体无力，无发热",
        "treatment": "8年来间断口服硝苯地平控释片 30mg 每日1次、缬沙坦胶囊 80mg 每日1次，服药不规律，血压波动在 150～180/90～110mmHg；1周前门诊测血压 178/108mmHg，为进一步诊治收入院",
        "generalCondition": "发病以来精神可，食欲正常，入睡困难且易醒，大小便正常，夜尿1～2次，体重近1年增加约4kg",
        "extra": ""
      },
      "ros": {
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动及情绪激动时心悸，休息后可缓解"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          },
          "edemaSys": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          }
        },
        "gu": {
          "nocturia": {
            "checked": true,
            "detail": "夜尿1～2次，量中等"
          },
          "oliguria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          },
          "polyuria": {
            "negative": true
          }
        },
        "hemat": {
          "epistaxis": {
            "negative": true
          },
          "fatigue": {
            "checked": true,
            "detail": "近1年易疲劳，工作耐力下降"
          }
        },
        "endocrine": {
          "hairChange": {
            "negative": true
          },
          "weightGain": {
            "checked": true,
            "detail": "近1年体重增加约4kg，腹型肥胖明显"
          },
          "weightLoss": {
            "negative": true
          },
          "neckMass": {
            "negative": true
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          }
        },
        "nervous": {
          "headache": {
            "checked": true,
            "detail": "枕部胀痛，多于晨起及午后出现，持续半小时至数小时"
          },
          "dizziness": {
            "checked": true,
            "detail": "头部昏沉感，休息后可缓解"
          },
          "visualBlur": {
            "checked": true,
            "detail": "1周前出现视物模糊1次，持续约1分钟后自行恢复"
          },
          "numbness": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "syncopeNerve": {
            "negative": true
          },
          "insomnia": {
            "checked": true,
            "detail": "入睡困难，夜间易醒"
          }
        }
      },
      "pmh": {
        "health": "既往体健，可胜任日常工作",
        "diseaseChecks": {
          "高血压": true,
          "高脂血症": true
        },
        "diseaseOther": "",
        "diseaseDetail": "高血压病史8年，最高血压 180/110mmHg，服药不规律，血压控制不佳；高脂血症3年，未规律治疗",
        "longTermMeds": "硝苯地平控释片 30mg 每日1次（间断）；缬沙坦胶囊 80mg 每日1次（间断）",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认肾炎及泌尿系统疾病史，否认阵发性头痛心悸大汗发作史，否认长期服用糖皮质激素及甘草制剂史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "河南郑州，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "有",
        "smokingAmount": "吸烟25年，每日约15支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮白酒每周2～3次，每次约150mL，共20年",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "口味偏咸，每日食盐摄入量估计超过10g，应酬较多，运动少，睡眠不足",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事行政管理工作30年，长期伏案、精神紧张，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "27",
        "spouseHealth": "配偶体健",
        "sexLife": "近1年较少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true,
          "脑卒中": true,
          "糖尿病": true
        },
        "other": "",
        "deceased": "父亲因脑出血去世，享年70岁；母亲患高血压，健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "父母均有高血压病史，父亲生前因脑出血去世",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "肥胖",
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
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心尖搏动向左下移位",
          "heartPalpation": "可触及抬举性心尖搏动",
          "heartPercussion": "心界向左下扩大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "dorsalisPedis": "双侧足背动脉搏动对称有力"
        },
        "special_cardiology": {
          "cardioApex": "心尖搏动向左下移位",
          "cardioThrill": "心尖搏动呈抬举样",
          "cardioBorder": "心界向左下扩大",
          "cardioRate": "心率正常，心律齐",
          "cardioHeartSound": "P2亢进",
          "cardioMurmur": "各瓣膜听诊区未闻及病理性杂音",
          "cardioPericardium": "未闻及心包摩擦音",
          "cardioJVP": "肝颈静脉回流征阴性",
          "cardioEdema": "双下肢无水肿"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "尿常规",
            "result": "尿蛋白阴性，尿糖阴性，尿潜血阴性，镜检未见红细胞及白细胞",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肾功能",
            "result": "血肌酐 88μmol/L，尿素氮 5.6mmol/L，估算肾小球滤过率 92mL/(min·1.73m²)",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心脏超声",
            "result": "室间隔厚度 13mm，左心室后壁厚度 12mm，左心室舒张末期内径 52mm，左心室射血分数 62%；主动脉瓣轻度反流；提示左心室肥厚",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，心率 76次/分，左心室高电压（Rv5 2.8mV），ST-T 改变",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血脂",
            "result": "总胆固醇 6.2mmol/L，甘油三酯 2.6mmol/L，低密度脂蛋白胆固醇 4.1mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "高血压病3级（很高危）",
          "高血压性心脏病（左心室肥厚）",
          "高脂血症"
        ]
      }
    }
  },
  {
    "key": "hyperthyroid",
    "dept": "endocrinology",
    "name": "甲状腺功能亢进症（Graves 病）",
    "alias": [
      "甲亢",
      "甲状腺功能亢进",
      "Graves病",
      "毒性弥漫性甲状腺肿",
      "甲状腺机能亢进"
    ],
    "hint": "怕热多汗、多食易饥伴体重下降、心悸手抖，甲状腺弥漫性肿大伴血管杂音，双眼球突出",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "浙江杭州",
        "birthPlace": "浙江杭州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "怕热、多汗伴心悸、消瘦4个月"
      },
      "hpi": {
        "onset": "4个月前无明显诱因出现怕热多汗，同室温下较他人穿衣更少，稍活动即大汗",
        "cause": "无明显诱因，工作压力大及睡眠不足时症状加重",
        "symptoms": "怕热多汗，喜冷饮，每日饮水约2500mL；食欲亢进，每日进食5～6餐仍感饥饿；心悸，静息心率自测约100次/分；双手持筷时抖动",
        "relief": "未服药，未就诊，症状逐渐加重",
        "evolution": "4个月内体重由58kg下降至49kg，伴易激动、失眠、大便次数增多至每日3～4次，成形；近1个月自觉双眼较前突出、畏光流泪",
        "accompanying": "伴乏力、颈部增粗、月经量减少，无颈前疼痛，无吞咽困难及声音嘶哑",
        "negativeDiscriminating": "无明显多饮多尿，无颈前疼痛及触痛，无发热，无吞咽困难及声音嘶哑，无胸痛及夜间不能平卧，无双下肢水肿，无发作性肢体无力，无长期服用含碘药物及甲状腺激素史",
        "treatment": "1周前门诊查甲状腺功能提示促甲状腺激素降低、游离甲状腺素升高，甲状腺超声提示弥漫性病变，为进一步诊治收入院；未用过抗甲状腺药物",
        "generalCondition": "发病以来精神易激动，进食量较前明显增加，睡眠差，大便每日3～4次，小便正常，体重下降约9kg",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "heatIntolerance": {
            "checked": true,
            "detail": "怕热多汗，同室温下较他人穿衣少，稍活动即大汗"
          },
          "weightLoss": {
            "checked": true,
            "detail": "4个月内体重由58kg下降至49kg"
          },
          "weightGain": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          },
          "neckMass": {
            "checked": true,
            "detail": "1个月前发现颈部较前增粗，无疼痛"
          },
          "hairChange": {
            "checked": true,
            "detail": "近2个月脱发较前增多"
          },
          "polydipsia": {
            "negative": true
          },
          "polyuriaEndo": {
            "negative": true
          },
          "growthChange": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "静息时心率自测约100次/分，活动后心悸明显"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "易疲劳，上三楼即需休息"
          },
          "anemia": {
            "negative": true
          },
          "lymphNode": {
            "negative": true
          }
        },
        "nervous": {
          "tremor": {
            "checked": true,
            "detail": "双手平伸时细颤，持筷及写字时明显"
          },
          "insomnia": {
            "checked": true,
            "detail": "入睡困难，夜间易醒，每日睡眠约4小时"
          },
          "anxiety": {
            "checked": true,
            "detail": "易激动、急躁，因小事与同事争执"
          },
          "weakness": {
            "checked": true,
            "detail": "四肢近端乏力，上楼及下蹲后起身费力"
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "eyePain": {
            "checked": true,
            "detail": "双眼畏光、流泪，视物时有异物感"
          },
          "speech": {
            "negative": true
          },
          "seizure": {
            "negative": true
          }
        },
        "gi": {
          "diarrhea": {
            "checked": true,
            "detail": "大便每日3～4次，成形，无黏液脓血"
          },
          "appetiteLoss": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "melena": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          }
        },
        "gu": {
          "polyuria": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          }
        },
        "joint": {
          "muscleWeak": {
            "checked": true,
            "detail": "双下肢近端无力，无发作性软瘫"
          },
          "jointPain": {
            "negative": true
          },
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，可胜任日常工作",
        "diseaseChecks": {},
        "diseaseOther": "",
        "diseaseDetail": "否认高血压、糖尿病、冠心病史；否认颈前疼痛及发热史",
        "longTermMeds": "近半年未服用任何药物；否认服用含碘制剂、胺碘酮及甲状腺激素史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史；否认颈部手术及放射治疗史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认糖尿病史及明显多饮多尿，否认心悸伴胸痛史，否认家族性甲状腺疾病以外的自身免疫病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江杭州，否认疫区及地方病流行区长期居住史；本地非碘缺乏地区",
        "travel": "",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认毒物、粉尘及放射性物质接触史",
        "environment": "",
        "habits": "工作节奏快、精神压力大，近半年经常熬夜加班，饮食不规律，喜食海带紫菜等含碘食物",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事财务工作6年，长期伏案、精神紧张，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "未婚",
        "sexLife": "无性生活史",
        "relation": "与父母同住，关系融洽"
      },
      "family": {
        "diseaseChecks": {
          "甲状腺疾病": true
        },
        "other": "",
        "deceased": "父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "母亲患甲状腺功能亢进，已治愈",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "甲亢面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑水肿",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺Ⅱ度肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "可触及抬举性心尖搏动",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音活跃",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "limbMuscle": "四肢肌力4级"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "tendonReflex": "腱反射普遍亢进",
          "babinski": "巴氏征阴性"
        },
        "special_endocrinology": {
          "endoBody": "消瘦",
          "endoSkin": "皮肤无紫纹、痤疮及色素沉着，毛发分布正常",
          "endoThyroid": "甲状腺Ⅱ度肿大",
          "endoEye": "双眼球突出",
          "endoHandFoot": "手足无畸形，指端无增粗",
          "endoWound": "全身皮肤完整，未见溃疡及伤口愈合不良"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "甲状腺功能",
            "result": "促甲状腺激素 ＜0.005mIU/L（降低），游离甲状腺素 38.6pmol/L（升高），游离三碘甲状腺原氨酸 12.4pmol/L（升高）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺自身抗体",
            "result": "促甲状腺激素受体抗体 8.6IU/L（阳性，升高），甲状腺过氧化物酶抗体 126IU/mL（轻度升高），甲状腺球蛋白抗体 98IU/mL",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺超声",
            "result": "甲状腺弥漫性肿大，实质回声减低、分布不均，血流信号丰富呈「火海征」；未见明确结节",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及肝功能",
            "result": "白细胞 5.2×10^9/L，中性粒细胞绝对值 2.9×10^9/L，血红蛋白 128g/L；丙氨酸氨基转移酶 42U/L，总胆红素 14μmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心动过速，心率 108次/分，各导联 ST 段未见明显异常",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "甲状腺功能亢进症（Graves 病）",
          "甲状腺Ⅱ度肿大",
          "甲亢性肌病"
        ]
      }
    }
  },
  {
    "key": "hypothyroid",
    "dept": "endocrinology",
    "name": "甲状腺功能减退症（原发性，桥本甲状腺炎）",
    "alias": [
      "甲减",
      "甲状腺功能减退",
      "桥本甲状腺炎",
      "黏液性水肿",
      "甲状腺机能减退"
    ],
    "hint": "畏寒乏力、嗜睡、体重增加伴便秘，颜面眼睑水肿、皮肤干燥、毛发稀疏，甲状腺Ⅰ度肿大质韧",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河北石家庄",
        "birthPlace": "河北石家庄",
        "occupation": "中学后勤职员",
        "reliability": "可靠",
        "chiefComplaint": "畏寒、乏力伴嗜睡、体重增加1年"
      },
      "hpi": {
        "onset": "1年前无明显诱因出现畏寒、乏力，同室温下较他人穿衣更厚，冬季尤甚",
        "cause": "无明显诱因，劳累及受凉后症状加重",
        "symptoms": "畏寒怕冷，手足发凉；乏力，做家务即感疲倦；白天嗜睡，每日午后需卧床1～2小时；记忆力明显下降，常忘记刚交代的事情",
        "relief": "未服药，仅自行增加衣物，症状无缓解",
        "evolution": "1年内体重由60kg增加至68kg，便秘2～3天一次，大便干结；皮肤干燥脱屑，脱发增多；近2个月家属发现其反应迟缓、言语变慢",
        "accompanying": "伴颜面及眼睑水肿、声音低哑、月经量增多，无颈前疼痛，无心悸，无怕热多汗",
        "negativeDiscriminating": "无怕热多汗及多食易饥，无心悸及手抖，无胸痛及夜间不能平卧，无尿量减少及泡沫尿，无肉眼血尿，无皮肤黄染，无颈前疼痛及发热，无服用抗甲状腺药物及颈部放射治疗史，无情绪高涨与抑郁交替发作",
        "treatment": "1周前单位体检发现促甲状腺激素升高，为进一步诊治收入院；既往未用过甲状腺激素替代治疗",
        "generalCondition": "发病以来精神差、反应迟缓，食欲减退，睡眠增多，排便费力且次数减少，体重增加约8kg",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "coldIntolerance": {
            "checked": true,
            "detail": "畏寒怕冷，同室温下较他人穿衣更厚，手足常年发凉"
          },
          "weightGain": {
            "checked": true,
            "detail": "1年内体重由60kg增加至68kg，食欲减退但体重仍增"
          },
          "heatIntolerance": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          },
          "neckMass": {
            "checked": true,
            "detail": "近1年颈部稍增粗，无疼痛及压迫感"
          },
          "hairChange": {
            "checked": true,
            "detail": "头发干燥、脱发明显，眉毛外侧变稀疏"
          },
          "polydipsia": {
            "negative": true
          },
          "polyuriaEndo": {
            "negative": true
          },
          "polyphagia": {
            "negative": true
          },
          "growthChange": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "全身乏力，做家务即感疲倦，需频繁休息"
          },
          "anemia": {
            "checked": true,
            "detail": "面色苍白、头晕，血常规提示轻度贫血"
          },
          "pruritus": {
            "checked": true,
            "detail": "皮肤干燥瘙痒，冬季加重，无皮疹"
          },
          "pallorSkin": {
            "checked": true,
            "detail": "面色及手掌苍白"
          }
        },
        "nervous": {
          "memoryLoss": {
            "checked": true,
            "detail": "记忆力明显减退，常忘记刚交代的事情"
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "白天嗜睡，每日午后需卧床1～2小时"
          },
          "dizziness": {
            "checked": true,
            "detail": "起身时头晕，无黑矇"
          },
          "headache": {
            "negative": true
          },
          "numbness": {
            "checked": true,
            "detail": "双手腕部麻木，夜间为著"
          },
          "weakness": {
            "checked": true,
            "detail": "四肢乏力，提重物费力"
          },
          "speech": {
            "checked": true,
            "detail": "言语变慢、吐字不清，家属诉声音低哑"
          },
          "moodLow": {
            "checked": true,
            "detail": "情绪低落、兴趣减退，但与情绪高涨交替发作无关"
          },
          "visualBlur": {
            "negative": true
          },
          "seizure": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          }
        },
        "gi": {
          "constipation": {
            "checked": true,
            "detail": "便秘2～3天一次，大便干结，需用开塞露"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲减退，进食量较前减少约三分之一"
          },
          "bloating": {
            "checked": true,
            "detail": "餐后腹胀，无腹痛"
          },
          "abdominalPain": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "gu": {
          "edemaGu": {
            "checked": true,
            "detail": "晨起眼睑水肿，傍晚减轻"
          },
          "oliguria": {
            "negative": true
          },
          "polyuria": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          }
        },
        "resp": {
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "checked": true,
            "detail": "双膝关节酸痛，活动后加重，无红肿"
          },
          "muscleWeak": {
            "checked": true,
            "detail": "四肢近端肌力下降，下蹲后起身困难"
          },
          "morningStiff": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，可胜任后勤工作",
        "diseaseChecks": {
          "贫血": true
        },
        "diseaseOther": "",
        "diseaseDetail": "轻度贫血2年，未查明原因，间断口服铁剂效果不佳；否认甲状腺疾病诊治史",
        "longTermMeds": "琥珀酸亚铁片 0.1g 每日2次（间断）；未用过甲状腺激素及抗甲状腺药物",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史；否认颈部手术及放射治疗史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认冠心病、肾病综合征及慢性肾脏病史；否认垂体瘤及头颅放射治疗史；否认产后大出血史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "河北石家庄，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认毒物、粉尘及放射性物质接触史",
        "environment": "",
        "habits": "生活规律，饮食偏清淡，活动量少，近1年怕冷不愿外出",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事学校后勤工作22年，以室内保洁及库房管理为主，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "23",
        "spouseHealth": "配偶体健",
        "sexLife": "近半年性欲减退，同房次数减少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "甲状腺疾病": true
        },
        "other": "",
        "deceased": "父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "姐姐患桥本甲状腺炎",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "肥胖",
          "conscious": "神志清楚，精神差",
          "posture": "自主体位",
          "face": "慢性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑水肿",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺Ⅰ度肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心音低钝"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如",
          "limbMuscle": "四肢肌力4级",
          "edemaPretibial": "双侧胫前凹陷性水肿"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "tendonReflex": "腱反射普遍减弱",
          "babinski": "巴氏征阴性"
        },
        "special_endocrinology": {
          "endoBody": "体型匀称，脂肪分布正常，无向心性肥胖",
          "endoSkin": "皮肤无紫纹、痤疮及色素沉着，毛发分布正常",
          "endoThyroid": "甲状腺Ⅰ度肿大",
          "endoEye": "双眼球无突出，眼征阴性",
          "endoHandFoot": "手足无畸形，指端无增粗",
          "endoWound": "全身皮肤完整，未见溃疡及伤口愈合不良"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "甲状腺功能",
            "result": "促甲状腺激素 24.8mIU/L（升高），游离甲状腺素 6.2pmol/L（降低），游离三碘甲状腺原氨酸 2.8pmol/L（降低）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺自身抗体",
            "result": "甲状腺过氧化物酶抗体 ＞600IU/mL（明显升高），甲状腺球蛋白抗体 428IU/mL（升高），促甲状腺激素受体抗体阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺超声",
            "result": "甲状腺体积稍增大，实质回声增粗、分布不均，呈网格状改变，血流信号不丰富；未见明确结节",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及血脂",
            "result": "血红蛋白 102g/L，红细胞平均体积 88fL；总胆固醇 7.4mmol/L，甘油三酯 2.4mmol/L，低密度脂蛋白胆固醇 4.9mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图及心脏超声",
            "result": "心电图：窦性心动过缓，心率 54次/分，肢体导联低电压；心脏超声：心包腔少量积液（左室后壁后方 5mm），左心室射血分数 62%",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "甲状腺功能减退症（原发性，桥本甲状腺炎）",
          "轻度贫血",
          "高脂血症"
        ]
      }
    }
  },
  {
    "key": "itp",
    "dept": "hematology",
    "name": "原发免疫性血小板减少症（ITP）",
    "alias": [
      "ITP",
      "免疫性血小板减少症",
      "特发性血小板减少性紫癜",
      "血小板减少性紫癜"
    ],
    "hint": "反复皮肤瘀点瘀斑、鼻衄及牙龈出血，血小板明显减少而脾不大 —— ITP",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南通",
        "birthPlace": "江苏南通",
        "occupation": "小学教师",
        "reliability": "可靠",
        "chiefComplaint": "反复皮肤瘀点、瘀斑伴牙龈出血",
        "chiefComplaintDuration": "2",
        "chiefComplaintDurationUnit": "月"
      },
      "hpi": {
        "onset": "2个月前无明显诱因发现双下肢散在针尖样出血点，压之不褪色，无痛痒，未予重视",
        "cause": "发病前1个月曾有上呼吸道感染，自服感冒清热颗粒后痊愈，否认近期服用阿司匹林等药物，否认苯及射线接触",
        "symptoms": "出血点逐渐增多并融合成瘀斑，分布于双下肢及臀部；刷牙时牙龈渗血，需压迫数分钟方止；偶有晨起鼻衄，量少可自止",
        "relief": "局部压迫后牙龈及鼻腔出血可止，瘀斑自行消退需2周左右，此起彼伏",
        "evolution": "近半月瘀斑数量较前增多，轻微碰撞即出现大片瘀斑，洗脸后眼睑亦出现出血点",
        "accompanying": "伴乏力、易疲倦，活动后明显；无发热，无关节肿痛",
        "negativeDiscriminating": "无黑便、呕血及血尿，无月经过多，无发热盗汗，无骨痛及淋巴结肿大，无皮疹及皮肤瘙痒",
        "treatment": "1个月前于当地医院查血常规示血小板 28×10⁹/L，予氨肽素及维生素C口服2周，未复查；未用过糖皮质激素及免疫抑制剂",
        "generalCondition": "发病以来精神可，食欲睡眠正常，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "hemat": {
          "bruise": {
            "checked": true,
            "detail": "双下肢及臀部散在瘀点瘀斑，轻微碰撞即出现大片瘀斑"
          },
          "bleeding": {
            "checked": true,
            "detail": "刷牙时牙龈渗血，需压迫数分钟方止"
          },
          "purpura": {
            "checked": true,
            "detail": "双下肢散在针尖样出血点，压之不褪色"
          },
          "epistaxis": {
            "checked": true,
            "detail": "晨起偶有鼻衄，量少可自止"
          },
          "fatigue": {
            "checked": true,
            "detail": "乏力、易疲倦，活动后明显"
          },
          "anemia": {
            "negative": true
          },
          "lymphNode": {
            "negative": true
          },
          "bonePain": {
            "negative": true
          },
          "rash": {
            "negative": true
          },
          "transfusion": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          }
        },
        "gi": {
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "gu": {
          "hematuria": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          }
        },
        "nervous": {
          "headache": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病等慢性病史，否认系统性红斑狼疮、类风湿关节炎等自身免疫性疾病史",
        "longTermMeds": "无长期服药史，否认近期服用肝素、奎宁、磺胺等药物",
        "infection": "否认肝炎、结核、HIV 等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认苯、甲苯及放射性物质接触史",
        "vaccine": "按计划预防接种，近期未接种疫苗",
        "allergy": "无",
        "relatedHistory": "否认家族中有出血性疾病患者，否认酗酒史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于江苏南通，否认疫区及地方病流行区久居史",
        "maternal": "",
        "birth": "足月顺产，出生体重正常",
        "feeding": "母乳喂养",
        "growth": "生长发育与同龄人相仿",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认苯、甲醛及有机磷农药接触史",
        "environment": "",
        "habits": "作息规律，饮食正常，无特殊偏嗜",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "小学教学工作，无粉尘、射线及化学毒物接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "29",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有血小板减少及出血性疾病患者",
        "infectionHistory": "否认结核、肝炎等传染性疾病史"
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
          "rash": "可见瘀点瘀斑",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
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
          "liverPalpation": "肝肋下未触及，肝区无压痛",
          "spleenPalpation": "脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_hematology": {
          "hemAnemia": "睑结膜、口唇及甲床无苍白",
          "hemBleeding": "可见瘀点",
          "hemNode": "全身浅表淋巴结未触及肿大",
          "hemSternum": "胸骨无压痛",
          "hemGum": "牙龈渗血",
          "hemHepatospleen": "肝脾肋下未触及",
          "hemJaundice": "皮肤巩膜无黄染",
          "hemBoneTender": "四肢长骨及关节无压痛"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规（两次，间隔2周）",
            "result": "第一次 PLT 24×10⁹/L；第二次 PLT 31×10⁹/L；两次 Hb 126～131g/L，WBC 6.2～7.1×10⁹/L，红细胞及白细胞形态未见异常，MPV 13.2fl",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能与束臂试验",
            "result": "PT 12.6s，APTT 30s，纤维蛋白原 3.1g/L；出血时间延长，束臂试验阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "骨髓穿刺+活检",
            "result": "骨髓增生活跃，巨核细胞数增多，产板型巨核细胞显著减少，呈成熟障碍；红系及粒系形态未见异常",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血小板自身抗体与免疫学",
            "result": "抗血小板糖蛋白 GPⅡb/Ⅲa 抗体阳性；ANA、抗 dsDNA 抗体阴性；HIV、HCV、HBV 筛查阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "肝、胆、胰、脾未见异常，脾厚 32mm，肋下未及",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "原发免疫性血小板减少症（ITP，新诊断）",
          "血小板减少症（重度）"
        ]
      }
    }
  },
  {
    "key": "leukemia",
    "dept": "hematology",
    "name": "急性髓系白血病（AML-M2）",
    "alias": [
      "急性白血病",
      "白血病",
      "AML",
      "急性髓系白血病",
      "M2"
    ],
    "hint": "发热、乏力伴皮肤瘀点瘀斑，胸骨下段压痛，淋巴结及脾肿大 —— 急性白血病",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "河南周口",
        "birthPlace": "河南周口",
        "occupation": "货运司机",
        "reliability": "可靠",
        "chiefComplaint": "发热伴皮肤瘀点、乏力",
        "chiefComplaintDuration": "20",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "20天前无明显诱因出现发热，体温最高39.2℃，以下午及夜间为著，无畏寒寒战，自服对乙酰氨基酚后可暂时降至正常",
        "cause": "发病前2周曾因「感冒」在社区诊所静滴抗菌药物，无明显诱因，否认近期装修及化学毒物接触",
        "symptoms": "发热反复，伴全身乏力、活动后气促；同时双下肢及腹部出现散在瘀点、瘀斑，刷牙时牙龈渗血，晨起偶有鼻衄，可自行停止",
        "relief": "退热药物可暂时退热，但数小时后又复升；牙龈渗血需局部压迫方能止住",
        "evolution": "近1周乏力明显加重，需卧床休息，行走十余米即感心慌气短，瘀点瘀斑较前增多",
        "accompanying": "伴食欲明显下降、夜间盗汗，左侧卧位时左上腹有坠胀感",
        "negativeDiscriminating": "无黑便、呕血，无尿血，无关节肿痛及骨痛，无皮疹及皮肤瘙痒，无头痛呕吐及视物模糊",
        "treatment": "社区诊所予头孢曲松2g每日1次静滴3天、地塞米松5mg静推1次，体温可短暂下降，停药后复升，疗效不佳",
        "generalCondition": "发病以来精神差，食欲差，睡眠欠佳，大小便正常，体重下降约4kg",
        "extra": ""
      },
      "ros": {
        "hemat": {
          "bleeding": {
            "checked": true,
            "detail": "刷牙时牙龈渗血，晨起偶有鼻衄"
          },
          "bruise": {
            "checked": true,
            "detail": "双下肢及腹部散在瘀点、瘀斑"
          },
          "lymphNode": {
            "checked": true,
            "detail": "自觉颈部及腹股沟可扪及黄豆大小结节"
          },
          "fatigue": {
            "checked": true,
            "detail": "乏力明显，行走十余米即感心慌气短"
          },
          "anemia": {
            "checked": true,
            "detail": "面色苍白，活动后气促"
          },
          "bonePain": {
            "negative": true
          },
          "epistaxis": {
            "checked": true,
            "detail": "晨起偶有鼻衄，可自行停止"
          },
          "rash": {
            "negative": true
          },
          "pruritus": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "发热20天，最高39.2℃"
          },
          "cough": {
            "negative": true
          },
          "sputum": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "nightSweat": {
            "checked": true,
            "detail": "夜间盗汗，需更换衣物"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸"
          }
        },
        "gi": {
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲明显下降，进食量不足平日一半"
          },
          "abdominalPain": {
            "checked": true,
            "detail": "左侧卧位时左上腹坠胀感"
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "checked": true,
            "detail": "20天体重下降约4kg"
          }
        },
        "nervous": {
          "headache": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病等慢性病史，否认结核、肝炎等传染病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认苯及放射性物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认肿瘤家族史，否认长期服用氯霉素等药物史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于河南周口，否认疫区及地方病流行区久居史",
        "maternal": "",
        "birth": "足月顺产，出生体重正常",
        "feeding": "母乳喂养",
        "growth": "生长发育与同龄人相仿",
        "smoking": "有",
        "smokingAmount": "吸烟5年，每日约15支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "偶尔饮啤酒，每次约500ml，每周1～2次",
        "drugs": "否认苯、甲醛及有机磷农药接触史",
        "environment": "",
        "habits": "长期跑长途货运，作息不规律，常熬夜",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "货运驾驶工作，否认射线及化学毒物接触"
      },
      "marriage": {
        "status": "未婚",
        "age": "",
        "spouseHealth": "",
        "sexLife": "否认性生活史",
        "relation": ""
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有白血病及血液系统疾病患者",
        "infectionHistory": "否认结核、肝炎等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神差",
          "posture": "自主体位",
          "face": "贫血面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "可见瘀点瘀斑",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "双侧颈部可触及肿大淋巴结"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜溃疡"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
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
          "liverPalpation": "肝肋下未触及，肝区无压痛",
          "spleenPalpation": "脾肋下可触及且质硬"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_hematology": {
          "hemAnemia": "睑结膜苍白",
          "hemBleeding": "可见瘀点",
          "hemNode": "颈部淋巴结肿大",
          "hemSternum": "胸骨中下段压痛",
          "hemGum": "牙龈渗血",
          "hemHepatospleen": "脾肋下可触及",
          "hemJaundice": "皮肤巩膜无黄染",
          "hemBoneTender": "四肢长骨及关节无压痛"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 32.6×10⁹/L，Hb 68g/L，PLT 38×10⁹/L，外周血涂片见原始细胞 46%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "骨髓穿刺+活检",
            "result": "骨髓增生极度活跃，原始粒细胞占 52%，可见 Auer 小体，红系及巨核系受抑；活检示骨髓增生极度活跃，原始细胞弥漫性增生",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "免疫分型（流式细胞术）",
            "result": "CD13⁺、CD33⁺、CD117⁺、MPO⁺、HLA-DR⁺、CD34⁺，符合髓系表达",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "染色体及融合基因",
            "result": "46,XY,t(8;21)(q22;q22)；RUNX1-RUNX1T1 融合基因阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能与乳酸脱氢酶",
            "result": "PT 13.8s，APTT 32s，纤维蛋白原 3.4g/L；LDH 682U/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性髓系白血病（AML-M2，伴 t(8;21)）",
          "贫血（重度）",
          "血小板减少症"
        ]
      }
    }
  },
  {
    "key": "lungNodule",
    "dept": "surgery",
    "name": "肺结节（院内范例）",
    "alias": [
      "肺结节",
      "右肺上叶结节",
      "右肺上叶部分实性结节",
      "肺部结节"
    ],
    "hint": "体检发现右肺上叶部分实性结节，影像考虑恶性，病理暂缺",
    "source": {
      "kind": "hospital-example",
      "label": "院内范例",
      "note": "依据用户提供的肺结节病历截图整理；截图未展示完整摘要及诊断，这两项为整理示例。身份、生命体征及未展示病史留空，检查日期、机构和编号需按实际报告补录。"
    },
    "record": {
      "basic": {
        "chiefComplaint": "发现肺结节",
        "chiefComplaintDuration": "1",
        "chiefComplaintDurationUnit": "周"
      },
      "hpi": {
        "onset": "1周前当地体检行胸部CT发现右肺上叶部分实性结节，提示肺Ca，建议胸外科就诊；两肺另见散在实性结节，考虑炎性可能。1天前外院PET/CT示右肺上叶胸膜下部分实性结节代谢轻度增高，原发性肺癌可能性大，建议病理检查；双肺多发微小实性结节代谢未见增高，炎性或肉芽肿性病变可能，建议CT随诊；右肺门小淋巴结轻度代谢，考虑反应性；另见冠脉壁钙化。",
        "cause": "体检发现肺结节",
        "symptoms": "体检发现右肺上叶部分实性结节及双肺散在实性结节",
        "relief": "",
        "evolution": "为进一步住院手术治疗来院，门诊以“肺结节”收入院。",
        "accompanying": "无胸闷、胸痛、恶心、呕吐、头痛、头晕、心悸、腹痛及腹泻。",
        "negativeDiscriminating": "",
        "treatment": "",
        "generalCondition": "神清，精神、胃纳、睡眠可，大小便正常；体重下降，具体数值不详。",
        "extra": ""
      },
      "pmh": {
        "health": "",
        "diseaseChecks": {},
        "diseaseOther": "",
        "diseaseDetail": "慢性乙型病毒性肝炎数年；否认高血压、糖尿病、肾病、心脏病及脑血管病。",
        "longTermMeds": "恩替卡韦分散片0.5mg每晚1次（病史记载）。",
        "infection": "",
        "surgery": "",
        "trauma": "",
        "transfusion": "",
        "poisoning": "",
        "vaccine": "",
        "allergy": "",
        "relatedHistory": "",
        "otherTreatDiseases": "",
        "special": ""
      },
      "pe": {
        "vitals": {},
        "general": {
          "conscious": "神志清楚，精神可"
        },
        "chest": {
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdAuscultation": "肠鸣音正常",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，肝脾肋下未触及"
        },
        "spine": {
          "limbs": "双下肢无水肿"
        },
        "nervousPE": {
          "nerve": "神经系统常见阴性"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "胸部CT",
            "result": "右肺上叶部分实性结节，提示肺Ca，建议胸外科就诊；两肺散在实性结节，炎性可能；另见肝小囊肿、冠脉壁钙化。",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "肝囊肿，右肾囊肿，前列腺增大。",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "PET/CT",
            "result": "右肺上叶胸膜下部分实性结节代谢轻度增高，原发性肺癌可能性大，建议穿刺活检明确病理诊断；双肺多发微小实性结节代谢未见增高，炎性或肉芽肿性病变可能，建议CT随诊；右肺门小淋巴结轻度代谢增高，考虑反应性改变；冠脉壁钙化；双肾上腺增粗，延迟显像代谢增高，考虑增生可能，随诊；胆囊皱褶、胆囊管壁稍厚，代谢轻度增高，考虑炎症，结合超声检查；肝小囊肿、右肾囊肿、前列腺钙化灶；肠道节段性炎性或生理性摄取；左髂骨体骨岛或钙盐沉积，腰5椎体失稳、脊柱退行性变。",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "病理检查",
            "result": "暂缺。",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“发现肺结节1周”入院。1周前当地体检胸部CT发现右肺上叶部分实性结节，提示肺Ca并建议胸外科就诊；两肺散在实性结节考虑炎性可能。1天前外院PET/CT示右肺上叶胸膜下部分实性结节代谢轻度增高，原发性肺癌可能性大，建议病理检查；双肺多发微小实性结节代谢未见增高，炎性或肉芽肿性病变可能，建议CT随诊；右肺门小淋巴结轻度代谢，考虑反应性。患者无胸闷胸痛、恶心呕吐、头痛头晕、心悸、腹痛腹泻，为进一步住院手术治疗来院，门诊以肺结节收入。既往慢性乙型病毒性肝炎数年，服恩替卡韦分散片0.5mg每晚1次（病史记载）；体重下降，具体数值不详。查体神志清楚、精神可，双肺呼吸音清，未闻及干湿性啰音；心律齐，未闻及病理性杂音；腹平软，全腹无压痛、反跳痛，肝脾肋下未触及，肠鸣音正常，双下肢无水肿，神经系统常见阴性。病理暂缺，现有影像学所见提示恶性可能，尚无病理依据确诊肺癌。",
      "diagnosis": {
        "confirmed": [
          "右肺上叶部分实性结节（性质待定）",
          "慢性乙型病毒性肝炎"
        ]
      }
    }
  },
  {
    "key": "meningitis",
    "dept": "neurology",
    "name": "化脓性脑膜炎",
    "alias": [
      "化脓性脑膜炎",
      "细菌性脑膜炎",
      "肺炎链球菌脑膜炎",
      "化脑"
    ],
    "hint": "发热、头痛、呕吐伴脑膜刺激征阳性，脑脊液呈化脓性改变",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江宁波",
        "birthPlace": "浙江宁波",
        "occupation": "公司职员",
        "reliability": "可靠",
        "chiefComplaint": "发热伴头痛、呕吐3天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "3天前受凉后出现发热，体温最高39.6℃，无畏寒及寒战，同时出现全头部持续性胀痛，晨起及咳嗽、弯腰时加重",
        "cause": "发病前1周有咽部不适及鼻塞，未服药；发病前无头部外伤、无耳鼻流液",
        "symptoms": "头痛为全头胀痛，程度剧烈，难以忍受，伴恶心，进食后呕吐3次，为胃内容物，呈喷射样；发热持续，服退热药后可短暂下降，数小时后复升",
        "relief": "卧床、避光后头痛稍减轻，退热药效果短暂",
        "evolution": "入院前1天出现精神萎靡、反应迟钝、答话迟缓，家属呼之能应但言语减少",
        "accompanying": "伴畏光、颈部发僵、全身肌肉酸痛",
        "negativeDiscriminating": "无肢体瘫痪，无肢体抽搐，无言语不能，无视物成双，无耳流脓及听力下降，无皮肤瘀点瘀斑，无腹泻，无尿频尿痛",
        "treatment": "社区诊所予头孢呋辛1.5g静脉滴注2天、对乙酰氨基酚退热，体温未降至正常，头痛进行性加重，遂转我院急诊",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠因头痛受影响，小便正常，大便2日未解，体重无明显变化",
        "extra": "入院后即行腰椎穿刺，术前头颅CT未见明显占位"
      },
      "ros": {
        "nervous": {
          "headache": {
            "checked": true,
            "detail": "全头部持续性胀痛，咳嗽及弯腰时加重"
          },
          "speech": {
            "checked": true,
            "detail": "答话迟缓，言语减少"
          },
          "seizure": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "visualBlur": {
            "checked": true,
            "detail": "畏光，强光下头痛加重"
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "体温最高39.6℃，持续3天"
          },
          "chills": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "soreThroat": {
            "checked": true,
            "detail": "发病前1周咽部不适"
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "伴恶心，呕吐3次为胃内容物"
          },
          "vomiting": {
            "checked": true,
            "detail": "喷射样呕吐3次"
          },
          "diarrhea": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、慢性肾脏病等慢性病史；否认中耳炎、鼻窦炎反复发作史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史；近期无结核病人接触史",
        "surgery": "否认手术史",
        "trauma": "否认头部外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种，未接种肺炎链球菌疫苗",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认长期使用糖皮质激素及免疫抑制剂",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江宁波，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认有毒有害物质接触史",
        "environment": "",
        "habits": "经常熬夜，工作劳累",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "29",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈抵抗阳性",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常"
        },
        "nervousPE": {
          "kernig": "克氏征阳性",
          "brudzinski": "布氏征阳性",
          "babinski": "巴氏征阴性"
        },
        "special_neurology": {
          "neuroExtra1": "言语不利",
          "neuroExtra2": "十二对颅神经检查未见异常",
          "neuroExtra3": "四肢肌张力正常，肌力正常，未见肌萎缩",
          "neuroExtra4": "痛温觉、触觉、深感觉检查未见异常",
          "neuroMeningeal": "颈项强直阳性",
          "neuroGait": "步态正常，行走平稳"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "腰椎穿刺（脑脊液常规）",
            "result": "初压280mmH₂O，外观浑浊，白细胞4800×10⁶/L，中性粒细胞92%，蛋白2.8g/L，葡萄糖1.1mmol/L，氯化物112mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "脑脊液涂片及培养",
            "result": "涂片见革兰阳性双球菌，培养待报",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅CT（平扫）",
            "result": "脑实质未见占位性病变及出血灶，脑沟略浅，中线结构居中",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 18.6×10⁹/L，N 89%，Hb 126g/L，PLT 236×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白及降钙素原",
            "result": "CRP 168mg/L，PCT 12.4ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "化脓性脑膜炎（肺炎链球菌性）",
          "低钠血症"
        ]
      }
    }
  },
  {
    "key": "myoma",
    "dept": "gynecology",
    "name": "子宫肌瘤（多发性，拟手术）",
    "alias": [
      "子宫肌瘤",
      "多发性子宫肌瘤",
      "肌瘤",
      "子宫平滑肌瘤",
      "myoma"
    ],
    "hint": "经量增多、经期延长伴贫血，下腹可触及包块，超声示多发肌瘤",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "教师",
        "reliability": "可靠",
        "informant": "本人",
        "chiefComplaint": "月经量增多伴经期延长1年",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "1年前无明显诱因出现月经量增多，较前约增加一倍，经期由5天延长至9～10天",
        "cause": "无明显诱因，否认近期精神应激、剧烈运动及服用激素类药物",
        "symptoms": "经量增多以第2～3天为著，需每1～2小时更换卫生巾，伴大量暗红色血块，经期延长至9～10天",
        "relief": "经期卧床休息及口服氨甲环酸片1.0g每日3次后经量可略减少，停药后复现",
        "evolution": "近半年症状加重，经期延长至10天，周期缩短至22～25天；3个月前自行扪及下腹正中包块，逐渐增大",
        "accompanying": "伴头晕、乏力、活动后心悸，伴尿频、夜尿增多，无排尿困难，无便秘",
        "negativeDiscriminating": "无停经史，无阴道不规则流血及接触性出血，无下腹剧痛，无发热，无消瘦及食欲下降",
        "treatment": "半年前于我院门诊查血常规示血红蛋白86g/L，予琥珀酸亚铁0.1g每日3次口服并口服氨甲环酸，疗程3个月，复查血红蛋白升至102g/L，经量无明显减少",
        "generalCondition": "发病以来精神可，食欲正常，睡眠可，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          },
          "bloating": {
            "checked": true,
            "detail": "下腹坠胀感，午后及久站后明显"
          },
          "jaundiceGi": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "checked": true,
            "detail": "尿频、夜尿2～3次，无尿急尿痛"
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "discharge": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "checked": true,
            "detail": "面色苍白、头晕、活动后心悸，血红蛋白最低86g/L"
          },
          "fatigue": {
            "checked": true,
            "detail": "近半年易疲乏，上二楼即感气短"
          },
          "bleeding": {
            "checked": true,
            "detail": "经量增多、经期延长1年"
          },
          "pallorSkin": {
            "checked": true,
            "detail": "面色及口唇苍白"
          },
          "bruise": {
            "negative": true
          },
          "lymphNode": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸，休息后可缓解"
          },
          "edemaCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          }
        },
        "endocrine": {
          "polydipsia": {
            "negative": true
          },
          "polyuriaEndo": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          },
          "weightGain": {
            "negative": true
          }
        },
        "nervous": {
          "headache": {
            "checked": true,
            "detail": "经期及劳累后头晕、头痛"
          },
          "dizziness": {
            "checked": true,
            "detail": "体位改变时头晕，无晕厥"
          },
          "visualBlur": {
            "negative": true
          },
          "sleepDisorder": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "腰骶部酸痛，经期加重"
          },
          "jointPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {
          "贫血": "贫血"
        },
        "diseaseDetail": "1年前于我院诊断为缺铁性贫血，否认高血压、糖尿病、心脏病病史",
        "longTermMeds": "间断口服琥珀酸亚铁及氨甲环酸，无其他长期用药",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射线接触史",
        "vaccine": "按计划预防接种",
        "allergy": "有",
        "allergenChecks": {
          "磺胺类": "磺胺类"
        },
        "allergenReactionChecks": {
          "皮疹": "皮疹"
        },
        "allergyReaction": "服用磺胺类药后出现全身散在红色皮疹，停药后消退",
        "relatedHistory": "否认长期服用激素类药物及保健品，否认宫腔操作史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州",
        "travel": "否认疫区及传染病接触史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物滥用史",
        "environment": "",
        "habits": "工作以站立为主，饮食偏素，近半年注意补充含铁食物",
        "sexualHistory": "已婚，配偶固定，否认不洁性接触史",
        "occupationEnv": "小学教师，无粉尘、毒物及放射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "29",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "有",
        "age": "13",
        "cycle": "23",
        "duration": "9",
        "quantity": "增多，约为既往两倍",
        "color": "暗红",
        "clot": "有，量多",
        "leukorrhea": "量稍多，色白，无异味",
        "lmp": "2025年10月8日",
        "menopauseAge": "",
        "dysmenorrhea": "有，经期第1～2天下腹坠痛，需服止痛药"
      },
      "childbirth": {
        "applicable": "有",
        "fullTerm": "1",
        "premature": "0",
        "abortion": "0",
        "alive": "1",
        "gravida": "1",
        "para": "1",
        "details": "10年前足月顺产一男婴，产程顺利，无产后出血",
        "lastBirth": "末次分娩于10年前",
        "contraception": "宫内节育器已取出，现用避孕套"
      },
      "family": {
        "diseaseChecks": {
          "高血压": "高血压",
          "糖尿病": "糖尿病"
        },
        "other": "母亲患高血压，父亲患2型糖尿病，均规律服药",
        "deceased": "祖父母已故，死因不详；外祖父母健在",
        "threeGeneration": "两系三代否认遗传性疾病及妇科肿瘤病史",
        "similarDisease": "否认家族中有子宫肌瘤及类似疾病患者",
        "infectionHistory": "否认结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "贫血面容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发稀疏",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心尖区可闻及收缩期杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "可触及腹部包块"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_gynecology": {
          "gynVulva": "外阴发育正常，未见赘生物、溃疡及色素减退",
          "gynVagina": "阴道通畅，黏膜光滑，分泌物量少、色白、无异味",
          "gynCervix": "宫颈光滑，大小正常，无举痛，无接触性出血",
          "gynUterus": "子宫增大",
          "gynAdnexa": "双附件区未触及包块，无压痛",
          "gynTriple": "三合诊未触及异常，直肠黏膜光滑",
          "gynBreast": "双侧乳房对称，未触及肿块，乳头无溢液",
          "gynAbdomen": "下腹部可触及包块"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 88g/L，MCV 71fl，MCH 22pg，WBC 5.6×10⁹/L，PLT 268×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "铁代谢",
            "result": "血清铁蛋白 8ng/ml，血清铁 5.2μmol/L，总铁结合力升高",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "盆腔超声",
            "result": "子宫前位，增大如孕12周大小，肌层回声不均，可见多个低回声结节，最大者位于前壁肌层，大小约5.6cm×4.8cm，边界清；双附件未见异常",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "盆腔增强MRI",
            "result": "子宫多发肌瘤，最大者约5.8cm，结合带完整，未见附件区异常信号",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "宫颈液基细胞学（TCT）",
            "result": "未见上皮内病变及恶性细胞（NILM）",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "子宫肌瘤（多发性，肌壁间为主）",
          "缺铁性贫血（中度）",
          "慢性失血性贫血"
        ]
      }
    }
  },
  {
    "key": "nephrotic",
    "dept": "nephrology",
    "name": "肾病综合征（微小病变型）",
    "alias": [
      "肾病综合征",
      "微小病变型肾病",
      "微小病变",
      "NS"
    ],
    "hint": "大量蛋白尿、低白蛋白血症、全身凹陷性水肿、高脂血症，肾活检示微小病变",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "福建厦门",
        "birthPlace": "福建厦门",
        "occupation": "在读研究生",
        "reliability": "可靠",
        "chiefComplaint": "眼睑水肿伴尿泡沫增多1个月",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "月"
      },
      "hpi": {
        "onset": "1个月前晨起发现双眼睑水肿，洗脸后不易消退，午后自行减轻；同时尿中泡沫明显增多，静置10分钟不消散",
        "cause": "发病前3周有咽痛、发热2天，自服感冒药后好转；无过敏及药物接触史",
        "symptoms": "水肿由眼睑开始，1周内蔓延至颜面及双下肢，晨起颜面明显、午后下肢明显；现体重较发病前增加6kg，尿量较前减少，每日约900ml；尿泡沫多，呈细密状",
        "relief": "卧床休息后水肿略减轻，利尿药效果不明显",
        "evolution": "近1周腹部渐膨隆，平卧时气短，夜间不能平卧入睡",
        "accompanying": "伴腹胀、乏力、食欲减退",
        "negativeDiscriminating": "无肉眼血尿，无尿频尿急尿痛，无腰痛，无关节肿痛及皮疹，无脱发及口腔溃疡，无发热盗汗，无皮肤紫癜，无长期服用非甾体抗炎药及汞制剂史",
        "treatment": "社区医院诊为「急性肾炎」，予氢氯噻嗪25mg每日2次口服1周，水肿无明显减轻，遂转我院",
        "generalCondition": "发病以来精神一般，食欲减退，睡眠因夜间气短受影响，尿量减少，大便正常，体重较前增加6kg",
        "extra": "入院后限盐限水、利尿，并完善24小时尿蛋白定量，行肾穿刺活检"
      },
      "ros": {
        "gu": {
          "edemaGu": {
            "checked": true,
            "detail": "眼睑、颜面及双下肢水肿，晨起颜面为著"
          },
          "oliguria": {
            "checked": true,
            "detail": "24小时尿量约900ml"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          }
        },
        "cardio": {
          "edemaCardio": {
            "checked": true,
            "detail": "双下肢凹陷性水肿，夜间不能平卧"
          },
          "orthopnea": {
            "checked": true,
            "detail": "夜间不能平卧入睡"
          },
          "palpitation": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "平卧时气短"
          },
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          },
          "soreThroat": {
            "checked": true,
            "detail": "发病前3周咽痛、发热2天"
          }
        },
        "gi": {
          "bloating": {
            "checked": true,
            "detail": "腹部膨隆，腹胀"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲减退"
          },
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "checked": true,
            "detail": "腹胀伴轻度全腹隐痛"
          },
          "diarrhea": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "乏力，活动后明显"
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "morningStiff": {
            "negative": true
          }
        },
        "nervous": {
          "headache": {
            "negative": true
          },
          "dizziness": {
            "checked": true,
            "detail": "体位改变时头晕"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、肝炎、结核病史；否认过敏性紫癜及系统性红斑狼疮病史",
        "longTermMeds": "无长期服药史；近1个月服氢氯噻嗪25mg每日2次",
        "infection": "否认肝炎、结核等传染病史；发病前3周有上呼吸道感染",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认汞、金制剂及青霉胺接触史",
        "vaccine": "按计划预防接种",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认过敏性疾病及关节炎病史；否认关节痛、脱发、光过敏",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于福建厦门，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认非甾体抗炎药、中草药及重金属接触史",
        "environment": "",
        "habits": "长期熬夜，饮食不规律，近期学业压力大",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "在校学习，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "未婚",
        "age": "",
        "spouseHealth": "",
        "sexLife": "未涉及",
        "relation": ""
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑水肿",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉充盈"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "呼吸音减弱",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "移动性浊音阳性",
          "fluidThrill": "液波震颤阳性"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "双下肢凹陷性水肿"
        },
        "special_nephrology": {
          "renalFacialEdema": "颜面水肿",
          "renalLegEdema": "双下肢凹陷性水肿",
          "renalSkin": "皮肤黏膜无苍白、出血点及尿素霜",
          "renalPercussion": "双肾区无叩击痛",
          "renalBladder": "膀胱未触及，耻骨上区无压痛",
          "renalCardio": "双肺未闻及湿啰音，未闻及心包摩擦音"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "24小时尿蛋白定量",
            "result": "6.8g/24h，尿量 900ml，尿蛋白 4+",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血生化",
            "result": "血浆白蛋白 18g/L，总胆固醇 9.2mmol/L，甘油三酯 3.6mmol/L，血肌酐 72μmol/L，尿素氮 5.2mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肾穿刺活检（光镜及电镜）",
            "result": "光镜下肾小球基本正常，近端小管上皮细胞空泡及脂肪变性；免疫荧光阴性；电镜下足突广泛融合，未见电子致密物沉积",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "泌尿系超声",
            "result": "双肾大小形态正常，皮髓质分界清晰，双肾实质回声略增强，未见结石及积水",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "免疫学检查",
            "result": "抗核抗体阴性，抗双链DNA阴性，补体C3 1.12g/L、C4 0.28g/L，乙肝表面抗原阴性",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "肾病综合征（微小病变型）",
          "胸腔积液",
          "腹腔积液"
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
    "key": "organophosphate",
    "dept": "emergency",
    "name": "急性有机磷农药中毒（中度）",
    "alias": [
      "有机磷中毒",
      "有机磷农药中毒",
      "农药中毒",
      "胆碱能危象",
      "organophosphate"
    ],
    "hint": "喷洒有机磷农药后恶心呕吐、大汗流涎、肌纤维颤动、瞳孔针尖样缩小、呼气大蒜味 —— 急性有机磷中毒胆碱能危象",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河北邯郸",
        "birthPlace": "河北邯郸",
        "occupation": "农民",
        "reliability": "家属代诉，基本可靠",
        "chiefComplaint": "喷洒农药后恶心、呕吐伴大汗、全身肌肉跳动",
        "chiefComplaintDuration": "5",
        "chiefComplaintDurationUnit": "小时"
      },
      "hpi": {
        "onset": "5小时前于田间喷洒对硫磷乳油约2小时，未戴口罩及手套、着短袖，喷洒结束后1小时出现头晕、恶心，继而呕吐胃内容物3次，全身大汗、流涎不止",
        "cause": "喷洒有机磷杀虫药（对硫磷）期间经皮肤及呼吸道接触，防护不规范，药液曾溅及前臂皮肤",
        "symptoms": "头晕、视物模糊，双上肢先出现细小肌肉跳动，逐渐波及面肌及双下肢，呈持续性；伴胸闷、气促、口涎外流，内衣被汗浸透；无肢体抽搐及二便失禁",
        "relief": "脱离田间后于通风处休息、更换衣物并用清水冲洗前臂，症状无缓解，出汗及肌跳反而加重",
        "evolution": "近2小时精神转差，由烦躁转为思睡，呼之能应、答话迟缓；气促加重，咳大量白色泡沫痰，家属发现其呼出气有大蒜样臭味，遂送我院",
        "accompanying": "伴腹痛、脐周阵发性绞痛，腹泻稀水样便2次；无发热，无胸痛及咯血，无偏瘫及言语不能",
        "negativeDiscriminating": "无进食不洁食物及同餐者发病，无发热寒战及里急后重，无胸痛咯血，无头痛呕吐及肢体抽搐，无药物过敏史，无中暑环境暴露",
        "treatment": "入院前未用阿托品、氯解磷定等解毒药物，仅于当地诊所静脉输注葡萄糖注射液250ml及维生素C 2g，症状无缓解",
        "generalCondition": "发病以来精神差，思睡，食欲未进，小便1次量少色黄，大便稀水样2次"
      },
      "ros": {
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "胸闷、气促，活动后加重，咳白色泡沫痰"
          },
          "sputum": {
            "checked": true,
            "detail": "咳大量白色泡沫痰，不能平卧"
          },
          "cough": {
            "checked": true,
            "detail": "阵发性咳嗽，咳泡沫痰"
          },
          "wheeze": {
            "checked": true,
            "detail": "自觉喉中有痰鸣音"
          },
          "chestPainResp": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "chills": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "恶心明显，反复干呕"
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐胃内容物3次，非喷射性"
          },
          "abdominalPain": {
            "checked": true,
            "detail": "脐周阵发性绞痛"
          },
          "diarrhea": {
            "checked": true,
            "detail": "稀水样便2次，无脓血"
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "发病后未进食，口干明显"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "心慌、心跳加快"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "checked": true,
            "detail": "平卧时气促加重，需垫高枕头"
          },
          "syncope": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "5小时仅排尿1次，量少色黄"
          },
          "nocturia": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "头晕，起身及活动时加重"
          },
          "visualBlur": {
            "checked": true,
            "detail": "视物模糊，看东西发花，瞳孔针尖样缩小"
          },
          "tremor": {
            "checked": true,
            "detail": "双上肢及面肌细小肌肉跳动，持续不止"
          },
          "weakness": {
            "checked": true,
            "detail": "四肢乏力，持物无力"
          },
          "headache": {
            "checked": true,
            "detail": "额部胀痛，程度轻"
          },
          "seizure": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "numbness": {
            "negative": true
          }
        },
        "hemat": {
          "bleeding": {
            "negative": true
          },
          "bruise": {
            "negative": true
          }
        },
        "endocrine": {
          "neckMass": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健，长期务农，无慢性病长期用药",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病、慢性阻塞性肺疾病及肝肾疾病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血及输血反应史",
        "poisoning": "5小时前喷洒有机磷杀虫药（对硫磷）时经皮肤及呼吸道接触，未规范防护；否认其他毒物及药物过量接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期饮酒及吸烟史；近1周未服用抗胆碱能药物及镇静药物",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于河北邯郸，否认疫区及地方病流行区久居史",
        "maternal": "",
        "birth": "足月顺产，出生体重正常",
        "feeding": "",
        "growth": "生长发育与同龄人相仿",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认药物滥用及毒物长期接触史",
        "environment": "",
        "habits": "长期田间务农，喷洒农药时未佩戴口罩、手套及长袖衣物",
        "sexualHistory": "",
        "occupationEnv": "从事农业劳动20余年，每年喷洒有机磷农药数次，防护不规范"
      },
      "marriage": {
        "status": "已婚",
        "age": "23",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有血液病及肿瘤患者",
        "infectionHistory": "否认结核、肝炎等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "嗜睡",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸浅快",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺可闻及湿性啰音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音活跃",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "上腹部压痛，无反跳痛"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_emergency": {
          "emExtra1": "GCS评分下降",
          "emExtra2": "全身未见明显创伤",
          "emConscious": "嗜睡",
          "emAirway": "呼吸困难",
          "emCirculation": "脉搏细速",
          "emShock": "休克指数<0.5，末梢循环良好",
          "emTraumaABC": "按ABCDE顺序评估，各环节未见致命性损伤",
          "emTraumaSurvey": "头、颈、胸、腹、脊柱、骨盆及四肢系统筛查未见异常",
          "emSkin": "皮肤湿冷",
          "emAbdomen": "腹部压痛"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "全血胆碱酯酶活性",
            "result": "胆碱酯酶 420U/L（相当于正常参考值的 36%），提示中度抑制",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规+CRP",
            "result": "WBC 13.8×10⁹/L，N 84%，Hb 142g/L，PLT 216×10⁹/L；CRP 22mg/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动脉血气分析",
            "result": "pH 7.28，PaO₂ 56mmHg，PaCO₂ 48mmHg，HCO₃⁻ 22mmol/L，提示Ⅱ型呼吸衰竭",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部CT",
            "result": "双肺弥漫磨玻璃影及斑片状渗出，以中下肺野为著，提示肺水肿",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心动过速，未见ST-T动态改变及心律失常",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性有机磷农药中毒（中度，胆碱能危象）",
          "急性肺水肿",
          "Ⅱ型呼吸衰竭"
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
    "key": "pedDiarrhea",
    "dept": "pediatrics",
    "name": "轮状病毒肠炎伴中度脱水（1岁2月）",
    "alias": [
      "轮状病毒肠炎",
      "小儿腹泻",
      "腹泻病",
      "秋季腹泻",
      "婴幼儿腹泻"
    ],
    "hint": "蛋花汤样大便每日十余次，伴呕吐、尿少、前囟凹陷，秋冬季多见",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "婴幼儿",
        "reliability": "可靠",
        "informant": "母亲",
        "chiefComplaint": "腹泻伴呕吐3天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "3天前无明显诱因出现腹泻，初为稀糊便，当日转为蛋花汤样，无脓血及黏液",
        "cause": "发病前1天家中进食隔夜米糊，且正值秋冬季腹泻流行季节、幼儿园有类似患儿，可诱发本病",
        "symptoms": "大便每日10～12次，量多，呈黄色蛋花汤样，水分多，有酸臭味，无黏液脓血，每次排便前哭闹不安",
        "relief": "口服蒙脱石散及口服补液盐后大便次数略减至每日8次，呕吐仍频繁，进食及饮水后即吐",
        "evolution": "近1天呕吐加重，每日呕吐5～6次，为胃内容物，非喷射性；尿量明显减少，6小时未排尿",
        "accompanying": "伴低热，体温最高38.1℃；伴精神萎靡、哭时泪少，伴口渴喜饮",
        "negativeDiscriminating": "无黏液脓血便，无里急后重，无剧烈哭闹及果酱样便，无抽搐及意识障碍，无皮肤黄染，无尿痛及血尿",
        "treatment": "2天前于当地诊所口服蒙脱石散1g每日3次、口服补液盐Ⅲ少量多次喂服，疗程2天；并予枯草杆菌二联活菌颗粒口服，呕吐及尿少未见改善，疗效不佳",
        "generalCondition": "发病以来精神萎靡，食欲明显下降，睡眠差，小便量明显减少，3天来体重下降约0.4kg",
        "extra": ""
      },
      "ros": {
        "gi": {
          "diarrhea": {
            "checked": true,
            "detail": "每日10～12次，黄色蛋花汤样，量多，有酸臭味，无脓血"
          },
          "vomiting": {
            "checked": true,
            "detail": "每日5～6次，为胃内容物，非喷射性，进食后加重"
          },
          "nausea": {
            "checked": true,
            "detail": "喂食后干呕，随即呕吐"
          },
          "abdominalPain": {
            "checked": true,
            "detail": "排便前哭闹不安，排便后缓解"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近3天拒食，仅少量饮水"
          },
          "bloating": {
            "checked": true,
            "detail": "腹部较平时饱满，排气增多"
          },
          "constipation": {
            "negative": true
          },
          "hematochezia": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          },
          "toothache": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "近6小时未排尿，尿量明显减少"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          },
          "discharge": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "低热，最高体温38.1℃"
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          }
        },
        "nervous": {
          "seizure": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "因腹部不适及呕吐夜间频繁惊醒"
          },
          "moodLow": {
            "checked": true,
            "detail": "精神萎靡，哭声弱，对逗引反应差"
          }
        },
        "hemat": {
          "anemia": {
            "negative": true
          },
          "fatigue": {
            "checked": true,
            "detail": "活动明显减少，嗜睡状"
          },
          "bleeding": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "checked": true,
            "detail": "3天内体重下降约0.4kg"
          },
          "polydipsia": {
            "checked": true,
            "detail": "口渴明显，频繁索水"
          },
          "polyuriaEndo": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认反复腹泻、慢性腹泻及食物过敏史，否认热性惊厥史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、水痘等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及异物误服史",
        "vaccine": "按国家免疫规划接种，卡介苗、乙肝疫苗、脊灰疫苗、百白破疫苗、麻腮风疫苗均已按程序完成，轮状病毒疫苗未接种",
        "allergy": "无",
        "relatedHistory": "否认乳糖不耐受及牛奶蛋白过敏史，否认近期使用抗生素史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "maternal": "母孕期体健，无妊娠期高血压及糖尿病，无感染及用药史，孕足月",
        "birth": "足月顺产，出生体重3.1kg，出生时无窒息及抢救史，Apgar评分正常",
        "feeding": "生后母乳喂养至6月龄，6月龄起添加辅食，由米粉、菜泥逐步过渡至软食，现以软饭为主，仍母乳喂养每日2次",
        "growth": "3月龄会抬头，6月龄会独坐，10月龄会独走，1岁会说简单单词，现能扶走数步，生长发育与同龄儿相仿",
        "residence": "浙江温州",
        "travel": "否认疫区及外地旅居史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物接触史",
        "environment": "家中无吸烟者，居室通风良好，饮水为煮沸后自来水，无宠物接触史",
        "habits": "作息规律，每日户外活动约1小时，饭前便后已训练洗手",
        "sexualHistory": "",
        "occupationEnv": "婴幼儿，未入托"
      },
      "marriage": {
        "status": "未婚"
      },
      "family": {
        "diseaseChecks": {},
        "other": "父母体健，否认近亲结婚，母亲幼时有类似腹泻病史",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病及免疫缺陷病史",
        "similarDisease": "否认家族中有慢性腹泻及炎症性肠病患者",
        "infectionHistory": "否认家庭内结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神差",
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体不合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发稀疏",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "舌质红、少苔"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心音低钝"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音活跃",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_pediatrics": {
          "pedExtra1": "前囟平软",
          "pedExtra2": "毛细血管充盈时间延长",
          "pedExtra3": "咽无充血，扁桃体无肿大",
          "pedGrowth": "体重低于同龄儿",
          "pedFontanel": "前囟凹陷",
          "pedResp": "呼吸平稳，无三凹征，无鼻翼扇动",
          "pedHeart": "心音低钝",
          "pedAbdomen": "腹部膨隆",
          "pedNeuro": "原始反射已消失，脑膜刺激征阴性",
          "pedRickets": "未见方颅、肋骨串珠、手镯及足镯征"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "大便常规",
            "result": "黄色稀水便，白细胞 0～2/HP，红细胞阴性，脂肪球（+）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "大便轮状病毒抗原检测",
            "result": "阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 8.6×10⁹/L，N 38.5%，L 55.2%，Hb 112g/L，PLT 312×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血电解质",
            "result": "Na⁺ 133mmol/L，K⁺ 3.3mmol/L，Cl⁻ 98mmol/L，HCO₃⁻ 17mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血气分析",
            "result": "pH 7.31，BE -6mmol/L，提示轻度代谢性酸中毒",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "轮状病毒肠炎",
          "中度等渗性脱水",
          "轻度代谢性酸中毒伴低钾血症"
        ]
      }
    }
  },
  {
    "key": "pedPneumonia",
    "dept": "pediatrics",
    "name": "支气管肺炎（3岁）",
    "alias": [
      "支气管肺炎",
      "小儿肺炎",
      "肺炎",
      "pediatric pneumonia"
    ],
    "hint": "发热、咳嗽伴气促，双肺可闻及固定中细湿啰音",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "学龄前儿童",
        "reliability": "可靠",
        "informant": "母亲",
        "chiefComplaint": "发热伴咳嗽5天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "5天前受凉后出现发热，体温最高39.2℃，每日发热2～3次，服退热药后可暂降至正常",
        "cause": "幼儿园同班有呼吸道感染患儿接触史，可诱发本病",
        "symptoms": "咳嗽呈阵发性连声咳，夜间及晨起为著，初为干咳，近2天咳出白色黏痰，尚能咳出",
        "relief": "口服布洛芬混悬液后体温可降至正常，4～6小时后复升；咳嗽雾化后略减轻",
        "evolution": "近2天咳嗽加重，出现气促，活动及哭闹后口周发青，夜间不能安睡",
        "accompanying": "伴鼻塞、流涕，伴食欲下降，精神较前萎靡",
        "negativeDiscriminating": "无抽搐，无意识障碍，无皮疹，无呕吐及腹泻，无耳痛及耳流脓，无盗汗及消瘦",
        "treatment": "5天前于当地诊所口服阿莫西林颗粒0.25g每日3次，疗程3天，并口服小儿氨酚黄那敏颗粒，服药后体温反复，咳嗽未见好转，疗效不佳",
        "generalCondition": "发病以来精神较前萎靡，食欲下降，睡眠差，大小便正常，尿量略减少，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "resp": {
          "fever": {
            "checked": true,
            "detail": "发热5天，最高体温39.2℃，每日发热2～3次"
          },
          "cough": {
            "checked": true,
            "detail": "阵发性连声咳，夜间及晨起加重，咳白色黏痰"
          },
          "sputum": {
            "checked": true,
            "detail": "白色黏痰，量中等，尚能咳出"
          },
          "dyspnea": {
            "checked": true,
            "detail": "活动及哭闹后气促，口周发青"
          },
          "nasalObstruction": {
            "checked": true,
            "detail": "鼻塞、流清涕"
          },
          "wheeze": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "chestPainResp": {
            "negative": true
          },
          "chills": {
            "checked": true,
            "detail": "体温上升时畏寒、寒战"
          },
          "nightSweat": {
            "negative": true
          },
          "soreThroat": {
            "negative": true
          },
          "hoarseness": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近3天进食量约为平时一半"
          },
          "constipation": {
            "negative": true
          },
          "bloating": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "cyanosis": {
            "checked": true,
            "detail": "哭闹后口周轻度发青"
          },
          "edemaCardio": {
            "negative": true
          }
        },
        "nervous": {
          "seizure": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "夜间咳嗽频繁，入睡困难、易醒"
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "近2天尿量较平时减少约三分之一"
          },
          "dysuria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "negative": true
          },
          "fatigue": {
            "checked": true,
            "detail": "活动减少，易疲倦"
          },
          "lymphNode": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "negative": true
          },
          "polydipsia": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体质一般，近1年患呼吸道感染3次",
        "diseaseChecks": {},
        "diseaseDetail": "否认哮喘、先天性心脏病、结核等病史，否认热性惊厥史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、水痘等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及异物误服史",
        "vaccine": "按国家免疫规划接种，卡介苗、乙肝疫苗、脊灰疫苗、百白破疫苗、麻腮风疫苗均已按程序完成，流感疫苗未接种",
        "allergy": "无",
        "relatedHistory": "否认反复肺炎及迁延性腹泻史，否认异物吸入史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "maternal": "母孕期体健，无妊娠期高血压及糖尿病，无感染及用药史，孕足月",
        "birth": "足月顺产，出生体重3.2kg，出生时无窒息及抢救史，Apgar评分正常",
        "feeding": "生后母乳喂养至10月龄，4月龄起添加辅食，由米粉、蛋黄逐步过渡至软食，现与家人同餐",
        "growth": "3月龄会抬头，6月龄会独坐，12月龄会独走，18月龄会说简单单词，现能说短句，生长发育与同龄儿相仿",
        "residence": "浙江温州",
        "travel": "否认疫区及外地旅居史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物接触史",
        "environment": "家中无吸烟者，居室通风良好，无宠物接触史",
        "habits": "入幼儿园1年，作息规律，户外活动每日约1小时",
        "sexualHistory": "",
        "occupationEnv": "学龄前儿童，在园就读"
      },
      "marriage": {
        "status": "未婚"
      },
      "family": {
        "diseaseChecks": {
          "哮喘": "哮喘"
        },
        "other": "父亲患支气管哮喘，母亲体健，否认近亲结婚",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病及免疫缺陷病史",
        "similarDisease": "否认家族中有类似反复肺炎患者",
        "infectionHistory": "否认家庭内结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "双侧颈部可触及肿大淋巴结"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "咽充血，扁桃体肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸浅快",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺可闻及湿性啰音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_pediatrics": {
          "pedExtra1": "生长发育与同龄儿相仿",
          "pedExtra2": "皮肤无黄染、花纹，毛细血管充盈良好",
          "pedExtra3": "咽充血，扁桃体肿大",
          "pedGrowth": "身高、体重、头围在同龄儿正常范围内",
          "pedFontanel": "前囟已闭",
          "pedResp": "呼吸急促",
          "pedHeart": "心率在正常范围，心音有力，律齐，未闻及杂音",
          "pedAbdomen": "腹部平软，肝脾未超出同龄儿正常范围",
          "pedNeuro": "原始反射已消失，脑膜刺激征阴性",
          "pedRickets": "未见方颅、肋骨串珠、手镯及足镯征"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 15.8×10⁹/L，N 74.2%，L 20.5%，Hb 118g/L，PLT 286×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白",
            "result": "32mg/L，降钙素原 0.35ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部正位片",
            "result": "双肺纹理增粗，右下肺野可见斑片状模糊影，边缘不清，心影大小形态正常，双侧肋膈角锐利",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "呼吸道病原体检测",
            "result": "肺炎支原体IgM阴性，呼吸道合胞病毒抗原阴性，流感病毒抗原阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血气分析",
            "result": "pH 7.38，PaO₂ 78mmHg，PaCO₂ 36mmHg，SpO₂ 96%",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "支气管肺炎",
          "急性上呼吸道感染",
          "轻度贫血"
        ]
      }
    }
  },
  {
    "key": "peritonitis",
    "dept": "surgery",
    "name": "急性弥漫性腹膜炎（消化道穿孔）",
    "alias": [
      "急性弥漫性腹膜炎",
      "消化道穿孔",
      "胃穿孔",
      "十二指肠穿孔",
      "弥漫性腹膜炎"
    ],
    "hint": "突发上腹刀割样剧痛并迅速波及全腹，全腹压痛反跳痛伴板状腹、肝浊音界消失",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "山东济南",
        "birthPlace": "山东济南",
        "occupation": "货车驾驶员",
        "reliability": "可靠",
        "chiefComplaint": "突发上腹剧痛并波及全腹6小时"
      },
      "hpi": {
        "onset": "6小时前突发上腹部刀割样剧痛，程度剧烈，难以忍受，蜷曲体位不能缓解",
        "cause": "精神紧张及过度劳累后",
        "symptoms": "疼痛起始于剑突下偏右，约2小时后迅速波及全腹，呈持续性刀割样，深呼吸、咳嗽及翻身时加剧",
        "relief": "屈膝卧位及静卧后无缓解，服铝碳酸镁咀嚼片后无减轻",
        "evolution": "6小时内腹痛由剑突下扩展至全腹，程度逐渐加重，4小时前出现发热，无疼痛间歇期",
        "accompanying": "伴恶心、呕吐胃内容物1次，伴发热、口渴",
        "negativeDiscriminating": "无呕血及黑便，无皮肤巩膜黄染，无尿频尿急尿痛，无胸痛及呼吸困难",
        "treatment": "3小时前于社区诊所予山莨菪碱10mg肌内注射、奥美拉唑40mg静脉滴注1次，腹痛无缓解，为进一步诊治急诊来院",
        "generalCondition": "发病以来精神差，未进食，睡眠差，小便量少，未解大便，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "剑突下起，迅速波及全腹，持续性刀割样"
          },
          "nausea": {
            "checked": true,
            "detail": "持续存在"
          },
          "vomiting": {
            "checked": true,
            "detail": "胃内容物1次，量少"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "完全不能进食"
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
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
            "checked": true,
            "detail": "反复反酸、烧心2年"
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "4小时前起，未测体温"
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          },
          "chestPainResp": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "腹痛发作时明显"
          },
          "chestPainCardio": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "checked": true,
            "detail": "近3小时尿量明显减少"
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素尚可",
        "diseaseChecks": {
          "消化性溃疡": true
        },
        "diseaseOther": "",
        "diseaseDetail": "十二指肠球部溃疡8年，间断服奥美拉唑，未规律复查",
        "longTermMeds": "间断口服奥美拉唑20mg每日1次，未规律服药",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期服用非甾体抗炎药及糖皮质激素史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "山东济南，否认疫区及地方病流行区居住史",
        "smoking": "有",
        "smokingAmount": "每日20支，共15年",
        "drinking": "有",
        "drinkingAmount": "每周饮白酒约250ml，共10年",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "habits": "长期饮食不规律，出车时常空腹或暴饮暴食",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "长途驾驶，作息不规律"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶体健"
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
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "皮肤黏膜苍白",
          "rash": "未见皮疹及出血点"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏"
        },
        "neck": {
          "neckResist": "颈软，无抵抗"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音消失",
          "abdPercussion": "鼓音区缩小",
          "abdPalpation": "全腹压痛、反跳痛，腹肌紧张"
        },
        "special_surgery": {
          "surgPeritoneum": "肝浊音界消失",
          "surgAbdomenMass": "腹部未触及包块",
          "surgLymph": "引流区域淋巴结未触及肿大"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 132g/L，WBC 19.4×10⁹/L，N 92%，PLT 214×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "立位腹部平片",
            "result": "双侧膈下可见游离气体影，呈新月形，肠管未见明显扩张及液气平面",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部CT",
            "result": "腹腔内大量游离气体，肝前间隙及小网膜囊内积液，十二指肠球部前壁增厚，周围脂肪间隙模糊",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血淀粉酶",
            "result": "86U/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "PT 13.2s，APTT 32.6s，INR 1.08，纤维蛋白原 3.6g/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性弥漫性腹膜炎（消化道穿孔）",
          "十二指肠球部溃疡穿孔"
        ]
      }
    }
  },
  {
    "key": "pid",
    "dept": "gynecology",
    "name": "盆腔炎性疾病（急性）",
    "alias": [
      "盆腔炎",
      "盆腔炎性疾病",
      "PID",
      "急性盆腔炎",
      "输卵管炎",
      "子宫内膜炎"
    ],
    "hint": "下腹持续疼痛伴阴道分泌物增多、发热，宫颈举痛、子宫及附件区压痛",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "informant": "本人",
        "chiefComplaint": "下腹疼痛伴阴道分泌物增多5天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "5天前月经干净后第2天无明显诱因出现下腹持续性坠痛，以右下腹为著",
        "cause": "发病前有劳累及会阴局部卫生不良，可诱发本病",
        "symptoms": "疼痛呈持续性胀坠感，程度中等，行走、久站及性交时加重，卧床休息后可略减轻",
        "relief": "自行口服布洛芬缓释胶囊0.3g每日2次，服药3天疼痛无明显缓解",
        "evolution": "近2天疼痛较前加重，伴畏寒、发热，最高体温38.6℃，阴道分泌物明显增多",
        "accompanying": "分泌物色黄、有异味，伴尿频、尿急，无尿痛，伴恶心、食欲下降",
        "negativeDiscriminating": "无阴道流血，无停经史，无晕厥及肛门坠胀感，无腹泻及里急后重，无右下腹转移性疼痛",
        "treatment": "5天前于社区卫生服务中心查血常规示白细胞升高，予头孢克肟0.1g每日2次口服，疗程3天，服药后体温一度降至正常，停药后复升，疗效不佳",
        "generalCondition": "发病以来精神稍差，食欲下降，睡眠欠佳，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "下腹持续性坠痛，右下腹为著，行走及性交时加重"
          },
          "nausea": {
            "checked": true,
            "detail": "进食后恶心，未呕吐"
          },
          "vomiting": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近3天食欲明显下降"
          },
          "jaundiceGi": {
            "negative": true
          },
          "bloating": {
            "negative": true
          }
        },
        "gu": {
          "discharge": {
            "checked": true,
            "detail": "阴道分泌物增多，色黄，有异味"
          },
          "dysuria": {
            "checked": true,
            "detail": "尿频、尿急，无尿痛"
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "flankPain": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "畏寒、发热，最高体温38.6℃"
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "negative": true
          },
          "fatigue": {
            "checked": true,
            "detail": "近2天乏力明显"
          },
          "bleeding": {
            "negative": true
          }
        },
        "endocrine": {
          "polydipsia": {
            "negative": true
          },
          "polyuriaEndo": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          }
        },
        "nervous": {
          "headache": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "dizziness": {
            "checked": true,
            "detail": "发热时感头晕，无晕厥"
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "因腹痛夜间入睡困难"
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "腰骶部酸胀，与下腹痛同时出现"
          },
          "jointPain": {
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
        "surgery": "否认手术史，否认人工流产及宫腔操作史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射线接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认不洁性接触史，否认多个性伴侣，配偶否认泌尿生殖道感染史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州",
        "travel": "否认疫区及传染病接触史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物滥用史",
        "environment": "",
        "habits": "工作久坐，饮水少，偶有憋尿习惯",
        "sexualHistory": "已婚，配偶固定，否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘、毒物及放射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "有",
        "age": "13",
        "cycle": "28",
        "duration": "5",
        "quantity": "中等",
        "color": "暗红",
        "clot": "无",
        "leukorrhea": "平素量少，色白，无异味；近5天量增多，色黄，有异味",
        "lmp": "2025年10月1日",
        "menopauseAge": "",
        "dysmenorrhea": "有，经期第1天明显，需服止痛药"
      },
      "childbirth": {
        "applicable": "有",
        "fullTerm": "0",
        "premature": "0",
        "abortion": "0",
        "alive": "0",
        "gravida": "0",
        "para": "0",
        "details": "结婚2年未避孕未孕",
        "lastBirth": "",
        "contraception": "避孕套"
      },
      "family": {
        "diseaseChecks": {},
        "other": "父母体健",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有类似疾病患者",
        "infectionHistory": "否认结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "双侧腹股沟可触及肿大淋巴结"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "舌质红、苔黄腻"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "右下腹压痛、反跳痛"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_gynecology": {
          "gynVagina": "阴道分泌物增多伴异味",
          "gynCervix": "宫颈举痛",
          "gynUterus": "子宫压痛",
          "gynAdnexa": "双附件区压痛",
          "gynTriple": "宫骶韧带增厚结节",
          "gynBreast": "双侧乳房对称，未触及肿块，乳头无溢液"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 14.2×10⁹/L，N 82.4%，Hb 118g/L，PLT 236×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "C反应蛋白",
            "result": "68mg/L，降钙素原 0.18ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血hCG",
            "result": "阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "阴道分泌物常规",
            "result": "清洁度Ⅲ度，白细胞满视野，未见滴虫及假丝酵母菌孢子",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "盆腔超声",
            "result": "子宫大小形态正常，宫腔线清晰；双附件区增厚，右侧输卵管增粗，盆腔少量积液（深约1.8cm）",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "盆腔炎性疾病（急性）",
          "右侧输卵管炎",
          "盆腔少量积液"
        ]
      }
    }
  },
  {
    "key": "preeclampsia",
    "dept": "obstetrics",
    "name": "重度子痫前期",
    "alias": [
      "子痫前期",
      "重度子痫前期",
      "妊娠期高血压疾病",
      "妊高症",
      "妊娠高血压"
    ],
    "hint": "孕晚期血压明显升高伴蛋白尿、头痛、视物模糊",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "安徽阜阳",
        "birthPlace": "安徽阜阳",
        "occupation": "个体经营",
        "reliability": "可靠",
        "informant": "本人",
        "chiefComplaint": "停经34周，头痛伴视物模糊2天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "停经34周，2天前产检时发现血压160/110mmHg，休息30分钟后复测为155/105mmHg",
        "cause": "本次妊娠未规律产检，近1个月工作劳累、睡眠不足，摄盐偏多",
        "symptoms": "此后出现持续性头部胀痛，以额枕部为主，伴视物模糊、眼前黑影，无抽搐，无上腹疼痛",
        "relief": "卧床休息后头痛稍减轻，但不能完全缓解",
        "evolution": "今日自测血压170/112mmHg，头痛加重伴恶心，无呕吐，遂来院",
        "accompanying": "伴双下肢水肿，晨起眼睑水肿，尿量较前减少，胎动较前减少",
        "negativeDiscriminating": "无抽搐及意识丧失，无右上腹疼痛，无阴道流血及流液，无皮肤瘙痒及黄疸",
        "treatment": "昨日起于当地诊所口服拉贝洛尔100mg每日2次，共服4次，血压下降不明显；未用过硫酸镁",
        "generalCondition": "发病以来精神差，食欲减退，睡眠差，尿量偏少，近1周体重增加明显",
        "extra": ""
      },
      "ros": {
        "nervous": {
          "headache": {
            "checked": true,
            "detail": "持续性额枕部胀痛，休息后不缓解"
          },
          "visualBlur": {
            "checked": true,
            "detail": "视物模糊，眼前黑影"
          },
          "dizziness": {
            "checked": true,
            "detail": "起身时头晕"
          },
          "seizure": {
            "negative": true
          },
          "sleepDisorder": {
            "negative": true
          },
          "tinnitus": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "近2天晨起恶心，未呕吐"
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "checked": true,
            "detail": "上腹部隐痛，无绞痛"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "近1周食欲减退"
          },
          "jaundiceGi": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "尿量较前减少，每日约800ml"
          },
          "edemaGu": {
            "checked": true,
            "detail": "双下肢及眼睑水肿"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "活动后心悸"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "checked": true,
            "detail": "双下肢凹陷性水肿"
          }
        },
        "resp": {
          "dyspnea": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "hemat": {
          "bleeding": {
            "negative": true
          },
          "bruise": {
            "negative": true
          },
          "pallorSkin": {
            "negative": true
          }
        },
        "endocrine": {
          "weightGain": {
            "checked": true,
            "detail": "近1周体重增加约2kg"
          },
          "polydipsia": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          },
          "jointPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认慢性高血压、糖尿病、慢性肾脏病及甲状腺疾病史，孕前及孕早期血压均正常",
        "longTermMeds": "现口服拉贝洛尔，无其他长期用药",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射线接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "3年前孕1产1，孕期无高血压及蛋白尿，足月顺产一女婴，体健",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "安徽阜阳",
        "travel": "否认疫区及传染病接触史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物滥用史",
        "environment": "",
        "habits": "口味偏咸，每日食盐量较多；近1个月经营店铺劳累，睡眠每日约5小时",
        "sexualHistory": "已婚，配偶固定，否认不洁性接触史",
        "occupationEnv": "个体经营，无粉尘、毒物及放射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "26",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "有",
        "age": "13",
        "cycle": "30",
        "duration": "5",
        "quantity": "中等",
        "color": "暗红",
        "clot": "无",
        "leukorrhea": "量少，色白，无异味",
        "lmp": "2024年12月1日，停经至今34周",
        "menopauseAge": "",
        "dysmenorrhea": "有"
      },
      "childbirth": {
        "applicable": "有",
        "fullTerm": "1",
        "premature": "0",
        "abortion": "0",
        "alive": "1",
        "gravida": "2",
        "para": "1",
        "details": "3年前足月顺产一活女婴，产程顺利，无产后出血",
        "lastBirth": "3年前",
        "contraception": "工具避孕"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true
        },
        "other": "母亲患高血压，长期服药控制",
        "deceased": "祖父母已故，死因不详",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有妊娠期高血压疾病患者",
        "infectionHistory": "否认结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑水肿",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "liverPalpation": "肝肋下未触及，肝区无压痛",
          "spleenPalpation": "脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "双下肢凹陷性水肿"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_obstetrics": {
          "obsExtra1": "宫高、腹围与孕周相符，胎位纵产式",
          "obsExtra2": "胎心音可闻及，律齐",
          "obsLeopold": "宫底为胎臀，胎背位于左侧，先露为头，未入盆",
          "obsContraction": "有不规律宫缩",
          "obsCervix": "宫颈未消，宫口未开，质地中等，位置居中",
          "obsPelvis": "骨盆外测量各径线在正常范围",
          "obsEdema": "双下肢凹陷性水肿",
          "obsBP": "血压升高伴尿蛋白阳性",
          "obsBreast": "双侧乳房对称，乳头无凹陷，无红肿及结节",
          "obsFetalMovement": "胎动减少"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "尿常规",
            "result": "尿蛋白（++），24小时尿蛋白定量2.8g，尿红细胞阴性，尿白细胞阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "Hb 108g/L，WBC 9.2×10⁹/L，N 70%，PLT 92×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝肾功能及电解质",
            "result": "ALT 68U/L，AST 52U/L，LDH 386U/L，肌酐 96μmol/L，尿酸 486μmol/L，钾 3.9mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "产科超声",
            "result": "宫内单活胎，头位，双顶径8.4cm，股骨长6.5cm，羊水指数9.2cm，胎盘Ⅱ级，胎儿估重约2150g，脐动脉S/D 3.2",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胎心监护",
            "result": "反应型，基线145次/分，可见加速，未见晚期减速",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "重度子痫前期",
          "胎儿生长受限",
          "妊娠34周 G2P1 头位"
        ]
      }
    }
  },
  {
    "key": "pregDiabetes",
    "dept": "obstetrics",
    "name": "妊娠期糖尿病",
    "alias": [
      "妊娠期糖尿病",
      "GDM",
      "妊娠糖尿病",
      "糖耐量异常（妊娠期）"
    ],
    "hint": "孕中期糖耐量试验异常，伴多饮、多尿、胎儿偏大",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏南通",
        "birthPlace": "江苏南通",
        "occupation": "教师",
        "reliability": "可靠",
        "informant": "本人",
        "chiefComplaint": "停经28周，多饮多尿伴胎儿偏大2周",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "停经24周行75g口服葡萄糖耐量试验，空腹血糖5.6mmol/L，服糖后1小时10.8mmol/L，2小时9.2mmol/L",
        "cause": "孕前体重偏重，孕期活动量少，喜食甜食及精制米面，母亲患2型糖尿病",
        "symptoms": "近2周自觉口干多饮，每日饮水量约2500ml，夜尿2～3次，尿量增多",
        "relief": "控制甜食后口干稍减轻，多尿无明显改善",
        "evolution": "孕26周复查空腹血糖5.9mmol/L，餐后2小时血糖8.6mmol/L；孕27周超声提示胎儿腹围大于同孕周第90百分位",
        "accompanying": "伴易饥、乏力，无明显消瘦，无外阴瘙痒",
        "negativeDiscriminating": "无多食伴体重下降，无恶心呕吐，无腹痛及阴道流血，无头痛及视物模糊，无胎动异常",
        "treatment": "孕24周确诊后予医学营养治疗，每日主食控制在200g左右，分5～6餐；孕25周起自测指尖血糖，空腹5.2～5.8mmol/L，餐后2小时7.4～8.6mmol/L，未用胰岛素",
        "generalCondition": "发病以来精神可，食欲好，睡眠因夜尿增多受影响，大便正常，孕期体重增长偏多",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "polydipsia": {
            "checked": true,
            "detail": "口干多饮，每日饮水约2500ml"
          },
          "polyuriaEndo": {
            "checked": true,
            "detail": "夜尿2～3次，尿量增多"
          },
          "polyphagia": {
            "checked": true,
            "detail": "易饥，餐后2～3小时即感饥饿"
          },
          "weightLoss": {
            "negative": true
          },
          "weightGain": {
            "checked": true,
            "detail": "孕期体重增长偏多，近1个月增加约2kg"
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          },
          "hairChange": {
            "negative": true
          }
        },
        "gu": {
          "polyuria": {
            "checked": true,
            "detail": "昼夜尿量均增多，夜尿2～3次"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "discharge": {
            "checked": true,
            "detail": "白带量稍多，色白，无明显异味"
          },
          "edemaGu": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          }
        },
        "nervous": {
          "visualBlur": {
            "negative": true
          },
          "numbness": {
            "checked": true,
            "detail": "偶有双足趾麻木"
          },
          "dizziness": {
            "negative": true
          },
          "headache": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "餐前偶感乏力"
          },
          "anemia": {
            "negative": true
          },
          "pruritus": {
            "negative": true
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "backPain": {
            "checked": true,
            "detail": "久站后腰部酸胀"
          }
        }
      },
      "pmh": {
        "health": "平素体健，孕前体重偏重",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、冠心病、慢性肾脏病及甲状腺疾病史，孕前未查过血糖",
        "longTermMeds": "孕期服用叶酸至孕3个月、多糖铁复合物，无其他长期用药",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射线接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认不良孕产史及既往巨大儿分娩史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "江苏南通",
        "travel": "否认疫区及传染病接触史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物滥用史",
        "environment": "",
        "habits": "喜甜食及精制米面，孕前每日久坐超过8小时，孕期活动量偏少",
        "sexualHistory": "已婚，配偶固定，否认不洁性接触史",
        "occupationEnv": "中学教师，无粉尘、毒物及放射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "30",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "有",
        "age": "14",
        "cycle": "32",
        "duration": "5",
        "quantity": "中等",
        "color": "暗红",
        "clot": "无",
        "leukorrhea": "量稍多，色白，无异味",
        "lmp": "2025年4月12日，停经至今28周",
        "menopauseAge": "",
        "dysmenorrhea": "无"
      },
      "childbirth": {
        "applicable": "有",
        "fullTerm": "0",
        "premature": "0",
        "abortion": "1",
        "alive": "0",
        "gravida": "2",
        "para": "0",
        "details": "4年前孕7周自然流产1次，行清宫术，术后恢复可",
        "lastBirth": "",
        "contraception": "未避孕"
      },
      "family": {
        "diseaseChecks": {
          "糖尿病": true,
          "高血压": true
        },
        "other": "母亲患2型糖尿病12年，口服二甲双胍控制；父亲患高血压",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "母亲有妊娠期糖尿病史",
        "infectionHistory": "否认结核、肝炎等传染病接触史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "肥胖",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "面容自然",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "liverPalpation": "肝肋下未触及，肝区无压痛",
          "spleenPalpation": "脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_obstetrics": {
          "obsExtra1": "宫高与孕周不符",
          "obsExtra2": "胎心音可闻及，律齐",
          "obsLeopold": "宫底为胎臀，胎背位于左侧，先露为头，未入盆",
          "obsContraction": "无规律宫缩，子宫无压痛",
          "obsCervix": "宫颈未消，宫口未开，质地中等，位置居中",
          "obsPelvis": "骨盆外测量各径线在正常范围",
          "obsEdema": "双下肢无水肿，体重增长在正常范围",
          "obsBP": "血压正常，尿蛋白阴性",
          "obsBreast": "双侧乳房对称，乳头无凹陷，无红肿及结节",
          "obsFetalMovement": "胎动正常，胎心监护反应型"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "75g口服葡萄糖耐量试验",
            "result": "空腹5.6mmol/L，服糖后1小时10.8mmol/L，服糖后2小时9.2mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "空腹及餐后血糖",
            "result": "空腹5.9mmol/L，早餐后2小时8.6mmol/L，午餐后2小时7.8mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "糖化血红蛋白",
            "result": "5.8%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规",
            "result": "尿蛋白阴性，尿糖（+），尿酮体阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "产科超声",
            "result": "宫内单活胎，头位，双顶径7.4cm，腹围26.8cm，股骨长5.3cm，羊水指数16.2cm，胎盘Ⅰ级，胎儿估重约1480g，腹围大于同孕周第90百分位",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "妊娠期糖尿病",
          "妊娠28周 G2P0 头位",
          "胎儿偏大（大于同孕周第90百分位）"
        ]
      }
    }
  },
  {
    "key": "pregnancy",
    "dept": "obstetrics",
    "name": "妊娠待产（孕38周 G1P0）",
    "alias": [
      "妊娠待产",
      "足月妊娠",
      "孕38周",
      "G1P0",
      "待产",
      "正常妊娠"
    ],
    "hint": "停经38周，下腹规律阵痛伴见红，无阴道流血流液",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "公司职员",
        "reliability": "可靠",
        "informant": "本人",
        "chiefComplaint": "停经38周，下腹阵痛伴见红3小时",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": ""
      },
      "hpi": {
        "onset": "停经38周，3小时前出现下腹规律阵痛，间隔约5～6分钟，持续约30秒",
        "cause": "无明显诱因，孕早期于我院建卡并规律产检",
        "symptoms": "腹痛呈阵发性下坠感，伴少量阴道血性分泌物",
        "relief": "休息后宫缩不能缓解，改变体位亦无减轻",
        "evolution": "宫缩间隔由10分钟逐渐缩短至5～6分钟，强度逐渐增强",
        "accompanying": "伴腰骶部酸胀、下腹坠胀，胎动正常，无恶心呕吐",
        "negativeDiscriminating": "无阴道大量流血，无阴道流液，无头痛、视物模糊，无上腹不适及皮肤瘙痒",
        "treatment": "孕期规律产检9次，孕28周起口服多糖铁复合物0.1g每日1次，疗程8周，复查血红蛋白维持在110g/L以上，疗效可",
        "generalCondition": "发病以来精神可，食欲正常，睡眠因宫缩受影响，大小便正常，孕期体重增长在正常范围",
        "extra": ""
      },
      "ros": {
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "孕早期晨起恶心，偶有呕吐，孕3个月后自行缓解"
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "checked": true,
            "detail": "下腹阵发性坠痛，间隔5～6分钟"
          },
          "diarrhea": {
            "negative": true
          },
          "constipation": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          },
          "jaundiceGi": {
            "negative": true
          }
        },
        "gu": {
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "discharge": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "dyspnea": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "negative": true
          },
          "fatigue": {
            "negative": true
          },
          "bleeding": {
            "negative": true
          }
        },
        "endocrine": {
          "polydipsia": {
            "negative": true
          },
          "polyuriaEndo": {
            "negative": true
          },
          "weightGain": {
            "negative": true
          }
        },
        "nervous": {
          "headache": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          },
          "sleepDisorder": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "腰骶部酸胀，随宫缩加重"
          },
          "jointPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、心脏病及慢性肾脏病病史",
        "longTermMeds": "孕期服用多糖铁复合物，无其他长期用药",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及放射线接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认不良孕产史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江温州",
        "travel": "否认疫区及传染病接触史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒品及成瘾性药物滥用史",
        "environment": "",
        "habits": "生活规律，饮食可，孕期坚持适量活动",
        "sexualHistory": "已婚，配偶固定，否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘、毒物及放射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "28",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "menstruation": {
        "applicable": "有",
        "age": "14",
        "cycle": "28",
        "duration": "5",
        "quantity": "中等",
        "color": "暗红",
        "clot": "无",
        "leukorrhea": "量少，色白，无异味",
        "lmp": "2025年1月20日，停经至今38周",
        "menopauseAge": "",
        "dysmenorrhea": "无"
      },
      "childbirth": {
        "applicable": "有",
        "fullTerm": "0",
        "premature": "0",
        "abortion": "0",
        "alive": "0",
        "gravida": "1",
        "para": "0",
        "details": "",
        "lastBirth": "",
        "contraception": "未避孕"
      },
      "family": {
        "diseaseChecks": {},
        "other": "父母体健",
        "deceased": "祖父母、外祖父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有类似疾病患者",
        "infectionHistory": "否认结核、肝炎等传染病接触史"
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
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部膨隆",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "liverPalpation": "肝肋下未触及，肝区无压痛",
          "spleenPalpation": "脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        },
        "special_obstetrics": {
          "obsExtra1": "宫高、腹围与孕周相符，胎位纵产式",
          "obsExtra2": "胎心音可闻及，律齐",
          "obsLeopold": "先露已入盆",
          "obsContraction": "规律宫缩",
          "obsCervix": "宫颈部分消退",
          "obsPelvis": "骨盆外测量各径线在正常范围",
          "obsEdema": "双下肢无水肿，体重增长在正常范围",
          "obsBP": "血压正常，尿蛋白阴性",
          "obsBreast": "双侧乳房对称，乳头无凹陷，无红肿及结节",
          "obsFetalMovement": "胎动正常，胎心监护反应型"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "Hb 112g/L，WBC 9.8×10⁹/L，N 72%，PLT 198×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规",
            "result": "尿蛋白阴性，尿糖阴性，尿酮体阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "产科超声",
            "result": "宫内单活胎，头位，双顶径9.2cm，股骨长7.1cm，羊水指数12.6cm，胎盘Ⅱ级",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胎心监护",
            "result": "反应型，可见加速，无晚期减速及变异减速",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "妊娠38周 G1P0 头位待产",
          "单活胎"
        ]
      }
    }
  },
  {
    "key": "ptx",
    "dept": "respiratory",
    "name": "自发性气胸（右侧，闭合性）",
    "alias": [
      "气胸",
      "自发性气胸",
      "原发性自发性气胸",
      "闭合性气胸",
      "肺压缩"
    ],
    "hint": "瘦高青年突发一侧胸痛后气促，患侧胸廓饱满、语颤减弱、叩诊过清音、呼吸音减弱，气管向健侧移位，胸片见外带无肺纹理、肺压缩约 60%",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "山东济南",
        "birthPlace": "山东济南",
        "occupation": "大学生",
        "reliability": "可靠",
        "chiefComplaint": "突发右侧胸痛伴气促6小时",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "6小时前在教室自习安静状态下突发右侧胸部尖锐刺痛，持续约数分钟后稍缓解，随即出现气促",
        "cause": "发病前无剧烈运动、无外伤及用力屏气，无咳嗽及发热，近期备考熬夜、睡眠不足",
        "symptoms": "胸痛位于右侧前胸及腋下，为尖锐刺痛，吸气及咳嗽时加重，可放射至右肩部；气促与活动相关，平地行走数十米即需停下休息，卧床时可稍缓解，无端坐呼吸",
        "relief": "卧床休息后气促稍减轻，胸痛无缓解",
        "evolution": "入院前2小时气促加重，讲话需停顿，同事送至急诊",
        "accompanying": "伴干咳，无痰，轻度心慌",
        "negativeDiscriminating": "无发热及寒战，无咳脓痰及咯血，无粉红色泡沫样痰，无夜间阵发性呼吸困难及双下肢水肿，无长期卧床及单侧下肢肿胀史，无胸部外伤及剧烈运动史，无既往类似发作",
        "treatment": "急诊予鼻导管吸氧及镇痛对症处理，未使用抗生素及支气管扩张剂，胸片后行胸腔穿刺抽气",
        "generalCondition": "发病以来精神紧张，食欲尚可，睡眠因胸痛及气促受影响，大小便正常，体重无明显变化",
        "extra": "急诊胸片示右侧气胸，肺压缩约60%，纵隔向左侧移位，遂收入院行胸腔闭式引流"
      },
      "ros": {
        "resp": {
          "chestPainResp": {
            "checked": true,
            "detail": "突发右侧前胸及腋下尖锐刺痛，吸气及咳嗽时加重，可放射至右肩"
          },
          "dyspnea": {
            "checked": true,
            "detail": "活动后气促，平地行走数十米需停下休息，讲话需停顿"
          },
          "cough": {
            "checked": true,
            "detail": "干咳，无痰"
          },
          "hemoptysis": {
            "negative": true
          },
          "sputum": {
            "negative": true
          },
          "fever": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "nightSweat": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "轻度心慌"
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病史；否认慢性支气管炎、哮喘及肺结核病史；否认既往气胸发作史",
        "longTermMeds": "无长期口服药物",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认胸部外伤及肋骨骨折史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及有害气体接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认吸烟及被动吸烟史，否认家族中气胸及结缔组织疾病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "山东济南，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认粉尘、石棉及放射性物质接触史",
        "environment": "",
        "habits": "",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "在校大学生，无工业毒物及粉尘接触，近期备考、久坐、作息不规律"
      },
      "marriage": {
        "status": "未婚",
        "age": "",
        "spouseHealth": "",
        "sexLife": "",
        "relation": ""
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管向左侧移位"
        },
        "chest": {
          "chestShape": "胸廓不对称",
          "lungInspect": "呼吸运动减弱",
          "lungPalpation": "语颤减弱",
          "lungAuscultation": "呼吸音减弱",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_respiratory": {
          "respShape": "一侧呼吸运动减弱",
          "respAccessory": "可见辅助呼吸肌参与呼吸运动",
          "respPercussion": "局部叩诊过清音",
          "respVocalFremitus": "患侧语音震颤减弱",
          "respChestExpansion": "一侧肺下界移动度消失",
          "respBreathSound": "双肺呼吸音减弱",
          "respCyanosis": "无杵状指，无球结膜水肿"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "胸部X线片",
            "result": "右侧胸腔外带见无肺纹理透亮区，内缘见外凸弧形气胸线，右肺被压缩至肺门旁、压缩约60%，纵隔及气管向左侧移位，左肺未见异常",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部CT（平扫）",
            "result": "右侧胸腔大量积气，右肺压缩约60%，右肺尖见数个小肺大疱，未见明显肺实质浸润及胸膜腔积液",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动脉血气分析",
            "result": "pH 7.46，PaO2 68mmHg，PaCO2 34mmHg，SaO2 94%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及凝血功能",
            "result": "WBC 9.2×10⁹/L，中性粒细胞 72.6%，Hb 146g/L，PLT 226×10⁹/L；PT 11.8秒，APTT 28.6秒",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“突发右侧胸痛伴气促6小时”入院。6小时前安静状态下突发右侧前胸尖锐刺痛，吸气及咳嗽时加重，随即出现气促，平地行走数十米即需休息；既往体健，无胸部外伤及剧烈运动史。查体：急性病容，气管向左侧移位，胸廓不对称，右侧呼吸运动及语颤减弱，局部叩诊过清音，双肺呼吸音减弱，患侧肺下界移动度消失，可见辅助呼吸肌参与呼吸运动。胸片示右侧外带无肺纹理透亮区、外凸弧形气胸线，右肺压缩约60%，纵隔向左侧移位；CT示右肺尖小肺大疱。无发热及咳脓痰、无咯血，可与肺炎鉴别；无粉红色泡沫样痰、无夜间阵发性呼吸困难及双下肢水肿，可与急性左心衰竭鉴别",
      "soap": {
        "a": {
          "basisDetail": [
            {
              "diagnosis": "自发性气胸（右侧，闭合性）",
              "history": "瘦高体型青年，安静状态下突发右侧前胸尖锐刺痛，吸气及咳嗽时加重，随即出现气促；既往无胸部外伤及剧烈运动史，无类似发作史",
              "pe": "急性病容，气管向左侧移位，胸廓不对称，右侧呼吸运动及语颤减弱，局部叩诊过清音，双肺呼吸音减弱，患侧肺下界移动度消失",
              "aux": "胸部X线片示右侧胸腔外带无肺纹理透亮区、外凸弧形气胸线，右肺压缩约60%，纵隔及气管向左侧移位；胸部CT示右肺尖小肺大疱"
            },
            {
              "diagnosis": "低氧血症",
              "history": "气促，平地行走数十米即需休息，讲话需停顿",
              "pe": "急性病容，可见辅助呼吸肌参与呼吸运动",
              "aux": "动脉血气分析 pH 7.46，PaO2 68mmHg，PaCO2 34mmHg，SaO2 94%"
            }
          ]
        }
      },
      "diagnosis": {
        "confirmed": [
          "自发性气胸（右侧，闭合性）",
          "低氧血症"
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
    "key": "schizophrenia",
    "dept": "psychiatry",
    "name": "精神分裂症（偏执型）",
    "alias": [
      "精神分裂症",
      "偏执型精神分裂症",
      "分裂症",
      "思觉失调"
    ],
    "hint": "青壮年起病，幻听与被害妄想并存，自知力缺失，社会功能明显受损",
    "record": {
      "basic": {
        "marital": "未婚",
        "nationality": "汉族",
        "nativePlace": "河南洛阳",
        "birthPlace": "河南洛阳",
        "occupation": "无业",
        "reliability": "尚可靠",
        "informant": "患者母亲",
        "chiefComplaint": "凭空闻声、疑人害己1年"
      },
      "hpi": {
        "onset": "1年前无明显诱因渐起，夜间独处时诉耳边有人说话，内容多为议论和辱骂自己",
        "cause": "毕业后求职受挫、独自在外租房居住后",
        "symptoms": "坚信邻居与同事串通要害自己，认为饭菜被人下毒，拒绝进食家中以外送来的食物，多次报警称被跟踪",
        "relief": "独处房间、关紧门窗时稍感安全，余无缓解方式",
        "evolution": "近半年加重，对家人亦起疑，曾持刀守在门口不许母亲外出，夜间几乎不眠",
        "accompanying": "情感反应平淡，对家人受伤住院亦无相应关切，生活懒散，需家人督促洗漱更衣",
        "negativeDiscriminating": "无发热、头痛、呕吐及抽搐，无颅脑外伤史，无长期饮酒及吸食新型毒品史，无持续情绪高涨或持续情绪低落发作",
        "treatment": "半年前于当地精神专科医院门诊就诊，予奥氮平10mg每晚口服，因自觉「没病」服药1个月后自行停药，停药后症状加重",
        "generalCondition": "发病以来精神差，睡眠差，饮食需督促，生活懒散，体重较前下降，社会功能明显受损，无法工作",
        "extra": ""
      },
      "ros": {
        "nervous": {
          "hallucination": {
            "checked": true,
            "detail": "以言语性幻听为主，夜间明显，诉「有人隔着墙骂我」"
          },
          "behaviorAbnormal": {
            "checked": true,
            "detail": "曾持刀守门，夜间外出行走，反复报警"
          },
          "sleepDisorder": {
            "checked": true,
            "detail": "入睡困难，夜间仅睡2～3小时，白天困倦"
          },
          "memoryLoss": {
            "negative": true
          },
          "moodLow": {
            "negative": true
          },
          "anxiety": {
            "negative": true
          },
          "suicidal": {
            "negative": true
          },
          "tremor": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "dizziness": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          }
        },
        "gi": {
          "appetiteLoss": {
            "checked": true,
            "detail": "因怀疑饭菜被下毒而拒食，体重下降"
          },
          "vomiting": {
            "negative": true
          }
        },
        "joint": {
          "backPain": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史，否认癫痫及颅脑外伤史",
        "longTermMeds": "否认长期服用激素、抗结核药及其他药物史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认一氧化碳中毒及农药接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认既往精神障碍发作史及精神科住院史",
        "otherTreatDiseases": "",
        "special": "否认长期饮酒史，否认吸食大麻、冰毒等精神活性物质史"
      },
      "personal": {
        "residence": "河南洛阳，否认疫区及地方病流行区居住史",
        "smoking": "有",
        "smokingAmount": "每日约10支，共5年",
        "drinking": "无",
        "drugs": "否认乙醇依赖及吸食大麻、苯丙胺类物质史",
        "habits": "日常起居需家人督促，白天多卧床或来回踱步，夜间常独自外出，几乎不与朋友来往",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "毕业后从事销售工作半年即离职，现无业，无粉尘及毒物接触",
        "premorbidPersonality": "内向、孤僻、敏感多疑，不善与人交往，遇事易往坏处想",
        "stressEvent": "1年前求职受挫并独自在外租房，与家人联系减少"
      },
      "marriage": {
        "status": "未婚"
      },
      "family": {
        "diseaseChecks": {
          "精神病": true
        },
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病病史",
        "similarDisease": "外祖母年轻时有「精神失常」史，未系统诊治",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病家族史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "conscious": "神志清楚，精神一般"
        },
        "special_psychiatry": {
          "psyAppearance": "衣着不整，接触被动",
          "psyOrientation": "定向力完整，意识清晰",
          "psySpeech": "言语零乱，答不切题",
          "psyThoughtForm": "思维散漫",
          "psyThoughtContent": "被害妄想",
          "psyPerception": "幻听",
          "psyMood": "情感淡漠",
          "psyCognition": "记忆、计算与理解力尚可",
          "psyInsight": "自知力缺失，否认有病",
          "psyBehavior": "冲动毁物行为"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "头颅MRI",
            "result": "脑实质未见异常信号，脑室系统无扩大，未见占位性病变",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺功能",
            "result": "FT3 4.9pmol/L，FT4 16.1pmol/L，TSH 1.8mIU/L，均在正常范围",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，QT间期0.38s，大致正常心电图",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "WBC 6.4×10⁹/L，N 62%，Hb 132g/L，PLT 218×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "阳性与阴性症状量表（PANSS）",
            "result": "总分86分，阳性症状分明显升高，供病情评估与随访比较",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "精神分裂症（偏执型）",
          "社会功能受损"
        ]
      }
    }
  },
  {
    "key": "sepsis",
    "dept": "emergency",
    "name": "脓毒症（胆道感染继发）",
    "alias": [
      "脓毒症",
      "sepsis",
      "全身感染",
      "脓毒性休克",
      "感染性休克"
    ],
    "hint": "寒战高热伴右上腹痛、意识淡漠、呼吸急促 —— 感染灶继发脓毒症，需警惕脓毒性休克",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "山东潍坊",
        "birthPlace": "山东潍坊",
        "occupation": "农民",
        "reliability": "家属代诉，基本可靠",
        "chiefComplaint": "寒战、高热伴右上腹疼痛",
        "chiefComplaintDuration": "3",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "3天前进食油腻食物后出现右上腹持续性胀痛，2小时后出现寒战、高热，体温最高40.1℃，伴恶心、呕吐胃内容物2次",
        "cause": "起病前1天曾进食大量油炸食物，既往有胆囊结石病史5年，间断右上腹不适",
        "symptoms": "腹痛为持续性胀痛，向右肩背部放射，无缓解体位；寒战与高热交替，热退时大汗淋漓；尿量较平日减少，色深黄",
        "relief": "自服布洛芬混悬液10ml后体温可暂降至38.5℃，约3小时后复升，腹痛无缓解",
        "evolution": "近12小时精神明显转差，由烦躁转为嗜睡，呼之能应但答话迟缓，家属诉其「说胡话」一次；呼吸逐渐急促",
        "accompanying": "伴口干、皮肤湿冷，无呕血、黑便，无胸痛咳嗽",
        "negativeDiscriminating": "无胸痛及咯血，无腹泻及里急后重，无皮肤黄染，无尿频尿急尿痛，无头痛呕吐及肢体抽搐",
        "treatment": "2天前于当地卫生院静滴头孢呋辛1.5g每日2次、补液500ml，症状无缓解；昨日加用地塞米松5mg静推1次，体温短暂下降后复升",
        "generalCondition": "发病以来精神差，由烦躁渐转为嗜睡，食欲明显下降，近24小时尿量约400ml，大便未解",
        "extra": ""
      },
      "ros": {
        "resp": {
          "chills": {
            "checked": true,
            "detail": "寒战与高热交替，热退时大汗"
          },
          "fever": {
            "checked": true,
            "detail": "体温最高40.1℃，3天"
          },
          "dyspnea": {
            "checked": true,
            "detail": "近12小时呼吸急促，稍活动即感气短"
          },
          "cough": {
            "negative": true
          },
          "sputum": {
            "negative": true
          },
          "chestPainResp": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          }
        },
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "右上腹持续性胀痛，向右肩背部放射"
          },
          "nausea": {
            "checked": true,
            "detail": "恶心，呕吐胃内容物2次"
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐胃内容物2次，非喷射性"
          },
          "jaundiceGi": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "melena": {
            "negative": true
          },
          "hematemesis": {
            "negative": true
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲明显下降，3天几乎未进食"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "心跳加快，自觉心慌"
          },
          "chestPainCardio": {
            "negative": true
          },
          "syncope": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "近24小时尿量约400ml，色深黄"
          },
          "dysuria": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "起身时头晕，家属诉其答话迟缓"
          },
          "headache": {
            "negative": true
          },
          "seizure": {
            "negative": true
          },
          "weakness": {
            "checked": true,
            "detail": "全身乏力，四肢无力"
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          }
        },
        "hemat": {
          "bleeding": {
            "negative": true
          },
          "bruise": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平时体健，近5年反复右上腹不适",
        "diseaseChecks": {
          "胆囊结石": true,
          "糖尿病": true
        },
        "diseaseDetail": "2型糖尿病6年，平素口服二甲双胍0.5g每日2次，空腹血糖波动于8～11mmol/L，未规律监测",
        "longTermMeds": "二甲双胍0.5g每日2次口服，服法规律",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期饮酒史，否认胆道手术史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于山东潍坊，否认疫区及地方病流行区久居史",
        "maternal": "",
        "birth": "足月顺产，出生体重正常",
        "feeding": "母乳喂养",
        "growth": "生长发育与同龄人相仿",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认毒物及有机磷农药接触史",
        "environment": "",
        "habits": "喜食油腻，饮食不规律，体力活动少",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "田间劳动，无粉尘及射线接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中有胆道疾病及糖尿病患者",
        "infectionHistory": "否认结核、肝炎等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "舌质红、苔黄腻"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸浅快",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "上腹部压痛，无反跳痛"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_emergency": {
          "emExtra1": "休克表现",
          "emConscious": "神志清楚，双侧瞳孔等大等圆，对光反射灵敏",
          "emAirway": "气道通畅，呼吸平稳，双肺呼吸音对称",
          "emCirculation": "脉搏细速",
          "emShock": "休克指数0.5～1.0",
          "emSkin": "皮肤湿冷",
          "emAbdomen": "腹部压痛"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规+CRP+PCT",
            "result": "WBC 21.4×10⁹/L，N 89%，Hb 128g/L，PLT 112×10⁹/L；CRP 186mg/L；PCT 12.4ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血培养（抗菌药物使用前）",
            "result": "需氧瓶培养48小时报告革兰阴性杆菌生长，后鉴定为大肠埃希菌，对头孢曲松敏感",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝功能与胆道酶学",
            "result": "ALT 96U/L，AST 82U/L，总胆红素 24.6μmol/L，直接胆红素 12.1μmol/L，ALP 168U/L，GGT 214U/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部超声",
            "result": "胆囊 92mm×38mm，壁厚 5mm 呈双边，腔内可见多枚强回声伴声影，最大约 12mm；胆总管上段轻度扩张，直径 7mm",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "动脉血气分析+乳酸",
            "result": "pH 7.31，PaO₂ 68mmHg，PaCO₂ 31mmHg，HCO₃⁻ 18mmol/L，乳酸 4.8mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "脓毒症（胆道感染继发）",
          "急性结石性胆囊炎",
          "2型糖尿病"
        ]
      }
    }
  },
  {
    "key": "shock",
    "dept": "emergency",
    "name": "失血性休克（外伤性脾破裂）",
    "alias": [
      "失血性休克",
      "休克",
      "脾破裂",
      "外伤性脾破裂",
      "低血容量性休克"
    ],
    "hint": "外伤后左上腹痛、面色苍白、脉搏细速、腹穿不凝血 —— 提示腹腔实质脏器破裂出血并发失血性休克",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河南周口",
        "birthPlace": "河南周口",
        "occupation": "建筑工人",
        "reliability": "患者本人陈述，家属补充，可靠",
        "chiefComplaint": "外伤后左上腹疼痛伴头晕、心悸",
        "chiefComplaintDuration": "5",
        "chiefComplaintDurationUnit": "小时"
      },
      "hpi": {
        "onset": "5小时前骑电动车摔倒，左上腹撞击车把，当即感左上腹持续性胀痛，尚能自行站起",
        "cause": "5小时前车祸外伤，左上腹钝性撞击，无皮肤破损",
        "symptoms": "腹痛为持续性胀痛，向左肩部放射，蜷曲体位可稍缓解；伤后1小时站立时突发头晕、眼前发黑，短暂意识丧失约10秒后自行清醒；伴心悸、口干",
        "relief": "卧倒休息后头晕稍减轻，腹痛无缓解；来院途中予平卧位、鼻导管吸氧3L/min",
        "evolution": "近2小时面色渐苍白，心悸加重，说话无力，四肢发凉，头晕由活动后出现转为静卧时亦存在",
        "accompanying": "伴恶心2次，未呕吐；无呕血、黑便，无胸痛及呼吸困难，无血尿",
        "negativeDiscriminating": "无头痛及喷射性呕吐，无四肢麻木及活动障碍，无发热寒战，无腹泻及里急后重",
        "treatment": "伤后未用止血药物，当地卫生院建立静脉通路输注复方氯化钠500ml，头晕无改善；未输血",
        "generalCondition": "伤后精神差，未进食，排尿1次量约100ml、色深黄，未解大便"
      },
      "ros": {
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "平卧时稍感气短，坐起可缓解"
          },
          "cough": {
            "negative": true
          },
          "chestPainResp": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "心悸，活动后加重"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "syncope": {
            "checked": true,
            "detail": "伤后1小时站立时短暂意识丧失约10秒"
          }
        },
        "gi": {
          "abdominalPain": {
            "checked": true,
            "detail": "左上腹持续性胀痛，向左肩部放射"
          },
          "nausea": {
            "checked": true,
            "detail": "恶心2次，未呕吐"
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
          }
        },
        "gu": {
          "oliguria": {
            "checked": true,
            "detail": "伤后5小时仅排尿1次，量约100ml"
          },
          "hematuria": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "站立时头晕、眼前发黑"
          },
          "weakness": {
            "checked": true,
            "detail": "四肢无力，说话无力"
          },
          "headache": {
            "negative": true
          },
          "seizure": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "checked": true,
            "detail": "面色苍白，家人诉较平日明显"
          },
          "fatigue": {
            "checked": true,
            "detail": "乏力明显，不愿活动"
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "左肩部酸痛，活动尚可"
          }
        }
      },
      "pmh": {
        "health": "平素体健，从事建筑工作，无慢性病用药",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病、血液病及肝病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "5小时前左上腹钝性外伤（电动车车把撞击）",
        "transfusion": "否认输血及输血反应史",
        "poisoning": "否认毒物及农药接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认长期饮酒史，否认服用抗凝及抗血小板药物",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于河南周口，否认疫区及地方病流行区久居史",
        "maternal": "",
        "birth": "足月顺产，出生体重正常",
        "feeding": "",
        "growth": "生长发育与同龄人相仿",
        "smoking": "有",
        "smokingAmount": "吸烟10年，每日约10支",
        "drinking": "无",
        "drugs": "否认毒物及药物滥用史",
        "environment": "",
        "habits": "长期从事建筑体力劳动，饮食不规律",
        "sexualHistory": "",
        "occupationEnv": "建筑工地作业，有高处坠落及钝性外伤风险"
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
        "similarDisease": "否认家族中有血液病及肿瘤患者",
        "infectionHistory": "否认结核、肝炎等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "被动体位",
          "face": "贫血面容",
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "口唇及肢端发绀",
          "rash": "未见皮疹及出血点",
          "spider": "未见蜘蛛痣及肝掌",
          "elasticity": "皮肤弹性减退",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "headShape": "头颅大小、形态正常，无压痛及包块",
          "hair": "毛发分布均匀",
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大",
          "teeth": "口腔黏膜无溃疡，舌质淡红、苔薄白"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸浅快",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartPalpation": "心尖搏动无抬举性，未触及震颤",
          "heartPercussion": "心界不大",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音减弱",
          "abdPercussion": "移动性浊音阳性",
          "abdPalpation": "全腹压痛、反跳痛，腹肌紧张"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_emergency": {
          "emExtra1": "休克表现",
          "emExtra2": "腹部闭合性损伤",
          "emConscious": "神志清楚，双侧瞳孔等大等圆，对光反射灵敏",
          "emAirway": "气道通畅，呼吸平稳，双肺呼吸音对称",
          "emCirculation": "脉搏细速",
          "emShock": "休克指数>1.0",
          "emTraumaABC": "活动性出血",
          "emTraumaSurvey": "腹部压痛",
          "emSkin": "皮肤湿冷",
          "emAbdomen": "腹膜刺激征阳性"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "血常规",
            "result": "WBC 14.2×10⁹/L，N 82%，Hb 58g/L，PLT 148×10⁹/L，红细胞压积 18%",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹腔穿刺",
            "result": "左下腹穿刺抽出暗红色不凝血 5ml，放置 5 分钟不凝固",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "床旁超声（FAST）",
            "result": "脾周及左结肠旁沟可见无回声区，深约 42mm，脾实质回声不均，考虑脾破裂合并腹腔积血",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "腹部CT（平扫+增强）",
            "result": "脾包膜下及脾周血肿，腹腔积血，脾实质强化不均，提示脾破裂（Ⅳ级）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血型与交叉配血",
            "result": "O型，Rh阳性，抗体筛查阴性，已备红细胞悬液4U",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "失血性休克（外伤性脾破裂）",
          "脾破裂（Ⅳ级）",
          "失血性贫血（重度）"
        ]
      }
    }
  },
  {
    "key": "stone",
    "dept": "nephrology",
    "name": "输尿管结石伴肾绞痛",
    "alias": [
      "输尿管结石",
      "肾绞痛",
      "泌尿系结石",
      "尿石症"
    ],
    "hint": "突发一侧腰腹部绞痛向会阴放射，辗转不安，伴血尿，CT 见输尿管结石伴积水",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江西南昌",
        "birthPlace": "江西南昌",
        "occupation": "货车司机",
        "reliability": "可靠",
        "chiefComplaint": "突发右侧腰腹部绞痛伴肉眼血尿6小时",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "小时"
      },
      "hpi": {
        "onset": "6小时前开车途中突发右侧腰部刀割样疼痛，阵发性加剧，难以忍受，坐卧不安、辗转不止",
        "cause": "发病前1天长时间驾驶，饮水少、憋尿时间长；既往有泌尿系结石病史",
        "symptoms": "疼痛位于右侧腰部，向下腹部及会阴部放射，每次发作持续20～40分钟后稍缓解，间隔十余分钟再次发作；排尿时尿道刺痛，尿色呈洗肉水样",
        "relief": "改变体位及热敷不能缓解，疼痛发作时伴大汗",
        "evolution": "近2小时疼痛发作更频繁，伴恶心并呕吐2次，为胃内容物",
        "accompanying": "伴大汗、心慌",
        "negativeDiscriminating": "无发热及寒战，无尿频尿急尿痛，无排便异常及里急后重，无腹泻，无腹肌紧张及反跳痛，无黄疸，无腰背部外伤史，无长期服用磺胺类及过量维生素C史",
        "treatment": "急诊予山莨菪碱10mg肌内注射、双氯芬酸钠栓50mg纳肛，疼痛部分缓解；未使用强阿片类镇痛药",
        "generalCondition": "发病以来精神紧张，未进食，睡眠缺失，小便量少色深，大便正常，体重无明显变化",
        "extra": "急诊完善泌尿系 CT 平扫及尿常规后收入院"
      },
      "ros": {
        "gu": {
          "flankPain": {
            "checked": true,
            "detail": "右侧腰部刀割样绞痛，向会阴部放射"
          },
          "hematuria": {
            "checked": true,
            "detail": "尿色呈洗肉水样"
          },
          "dysuria": {
            "checked": true,
            "detail": "排尿时尿道刺痛"
          },
          "oliguria": {
            "checked": true,
            "detail": "6小时内仅排尿1次，量约150ml"
          },
          "polyuria": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "伴恶心"
          },
          "vomiting": {
            "checked": true,
            "detail": "呕吐2次为胃内容物"
          },
          "abdominalPain": {
            "checked": true,
            "detail": "右下腹牵涉痛，与腰痛相连"
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
            "checked": true,
            "detail": "疼痛发作期间未进食"
          }
        },
        "resp": {
          "fever": {
            "negative": true
          },
          "chills": {
            "negative": true
          },
          "cough": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "疼痛发作时心慌"
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "右侧腰部疼痛，活动受限"
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "疼痛剧烈时头晕"
          },
          "headache": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病病史；3年前曾排出结石1枚，未行成分分析；否认反复尿路感染史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认腰背部外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认长期服用磺胺类、乙酰唑胺及过量维生素C、钙剂史；否认痛风及甲状旁腺疾病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于江西南昌，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟12年，每日约20支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮啤酒每周3～4次，每次约500ml",
        "drugs": "否认有毒有害物质接触史",
        "environment": "长期在车内高温环境工作",
        "habits": "每日饮水量约800ml，喜食高蛋白及高盐饮食，长时间驾驶常憋尿",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "货运驾驶工作，久坐，饮水不便"
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
        "similarDisease": "父亲曾患泌尿系结石",
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
          "cooperation": "查体欠合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "elasticity": "皮肤弹性良好",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
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
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "胸腰椎叩击痛"
        },
        "special_nephrology": {
          "renalPercussion": "右肾区叩击痛",
          "renalTenderPoint": "中输尿管点压痛",
          "renalBladder": "膀胱未触及，耻骨上区无压痛",
          "renalFacialEdema": "颜面无水肿，双眼睑无水肿",
          "renalLegEdema": "双下肢无水肿",
          "renalBP": "血压正常，双上肢对称"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "泌尿系CT平扫",
            "result": "右侧输尿管上段（L3椎体水平）见一枚直径约0.6cm高密度结石影，其上右肾盂肾盏扩张积水，右肾周脂肪间隙模糊；左肾及膀胱未见异常",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "尿常规",
            "result": "外观淡红色，尿蛋白 1+，尿潜血 3+，红细胞满视野/HP，白细胞 8～12/HP，未见管型",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及肾功能",
            "result": "WBC 11.2×10⁹/L，N 78%，Hb 148g/L；血肌酐 96μmol/L，尿素氮 6.1mmol/L，尿酸 468μmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "泌尿系超声",
            "result": "右肾集合系统分离约1.4cm，右输尿管上段可见强回声伴声影，左肾及膀胱未见异常",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "右侧输尿管上段结石伴右肾积水",
          "肾绞痛",
          "高尿酸血症"
        ]
      }
    }
  },
  {
    "key": "stroke",
    "dept": "neurology",
    "name": "急性缺血性脑卒中（左侧大脑中动脉）",
    "alias": [
      "脑梗死",
      "脑梗塞",
      "缺血性脑卒中",
      "脑卒中",
      "中风",
      "急性脑血管病",
      "CIS"
    ],
    "hint": "突发偏侧肢体无力、言语不清，头颅CT未见出血，DWI见高信号",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江温州",
        "birthPlace": "浙江温州",
        "occupation": "退休工人",
        "reliability": "可靠",
        "chiefComplaint": "突发右侧肢体无力伴言语不清3小时",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "小时"
      },
      "hpi": {
        "onset": "3小时前晨起时无明显诱因出现右侧肢体无力，右手不能持物，右下肢不能抬离床面，同时出现言语含糊不清，症状持续不缓解",
        "cause": "既往高血压病史10年，平素服药不规律，血压控制不佳；3年前发现心房颤动，未规律抗凝",
        "symptoms": "右侧上下肢无力程度较重，上肢不能抬起、手指不能伸直，下肢不能在床面移动；言语含糊，能听懂他人问话，但只能说出简短词句，不能成句；无肢体疼痛",
        "relief": "卧床休息后症状无减轻",
        "evolution": "症状在1小时内进行性加重，出现口角向左歪斜，家属发现后立即送至急诊",
        "accompanying": "伴头晕、右侧面部及右侧肢体麻木",
        "negativeDiscriminating": "无剧烈头痛，无呕吐，无意识丧失及肢体抽搐，无发热，无胸痛及心悸加重，无大小便失禁，无外伤史",
        "treatment": "急诊予阿司匹林300mg嚼服、阿托伐他汀钙40mg口服，甘露醇125ml静脉滴注，并监测血压、指尖血糖，症状无明显好转",
        "generalCondition": "发病以来神志清楚，未进食，睡眠如常，小便正常，大便未解，体重无明显变化",
        "extra": "发病至入院时间3小时，在静脉溶栓时间窗内"
      },
      "ros": {
        "nervous": {
          "weakness": {
            "checked": true,
            "detail": "右侧上下肢无力，进行性加重"
          },
          "speech": {
            "checked": true,
            "detail": "言语含糊，仅能说出简短词句"
          },
          "numbness": {
            "checked": true,
            "detail": "右侧面部及肢体麻木"
          },
          "headache": {
            "negative": true
          },
          "seizure": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "syncopeNerve": {
            "negative": true
          },
          "incontinence": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "阵发性心悸3年，未规律服药"
          }
        },
        "resp": {
          "fever": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健，生活自理",
        "diseaseChecks": {
          "高血压": true
        },
        "diseaseDetail": "高血压病史10年，最高血压达180/110mmHg，长期口服苯磺酸氨氯地平5mg每日1次，未规律监测；3年前心电图发现心房颤动，未规律抗凝治疗",
        "longTermMeds": "苯磺酸氨氯地平5mg每日1次口服，近1年服药不规律",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认糖尿病、高脂血症病史，否认吸烟、饮酒史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江温州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "environment": "",
        "habits": "口味偏咸，喜食腌制食品，活动量少",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "退休前从事纺织车间工作，无粉尘及放射性物质接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "24",
        "spouseHealth": "配偶体健",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {
          "高血压": true
        },
        "other": "",
        "deceased": "父亲因脑卒中去世，73岁；母亲健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神可",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartPercussion": "心界向左下扩大"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "radialPulse": "脉搏短绌"
        },
        "nervousPE": {
          "babinski": "巴氏征阳性"
        },
        "special_neurology": {
          "neuroExtra1": "失语",
          "neuroExtra2": "面瘫",
          "neuroExtra3": "偏瘫",
          "neuroExtra4": "偏身感觉减退",
          "neuroGait": "偏瘫步态",
          "neuroAutonomic": "皮肤划痕试验阴性，出汗正常，无体位性低血压"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "头颅CT（平扫）",
            "result": "左侧基底节区见片状低密度影，边界模糊，未见高密度出血灶，脑沟变浅，中线结构居中",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅MRI（DWI、FLAIR）",
            "result": "左侧基底节区及放射冠见斑片状异常信号，DWI呈明显高信号，ADC图信号减低，符合急性脑梗死",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "心房颤动，心室率绝对不齐，未见ST-T动态改变",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "NIHSS评分",
            "result": "12分（意识0分、凝视1分、视野0分、面瘫2分、右上肢3分、右下肢2分、共济0分、感觉1分、语言2分、构音1分、忽视0分）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "凝血功能",
            "result": "PT 11.8s，INR 1.02，APTT 28.6s，纤维蛋白原 3.2g/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性缺血性脑卒中（左侧大脑中动脉供血区）",
          "高血压病3级（极高危）",
          "心房颤动"
        ]
      }
    }
  },
  {
    "key": "tb",
    "dept": "respiratory",
    "name": "继发性肺结核（右上肺，涂阳，初治）",
    "alias": [
      "肺结核",
      "继发性肺结核",
      "浸润性肺结核",
      "涂阳肺结核",
      "结核病"
    ],
    "hint": "咳嗽咳痰 2 月余伴咯血，午后低热、盗汗、乏力、体重下降；右上肺叩诊浊音伴湿啰音，CT 见上叶尖后段斑片影及空洞，痰抗酸染色阳性",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "河南信阳",
        "birthPlace": "河南信阳",
        "occupation": "建筑工人",
        "reliability": "可靠",
        "chiefComplaint": "咳嗽、咳痰2月余，痰中带血半月",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "2月前无明显诱因出现咳嗽、咳少量白色黏痰，自认为「感冒」，未就诊",
        "cause": "起病前1月曾在集体宿舍居住，同住工友中有长期咳嗽者，否认明确结核病人接触史，无糖尿病及长期使用糖皮质激素史",
        "symptoms": "咳嗽为阵发性单声咳，夜间及晨起明显，痰量每日约30ml，为白色黏液痰，近半月痰中带血，每日2至3次，量少；午后及傍晚出现低热，体温波动于37.3至37.8度，夜间入睡后出汗、醒后汗止，需更换衣物",
        "relief": "自服复方甘草片及阿莫西林胶囊0.5g每日3次共7天，咳嗽及低热均无缓解",
        "evolution": "近1月乏力明显，上楼时气促，遂来门诊就诊",
        "accompanying": "伴乏力、食欲减退，无明显胸痛及呼吸困难",
        "negativeDiscriminating": "无高热及寒战，无咯大量鲜血，无胸痛及呼吸困难，无下肢水肿及长期卧床史，无糖尿病及长期使用糖皮质激素史，无腹泻及腹痛",
        "treatment": "门诊已制定异烟肼0.3g每日1次、利福平0.45g每日1次、吡嗪酰胺0.5g每日3次、乙胺丁醇0.75g每日1次联合抗结核方案，尚未开始服药，等待痰菌结果期间先行保肝及对症治疗",
        "generalCondition": "发病以来精神差，食欲明显减退，夜间盗汗影响睡眠，大小便正常，体重下降约5kg",
        "extra": "门诊已按《中华人民共和国传染病防治法》乙类传染病要求于24小时内完成网络直报，嘱其居家隔离、佩戴口罩，家属行胸片筛查"
      },
      "ros": {
        "resp": {
          "cough": {
            "checked": true,
            "detail": "咳嗽2月余，夜间及晨起明显"
          },
          "sputum": {
            "checked": true,
            "detail": "白色黏液痰，每日约30ml，近半月痰中带血"
          },
          "hemoptysis": {
            "checked": true,
            "detail": "痰中带血半月，每日2至3次，量少"
          },
          "nightSweat": {
            "checked": true,
            "detail": "夜间入睡后出汗、醒后汗止，需更换衣物"
          },
          "fever": {
            "checked": true,
            "detail": "午后低热，体温波动于37.3至37.8度"
          },
          "dyspnea": {
            "checked": true,
            "detail": "近1月上楼时气促"
          },
          "chestPainResp": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          }
        },
        "hemat": {
          "anemia": {
            "negative": true
          }
        },
        "endocrine": {
          "weightLoss": {
            "checked": true,
            "detail": "1月内体重下降约5kg"
          }
        },
        "nervous": {
          "insomnia": {
            "checked": true,
            "detail": "夜间盗汗影响睡眠"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病史；否认病毒性肝炎、肝硬化病史；否认既往结核病史及抗结核治疗史",
        "longTermMeds": "无长期口服药物，否认长期使用糖皮质激素及免疫抑制剂",
        "infection": "否认肝炎等传染病史；本次为首次发现肺部结核病灶，否认既往结核病史",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及有害气体接触史",
        "vaccine": "幼年接种卡介苗，成年后未复种",
        "allergy": "无",
        "relatedHistory": "否认糖尿病、硅肺、胃大部切除术后等结核易感因素，否认酗酒",
        "otherTreatDiseases": "",
        "special": "同住工友中有长期咳嗽者，已建议其就诊筛查"
      },
      "personal": {
        "residence": "河南信阳，近2年在城市集体宿舍居住，否认疫区及地方病流行区久居史",
        "smoking": "有",
        "smokingAmount": "吸烟15年，每日约20支，未戒烟",
        "drinking": "有",
        "drinkingAmount": "饮白酒10年，每日约150ml，未戒酒",
        "drugs": "否认粉尘、石棉及放射性物质接触史",
        "environment": "集体宿舍居住，房间通风较差、人员密集",
        "habits": "",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "建筑工地务工10年，有长期水泥粉尘接触史，工作强度大、营养及休息欠佳"
      },
      "marriage": {
        "status": "已婚",
        "age": "23",
        "spouseHealth": "配偶体健，胸片未见异常",
        "sexLife": "正常",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认家族中结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养不良",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "慢性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "双侧颈部可触及肿大淋巴结"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤增强",
          "lungPercussion": "局部叩诊浊音",
          "lungAuscultation": "双肺可闻及湿性啰音",
          "heartInspect": "心前区无隆起，心尖搏动位置正常，未超出正常范围",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_respiratory": {
          "respVocalResonance": "患侧语音共振增强",
          "respChestExpansion": "肺下界移动度减小",
          "respCyanosis": "无杵状指，无球结膜水肿"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "胸部CT（平扫）",
            "result": "右上肺尖后段见斑片状、斑点状高密度影，密度不均，其内见空洞形成，壁较厚，周围见卫星灶及树芽征，右下肺背段见少量播散灶",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "痰涂片抗酸染色",
            "result": "连续三次痰涂片抗酸染色均阳性（1+至2+），痰结核分枝杆菌培养阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "结核感染T细胞检测（T-SPOT.TB）",
            "result": "阳性，每孔斑点数明显高于阴性对照，提示存在结核分枝杆菌感染",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及红细胞沉降率",
            "result": "WBC 7.8×10⁹/L，中性粒细胞 68.2%，Hb 112g/L，PLT 268×10⁹/L，ESR 68mm/h",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "肝肾功能",
            "result": "ALT 28U/L，AST 24U/L，总胆红素 12μmol/L，肌酐 68μmol/L，尿素氮 5.2mmol/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "summary": "患者因“咳嗽、咳痰2月余，痰中带血半月”入院。2月前起阵发性咳嗽、咳白色黏液痰，近半月痰中带血，伴午后低热（37.3至37.8度）、夜间盗汗、乏力，1月内体重下降约5kg。吸烟15年，集体宿舍居住，同住工友有长期咳嗽者。查体：营养不良，慢性病容，双侧颈部可触及肿大淋巴结，右上肺语颤增强、局部叩诊浊音、双肺可闻及湿性啰音，肺下界移动度减小。胸部CT示右上肺尖后段斑片状影伴空洞及卫星灶；痰涂片抗酸染色三次阳性；T-SPOT.TB阳性；ESR 68mm/h，Hb 112g/L。无高热及寒战、无咯大量鲜血，可与细菌性肺炎鉴别；无腹泻及腹痛，可与克罗恩病、淋巴瘤等鉴别",
      "soap": {
        "a": {
          "basisDetail": [
            {
              "diagnosis": "继发性肺结核（右上肺，涂片阳性，初治）",
              "history": "咳嗽咳痰2月余、痰中带血半月，伴午后低热、夜间盗汗、乏力、1月内体重下降约5kg；吸烟15年，集体宿舍居住，同住工友有长期咳嗽者",
              "pe": "营养不良，慢性病容，双侧颈部可触及肿大淋巴结，右上肺语颤增强、局部叩诊浊音，双肺可闻及湿性啰音，肺下界移动度减小",
              "aux": "胸部CT示右上肺尖后段斑片状、斑点状高密度影伴厚壁空洞及卫星灶、树芽征，右下肺背段少量播散灶；连续三次痰涂片抗酸染色阳性；T-SPOT.TB阳性；ESR 68mm/h"
            },
            {
              "diagnosis": "慢性病贫血",
              "history": "慢性感染消耗，病程2月余",
              "pe": "",
              "aux": "血常规Hb 112g/L，WBC 7.8×10⁹/L，血小板正常范围"
            }
          ]
        }
      },
      "diagnosis": {
        "confirmed": [
          "继发性肺结核（右上肺，涂片阳性，初治）",
          "慢性病贫血"
        ]
      }
    }
  },
  {
    "key": "thyroidNodule",
    "dept": "surgery",
    "name": "甲状腺结节（TI-RADS 4a，拟手术）",
    "alias": [
      "甲状腺结节",
      "甲状腺肿物",
      "颈前肿物",
      "甲状腺瘤"
    ],
    "hint": "颈前无痛性肿物缓慢增大，随吞咽上下移动，超声示低回声结节伴微钙化",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江宁波",
        "birthPlace": "浙江宁波",
        "occupation": "中学教师",
        "reliability": "可靠",
        "chiefComplaint": "发现颈前肿物1年"
      },
      "hpi": {
        "onset": "1年前洗脸时无意中发现颈前偏右肿物，约花生米大小，无疼痛及触痛",
        "cause": "无诱因，无意中发现",
        "symptoms": "肿物位于颈前偏右，缓慢增大，现约3cm大小，质韧，表面光滑，边界清楚，随吞咽上下移动，局部皮肤无红肿",
        "relief": "未服用任何药物治疗，肿物无自行缩小",
        "evolution": "近半年肿物增大较前明显",
        "accompanying": "伴颈部轻度胀感，长时间讲话后明显",
        "negativeDiscriminating": "无声音嘶哑，无吞咽困难及呼吸不畅，无怕热、多汗、心悸及手抖，无体重明显下降，无发热，无饮水呛咳",
        "treatment": "2周前于我院门诊查甲状腺超声示右叶低回声结节，TI-RADS 4a，甲状腺功能正常；1周前行细针穿刺细胞学检查示Bethesda Ⅳ类，为进一步手术治疗收入院",
        "generalCondition": "发病以来精神、食欲、睡眠可，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "endocrine": {
          "neckMass": {
            "checked": true,
            "detail": "颈前偏右肿物，1年来缓慢增大"
          },
          "weightLoss": {
            "negative": true
          },
          "weightGain": {
            "negative": true
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          },
          "hairLoss": {
            "negative": true
          },
          "polydipsia": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "negative": true
          },
          "cough": {
            "negative": true
          },
          "hoarseness": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "negative": true
          },
          "chestPainCardio": {
            "negative": true
          }
        },
        "gi": {
          "appetiteLoss": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "nausea": {
            "negative": true
          }
        },
        "nervous": {
          "tremor": {
            "negative": true
          },
          "weakness": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "negative": true
          },
          "lymphNode": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseOther": "",
        "diseaseDetail": "否认高血压、糖尿病、冠心病等慢性病史",
        "longTermMeds": "无长期服药史",
        "infection": "否认肝炎、结核、伤寒等传染病史",
        "surgery": "否认手术史",
        "trauma": "否认颈部外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "relatedHistory": "否认童年期头颈部放射线照射史，否认甲状腺疾病家族史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "浙江宁波，否认疫区及地方病流行区居住史",
        "smoking": "无",
        "drinking": "无",
        "drugs": "否认铅、汞等重金属及有机磷农药接触史",
        "habits": "饮食规律，平素碘盐摄入正常，无偏食",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事教学工作，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "25",
        "spouseHealth": "配偶体健"
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
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺可触及结节",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动",
          "trachea": "气管居中"
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
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "special_surgery": {
          "surgLymph": "引流区域淋巴结未触及肿大",
          "surgExtra1": "手术区域皮肤完整，无红肿及分泌物"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "甲状腺功能",
            "result": "FT3 4.6pmol/L，FT4 15.2pmol/L，TSH 2.18mIU/L，均在正常范围；TGAb、TPOAb 阴性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺及颈部超声",
            "result": "右叶见低回声结节，大小约2.8cm×2.1cm，边界欠清，形态欠规则，内见点状强回声（微钙化），TI-RADS 4a；颈部未见肿大淋巴结",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "甲状腺结节细针穿刺细胞学",
            "result": "涂片细胞丰富，见异型滤泡上皮细胞，可疑乳头状癌，Bethesda Ⅳ类",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "血红蛋白 132g/L，WBC 6.2×10⁹/L，N 60%，PLT 224×10⁹/L",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "电子喉镜",
            "result": "双侧声带活动对称，声门闭合良好，未见新生物",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "甲状腺结节（TI-RADS 4a）",
          "右甲状腺结节（Bethesda Ⅳ类）"
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
  },
  {
    "key": "uti",
    "dept": "nephrology",
    "name": "急性肾盂肾炎",
    "alias": [
      "急性肾盂肾炎",
      "上尿路感染",
      "泌尿系感染",
      "尿路感染"
    ],
    "hint": "寒战高热伴尿频尿急尿痛，肾区叩击痛阳性，尿培养见大肠埃希菌",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "浙江金华",
        "birthPlace": "浙江金华",
        "occupation": "小学教师",
        "reliability": "可靠",
        "chiefComplaint": "突发寒战、发热伴尿频尿急尿痛2天",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "天"
      },
      "hpi": {
        "onset": "2天前无明显诱因出现尿频，每日排尿10余次，每次尿量少，伴尿道烧灼样疼痛及明显尿急，憋不住尿",
        "cause": "发病前3天因工作繁忙饮水少、有憋尿习惯；无导尿及泌尿系器械操作史",
        "symptoms": "当日下午出现寒战，随后体温升至39.2℃，伴右侧腰部持续性胀痛，叩击时加重；尿液浑浊，有异味，未见肉眼血尿",
        "relief": "多饮水后尿痛稍减轻，退热药可短暂降温",
        "evolution": "入院前1天热峰升至39.5℃，寒战频繁，腰痛加剧，不能直立行走，伴恶心未吐",
        "accompanying": "伴乏力、食欲差、恶心",
        "negativeDiscriminating": "无肉眼血尿，无排尿困难及尿线中断，无腰腹部绞痛及向会阴放射痛，无腹泻及里急后重，无阴道分泌物增多，无皮疹及关节痛，无近期泌尿系手术及留置导尿史",
        "treatment": "社区诊所予左氧氟沙星0.5g每日1次口服2天，体温未控制，腰痛加重，遂来我院急诊；入院后改为静脉抗感染并留取尿培养",
        "generalCondition": "发病以来精神差，食欲明显减退，睡眠因腰痛及排尿频繁受影响，大便正常，体重无明显变化",
        "extra": "入院当日留取清洁中段尿培养及药敏，完善泌尿系超声除外梗阻"
      },
      "ros": {
        "gu": {
          "dysuria": {
            "checked": true,
            "detail": "排尿时尿道烧灼样疼痛"
          },
          "discharge": {
            "checked": true,
            "detail": "尿道口少量分泌物，尿液浑浊有异味"
          },
          "flankPain": {
            "checked": true,
            "detail": "右侧腰部持续性胀痛，叩击加重"
          },
          "hematuria": {
            "negative": true
          },
          "oliguria": {
            "negative": true
          },
          "polyuria": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          }
        },
        "resp": {
          "fever": {
            "checked": true,
            "detail": "体温最高39.5℃，持续2天"
          },
          "chills": {
            "checked": true,
            "detail": "寒战频繁，每日2～3次"
          },
          "cough": {
            "negative": true
          },
          "soreThroat": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "伴恶心，未呕吐"
          },
          "vomiting": {
            "negative": true
          },
          "diarrhea": {
            "negative": true
          },
          "abdominalPain": {
            "checked": true,
            "detail": "右下腹隐痛，与腰痛相连"
          },
          "appetiteLoss": {
            "checked": true,
            "detail": "食欲明显减退"
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "全身乏力"
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "发热时心慌"
          }
        },
        "joint": {
          "backPain": {
            "checked": true,
            "detail": "右侧腰部疼痛，活动受限"
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认糖尿病、慢性肾脏病、泌尿系结石病史；否认反复尿路感染史",
        "longTermMeds": "无长期服药史；近2天服左氧氟沙星0.5g每日1次",
        "infection": "否认肝炎、结核等传染病史",
        "surgery": "否认手术史；否认留置导尿及膀胱镜检查史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "否认食物、药物过敏史；否认喹诺酮类药物过敏",
        "relatedHistory": "否认妊娠；否认阴道炎及盆腔炎病史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于浙江金华，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认有毒有害物质接触史",
        "environment": "",
        "habits": "工作期间饮水少，常有憋尿习惯，每日饮水量约800ml",
        "sexualHistory": "已婚，否认不洁性接触史",
        "occupationEnv": "小学教学工作，无粉尘及放射性物质接触"
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
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神差",
          "posture": "被动体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
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
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及",
          "kidneyPalpation": "季肋点压痛"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常"
        },
        "special_nephrology": {
          "renalPercussion": "右肾区叩击痛",
          "renalTenderPoint": "上输尿管点压痛",
          "renalBladder": "耻骨上区压痛",
          "renalFacialEdema": "颜面无水肿，双眼睑无水肿",
          "renalLegEdema": "双下肢无水肿",
          "renalBP": "血压正常，双上肢对称"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "尿常规",
            "result": "外观浑浊，尿蛋白 1+，尿潜血 1+，白细胞满视野/HP，红细胞 5～8/HP，亚硝酸盐阳性",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "清洁中段尿培养及药敏",
            "result": "大肠埃希菌生长，菌落计数 >10⁵CFU/ml，对左氧氟沙星耐药、对头孢曲松敏感",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规及炎症指标",
            "result": "WBC 15.2×10⁹/L，N 88%，Hb 122g/L，PLT 210×10⁹/L；CRP 96mg/L，PCT 1.8ng/ml",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "泌尿系超声",
            "result": "双肾大小形态正常，皮髓质分界清晰，双侧肾盂肾盏未见扩张积水，未见结石及占位",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "急性肾盂肾炎",
          "大肠埃希菌尿路感染"
        ]
      }
    }
  },
  {
    "key": "valve",
    "dept": "cardiology",
    "name": "风湿性心脏瓣膜病 主动脉瓣关闭不全（重度）",
    "alias": [
      "心脏瓣膜病",
      "风湿性心脏病",
      "主动脉瓣关闭不全",
      "主动脉瓣反流",
      "瓣膜病"
    ],
    "hint": "活动后心悸气短、头部搏动感，主动脉瓣区可闻及舒张期杂音，水冲脉阳性、心界向左下扩大",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "湖南长沙",
        "birthPlace": "湖南长沙",
        "occupation": "小学教师",
        "reliability": "可靠",
        "chiefComplaint": "活动后心悸、气短3年，加重1个月"
      },
      "hpi": {
        "onset": "3年前开始出现快步走或上三楼时心悸、气短，休息数分钟可缓解，未系统诊治",
        "cause": "无明显诱因，劳累及上呼吸道感染后加重",
        "symptoms": "心悸为心前区搏动感，安静时亦能感觉到心跳，伴头部随心跳搏动感；气短以活动后为著，尚能平卧",
        "relief": "休息后可缓解，未规律服药；1个月前受凉后症状加重，当地诊所予利尿、扩血管治疗后可减轻",
        "evolution": "近1个月气短加重，上二楼即感气促，偶有夜间憋醒需坐起片刻，无咯粉红色泡沫痰",
        "accompanying": "伴乏力、活动耐力下降，偶有体位性头晕，无胸痛，无黑矇及晕厥",
        "negativeDiscriminating": "无胸痛及压榨样不适，无咯血，无持续发热，无关节红肿热痛，无环形红斑及皮下结节，无黑矇及晕厥，无夜间不能平卧及双下肢水肿，无尿量减少",
        "treatment": "1周前门诊心脏超声提示主动脉瓣重度反流、左心室扩大，为进一步诊治收入院",
        "generalCondition": "发病以来精神可，食欲正常，睡眠欠佳，大小便正常，体重无明显变化",
        "extra": ""
      },
      "ros": {
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "心前区搏动感，安静时亦能感觉到心跳，活动后明显"
          },
          "syncope": {
            "checked": true,
            "detail": "久蹲后站起时头晕，无黑矇及意识丧失"
          },
          "chestPainCardio": {
            "negative": true
          },
          "orthopnea": {
            "negative": true
          },
          "edemaCardio": {
            "negative": true
          },
          "cyanosis": {
            "negative": true
          },
          "intermittentClaudication": {
            "negative": true
          },
          "edemaSys": {
            "negative": true
          }
        },
        "resp": {
          "dyspnea": {
            "checked": true,
            "detail": "活动后气短，上二楼即感气促，尚能平卧"
          },
          "cough": {
            "negative": true
          },
          "hemoptysis": {
            "negative": true
          },
          "pleurisy": {
            "negative": true
          },
          "wheeze": {
            "negative": true
          },
          "fever": {
            "negative": true
          }
        },
        "gi": {
          "nausea": {
            "negative": true
          },
          "vomiting": {
            "negative": true
          },
          "abdominalPain": {
            "negative": true
          },
          "appetiteLoss": {
            "negative": true
          },
          "melena": {
            "negative": true
          }
        },
        "gu": {
          "oliguria": {
            "negative": true
          },
          "edemaGu": {
            "negative": true
          },
          "hematuria": {
            "negative": true
          },
          "nocturia": {
            "negative": true
          },
          "dysuria": {
            "negative": true
          }
        },
        "hemat": {
          "fatigue": {
            "checked": true,
            "detail": "活动耐力进行性下降，上二楼即需休息"
          },
          "anemia": {
            "negative": true
          }
        },
        "endocrine": {
          "weightGain": {
            "negative": true
          },
          "weightLoss": {
            "negative": true
          },
          "heatIntolerance": {
            "negative": true
          },
          "coldIntolerance": {
            "negative": true
          }
        },
        "nervous": {
          "dizziness": {
            "checked": true,
            "detail": "体位变动时头晕，无黑矇及意识丧失"
          },
          "syncopeNerve": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "insomnia": {
            "checked": true,
            "detail": "夜间易醒，入睡尚可"
          }
        },
        "joint": {
          "jointPain": {
            "negative": true
          },
          "morningStiff": {
            "negative": true
          },
          "muscleWeak": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "既往体健，可胜任教学工作",
        "diseaseChecks": {},
        "diseaseOther": "",
        "diseaseDetail": "青少年时期曾有反复咽痛、发热，未规律诊治；否认风湿热及舞蹈症病史记载",
        "longTermMeds": "间断口服氢氯噻嗪 25mg 每日1次、单硝酸异山梨酯 20mg 每日2次",
        "infection": "否认肝炎、结核、伤寒等传染病史；近半年无咽痛及发热",
        "surgery": "否认手术史",
        "trauma": "否认外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及特殊化学物质接触史",
        "vaccine": "按计划预防接种",
        "allergy": "无",
        "allergenChecks": {},
        "allergenOther": "",
        "allergenReactionChecks": {},
        "allergyReaction": "",
        "relatedHistory": "否认高血压、糖尿病、冠心病史；否认静脉药物滥用史；否认拔牙及侵入性操作后发热史",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "湖南长沙，否认疫区及地方病流行区长期居住史",
        "travel": "",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认毒物、粉尘及放射性物质接触史",
        "environment": "",
        "habits": "生活规律，饮食清淡，日常活动量中等",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "从事小学教学工作28年，以站立授课为主，无粉尘及电离辐射接触"
      },
      "marriage": {
        "status": "已婚",
        "age": "25",
        "spouseHealth": "配偶体健",
        "sexLife": "近半年因气短减少",
        "relation": "和睦"
      },
      "family": {
        "diseaseChecks": {},
        "other": "",
        "deceased": "父母均健在",
        "threeGeneration": "两系三代否认遗传性疾病史",
        "similarDisease": "家族中无类似疾病患者",
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
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "thyroid": "甲状腺无肿大",
          "neckVessel": "颈动脉搏动增强",
          "trachea": "气管居中"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungInspect": "呼吸运动对称，节律规整",
          "lungPalpation": "语颤对称，无胸膜摩擦感",
          "lungPercussion": "双肺叩诊清音，肺下界位置正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartInspect": "心尖搏动向左下移位",
          "heartPalpation": "可触及抬举性心尖搏动",
          "heartPercussion": "心界向左下扩大",
          "heartAuscultation": "主动脉瓣区可闻及舒张期杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音",
          "abdPercussion": "自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性",
          "abdPalpation": "腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常",
          "limbs": "四肢无畸形，关节无红肿，活动自如"
        },
        "special_cardiology": {
          "cardioApex": "心尖搏动向左下移位",
          "cardioThrill": "可触及舒张期震颤",
          "cardioBorder": "心界向左下扩大",
          "cardioRate": "心率正常，心律齐",
          "cardioHeartSound": "第一心音减弱",
          "cardioMurmur": "主动脉瓣区可闻及舒张期杂音",
          "cardioPericardium": "未闻及心包摩擦音",
          "cardioJVP": "肝颈静脉回流征阴性",
          "cardioPeripheralSign": "水冲脉阳性",
          "cardioEdema": "双下肢无水肿"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "心脏超声",
            "result": "主动脉瓣增厚、回声增强，舒张期见重度反流束；左心室舒张末期内径 66mm，左心室射血分数 56%；提示主动脉瓣重度关闭不全，左心室扩大",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "心电图",
            "result": "窦性心律，心率 82次/分，左心室高电压，ST-T 改变（Ⅰ、aVL、V5、V6 导联 ST 段压低）",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "胸部X线片",
            "result": "心影向左下扩大，主动脉结突出，肺纹理清晰，未见肺淤血征象",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血沉及抗链球菌溶血素O",
            "result": "血沉 12mm/h，抗链球菌溶血素O ＜200IU/mL，C反应蛋白 3.2mg/L，提示目前无风湿活动",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "血常规",
            "result": "白细胞 6.4×10^9/L，中性粒细胞百分比 62%，血红蛋白 132g/L，血小板 210×10^9/L",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "风湿性心脏瓣膜病 主动脉瓣关闭不全（重度）",
          "左心室扩大",
          "心功能Ⅱ级（NYHA 分级）"
        ]
      }
    }
  },
  {
    "key": "vertigo",
    "dept": "neurology",
    "name": "良性阵发性位置性眩晕（后半规管）",
    "alias": [
      "良性阵发性位置性眩晕",
      "耳石症",
      "BPPV",
      "位置性眩晕"
    ],
    "hint": "头位改变诱发短暂眩晕，伴特征性眼震，无耳鸣听力下降及中枢体征",
    "record": {
      "basic": {
        "marital": "已婚",
        "nationality": "汉族",
        "nativePlace": "江苏苏州",
        "birthPlace": "江苏苏州",
        "occupation": "会计",
        "reliability": "可靠",
        "chiefComplaint": "反复发作性眩晕伴恶心2周",
        "chiefComplaintDuration": "",
        "chiefComplaintDurationUnit": "周"
      },
      "hpi": {
        "onset": "2周前夜间翻身时突发旋转性眩晕，自觉自身旋转、周围景物晃动，持续约30秒后自行缓解",
        "cause": "多在躺下、起床、翻身及抬头晾衣时诱发，与体位改变关系明确；发病前有连续熬夜加班史",
        "symptoms": "每次发作持续数十秒，最长不超过1分钟，发作时不敢睁眼，需立即制动；发作间期无不适，日常行走如常，但快速转头时仍有短暂头昏",
        "relief": "保持头部不动、静坐数分钟后缓解，闭眼休息可减轻",
        "evolution": "近1周发作频次增多，每日3～4次，程度较前加重，因惧怕发作而不敢独自出门",
        "accompanying": "伴恶心，发作时呕吐1次，伴冷汗、心悸",
        "negativeDiscriminating": "无耳鸣、耳闷及听力下降，无耳流脓，无头痛，无言语不清及肢体无力，无面部麻木及吞咽困难，无行走不稳，无黑矇及意识丧失",
        "treatment": "社区医院按「颈椎病」予氟桂利嗪5mg每晚口服1周，症状无明显缓解，遂来诊",
        "generalCondition": "发病以来精神略紧张，食欲尚可，睡眠因惧怕夜间发作而变差，大小便正常，体重无明显变化",
        "extra": "门诊行Dix-Hallpike试验右侧诱发典型眼震，随即行Epley手法复位"
      },
      "ros": {
        "nervous": {
          "vertigo": {
            "checked": true,
            "detail": "体位改变诱发旋转性眩晕，持续数十秒"
          },
          "dizziness": {
            "checked": true,
            "detail": "发作间期快速转头时短暂头昏"
          },
          "tinnitus": {
            "negative": true
          },
          "hearingLoss": {
            "negative": true
          },
          "headache": {
            "negative": true
          },
          "visualBlur": {
            "negative": true
          },
          "numbness": {
            "negative": true
          },
          "weakness": {
            "negative": true
          },
          "speech": {
            "negative": true
          },
          "syncopeNerve": {
            "negative": true
          },
          "seizure": {
            "negative": true
          }
        },
        "cardio": {
          "palpitation": {
            "checked": true,
            "detail": "发作时伴心悸，数分钟后缓解"
          }
        },
        "gi": {
          "nausea": {
            "checked": true,
            "detail": "发作时恶心，呕吐1次"
          },
          "vomiting": {
            "checked": true,
            "detail": "发作时呕吐1次为胃内容物"
          }
        },
        "resp": {
          "fever": {
            "negative": true
          }
        }
      },
      "pmh": {
        "health": "平素体健",
        "diseaseChecks": {},
        "diseaseDetail": "否认高血压、糖尿病、冠心病病史；否认头部外伤及中耳炎病史；否认偏头痛病史",
        "longTermMeds": "氟桂利嗪5mg每晚口服1周（近期）",
        "infection": "否认肝炎、结核等传染病史；近1个月无上呼吸道感染",
        "surgery": "否认手术史",
        "trauma": "否认头部及耳部外伤史",
        "transfusion": "否认输血史",
        "poisoning": "否认毒物及耳毒性药物接触史",
        "vaccine": "按计划预防接种",
        "allergy": "否认食物、药物过敏史",
        "relatedHistory": "否认使用氨基糖苷类等耳毒性药物",
        "otherTreatDiseases": "",
        "special": ""
      },
      "personal": {
        "residence": "出生并居住于江苏苏州，否认疫区及地方病流行区久居史",
        "smoking": "无",
        "smokingAmount": "",
        "drinking": "无",
        "drinkingAmount": "",
        "drugs": "否认有毒有害物质接触史",
        "environment": "",
        "habits": "长期伏案工作，每日使用电脑约10小时，睡眠不足，喜饮浓咖啡",
        "sexualHistory": "否认不洁性接触史",
        "occupationEnv": "办公室工作，无粉尘及噪声接触"
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
        "similarDisease": "否认家族中类似疾病患者",
        "infectionHistory": "否认结核、肝炎、性病等传染性疾病史"
      },
      "pe": {
        "vitals": {},
        "general": {
          "development": "发育正常",
          "nutrition": "营养中等",
          "conscious": "神志清楚，精神一般",
          "posture": "自主体位",
          "face": "急性病容",
          "cooperation": "查体合作"
        },
        "skin": {
          "color": "全身皮肤黏膜无黄染、苍白、发绀",
          "rash": "未见皮疹及出血点",
          "lymph": "全身浅表淋巴结未触及肿大"
        },
        "head": {
          "eyes": "眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏",
          "ent": "耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大"
        },
        "neck": {
          "neckResist": "颈软，无抵抗",
          "neckVessel": "颈静脉无充盈，颈动脉无异常搏动"
        },
        "chest": {
          "chestShape": "胸廓对称，无畸形，肋间隙正常",
          "lungAuscultation": "双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音",
          "heartAuscultation": "心律齐，各瓣膜听诊区未闻及病理性杂音"
        },
        "abdomen": {
          "abdInspect": "腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波",
          "abdAuscultation": "肠鸣音正常，未闻及血管杂音"
        },
        "spine": {
          "spineCol": "脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常"
        },
        "nervousPE": {
          "nerve": "生理反射存在，病理反射未引出",
          "babinski": "巴氏征阴性",
          "kernig": "克氏征阴性"
        },
        "special_neurology": {
          "neuroExtra1": "言语流利，定向力、记忆力、计算力正常",
          "neuroExtra2": "十二对颅神经检查未见异常",
          "neuroExtra3": "四肢肌张力正常，肌力正常，未见肌萎缩",
          "neuroExtra4": "痛温觉、触觉、深感觉检查未见异常",
          "neuroExtra5": "指鼻试验、跟膝胫试验稳准，Romberg征阴性",
          "neuroPathologic": "Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性",
          "neuroMeningeal": "颈项强直阴性，Kernig征阴性，Brudzinski征阴性",
          "neuroGait": "步态正常，行走平稳"
        }
      },
      "auxiliary": {
        "items": [
          {
            "name": "Dix-Hallpike试验",
            "result": "右侧卧位诱发旋转性眼震，以垂直向上成分为主伴旋转，潜伏期约5秒，持续约20秒后疲劳，伴眩晕及恶心；左侧未诱发",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "纯音测听",
            "result": "双耳各频率气导、骨导阈值均在20dB以内，无听力下降",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "前庭功能检查（视频眼震图）",
            "result": "右侧后半规管诱发眼震阳性，冷热试验双侧半规管反应对称",
            "date": "",
            "hospital": "",
            "no": ""
          },
          {
            "name": "头颅MRI",
            "result": "脑实质未见异常信号，脑干及小脑未见梗死灶，内听道未见占位",
            "date": "",
            "hospital": "",
            "no": ""
          }
        ]
      },
      "diagnosis": {
        "confirmed": [
          "良性阵发性位置性眩晕（右侧后半规管）"
        ]
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATE_DATA;
}
