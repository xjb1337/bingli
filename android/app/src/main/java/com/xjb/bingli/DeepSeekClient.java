package com.xjb.bingli;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** Fixed HTTPS endpoint, bounded JSON/SSE response, explicit cancellation, 429 Retry-After support. Never logs bodies or keys. */
final class DeepSeekClient {
    interface Callback { void done(String id, JSONObject response); }
    interface StreamListener { void onDelta(String id, String delta); }
    interface Connections { HttpURLConnection open() throws IOException; }

    static final int MAX_IMAGE_BASE64_CHARS = 6 * 1024 * 1024;
    static final int MAX_TOKENS_DEFAULT = 4096;
    static final int MAX_TOKENS_RECOGNIZE = 8192;
    static final int MAX_RESPONSE_BYTES = 256 * 1024;
    static final long DEFAULT_MAX_AUTO_RETRY_WAIT_MS = 2000L;
    private static final int MAX_WORKERS = 8;

    private final Connections connections;
    private final long maxAutoRetryWaitMs;
    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(
        0,
        MAX_WORKERS,
        60L,
        TimeUnit.SECONDS,
        new SynchronousQueue<>(),
        runnable -> {
            Thread thread = new Thread(runnable, "deepseek-client");
            thread.setDaemon(true);
            return thread;
        }
    );
    private volatile HttpURLConnection connection;
    private volatile String active = "";
    private volatile boolean closed;

    DeepSeekClient() {
        this(() -> (HttpURLConnection) new URL("https://api.deepseek.com/chat/completions").openConnection(), DEFAULT_MAX_AUTO_RETRY_WAIT_MS);
    }

    DeepSeekClient(Connections connections) {
        this(connections, DEFAULT_MAX_AUTO_RETRY_WAIT_MS);
    }

    DeepSeekClient(Connections connections, long maxAutoRetryWaitMs) {
        this.connections = connections;
        this.maxAutoRetryWaitMs = Math.max(0L, maxAutoRetryWaitMs);
    }

    private static final class RequestFailure extends Exception {
        final String code;
        final long retryAfterSeconds;
        RequestFailure(String code, String message) {
            this(code, message, -1L);
        }
        RequestFailure(String code, String message, long retryAfterSeconds) {
            super(message);
            this.code = code;
            this.retryAfterSeconds = retryAfterSeconds;
        }
    }

    static boolean validModel(String model) { return "deepseek-flash".equals(model) || "deepseek-v4-pro".equals(model); }
    static boolean validImageMime(String mime) {
        return "image/jpeg".equals(mime) || "image/png".equals(mime) || "image/gif".equals(mime) || "image/webp".equals(mime);
    }
    static boolean validImagePayload(String mime, String base64) {
        return validImageMime(mime) && base64 != null && !base64.isEmpty()
            && base64.length() <= MAX_IMAGE_BASE64_CHARS && base64.length() % 4 == 0
            && base64.matches("[A-Za-z0-9+/]+={0,2}");
    }

    /** Recognize requests are identified by the prompt produced by AI_CORE.prepare(). */
    static boolean isRecognizeRequest(String system, String user) {
        if (system != null && system.contains("病历识别与填表助手")) return true;
        return user != null && user.contains("\"operation\":\"识别病历图片/文字\"");
    }

    static JSONArray userContent(String user, String imageMime, String imageBase64) throws org.json.JSONException {
        JSONArray content = new JSONArray().put(new JSONObject().put("type", "text").put("text", user));
        if (imageMime != null || imageBase64 != null) {
            if (!validImagePayload(imageMime, imageBase64)) throw new org.json.JSONException("Invalid image payload");
            content.put(new JSONObject().put("type", "image_url")
                .put("image_url", new JSONObject()
                    .put("url", "data:" + imageMime + ";base64," + imageBase64)
                    .put("detail", "high")));
        }
        return content;
    }

    static String httpErrorCode(int code) {
        if (code == 401) return "unauthorized";
        if (code == 403) return "forbidden";
        if (code == 402) return "insufficient_balance";
        if (code == 429) return "rate_limited";
        if (code >= 500) return "server_unavailable";
        return "http_error";
    }

    static String httpError(int code) {
        if (code == 401) return "API Key 无效，请检查 AI 设置后重试";
        if (code == 403) return "API Key 无权限，请检查 AI 设置后重试";
        if (code == 402) return "DeepSeek 余额不足，请充值后重试";
        if (code == 429) return "请求过于频繁，请稍后重试";
        if (code >= 500) return "DeepSeek 服务暂不可用，请稍后重试";
        return "DeepSeek 请求失败（HTTP " + code + "），请检查模型设置后重试";
    }

    static long parseRetryAfterSeconds(HttpURLConnection conn, long nowMs) {
        if (conn == null) return -1L;
        String header = conn.getHeaderField("Retry-After");
        if (header == null) return -1L;
        String trimmed = header.trim();
        if (trimmed.isEmpty()) return -1L;
        if (trimmed.matches("\\d+")) {
            try {
                return Math.min(3600L, Math.max(0L, Long.parseLong(trimmed)));
            } catch (NumberFormatException ignored) {
                return 3600L;
            }
        }
        long dateMs = conn.getHeaderFieldDate("Retry-After", -1L);
        if (dateMs > 0L) {
            long deltaSec = (long) Math.ceil((dateMs - nowMs) / 1000.0d);
            return Math.min(3600L, Math.max(0L, deltaSec));
        }
        return -1L;
    }

