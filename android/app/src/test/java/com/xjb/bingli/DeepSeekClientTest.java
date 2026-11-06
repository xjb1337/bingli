package com.xjb.bingli;
import org.junit.Test;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import static org.junit.Assert.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class DeepSeekClientTest {
    @Test public void restrictModels() {
        assertTrue(DeepSeekClient.validModel("deepseek-flash")); assertTrue(DeepSeekClient.validModel("deepseek-v4-pro"));
        assertFalse(DeepSeekClient.validModel("../../other")); assertFalse(DeepSeekClient.validModel(null));
    }
    @Test public void classifyErrorsWithoutReflectingRemoteBody() {
        assertTrue(DeepSeekClient.httpError(401).contains("Key")); assertTrue(DeepSeekClient.httpError(403).contains("权限"));
        assertTrue(DeepSeekClient.httpError(402).contains("余额"));
        assertTrue(DeepSeekClient.httpError(429).contains("频繁")); assertTrue(DeepSeekClient.httpError(503).contains("暂不可用"));
        assertTrue(DeepSeekClient.httpError(302).contains("302"));
    }
    @Test public void emitsStableHttpErrorCodes() {
        assertEquals("unauthorized", DeepSeekClient.httpErrorCode(401));
        assertEquals("forbidden", DeepSeekClient.httpErrorCode(403));
        assertEquals("insufficient_balance", DeepSeekClient.httpErrorCode(402));
        assertEquals("rate_limited", DeepSeekClient.httpErrorCode(429));
        assertEquals("server_unavailable", DeepSeekClient.httpErrorCode(500));
        assertEquals("server_unavailable", DeepSeekClient.httpErrorCode(503));
        assertEquals("http_error", DeepSeekClient.httpErrorCode(302));
    }
    @Test public void readUtf8Response() throws Exception {
        String text = "{\"text\":\"患者诉咳嗽\"}";
        assertEquals(text, DeepSeekClient.readLimited(new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8))));
    }
    @Test public void buildsTextOnlyContentWithoutChangingTheText() throws Exception {
        JSONArray content = DeepSeekClient.userContent("识别这段病历", null, null);
        assertEquals(1, content.length());
        assertEquals("text", content.getJSONObject(0).getString("type"));
        assertEquals("识别这段病历", content.getJSONObject(0).getString("text"));
    }
    @Test public void buildsMultimodalContentWithHighDetailImage() throws Exception {
        JSONArray content = DeepSeekClient.userContent("请识别", "image/jpeg", "aGVsbG8=");
        assertEquals(2, content.length());
        JSONObject image = content.getJSONObject(1);
        assertEquals("image_url", image.getString("type"));
        assertEquals("data:image/jpeg;base64,aGVsbG8=", image.getJSONObject("image_url").getString("url"));
        assertEquals("high", image.getJSONObject("image_url").getString("detail"));
    }
    @Test public void rejectsUnsupportedOrMalformedImages() {
        assertFalse(DeepSeekClient.validImagePayload("image/svg+xml", "aGVsbG8="));
        assertFalse(DeepSeekClient.validImagePayload("image/jpeg", "not base64"));
        assertFalse(DeepSeekClient.validImagePayload("image/jpeg", "abc"));
        assertFalse(DeepSeekClient.validImagePayload(null, "aGVsbG8="));
        assertTrue(DeepSeekClient.validImagePayload("image/webp", "aGVsbG8="));
    }
    @Test public void rejectsImagesOverTheBase64Limit() {
        String tooLarge = "A".repeat(DeepSeekClient.MAX_IMAGE_BASE64_CHARS + 4);
        assertFalse(DeepSeekClient.validImagePayload("image/png", tooLarge));
    }
    @Test(expected=JSONException.class) public void rejectsInvalidImageWhenBuildingContent() throws Exception {
        DeepSeekClient.userContent("请识别", "image/bmp", "aGVsbG8=");
    }
    @Test(expected=IOException.class) public void rejectOversizedResponse() throws Exception {
        DeepSeekClient.readLimited(new ByteArrayInputStream(new byte[256 * 1024 + 1]));
    }

    // ---- P0-2: image requests force deepseek-flash for this request only ----

    @Test public void usesFlashForImageRequestsEvenWhenProIsSelected() throws Exception {
        FakeConnection conn = new FakeConnection(200, successResponse());
        DeepSeekClient client = new DeepSeekClient(() -> conn);
        try {
            JSONObject result = run(client, "deepseek-v4-pro", "请识别", "识别内容", "image/jpeg", "aGVsbG8=");
            JSONObject request = new JSONObject(conn.bodyText());
            assertEquals("deepseek-flash", request.getString("model"));
            assertEquals("deepseek-flash", result.getString("model"));
            assertTrue(result.getBoolean("ok"));
        } finally { client.close(); }
    }

    @Test public void keepsSelectedProModelForTextOnlyRequests() throws Exception {
        FakeConnection conn = new FakeConnection(200, successResponse());
        DeepSeekClient client = new DeepSeekClient(() -> conn);
        try {
            JSONObject result = run(client, "deepseek-v4-pro", "整理病历", "整理内容", null, null);
            JSONObject request = new JSONObject(conn.bodyText());
            assertEquals("deepseek-v4-pro", request.getString("model"));
            assertEquals("deepseek-v4-pro", result.getString("model"));
        } finally { client.close(); }
    }

    private static JSONObject run(DeepSeekClient client, String model, String system, String user,
                                  String imageMime, String imageBase64) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        JSONObject[] result = new JSONObject[1];
        assertTrue(client.request("test_request", "sk-test-key", model, system, user, imageMime, imageBase64,
            (id, response) -> { result[0] = response; latch.countDown(); }));
        assertTrue(latch.await(10, TimeUnit.SECONDS));
        assertNotNull(result[0]);
        return result[0];
    }

    private static String successResponse() throws Exception {
        return new JSONObject().put("choices", new JSONArray().put(new JSONObject()
            .put("finish_reason", "stop")
            .put("message", new JSONObject().put("content", new JSONObject().put("ok", true).toString())))).toString();
    }

    private static final class FakeConnection extends HttpURLConnection {
        private final ByteArrayOutputStream body = new ByteArrayOutputStream();
        private final int status;
        private final String response;
        FakeConnection(int status, String response) throws IOException {
            super(new URL("https://example.test/chat/completions"));
            this.status = status;
            this.response = response;
        }
        String bodyText() throws IOException { return body.toString(StandardCharsets.UTF_8.name()); }
        @Override public void connect() { }
        @Override public void disconnect() { }
        @Override public boolean usingProxy() { return false; }
        @Override public OutputStream getOutputStream() { return body; }
        @Override public int getResponseCode() { return status; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8)); }
    }
}
