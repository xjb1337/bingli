package com.xjb.bingli;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** Fixed HTTPS endpoint, bounded JSON response, explicit cancellation. Never logs bodies or keys. */
final class DeepSeekClient {
    interface Callback { void done(String id, JSONObject response); }
    interface Connections { HttpURLConnection open() throws IOException; }
    private final Connections connections;
    DeepSeekClient() { this(() -> (HttpURLConnection) new URL("https://api.deepseek.com/chat/completions").openConnection()); }
    DeepSeekClient(Connections connections) { this.connections = connections; }
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private volatile HttpURLConnection connection;
    private volatile String active = "";
    private volatile boolean closed;
    static boolean validModel(String model) { return "deepseek-flash".equals(model) || "deepseek-v4-pro".equals(model); }
    static String httpError(int code) {
        if (code == 401 || code == 403) return "API Key 无效或无权限，请检查 AI 设置";
        if (code == 402) return "DeepSeek 余额不足，请充值后重试";
        if (code == 429) return "请求过于频繁，请稍后重试";
        if (code >= 500) return "DeepSeek 服务暂不可用，请稍后重试";
        return "DeepSeek 请求失败（HTTP " + code + "），请检查模型设置";
    }
    synchronized boolean request(String id, String key, String model, String system, String user, Callback callback) {
        if (closed || !active.isEmpty()) return false;
        if (!validModel(model) || id == null || !id.matches("[A-Za-z0-9_-]{1,80}") || system.length() > 12000 || user.length() > 50000) return false;
        active = id;
        executor.submit(() -> {
            JSONObject result = new JSONObject(); HttpURLConnection conn = null;
            try {
                if (key.isEmpty()) throw new IllegalStateException("请先在 AI 设置中保存 API Key");
                if (!id.equals(active)) return;
                conn = connections.open();
                connection = conn;
                if (!id.equals(active)) return;
                conn.setInstanceFollowRedirects(false); conn.setConnectTimeout(15000); conn.setReadTimeout(90000);
                conn.setRequestMethod("POST"); conn.setDoOutput(true);
                conn.setRequestProperty("Authorization", "Bearer " + key);
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                JSONObject body = new JSONObject().put("model", model).put("stream", false).put("max_tokens", 4096)
                    .put("thinking", new JSONObject().put("type", "disabled"))
                    .put("response_format", new JSONObject().put("type", "json_object"))
                    .put("messages", new JSONArray().put(new JSONObject().put("role", "system").put("content", system))
                        .put(new JSONObject().put("role", "user").put("content", user)));
                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8); conn.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream output = conn.getOutputStream()) { output.write(bytes); }
                int code = conn.getResponseCode();
                if (code != 200) throw new IllegalStateException(httpError(code));
                String response;
                try (InputStream input = conn.getInputStream()) { response = readLimited(input); }
                JSONObject parsed = new JSONObject(response);
                JSONArray choices = parsed.getJSONArray("choices");
                if (choices.length() != 1) throw new IllegalStateException("AI 返回候选数量异常，请重试");
                JSONObject choice = choices.getJSONObject(0);
                if (!"stop".equals(choice.optString("finish_reason"))) throw new IllegalStateException("AI 结果未完整结束，未写入病历；请缩短资料后重试");
                String content = choice.getJSONObject("message").optString("content", "").trim();
                if (content.isEmpty()) throw new IllegalStateException("AI 返回了空白内容，请重试");
                // Only final JSON content enters the UI, never reasoning or raw HTTP errors.
                result.put("ok", true).put("content", new JSONObject(content)).put("model", model);
            } catch (Exception e) {
                String message = e instanceof SocketTimeoutException ? "请求超时，原病历未改动；可缩短资料后重试" :
                    e instanceof IllegalStateException ? e.getMessage() :
                    e instanceof org.json.JSONException ? "AI 返回格式异常，未写入病历；请重试" : "网络连接失败，请检查联网后重试";
                try { result.put("ok", false).put("error", message); } catch (Exception ignored) { }
            } finally {
                if (conn != null) conn.disconnect();
                synchronized (this) {
                    if (id.equals(active)) { connection = null; active = ""; if (!closed) callback.done(id, result); }
                }
            }
        });
        return true;
    }
    static String readLimited(InputStream input) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] bytes = new byte[8192]; int n;
        while ((n = input.read(bytes)) != -1) { if (out.size() + n > 256 * 1024) throw new IOException("Response too large"); out.write(bytes, 0, n); }
        return out.toString(StandardCharsets.UTF_8.name());
    }
    synchronized void cancel(String id) {
        if (!id.equals(active)) return;
        active = ""; HttpURLConnection conn = connection; connection = null;
        if (conn != null) conn.disconnect();
    }
    synchronized boolean busy() { return !active.isEmpty(); }
    synchronized void close() { closed = true; cancel(active); executor.shutdownNow(); }
}
