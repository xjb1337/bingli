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
    private static final String ALIAS = "bingli.deepseek.v1";
    private final SharedPreferences prefs;
    private final String alias;
    AIKeyStore(Context context) { this(context, ""); }
    AIKeyStore(Context context, String testSuffix) {
        alias = ALIAS + testSuffix;
        prefs = context.getSharedPreferences("deepseek" + testSuffix, Context.MODE_PRIVATE);
    }
    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (!store.containsAlias(alias)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            generator.generateKey();
        }
        return (SecretKey) store.getKey(alias, null);
    }
    synchronized String read() throws Exception {
        String value = prefs.getString("ciphertext", "");
        if (value.isEmpty()) return "";
        String[] parts = value.split(":", -1);
        if (parts.length != 2) throw new IllegalStateException("Invalid encrypted credential");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }
    synchronized void save(String value, String model) throws Exception {
        if (!DeepSeekClient.validModel(model)) throw new IllegalArgumentException("Unsupported model");
        SharedPreferences.Editor edit = prefs.edit().putString("model", model);
        if (!value.isEmpty()) {
            if (!value.matches("[A-Za-z0-9_\\-]{10,256}")) throw new IllegalArgumentException("Invalid key");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key());
            String encrypted = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" +
                Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
            edit.putString("ciphertext", encrypted);
        }
        if (!edit.commit()) throw new IllegalStateException("Credential write failed");
    }
    String model() { String model = prefs.getString("model", "deepseek-flash"); return DeepSeekClient.validModel(model) ? model : "deepseek-flash"; }
    boolean hasKey() { return prefs.contains("ciphertext"); }
    synchronized void clear() { if (!prefs.edit().clear().commit()) throw new IllegalStateException("Credential clear failed"); }
}
