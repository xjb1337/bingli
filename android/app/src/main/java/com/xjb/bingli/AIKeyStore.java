package com.xjb.bingli;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Only encrypted API credentials live in preferences. No WebView getter. */
final class AIKeyStore {
    interface Backend {
        String getString(String key, String fallback);
        boolean put(String model, String ciphertextOrNull);
        boolean clear();
        byte[] encrypt(byte[] plaintext) throws Exception;
        byte[] decrypt(byte[] iv, byte[] ciphertext) throws Exception;
    }

    private static final String ALIAS = "bingli.deepseek.v1";
    private final Backend backend;

    AIKeyStore(Context context) { this(context, ""); }
    AIKeyStore(Context context, String testSuffix) {
        this(new AndroidBackend(context, ALIAS + testSuffix, "deepseek" + testSuffix));
    }
    AIKeyStore(Backend backend) {
        this.backend = backend;
    }

    static boolean isValidKeyFormat(String value) {
        if (value == null) return false;
        int len = value.length();
        return len >= 4 && len <= 1024 && value.matches("[\\x21-\\x7E]+");
    }

    synchronized String read() throws Exception {
        String value = backend.getString("ciphertext", "");
        if (value == null || value.isEmpty()) return "";
        String[] parts = value.split(":", -1);
        if (parts.length != 2 || parts[0].isEmpty() || parts[1].isEmpty()) {
            throw new IllegalStateException("Invalid encrypted credential");
        }
        byte[] iv = java.util.Base64.getDecoder().decode(parts[0]);
        byte[] cipherBytes = java.util.Base64.getDecoder().decode(parts[1]);
        return new String(backend.decrypt(iv, cipherBytes), StandardCharsets.UTF_8);
    }

    synchronized void save(String value, String model) throws Exception {
        if (!DeepSeekClient.validModel(model)) throw new IllegalArgumentException("Unsupported model");
        String trimmed = value == null ? "" : value.trim();
        String encrypted = null;
        if (!trimmed.isEmpty()) {
            if (!isValidKeyFormat(trimmed)) throw new IllegalArgumentException("Invalid key");
            byte[] combined = backend.encrypt(trimmed.getBytes(StandardCharsets.UTF_8));
            if (combined == null || combined.length == 0) throw new IllegalStateException("Encryption failed");
            encrypted = new String(combined, StandardCharsets.UTF_8);
            if (!encrypted.contains(":")) throw new IllegalStateException("Encryption failed");
        }
        if (!backend.put(model, encrypted)) throw new IllegalStateException("Credential write failed");
    }

    String model() {
        String model = backend.getString("model", "deepseek-flash");
        return DeepSeekClient.validModel(model) ? model : "deepseek-flash";
    }

    synchronized boolean hasKey() {
        String raw = backend.getString("ciphertext", "");
        if (raw == null || raw.trim().isEmpty()) return false;
        try {
            String plaintext = read();
            return plaintext != null && !plaintext.trim().isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    synchronized void clear() {
        if (!backend.clear()) throw new IllegalStateException("Credential clear failed");
    }

    private static final class AndroidBackend implements Backend {
        private final SharedPreferences prefs;
        private final String alias;

        AndroidBackend(Context context, String alias, String prefsName) {
            this.alias = alias;
            this.prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE);
        }

        private SecretKey key() throws Exception {
            KeyStore store = KeyStore.getInstance("AndroidKeyStore");
            store.load(null);
            if (!store.containsAlias(alias)) {
                KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .build());
                generator.generateKey();
            }
            return (SecretKey) store.getKey(alias, null);
        }

        @Override public String getString(String key, String fallback) {
            return prefs.getString(key, fallback);
        }

        @Override public boolean put(String model, String ciphertextOrNull) {
            SharedPreferences.Editor edit = prefs.edit().putString("model", model);
            if (ciphertextOrNull != null) edit.putString("ciphertext", ciphertextOrNull);
            return edit.commit();
        }

        @Override public boolean clear() {
            return prefs.edit().clear().commit();
        }

        @Override public byte[] encrypt(byte[] plaintext) throws Exception {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key());
            String formatted = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)
                + ":"
                + Base64.encodeToString(cipher.doFinal(plaintext), Base64.NO_WRAP);
            return formatted.getBytes(StandardCharsets.UTF_8);
        }

        @Override public byte[] decrypt(byte[] iv, byte[] ciphertext) throws Exception {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            return cipher.doFinal(ciphertext);
        }
    }
}
