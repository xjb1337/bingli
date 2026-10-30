package com.xjb.bingli;

import android.test.AndroidTestCase;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** Real Android Keystore and native request pipeline with synthetic HTTP fixtures. */
@SuppressWarnings("deprecation")
public class AIInstrumentedTest extends AndroidTestCase {
    public void testKeystoreEncryptedRoundtripAndDelete() throws Exception {
        AIKeyStore vault = new AIKeyStore(getContext(), ".instrumented"); vault.clear();
        String fake = "sk-synthetic-instrumented-not-a-real-api-key";
        try {
            vault.save(fake, "deepseek-flash");
            assertEquals(fake, vault.read());
            String raw = getContext().getSharedPreferences("deepseek.instrumented", 0).getString("ciphertext", "");
            assertFalse(raw.contains(fake)); assertTrue(raw.contains(":"));
            vault.save("", "deepseek-v4-pro"); assertEquals(fake, vault.read()); assertEquals("deepseek-v4-pro", vault.model());
            vault.clear(); assertFalse(vault.hasKey()); assertEquals("", vault.read());
        } finally { vault.clear(); }
    }
    private static class Connection extends HttpURLConnection {
        final int code; final String response; final ByteArrayOutputStream sent = new ByteArrayOutputStream();
        boolean disconnected;
        Connection(int code, String response) throws Exception { super(new URL("https://api.deepseek.com/chat/completions")); this.code = code; this.response = response; }
        @Override public void connect() { }
        @Override public void disconnect() { disconnected = true; }
        @Override public boolean usingProxy() { return false; }
        @Override public OutputStream getOutputStream() { return sent; }
        @Override public int getResponseCode() { return code; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8)); }
    }
    private JSONObject run(Connection conn) throws Exception {
        DeepSeekClient client = new DeepSeekClient(() -> conn);
        CountDownLatch latch = new CountDownLatch(1); JSONObject[] result = {null};
        assertTrue(client.request("fixture", "sk-synthetic", "deepseek-flash", "JSON only", "synthetic note", (id, r) -> { result[0] = r; latch.countDown(); }));
        assertTrue(latch.await(5, TimeUnit.SECONDS)); client.close(); assertTrue(conn.disconnected);
        return result[0];
    }
    private String envelope(String content, String finish) throws Exception {
        return new JSONObject().put("choices", new org.json.JSONArray().put(new JSONObject().put("finish_reason", finish)
            .put("message", new JSONObject().put("content", content).put("reasoning_content", "DO_NOT_EXPOSE_REASONING")))).toString();
    }
    public void testValidNativeRequestAndFinalJsonOnly() throws Exception {
        Connection conn = new Connection(200, envelope("{\"suggestions\":[],\"issues\":[],\"questions\":[]}", "stop"));
        JSONObject result = run(conn); assertTrue(result.optBoolean("ok"));
        assertNotNull(result.optJSONObject("content")); assertFalse(result.toString().contains("DO_NOT_EXPOSE_REASONING"));
        JSONObject body = new JSONObject(conn.sent.toString("UTF-8"));
        assertEquals("json_object", body.getJSONObject("response_format").getString("type"));
        assertFalse(body.getBoolean("stream")); assertEquals("disabled", body.getJSONObject("thinking").getString("type"));
        assertFalse(conn.getInstanceFollowRedirects());
    }
    public void testTruncatedResponseRejected() throws Exception {
        JSONObject result = run(new Connection(200, envelope("{\"partial\":", "length")));
        assertFalse(result.optBoolean("ok")); assertTrue(result.getString("error").contains("完整"));
    }
    public void testBlankAndMalformedResponsesRejected() throws Exception {
        assertFalse(run(new Connection(200, envelope("   ", "stop"))).optBoolean("ok"));
        assertFalse(run(new Connection(200, envelope("{broken", "stop"))).optBoolean("ok"));
    }
    public void testHttpErrorsDoNotExposePrivateRemoteBody() throws Exception {
        for (int code : new int[]{401, 402, 429, 500, 302}) {
            JSONObject result = run(new Connection(code, "PRIVATE_BODY_DO_NOT_DISPLAY"));
            assertFalse(result.optBoolean("ok")); assertFalse(result.toString().contains("PRIVATE_BODY"));
        }
    }
    public void testCancelSuppressesLateCompletionAndAllowsNextRequest() throws Exception {
        CountDownLatch started = new CountDownLatch(1), released = new CountDownLatch(1), finished = new CountDownLatch(1);
        boolean[] called = {false};
        Connection conn = new Connection(200, envelope("{}", "stop")) {
            @Override public int getResponseCode() { started.countDown(); try { released.await(5, TimeUnit.SECONDS); } catch (Exception ignored) { } return 200; }
            @Override public void disconnect() { super.disconnect(); released.countDown(); finished.countDown(); }
        };
        DeepSeekClient client = new DeepSeekClient(() -> conn);
        assertTrue(client.request("cancel_me", "sk-synthetic", "deepseek-flash", "JSON", "test", (id, r) -> { called[0] = true; }));
        assertTrue(started.await(5, TimeUnit.SECONDS));
        assertFalse(client.request("busy", "sk-synthetic", "deepseek-flash", "JSON", "test", (id, r) -> { }));
        client.cancel("cancel_me"); assertFalse(client.busy()); assertTrue(finished.await(5, TimeUnit.SECONDS));
        CountDownLatch next = new CountDownLatch(1);
        assertTrue(client.request("next", "sk-synthetic", "deepseek-flash", "JSON", "test", (id, r) -> next.countDown()));
        assertTrue(next.await(5, TimeUnit.SECONDS)); assertFalse(called[0]); client.close();
    }
}