    synchronized boolean request(String id, String key, String model, String system, String user, Callback callback) {
        return request(id, key, model, system, user, null, null, isRecognizeRequest(system, user), false, null, callback);
    }

    synchronized boolean request(String id, String key, String model, String system, String user,
                                 String imageMime, String imageBase64, Callback callback) {
        return request(id, key, model, system, user, imageMime, imageBase64, isRecognizeRequest(system, user), false, null, callback);
    }

    synchronized boolean request(String id, String key, String model, String system, String user,
                                 String imageMime, String imageBase64, boolean recognize, Callback callback) {
        return request(id, key, model, system, user, imageMime, imageBase64, recognize, false, null, callback);
    }

    synchronized boolean request(String id, String key, String model, String system, String user,
                                 String imageMime, String imageBase64, boolean recognize, boolean stream,
                                 StreamListener streamListener, Callback callback) {
        if (closed || !active.isEmpty()) return false;
        if (!validModel(model) || id == null || !id.matches("[A-Za-z0-9_-]{1,80}")
            || system == null || user == null || system.length() > 12000 || user.length() > 50000) {
            return false;
        }
        boolean hasImage = imageMime != null || imageBase64 != null;
        if (hasImage && !validImagePayload(imageMime, imageBase64)) return false;
        // deepseek-v4-pro does not support image understanding: force Flash for this request only.
        final String requestModel = hasImage ? "deepseek-flash" : model;
        final int maxTokens = recognize ? MAX_TOKENS_RECOGNIZE : MAX_TOKENS_DEFAULT;
        active = id;
        try {
            executor.submit(() -> executeRequest(id, key == null ? "" : key, requestModel, system, user, imageMime, imageBase64, maxTokens, stream, streamListener, callback));
        } catch (RejectedExecutionException rejected) {
            active = "";
            return false;
        }
        return true;
    }

