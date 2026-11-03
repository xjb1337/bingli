package com.xjb.bingli;
import org.junit.Test;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import static org.junit.Assert.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

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
}
