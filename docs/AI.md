# DeepSeek AI 安全边界

本文件对应 PR6「DeepSeek 和 Android 原生桥接」。目标不是宣称 AI 结论正确，而是把密钥、患者资料、结果来源和写入边界限制在可检查的范围内。

## 安全边界

### 浏览器 Web 版

- 用户在「AI 助手 → API 设置」输入自己的 API Key。密钥只存在于 `EditorApp` 的 React state 和当前请求 transport 的私有字段中。
- 刷新页面即清空，不做恢复；界面明确显示「仅保存在本页内存，刷新后需重新输入」。
- 密钥不写入 localStorage、sessionStorage、IndexedDB、Cookie、URL、病历 JSON、导出文件、错误对象或 console。
- `WebFetchTransport` 只把密钥放入 HTTPS 请求的 `Authorization: Bearer ...` 请求头，不放入 URL、请求 JSON、日志或错误消息。
- 无密钥时，填写、自动保存、导入导出、病历列表和三份文书生成全部照常可用；AI 面板只显示配置提示。

### Android App

- 密钥由 `AIKeyStore` 使用 Android Keystore 的 AES/GCM 加密保存，只留在原生进程。
- 网页通过 `BingliAndroid.aiStatus()` 只能拿到 `{configured, model}`，没有任何返回密钥的方法。
- `AndroidBridgeTransport` 调用现有 `aiRequest(id, {system,user,image?})` / `aiCancel(id)` 桥接方法；请求 payload 不包含密钥。图片只传 MIME 与 base64，由原生 `DeepSeekClient` 组装成 DeepSeek 多模态 content parts。
- 含图片的识别请求固定使用 `deepseek-flash`（`deepseek-v4-pro` 不支持图像理解），只影响本次请求，不修改已保存的模型设置。
- AI 助手的「API 设置」在 Android 环境中只提供原生设置入口、配置状态和模型名，不显示网页密钥输入框。原生窗口可保存密钥、选择模型并测试连接；返回后可在 AI 面板刷新状态。
- `DeepSeekClient` 固定请求 `https://api.deepseek.com/chat/completions`，不跟随重定向，并只把最终 JSON 内容交给网页。

网页连接测试只通过现有 transport 发送固定测试文字，不包含患者资料；不自动发起测试。文本模型选择也只在内存中保留，图片识别仍固定使用 Flash。

## 入口

- Android 顶栏常驻「AI 助手」，直接打开 AI 面板；设置页不承担 AI 入口职责。
- React 顶栏常驻「AI 助手」，可从任意步骤、病历列表或设置进入独立 AI 页，返回编辑仍停留在原步骤。生成页不再重复挂载面板。
- 打开时按当前步骤预选可润色字段；现病史默认症状特点，无对应白名单段落时默认症状特点，可手动切换。

## 数据流

React Web / WebView 及旧 Android 内置界面的「整理填表」按「贴笔记 → 预览确认 → 建议对照 → 已采纳/回表单」四步分段展示，可返回查看；建议默认展开原内容、AI 建议和原文依据，采纳后可用「去改该字段」回到对应表单并定位、聚焦，仍须逐项人工核对。
未核对计数可直接跳到已采纳待核对列表；API 设置提供可折叠拿 Key 引导和常见错误中文对照，发送预览按资料列出实际脱敏类别（仅保留脱敏后文字，图片仍无法自动脱敏）。


1. 用户在 AI 面板选择操作：整理填表、润色本段、检查病历、生成摘要草稿或识别病历图片/文字。识别可拍照、选择图片和粘贴文字，图片先在客户端缩到最长边约 1600 像素并转为 JPEG。
2. `packages/ai` 从当前病历构造白名单资料。请求包含操作名、可写目标字段、逐条来源资料、系统约束和实际发送 JSON。
3. 用户先查看发送预览并勾选确认；此时不会写入病历。
4. transport 把请求直接发送给 DeepSeek（Android 由原生发送）。密钥只用于认证。
5. 返回内容先经过结构、字段白名单、原文逐字引用、数字/单位、否定词和不确定性限定校验。
6. 用户逐项查看「原内容 / AI 建议 / 原文依据」并勾选采纳。采纳写入当前字段，来源标为 `ai`，核对状态固定为未核对。
7. 用户在 AI 面板逐项点击「确认已核对」后，核对方生效，并与当前字段值指纹绑定；之后改值会自动失效。

## 会发送给 DeepSeek 的内容

发送体是 JSON，主要包含：

- 操作类型和允许建议的字段路径/中文名；
- 已人工确认或实际录入的白名单文本资料；
- 实际测得的生命体征、已勾选且非空的查体项、实际辅助检查结果；
- 原录入诊断（只用于检查/摘要上下文，不是 AI 可写字段）；
- 用户本次输入的问诊笔记或待识别文字（留在面板内存，关闭/刷新页面后不再保留）。
- 识别时用户明确确认发送的压缩图片（JPEG/PNG/GIF/WebP，最长 6 MiB base64）。图片可能含身份信息，无法像文本一样自动脱敏，界面会展示缩略图并单独要求确认。

