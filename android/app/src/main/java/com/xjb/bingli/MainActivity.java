package com.xjb.bingli;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.time.Clock;
import com.xjb.bingli.migration.LegacyMigrator;

public class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private String exportText;
    private UpdateManager updater;
    private AIKeyStore aiKeys;
    private DeepSeekClient aiClient;
    private LegacyMigrator migrator;
    private LinearLayout root;
    private WebView migrationWeb;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        aiKeys = new AIKeyStore(this);
        aiClient = new DeepSeekClient();
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        web = new WebView(this); root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1)); setContentView(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.addJavascriptInterface(new Bridge(), "BingliAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetResponse(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                return !(url.equals(ORIGIN + "/assets/index.html") || url.equals(ORIGIN + "/assets/legacy-migrate.html") || url.equals(ORIGIN + "/assets/migrate-recovery.html"));
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton("确定", (d,w) -> result.confirm()).setNegativeButton("取消", (d,w)->result.cancel())
                    .setOnCancelListener(d -> result.cancel()).show(); return true;
            }
            @Override public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("确定",(d,w)->result.confirm())
                    .setOnCancelListener(d->result.confirm()).show(); return true;
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(intent, 41); } catch (ActivityNotFoundException e) { chooser.onReceiveValue(null); chooser=null; }
                return true;
            }
        });
        updater = new UpdateManager(this);
        migrator = new LegacyMigrator(new File(getFilesDir(), "legacy-migration"), Clock.systemUTC(), BuildConfig.VERSION_NAME);
        if (migrator.getState() == LegacyMigrator.State.NONE) beginLegacyMigration();
        else if (migrator.getState() == LegacyMigrator.State.FAILED) loadRecovery();
        else loadMain();
    }

    private WebResourceResponse assetResponse(Uri uri) {
        if (!ORIGIN.equals(uri.getScheme() + "://" + uri.getAuthority()))
            return blockedResponse();
        String path = uri.getPath();
        String asset = "/assets/index.html".equals(path) ? "index.html" :
            "/assets/legacy-migrate.html".equals(path) ? "legacy-migrate.html" :
            "/assets/migrate-recovery.html".equals(path) ? "migrate-recovery.html" : null;
        if (asset == null) return blockedResponse();
        try { return new WebResourceResponse("text/html", "UTF-8", getAssets().open(asset)); }
        catch (IOException e) { return new WebResourceResponse("text/plain", "UTF-8", 500, "Error", null, new ByteArrayInputStream(new byte[0])); }
    }
    private WebResourceResponse blockedResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null, new ByteArrayInputStream(new byte[0]));
    }
    private void loadMain() {
        web.setVisibility(View.VISIBLE);
        web.loadUrl(ORIGIN + "/assets/index.html");
        if (migrator.getState() == LegacyMigrator.State.IMPORTED) migrator.confirmLaunch(true);
        updater.check(false);
    }
    private void loadRecovery() {
        web.setVisibility(View.VISIBLE);
        web.loadUrl(ORIGIN + "/assets/migrate-recovery.html");
    }
    private void beginLegacyMigration() {
        if (migrationWeb != null) return;
        migrationWeb = new WebView(this);
        migrationWeb.setAlpha(0f);
        migrationWeb.getSettings().setJavaScriptEnabled(true);
        migrationWeb.getSettings().setDomStorageEnabled(true);
        migrationWeb.getSettings().setAllowFileAccess(false);
        migrationWeb.getSettings().setAllowContentAccess(true);
        migrationWeb.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) { return assetResponse(request.getUrl()); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return !request.getUrl().toString().equals(ORIGIN + "/assets/legacy-migrate.html"); }
        });
        migrationWeb.addJavascriptInterface(new MigrationBridge(), "BingliLegacyMigrate");
        root.addView(migrationWeb, new LinearLayout.LayoutParams(1, 1));
        migrationWeb.loadUrl(ORIGIN + "/assets/legacy-migrate.html");
    }
    private void finishLegacyMigration(boolean failed) {
        if (migrationWeb != null) {
            root.removeView(migrationWeb);
            migrationWeb.removeJavascriptInterface("BingliLegacyMigrate");
            migrationWeb.destroy(); migrationWeb = null;
        }
        if (!failed) {
            LegacyMigrator.Manifest manifest = migrator.manifest();
            if (manifest != null && !manifest.getCorruptKeys().isEmpty()) {
                migrator.markFailed("迁移数据包含损坏 JSON：" + String.join(",", manifest.getCorruptKeys()));
                failed = true;
            }
        }
        if (failed) loadRecovery(); else loadMain();
    }
    public final class MigrationBridge {
        @JavascriptInterface public void submit(String json) {
            runOnUiThread(() -> {
                try { migrator.stage(json); finishLegacyMigration(false); }
                catch (Exception e) { migrator.markFailed(e.getMessage() == null ? "迁移失败" : e.getMessage()); finishLegacyMigration(true); }
            });
        }
        @JavascriptInterface public void fail(String reason) {
            runOnUiThread(() -> { migrator.markFailed(reason == null ? "迁移页失败" : reason); finishLegacyMigration(true); });
        }
    }

    public final class Bridge {
        @JavascriptInterface public String aiStatus() {
            try { return new org.json.JSONObject().put("configured", aiKeys.hasKey()).put("model", aiKeys.model()).toString(); }
            catch (Exception e) { return "{\"configured\":false}"; }
        }
        @JavascriptInterface public void aiSettings() { runOnUiThread(() -> AISettings.show(MainActivity.this, aiKeys, aiClient)); }
        @JavascriptInterface public void aiCancel(String id) { aiClient.cancel(id); }
        @JavascriptInterface public void aiRequest(String id, String payload) {
            try {
                if (payload == null || payload.length() > 65000) throw new IllegalArgumentException();
                org.json.JSONObject p = new org.json.JSONObject(payload);
                boolean accepted = aiClient.request(id, aiKeys.read(), aiKeys.model(), p.getString("system"), p.getString("user"), MainActivity.this::aiResult);
                if (!accepted) aiResult(id, new org.json.JSONObject().put("ok", false).put("error", "已有请求进行中或参数无效，请稍后重试"));
            } catch (Exception e) {
                try { aiResult(id, new org.json.JSONObject().put("ok", false).put("error", "无法读取 AI 设置，请重新保存密钥")); } catch (Exception ignored) { }
            }
        }
        @JavascriptInterface public String versionName() { return BuildConfig.VERSION_NAME; }
        @JavascriptInterface public String stagedLegacy() {
            try {
                org.json.JSONObject out = new org.json.JSONObject();
                String raw = migrator.exportRaw();
                out.put("payload", new org.json.JSONObject(raw));
                out.put("rawPayload", raw);
                LegacyMigrator.Manifest manifest = migrator.manifest();
                if (manifest != null) out.put("manifest", manifest.toJson());
                return out.toString();
            } catch (Exception e) { return ""; }
        }
        @JavascriptInterface public void exportLegacyRaw() {
            export(migrator.exportRaw(), "dabingli-legacy-migration.json", "application/json");
        }
        @JavascriptInterface public void retryLegacy() { runOnUiThread(MainActivity.this::beginLegacyMigration); }
        @JavascriptInterface public void legacyImportSucceeded() {
            try { migrator.markImported(); } catch (Exception e) { migrator.markFailed(e.getMessage() == null ? "导入失败" : e.getMessage()); }
        }
        @JavascriptInterface public void legacyLaunchSucceeded() { migrator.confirmLaunch(true); }
        @JavascriptInterface public void checkUpdates() { runOnUiThread(() -> updater.check(true)); }
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> ((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("病历", text)));
        }
        @JavascriptInterface public void export(String text, String filename, String mime) {
            if (text.length() > 8 * 1024 * 1024) return;
            runOnUiThread(() -> {
                if (exportText != null) { Toast.makeText(MainActivity.this,"请先完成当前导出",Toast.LENGTH_SHORT).show(); return; }
                exportText = text;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType(mime.equals("application/json") ? mime : "text/plain")
                    .putExtra(Intent.EXTRA_TITLE, new File(filename).getName());
                try { startActivityForResult(intent, 42); } catch (ActivityNotFoundException e) { exportText=null; }
            });
        }
    }
    private void aiResult(String id, org.json.JSONObject result) {
        runOnUiThread(() -> {
            if (web == null || isFinishing() || isDestroyed()) return;
            web.evaluateJavascript("if(typeof AI_ASSIST!=='undefined') AI_ASSIST.receive(" + org.json.JSONObject.quote(id) + "," + result.toString() + ")", null);
        });
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if (request == 41 && chooser != null) {
            chooser.onReceiveValue(result == RESULT_OK && data != null ? new Uri[]{data.getData()} : null); chooser=null;
        }
        if (request == 42) {
            String content = exportText; exportText=null;
            if (result == RESULT_OK && data != null && content != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if(out == null) throw new IOException("无法打开文件");
                    out.write(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    Toast.makeText(this,"文件已保存",Toast.LENGTH_SHORT).show();
                } catch (IOException e) { Toast.makeText(this,"保存失败："+e.getMessage(),Toast.LENGTH_LONG).show(); }
            }
        }
    }
    @Override protected void onPause() {
        // Flush the WebView editor's debounced draft before the Activity goes
        // into the background. The callback is intentionally best-effort;
        // Android may stop the process immediately after onPause.
        web.evaluateJavascript("if(typeof APP!=='undefined' && APP._test.flushPendingSave) APP._test.flushPendingSave()", null);
        super.onPause();
    }
    @Override protected void onDestroy() {
        if (aiClient != null) aiClient.close();
        if (updater != null) updater.close();
        if (chooser != null) { chooser.onReceiveValue(null); chooser = null; }
        if (migrationWeb != null) { migrationWeb.destroy(); migrationWeb = null; }
        if (web != null) {
            if (web.getParent() instanceof android.view.ViewGroup) {
                ((android.view.ViewGroup) web.getParent()).removeView(web);
            }
            web.removeJavascriptInterface("BingliAndroid");
            web.stopLoading();
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("(()=>{if(typeof AI_ASSIST!=='undefined'&&AI_ASSIST.isOpen()){AI_ASSIST.close();return true;}if(typeof APP!=='undefined'&&APP._test.flushPendingSave)APP._test.flushPendingSave();return false;})()", value -> {
            if ("true".equals(value) || isFinishing() || isDestroyed()) return;
            new AlertDialog.Builder(this).setMessage("退出大病历？请确认页面没有保存失败提示。")
                .setPositiveButton("退出",(d,w)->finish()).setNegativeButton("继续填写",null).show();
        });
    }
}
