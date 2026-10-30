package com.xjb.bingli;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import java.io.*;

public class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private String exportText;
    private UpdateManager updater;
    private AIKeyStore aiKeys;
    private DeepSeekClient aiClient;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        aiKeys = new AIKeyStore(this);
        aiClient = new DeepSeekClient();
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
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
                Uri uri = request.getUrl();
                if (ORIGIN.equals(uri.getScheme() + "://" + uri.getAuthority()) && "/assets/index.html".equals(uri.getPath())) {
                    try { return new WebResourceResponse("text/html", "UTF-8", getAssets().open("index.html")); }
                    catch (IOException e) { return new WebResourceResponse("text/plain", "UTF-8", 500, "Error", null, new ByteArrayInputStream(new byte[0])); }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null, new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().equals(ORIGIN + "/assets/index.html");
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
        web.loadUrl(ORIGIN + "/assets/index.html");
        updater.check(false);
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
        web.evaluateJavascript("if(typeof APP!=='undefined') APP._test.saveCurrentAwait()",null);
        super.onPause();
    }
    @Override protected void onDestroy() {
        if (aiClient != null) aiClient.close();
        if (updater != null) updater.close();
        if (chooser != null) { chooser.onReceiveValue(null); chooser = null; }
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
        web.evaluateJavascript("(()=>{if(typeof AI_ASSIST!=='undefined'&&AI_ASSIST.isOpen()){AI_ASSIST.close();return true;}if(typeof APP!=='undefined')APP._test.saveCurrentAwait();return false;})()", value -> {
            if ("true".equals(value) || isFinishing() || isDestroyed()) return;
            new AlertDialog.Builder(this).setMessage("退出大病历？请确认页面没有保存失败提示。")
                .setPositiveButton("退出",(d,w)->finish()).setNegativeButton("继续填写",null).show();
        });
    }
}