    private void executeRequest(String id, String key, String requestModel, String system, String user,
                                String imageMime, String imageBase64, int maxTokens, boolean stream,
                                StreamListener streamListener, Callback callback) {
        JSONObject result = new JSONObject();
        HttpURLConnection conn = null;
        try {
            if (key.isEmpty()) throw new RequestFailure("missing_key", "请先在 AI 设置中保存 API Key");
            for (int attempt = 0; attempt < 2; attempt++) {
                synchronized (this) {
                    if (closed || !id.equals(active)) return;
                }
                conn = connections.open();
                synchronized (this) {
                    if (closed || !id.equals(active)) return;
                    connection = conn;
                }
                conn.setInstanceFollowRedirects(false);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(90000);
                conn.setRequestMethod("POST");
                conn.setDoOutput(true);
                conn.setRequestProperty("Authorization", "Bearer " + key);
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                if (stream) conn.setRequestProperty("Accept", "text/event-stream");
                JSONObject body = new JSONObject()
                    .put("model", requestModel)
                    .put("stream", stream)
                    .put("max_tokens", maxTokens)
                    .put("thinking", new JSONObject().put("type", "disabled"))
                    .put("response_format", new JSONObject().put("type", "json_object"))
                    .put("messages", new JSONArray()
                        .put(new JSONObject().put("role", "system").put("content", system))
                        .put(new JSONObject().put("role", "user").put("content", userContent(user, imageMime, imageBase64))));
                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
                conn.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream output = conn.getOutputStream()) { output.write(bytes); }

                int code = conn.getResponseCode();
                if (code == 429) {
                    long retryAfterSeconds = parseRetryAfterSeconds(conn, System.currentTimeMillis());
                    if (attempt == 0 && retryAfterSeconds >= 0 && retryAfterSeconds * 1000L <= maxAutoRetryWaitMs) {
                        conn.disconnect();
                        conn = null;
                        synchronized (this) {
                            if (id.equals(active)) connection = null;
                        }
                        if (!waitForRetry(id, retryAfterSeconds * 1000L)) return;
                        continue;
                    }
                    String message = retryAfterSeconds > 0
                        ? "请求过于频繁，请在 " + retryAfterSeconds + " 秒后重试"
                        : httpError(429);
                    throw new RequestFailure("rate_limited", message, retryAfterSeconds);
                }
                if (code != 200) throw new RequestFailure(httpErrorCode(code), httpError(code));

                String contentText;
                if (stream) {
                    contentText = readSseResponse(id, conn, streamListener);
                } else {
                    String response;
                    try (InputStream input = conn.getInputStream()) { response = readLimited(input); }
                    contentText = extractSyncContent(response);
                }
                // Only final JSON content enters the UI, never reasoning or raw HTTP errors.
                result.put("ok", true).put("content", new JSONObject(contentText)).put("model", requestModel);
                break;
            }
        } catch (Exception e) {
            String code;
            String message;
            long retryAfter = -1L;
            if (e instanceof SocketTimeoutException) {
                code = "timeout"; message = "请求超时，原病历未改动；可缩短资料后重试";
            } else if (e instanceof RequestFailure) {
                RequestFailure rf = (RequestFailure) e;
                code = rf.code; message = rf.getMessage(); retryAfter = rf.retryAfterSeconds;
            } else if (e instanceof org.json.JSONException) {
                code = "invalid_response"; message = "AI 返回格式异常，未写入病历；请重试";
            } else {
                code = "network"; message = "网络连接失败，请检查联网后重试";
            }
            try {
                result.put("ok", false).put("error", message).put("code", code);
                if (retryAfter > 0) result.put("retryAfter", retryAfter);
            } catch (Exception ignored) { }
        } finally {
            if (conn != null) conn.disconnect();
            synchronized (this) {
                if (id.equals(active)) {
                    connection = null;
                    active = "";
                    if (!closed) callback.done(id, result);
                }
            }
        }
    }

    private boolean waitForRetry(String id, long delayMs) throws InterruptedException {
        if (delayMs <= 0L) return !closed && id.equals(active);
        long deadline = System.currentTimeMillis() + delayMs;
        synchronized (this) {
            while (!closed && id.equals(active)) {
                long remaining = deadline - System.currentTimeMillis();
                if (remaining <= 0L) return true;
                wait(remaining);
            }
            return false;
        }
    }

    private static String extractSyncContent(String response) throws Exception {
        JSONObject parsed = new JSONObject(response);
        JSONArray choices = parsed.getJSONArray("choices");
        if (choices.length() != 1) throw new RequestFailure("invalid_response", "AI 返回候选数量异常，请重试");
        JSONObject choice = choices.getJSONObject(0);
        String finishReason = choice.optString("finish_reason", "");
        checkFinishReason(finishReason);
        String content = choice.getJSONObject("message").optString("content", "").trim();
        if (content.isEmpty()) throw new RequestFailure("invalid_response", "AI 返回了空白内容，请重试");
        return content;
    }

    private String readSseResponse(String id, HttpURLConnection conn, StreamListener streamListener) throws Exception {
        StringBuilder content = new StringBuilder();
        String finishReason = "";
        int totalBytes = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (closed || !id.equals(active)) throw new RequestFailure("cancelled", "已取消 AI 请求");
                totalBytes += line.getBytes(StandardCharsets.UTF_8).length + 1;
                if (totalBytes > MAX_RESPONSE_BYTES) throw new IOException("Response too large");
                String trimmed = line.trim();
                if (trimmed.isEmpty() || !trimmed.startsWith("data:")) continue;
                String data = trimmed.substring(5).trim();
                if ("[DONE]".equals(data)) break;
                JSONObject chunk = new JSONObject(data);
                JSONArray choices = chunk.optJSONArray("choices");
                if (choices == null || choices.length() == 0) continue;
                if (choices.length() != 1) throw new RequestFailure("invalid_response", "AI 返回候选数量异常，请重试");
                JSONObject choice = choices.getJSONObject(0);
                String reason = choice.optString("finish_reason", "");
                if (!reason.isEmpty() && !"null".equals(reason)) finishReason = reason;
                JSONObject delta = choice.optJSONObject("delta");
                if (delta != null) {
                    String part = delta.optString("content", "");
                    if (!part.isEmpty()) {
                        content.append(part);
                        if (streamListener != null && id.equals(active) && !closed) {
                            streamListener.onDelta(id, part);
                        }
                    }
                }
            }
        }
        checkFinishReason(finishReason);
        String finalContent = content.toString().trim();
        if (finalContent.isEmpty()) throw new RequestFailure("invalid_response", "AI 返回了空白内容，请重试");
        return finalContent;
    }

    private static void checkFinishReason(String finishReason) throws RequestFailure {
        if ("length".equals(finishReason)) throw new RequestFailure("truncated_response", "AI 结果未完整结束，未写入病历；请缩短资料后重试");
        if ("content_filter".equals(finishReason)) throw new RequestFailure("content_filtered", "内容被服务端安全策略拦截");
        if (!"stop".equals(finishReason)) throw new RequestFailure("request_failed", "AI 请求失败，未写入病历；请重试");
    }

    static String readLimited(InputStream input) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] bytes = new byte[8192]; int n;
        while ((n = input.read(bytes)) != -1) { if (out.size() + n > MAX_RESPONSE_BYTES) throw new IOException("Response too large"); out.write(bytes, 0, n); }
        return out.toString(StandardCharsets.UTF_8.name());
    }

    synchronized void cancel(String id) {
        if (id == null || !id.equals(active)) return;
        active = "";
        HttpURLConnection conn = connection;
        connection = null;
        notifyAll();
        if (conn != null) conn.disconnect();
    }

    synchronized boolean busy() { return !active.isEmpty(); }

    synchronized void close() {
        closed = true;
        cancel(active);
        notifyAll();
        executor.shutdownNow();
    }
}
