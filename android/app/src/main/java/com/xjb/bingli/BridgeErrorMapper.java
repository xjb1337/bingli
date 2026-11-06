package com.xjb.bingli;

/** Stable JS-facing error codes for the AI bridge. Pure Java so it is unit-testable. */
final class BridgeErrorMapper {
    private BridgeErrorMapper() { }
    static String codeFor(Throwable error) {
        return error instanceof org.json.JSONException || error instanceof IllegalArgumentException
            ? "invalid_input" : "missing_key";
    }
    static String messageFor(Throwable error) {
        return "invalid_input".equals(codeFor(error))
            ? "AI 请求或图片参数无效，请重新选择后再试"
            : "无法读取 AI 设置，请重新保存密钥";
    }
}
