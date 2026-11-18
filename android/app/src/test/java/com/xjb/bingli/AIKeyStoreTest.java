package com.xjb.bingli;

import org.junit.Test;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import static org.junit.Assert.*;

public class AIKeyStoreTest {
    private static final class MemoryBackend implements AIKeyStore.Backend {
        final Map<String, String> prefs = new HashMap<>();
        boolean failDecrypt;

        @Override public String getString(String key, String fallback) {
            return prefs.containsKey(key) ? prefs.get(key) : fallback;
        }

        @Override public boolean put(String model, String ciphertextOrNull) {
            prefs.put("model", model);
            if (ciphertextOrNull != null) prefs.put("ciphertext", ciphertextOrNull);
            return true;
        }

        @Override public boolean clear() {
            prefs.clear();
            return true;
        }

        @Override public byte[] encrypt(byte[] plaintext) {
            String iv = Base64.getEncoder().encodeToString("123456789012".getBytes(StandardCharsets.UTF_8));
            String body = Base64.getEncoder().encodeToString(plaintext);
            return (iv + ":" + body).getBytes(StandardCharsets.UTF_8);
        }

        @Override public byte[] decrypt(byte[] iv, byte[] ciphertext) throws Exception {
            if (failDecrypt) throw new javax.crypto.AEADBadTagException("Key invalidated");
            return ciphertext;
        }
    }

    @Test public void hasKeyVerifiesNonEmptyDecryptableCiphertext() throws Exception {
        MemoryBackend backend = new MemoryBackend();
        AIKeyStore store = new AIKeyStore(backend);
        assertFalse(store.hasKey());

        backend.prefs.put("ciphertext", "");
        assertFalse(store.hasKey());

        backend.prefs.put("ciphertext", "malformed-without-colon");
        assertFalse(store.hasKey());

        store.save("sk-valid-test-key", "deepseek-flash");
        assertTrue(store.hasKey());
        assertEquals("sk-valid-test-key", store.read());

        backend.failDecrypt = true;
        assertFalse(store.hasKey());

        backend.failDecrypt = false;
        assertTrue(store.hasKey());

        store.clear();
        assertFalse(store.hasKey());
    }

    @Test public void relaxedKeyFormatAllowsValidApiKeysAndRejectsUnsafeChars() throws Exception {
        MemoryBackend backend = new MemoryBackend();
        AIKeyStore store = new AIKeyStore(backend);

        String complexKey = "sk-proj.abc+def/12345=xyz_" + "a".repeat(300);
        store.save(complexKey, "deepseek-v4-pro");
        assertTrue(store.hasKey());
        assertEquals(complexKey, store.read());
        assertEquals("deepseek-v4-pro", store.model());

        assertTrue(AIKeyStore.isValidKeyFormat("sk-1234"));
        assertFalse(AIKeyStore.isValidKeyFormat("ab"));
        assertFalse(AIKeyStore.isValidKeyFormat("sk-bad\r\nheader"));
        assertFalse(AIKeyStore.isValidKeyFormat("sk-bad space"));
    }
}
