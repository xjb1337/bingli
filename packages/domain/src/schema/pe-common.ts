import type { PeGroup } from '../types';

/**
 * 通用体格检查。每一项有：
 *   normal: 正常时写入的文字（可直接使用）
 *   options: 异常可选描述（点了就替换）
 * 结果都写进 pe[key].text
 */
export const PE_COMMON: readonly PeGroup[] = [
  {
    key: 'general',
    name: '一般状况',
    // 顺序按《诊断学》（第10版）第六篇病历书写「一般状况」原文：
    //   发育（正常、异常），营养（良好、中等、不良），神志（清晰、模糊、嗜睡…），
    //   体位（自主、被动、强迫），面容与表情，检查能否合作。
    // 生成病历时就按这个顺序逐项列举，读起来与教材、医院模板一致。
    //
    // joinWith：教材与医院模板里一般状况是**一整句逗号连写**
    // （「发育正常，营养良好，神志清楚，自主体位。」），不是逐句句号断开。
    // 其余查体组仍是句号分隔，所以把分隔符放在组上，不在 generator 里硬编码组名。
    joinWith: '，',
    items: [
      {
        // 教材「一般状况」第一项就是「发育（正常、异常）」，原 schema 缺此项。
        key: 'development', label: '发育', default: '发育正常',
        options: ['发育正常', '发育不良', '发育迟缓', '发育异常']
      },
      {
        key: 'nutrition', label: '营养', default: '营养中等',
        options: ['营养良好', '营养中等', '营养不良', '肥胖']
      },
      {
        key: 'conscious', label: '神志', default: '神志清楚，精神可',
        options: ['神志清楚，精神可', '神志清楚，精神一般', '神志清楚，精神差', '嗜睡', '昏睡', '浅昏迷', '深昏迷']
      },
      {
        // 教材原文是「体位（自主、被动、强迫）」，医院模板写成「自主体位」。
        // 旧版这里写的是「自动体位」（不规范说法），已按教材改为「自主体位」。
        key: 'posture', label: '体位', default: '自主体位',
        options: ['自主体位', '被动体位', '强迫体位'],
        legacyDefault: '自动体位'
      },
      {
        key: 'face', label: '面容', default: '面容自然',
        options: ['面容自然', '急性病容', '慢性病容', '贫血面容', '二尖瓣面容', '甲亢面容', '满月面容']
      },
      {
        key: 'cooperation', label: '查体合作', default: '查体合作',
        options: ['查体合作', '查体欠合作', '查体不合作']
      }
    ]
  },
  {
    key: 'skin',
    name: '皮肤粘膜',
    items: [
      {
        key: 'color', label: '色泽', default: '全身皮肤黏膜无黄染、苍白、发绀',
        options: ['全身皮肤黏膜无黄染、苍白、发绀', '皮肤黏膜黄染', '皮肤黏膜苍白', '口唇及肢端发绀']
      },
      {
        key: 'rash', label: '皮疹/出血点', default: '未见皮疹及出血点',
        options: ['未见皮疹及出血点', '可见散在皮疹', '可见瘀点瘀斑']
      },
      {
        key: 'spider', label: '蜘蛛痣与肝掌', default: '未见蜘蛛痣及肝掌',
        options: ['未见蜘蛛痣及肝掌', '可见蜘蛛痣', '肝掌阳性', '可见蜘蛛痣，肝掌阳性']
      },
      {
        key: 'elasticity', label: '弹性', default: '皮肤弹性良好',
        options: ['皮肤弹性良好', '皮肤弹性减退']
      },
      {
        key: 'lymph', label: '浅表淋巴结', default: '全身浅表淋巴结未触及肿大',
        options: [
          '全身浅表淋巴结未触及肿大',
          '双侧颈部可触及肿大淋巴结',
          '双侧腋窝可触及肿大淋巴结',
          '双侧腹股沟可触及肿大淋巴结'
        ]
      }
    ]
  },
  {
    key: 'head',
    name: '头颅及其器官',
    items: [
      {
        key: 'headShape', label: '头颅', default: '头颅大小、形态正常，无压痛及包块',
        options: ['头颅大小、形态正常，无压痛及包块', '头颅外伤', '方颅', '头颅有压痛']
      },
      {
        key: 'hair', label: '毛发', default: '毛发分布均匀',
        options: ['毛发分布均匀', '毛发稀疏', '毛发分布异常']
      },
      {
        key: 'eyes', label: '眼', default: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        options: [
          '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
          '眼睑水肿',
          '巩膜黄染',
          '双侧瞳孔不等大',
          '双侧瞳孔对光反射迟钝',
          '眼睑下垂'
        ]
      },
      {
        key: 'ent', label: '耳鼻口咽', default: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        options: [
          '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
          '咽充血，扁桃体肿大',
          '双侧扁桃体Ⅰ度肿大',
          '外耳道有分泌物',
          '鼻窦区压痛',
          '口唇发绀'
        ]
      },
      {
        key: 'teeth', label: '口腔黏膜/舌', default: '口腔黏膜无溃疡，舌质淡红、苔薄白',
        options: ['口腔黏膜无溃疡，舌质淡红、苔薄白', '口腔黏膜溃疡', '舌质红、苔黄腻', '舌质红、少苔', '草莓舌']
      }
    ]
  },
  {
    key: 'neck',
    name: '颈部',
    items: [
      {
        key: 'neckResist', label: '颈抵抗', default: '颈软，无抵抗',
        options: ['颈软，无抵抗', '颈抵抗阳性']
      },
      {
        key: 'thyroid', label: '甲状腺', default: '甲状腺无肿大',
        options: ['甲状腺无肿大', '甲状腺Ⅰ度肿大', '甲状腺Ⅱ度肿大', '甲状腺Ⅲ度肿大', '甲状腺可触及结节']
      },
      {
        key: 'neckVessel', label: '颈静脉/颈动脉', default: '颈静脉无充盈，颈动脉无异常搏动',
        options: ['颈静脉无充盈，颈动脉无异常搏动', '颈静脉充盈', '颈静脉怒张', '颈动脉搏动增强']
      },
      {
        key: 'trachea', label: '气管', default: '气管居中',
        options: ['气管居中', '气管向左侧移位', '气管向右侧移位']
      }
    ]
  },
  {
    key: 'chest',
    name: '胸部',
    items: [
      {
        key: 'chestShape', label: '胸廓', default: '胸廓对称，无畸形，肋间隙正常',
        options: ['胸廓对称，无畸形，肋间隙正常', '桶状胸', '胸廓不对称', '肋间隙增宽', '肋间隙变窄', '鸡胸', '漏斗胸']
      },
      {
        key: 'lungInspect', label: '肺—视诊', default: '呼吸运动对称，节律规整',
        options: ['呼吸运动对称，节律规整', '呼吸运动减弱', '呼吸浅快', '呼吸深大']
      },
      {
        key: 'lungPalpation', label: '肺—触诊', default: '语颤对称，无胸膜摩擦感',
        options: ['语颤对称，无胸膜摩擦感', '语颤增强', '语颤减弱', '可触及胸膜摩擦感']
      },
      {
        key: 'lungPercussion', label: '肺—叩诊', default: '双肺叩诊清音，肺下界位置正常',
        options: ['双肺叩诊清音，肺下界位置正常', '双肺叩诊过清音', '局部叩诊浊音', '局部叩诊实音', '肺下界下移']
      },
      {
        key: 'lungAuscultation', label: '肺—听诊', default: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        normalVariants: ['双肺呼吸音清，未闻及干湿性啰音'],
        options: [
          '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
          '双肺呼吸音清，未闻及干湿性啰音',
          '双肺呼吸音粗，可闻及散在干啰音',
          '双肺可闻及湿性啰音',
          '右下肺可闻及湿性啰音',
          '双肺可闻及哮鸣音',
          '可闻及胸膜摩擦音',
          '呼吸音减弱'
        ]
      },
      {
        key: 'heartInspect', label: '心—视诊', default: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        options: ['心前区无隆起，心尖搏动位置正常，未超出正常范围', '心尖搏动向左下移位', '心前区隆起']
      },
      {
        key: 'heartPalpation', label: '心—触诊', default: '心尖搏动无抬举性，未触及震颤',
        options: ['心尖搏动无抬举性，未触及震颤', '可触及抬举性心尖搏动', '可触及震颤']
      },
      {
        key: 'heartPercussion', label: '心—叩诊', default: '心界不大',
        options: ['心界不大', '心界向左下扩大', '心界向两侧扩大']
      },
      {
        key: 'heartAuscultation', label: '心—听诊', default: '心律齐，各瓣膜听诊区未闻及病理性杂音',
        options: [
          '心律齐，各瓣膜听诊区未闻及病理性杂音',
          '心律不齐，可闻及早搏',
          '心尖区可闻及收缩期杂音',
          '主动脉瓣区可闻及舒张期杂音',
          '心音低钝',
          '可闻及心包摩擦音'
        ]
      },
      {
        key: 'breast', label: '乳房', default: '双侧乳房对称，未触及肿块',
        options: ['双侧乳房对称，未触及肿块', '乳房可触及肿块', '乳房不对称'],
        depts: ['surgery']
      }
    ]
  },
  {
    key: 'abdomen',
    name: '腹部',
    // ★ 次序铁律（评分表第3页「腹部检查次序正确得2分」）：
    //     视诊 → 听诊 → 叩诊 → 触诊
    //   触诊与叩诊会刺激肠管、改变肠鸣音，所以听诊必须排在它们之前。
    //   这个数组的顺序就是生成病历时的输出顺序，不要随意调整。
    //   胸部/心脏不适用本规则，仍为 视诊 → 触诊 → 叩诊 → 听诊。
    items: [
      {
        // ① 视诊：只写腹部形态（2分）。"腹平软"属触诊结论，已移至 abdPalpation。
        key: 'abdInspect', label: '视诊', default: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        // legacyDefault：旧版本的 default 文本。hints.js 用 `val === item.default`
        // 判断「用户没改过」，旧存档里可能存着旧文本，两个都要认，否则会误报阳性。
        legacyDefault: '腹平软，未见腹壁静脉曲张',
        options: ['腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波', '腹部膨隆', '腹壁静脉曲张', '可见胃肠型及蠕动波', '可见手术瘢痕']
      },
      {
        // ② 听诊：必须在触诊、叩诊之前（4分）。评分表要求交代听诊部位与听诊时长。
        key: 'abdAuscultation', label: '听诊', default: '肠鸣音正常，未闻及血管杂音',
        legacyDefault: '肠鸣音正常，约4次/分',
        normalVariants: ['肠鸣音正常'],
        options: ['肠鸣音正常，未闻及血管杂音', '肠鸣音正常', '肠鸣音活跃', '肠鸣音减弱', '肠鸣音消失', '可闻及血管杂音']
      },
      {
        // ③ 叩诊：逆时针次序（4分，不要求脾区）
        key: 'abdPercussion', label: '叩诊', default: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        legacyDefault: '肝区及双肾区无叩击痛，移动性浊音阴性',
        options: ['自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性', '肝区叩击痛', '双肾区叩击痛', '移动性浊音阳性', '鼓音区缩小']
      },
      {
        // ④ 触诊（10分）。父项保留：hints.js 有 5 条规则依赖 abdomen.abdPalpation，
        //    其中「急性阑尾炎」等规则的 must 正是它，删改会导致规则静默失效。
        key: 'abdPalpation', label: '触诊', default: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
        legacyDefault: '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
        normalVariants: ['腹平软，全腹无压痛、反跳痛，肝脾肋下未触及'],
        options: [
          '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
          '腹平软，全腹无压痛、反跳痛，肝脾肋下未触及',
          '上腹部压痛，无反跳痛',
          '右下腹压痛、反跳痛',
          '全腹压痛、反跳痛，腹肌紧张',
          '肝肋下可触及',
          '脾肋下可触及',
          '可触及腹部包块'
        ]
      },
      {
        // 触诊细分（各 2.5 分）：默认留空，填了才输出；未填时以上面的 abdPalpation 兜底。
        // parent 指明聚合父项，供 generator 去重、供 hints 做别名映射。
        key: 'abdPalpSuperficial', label: '触诊—全腹浅触诊', default: '', parent: 'abdPalpation',
        normal: '全腹浅触诊无压痛，腹肌柔软',
        options: ['全腹浅触诊无压痛，腹肌柔软', '上腹部浅触诊压痛', '右下腹浅触诊压痛', '全腹浅触诊压痛，腹肌紧张']
      },
      {
        key: 'abdPalpDeep', label: '触诊—全腹深触诊', default: '', parent: 'abdPalpation',
        normal: '全腹深触诊无压痛、反跳痛，未触及包块',
        options: ['全腹深触诊无压痛、反跳痛，未触及包块', '深触诊可触及包块', '深触诊反跳痛阳性']
      },
      {
        key: 'liverPalpation', label: '触诊—肝', default: '', parent: 'abdPalpation',
        normal: '肝肋下未触及，肝区无压痛',
        options: ['肝肋下未触及，肝区无压痛', '肝肋下可触及', '肝区压痛']
      },
      {
        key: 'spleenPalpation', label: '触诊—脾', default: '', parent: 'abdPalpation',
        normal: '脾肋下未触及',
        options: ['脾肋下未触及', '脾肋下可触及', '脾肋下可触及且质硬']
      },
      {
        // 胆囊触诊与 Murphy 征。教材腹部触诊原文：「医师以拇指指腹勾压于右肋下
        // 胆囊点为胆囊触痛点，然后嘱病人缓慢深吸气。在吸气过程中发炎的胆囊下移
        // 时碰到用力按压的拇指，即可引起疼痛，此为胆囊触痛；如因剧烈疼痛而致
        // 吸气中止称墨菲征（Murphy sign）阳性」。
        key: 'gallbladderPalpation', label: '触诊—胆囊（Murphy征）', default: '', parent: 'abdPalpation',
        normal: '胆囊未触及，Murphy征阴性',
        options: ['胆囊未触及，Murphy征阴性', '胆囊触痛阳性', 'Murphy征阳性', '胆囊可触及']
      },
      {
        // 肾脏触诊。教材：「双手触诊法…病人取仰卧位，屈髋屈膝…」正常不可触及。
        key: 'kidneyPalpation', label: '触诊—肾', default: '', parent: 'abdPalpation',
        normal: '双肾未触及，季肋点及肋脊点无压痛',
        options: ['双肾未触及，季肋点及肋脊点无压痛', '右肾下极可触及', '双肾可触及', '季肋点压痛', '肋脊点压痛']
      },
      {
        // 膀胱触诊。教材：「膀胱膨胀时可在下腹部触到圆形或椭圆形肿物…」
        key: 'bladderPalpation', label: '触诊—膀胱', default: '', parent: 'abdPalpation',
        normal: '膀胱未触及，耻骨上区无压痛',
        options: ['膀胱未触及，耻骨上区无压痛', '膀胱充盈可触及', '耻骨上区压痛']
      },
      {
        // 液波震颤。教材：「需 3000ml 以上液量才能查出，不如移动性浊音敏感，
        // 肥胖者可出现假阳性」。放在触诊块内，紧接在腹部触诊细分之后。
        key: 'fluidThrill', label: '触诊—液波震颤', default: '', parent: 'abdPalpation',
        normal: '液波震颤阴性',
        options: ['液波震颤阴性', '液波震颤阳性']
      },
      {
        // 振水音。教材：「餐后 6～8 小时以上仍有此音，提示幽门梗阻或胃扩张，
        // 是幽门梗阻的特征性体征」。属听诊内容，父项挂 abdAuscultation。
        key: 'succussionSplash', label: '听诊—振水音', default: '', parent: 'abdAuscultation',
        normal: '振水音阴性',
        options: ['振水音阴性', '振水音阳性']
      }
    ]
  },
  {
    key: 'genital',
    name: '生殖器、肛门及直肠',
    items: [
      {
        key: 'genitalia', label: '外生殖器', default: '未见异常',
        options: ['未见异常', '未查', '包皮过长', '外生殖器发育异常']
      },
      {
        key: 'anus', label: '肛门及直肠', default: '未见异常',
        options: ['未见异常', '未查', '肛门指检未触及异常', '肛门指检可触及肿物', '肛周红肿']
      }
    ]
  },
  {
    key: 'spine',
    name: '脊柱及四肢',
    items: [
      {
        key: 'spineCol', label: '脊柱', default: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        options: ['脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常', '脊柱侧弯', '脊柱后凸', '胸腰椎压痛', '胸腰椎叩击痛']
      },
      {
        // 父项保留：hints.js 有 3 条规则依赖 spine.limbs（含 CKD 规则的 must）
        key: 'limbs', label: '四肢', default: '四肢无畸形，关节无红肿，活动自如',
        normalVariants: ['双下肢无水肿'],
        options: ['四肢无畸形，关节无红肿，活动自如', '双下肢无水肿', '双下肢凹陷性水肿', '双下肢非凹陷性水肿', '关节红肿畸形', '杵状指', '四肢肌力减退']
      },
      {
        // 以下为评分表第3-4页「神经系统及四肢」按项给分项的拆分（各 2 分）。
        // 默认留空，未填写不输出；填了才进病历，正常描述见 normal。
        // parent 指明聚合父项 limbs，供 generator 去重、供 hints 做别名映射。
        key: 'limbMuscle', label: '四肢肌力', default: '', parent: 'limbs',
        normal: '四肢肌力5级',
        options: ['四肢肌力5级', '四肢肌力4级', '四肢肌力3级', '双上肢肌力正常、双下肢肌力减退', '偏瘫侧肌力减退']
      },
      {
        key: 'kneeJerk', label: '双侧膝跳反射', default: '',
        normal: '双侧膝跳反射正常对称',
        options: ['双侧膝跳反射正常对称', '双侧膝跳反射减弱', '双侧膝跳反射亢进', '单侧膝跳反射减弱']
      },
      {
        key: 'edemaAnkle', label: '下肢水肿—踝部', default: '', parent: 'limbs',
        normal: '双侧踝部无水肿',
        options: ['双侧踝部无水肿', '双侧踝部凹陷性水肿', '单侧踝部水肿']
      },
      {
        key: 'edemaPretibial', label: '下肢水肿—胫前', default: '', parent: 'limbs',
        normal: '双侧胫前无水肿',
        options: ['双侧胫前无水肿', '双侧胫前凹陷性水肿', '单侧胫前水肿']
      },
      {
        key: 'dorsalisPedis', label: '足背动脉搏动', default: '',
        normal: '双侧足背动脉搏动对称有力',
        options: ['双侧足背动脉搏动对称有力', '双侧足背动脉搏动减弱', '单侧足背动脉搏动减弱', '单侧足背动脉搏动未触及']
      },
      {
        key: 'radialPulse', label: '桡动脉搏动', default: '',
        normal: '双侧桡动脉搏动对称',
        options: ['双侧桡动脉搏动对称', '双侧桡动脉搏动减弱', '脉搏短绌', '水冲脉']
      }
    ]
  },
  {
    key: 'nervousPE',
    name: '神经系统',
    items: [
      {
        // ★ 父项不可删除：hints.js「脑膜炎」等规则 must 依赖 nervousPE.nerve
        key: 'nerve', label: '神经反射', default: '生理反射存在，病理反射未引出',
        normalVariants: ['神经系统常见阴性'],
        options: ['生理反射存在，病理反射未引出', '神经系统常见阴性', '膝反射减弱', '膝反射亢进', '病理反射阳性', '脑膜刺激征阳性']
      },
      {
        // 以下四项按评分表「腱反射、布氏征、克氏征、巴氏征（每项2分）」分立，
        // 各 2 分，默认留空。父项 nerve 保留，四项通过 parent 关联回去。
        key: 'tendonReflex', label: '腱反射', default: '', parent: 'nerve',
        normal: '双侧肱二头肌、膝腱、跟腱反射正常对称',
        options: ['双侧肱二头肌、膝腱、跟腱反射正常对称', '腱反射普遍减弱', '腱反射普遍亢进', '单侧腱反射减弱']
      },
      {
        key: 'brudzinski', label: '布氏征（Brudzinski）', default: '', parent: 'nerve',
        normal: '布氏征阴性',
        options: ['布氏征阴性', '布氏征阳性']
      },
      {
        key: 'kernig', label: '克氏征（Kernig）', default: '', parent: 'nerve',
        normal: '克氏征阴性',
        options: ['克氏征阴性', '克氏征阳性']
      },
      {
        key: 'babinski', label: '巴氏征（Babinski）', default: '', parent: 'nerve',
        normal: '巴氏征阴性',
        options: ['巴氏征阴性', '巴氏征阳性', '双侧巴氏征阳性']
      }
    ]
  }
];
