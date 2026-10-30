package com.xjb.bingli;
import org.junit.Test;
import static org.junit.Assert.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class DeepSeekClientTest {
    @Test public void restrictModels() {
        assertTrue(DeepSeekClient.validModel("deepseek-flash")); assertTrue(DeepSeekClient.validModel("deepseek-v4-pro"));
        assertFalse(DeepSeekClient.validModel("../../other")); assertFalse(DeepSeekClient.validModel(null));
    }
    @Test public void classifyErrorsWithoutReflectingRemoteBody() {
        assertTrue(DeepSeekClient.httpError(401).contains("Key")); assertTrue(DeepSeekClient.httpError(402).contains("余额"));
        assertTrue(DeepSeekClient.httpError(429).contains("频繁")); assertTrue(DeepSeekClient.httpError(503).contains("暂不可用"));
        assertTrue(DeepSeekClient.httpError(302).contains("302"));
    }
    @Test public void readUtf8Response() throws Exception {
        String text = "{\"text\":\"患者诉咳嗽\"}";
        assertEquals(text, DeepSeekClient.readLimited(new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8))));
    }
    @Test(expected=IOException.class) public void rejectOversizedResponse() throws Exception {
        DeepSeekClient.readLimited(new ByteArrayInputStream(new byte[256 * 1024 + 1]));
    }
}