以下内容不会作为事实发送：

- 姓名、电话、地址、工作单位、病历号、床号、籍贯、出生地等身份栏；
- 已知姓名/电话/地址等自由文本替换和常见身份证/手机号识别后的原文；
- 未核对的模板、默认值、示例内容和既有未核对 AI 内容；
- 空白默认正常查体，以及未勾选/未实际记录的查体项。

身份替换是保守筛查，不保证匿名。用户仍必须在发送预览中核对，并遵守所在单位的数据使用要求。

AI 不能写入正式诊断、处方、检查申请、患者身份、摘要或白名单外字段。识别操作可以建议基本情况选择项/年龄、生命体征、当前科室查体项和系统回顾三态；选择项与数值按 schema 枚举/范围校验，所有结果默认不勾选，必须人工采纳，且采纳后仍是未核对状态。

## 结果基线和证据

- 请求记录 `recordId`、请求时 `revision` 和临床内容指纹 `contentHash`。
- `contentHash` 忽略自动保存产生的 `meta`、`documentMeta`、`updatedAt` 和记录 ID；单纯增加修订号不会让结果过期。
- 结果对象保留请求基线。采纳时再次验证当前记录的 ID 与临床内容指纹；任何临床内容修改或切换患者都会阻止写入，并显示「病历已改变，此 AI 结果已过期，无法写入」。
- 文本建议必须引用实际发送资料中的逐字片段；图片建议的来源标记为 `image`，只能由用户对照原图核对。采纳后的字段 `sourceRef` 保存模型、请求基线、采纳时间、引用原文和引用来源路径。
- `source=ai` 且尚未确认的字段始终显示「未核对」；确认后显示「已核对」，但来源仍保留为 AI。

## 稳定错误码和提示

浏览器 transport 与 Android 原生结果使用同一组稳定代码：

| 情况 | 代码 | 中文提示 |
|---|---|---|
| 无密钥 | `missing_key` | 请在 AI 助手顶部「API 设置」中输入 DeepSeek API Key |
| HTTP 401 | `unauthorized` | API Key 无效，请检查 AI 设置后重试 |
| HTTP 403 | `forbidden` | API Key 无权限，请检查 AI 设置后重试 |
| HTTP 402 | `insufficient_balance` | DeepSeek 余额不足，请充值后重试 |
| HTTP 429 | `rate_limited` | 请求过于频繁，请稍后重试 |
| HTTP 5xx | `server_unavailable` | DeepSeek 服务暂不可用，请稍后重试 |
| 超时 | `timeout` | 请求超时，原病历未改动；可缩短资料后重试 |
| 网络失败 | `network` | 网络连接失败，请检查联网后重试 |
| 用户取消 | `cancelled` | 已取消 AI 请求 |
| 返回异常/截断 | `invalid_response` / `truncated_response` | 不写入病历，提示重新生成或缩短资料 |

非 2xx 的服务端正文不会回显。Android 侧 `DeepSeekClient` 在失败结果中附加 `code`，供网页稳定映射；旧版仅返回错误文字时仍有安全回退。

## 测试边界

- Web transport 测试通过注入 fake fetch 覆盖 401、403、402、429、5xx、超时、网络失败和取消；不会访问真实 DeepSeek。
- Android transport 测试使用 fake bridge 回调和 fake 状态，不读取真实 Keystore、不发起网络。
- JVM 单元测试验证原生 HTTP 状态到稳定代码的映射、多模态 content parts 构造及图片格式/base64/大小校验，并使用合成输入。
- Web UI 测试进入内存密钥、运行 mock AI、采纳、保存、导出，再检查 localStorage、sessionStorage、IndexedDB、Cookie、URL、导出 JSON 和 console。
- 这些测试不能证明真实模型医学质量，也不能替代账号、网络、CORS/WebView 和真实设备验收。

## 相关实现

- `packages/ai/src/core.ts`：请求构造、脱敏、校验、基线、采纳和确认。
- `packages/ai/src/transport.ts`：`WebFetchTransport`、`AndroidBridgeTransport`、超时与取消。
- `packages/ai/src/errors.ts`：稳定错误码与中文提示。
- `apps/web/src/components/AiAssistantPanel.tsx`：发送预览、建议对照、未核对标记和确认。
- `apps/web/src/pages/AiPage.tsx`：独立 AI 页，顶部提供内存密钥输入/清除、文本模型选择、连接测试和 Android 原生设置入口。
- `android/app/src/main/java/com/xjb/bingli/DeepSeekClient.java`：原生请求、取消、超时和错误代码。
- `android/app/src/main/java/com/xjb/bingli/MainActivity.java`：现有 AI 桥接结果分发，不向网页返回密钥。
