package com.xjb.bingli;

import android.app.*;
import android.annotation.TargetApi;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.print.*;
import android.provider.MediaStore;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import java.io.*;
import java.time.Clock;
import org.json.JSONObject;
import com.xjb.bingli.migration.LegacyMigrator;

public class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String HANDLE_BACK_JS =
        "(function(){try{if(window.BingliWebHost&&typeof window.BingliWebHost.handleBack==='function')return !!window.BingliWebHost.handleBack();return typeof APP!=='undefined'&&typeof APP.handleBack==='function'&&!!APP.handleBack();}catch(e){return false;}})()";
    private static final String FLUSH_PENDING_SAVE_JS =
        "(function(){try{if(window.BingliWebHost&&typeof window.BingliWebHost.flushPendingSave==='function'){window.BingliWebHost.flushPendingSave();}else if(typeof APP!=='undefined'&&typeof APP.flushPendingSave==='function'){APP.flushPendingSave();}}catch(e){}})()";
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private Uri cameraUri;
    private String exportText;
    private UpdateManager updater;
    private AIKeyStore aiKeys;
    private DeepSeekClient aiClient;
    private LegacyMigrator migrator;
    private LinearLayout root;
    private WebView migrationWeb;
    private WebView printWeb;
    private Object backCallback;
    private WebViewAssetLoader assetLoader;
    private boolean launchConfirmed;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        clearCameraCache();
        clearShareCache();
        aiKeys = new AIKeyStore(this);
        aiClient = new DeepSeekClient();
        // One owner for system bars/cutouts on every supported Android version.
        // The WebView receives an already inset viewport (see native-insets in HTML).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        web = new WebView(this); root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1)); setContentView(root);
        ViewCompat.requestApplyInsets(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", this::openBundledAsset)
            .build();
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
                cameraUri = null;
                if (acceptsImages(params)) {
                    if (params.isCaptureEnabled()) startImageCamera();
                    else openImageGallery();
                } else {
                    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                    try { startActivityForResult(intent, 41); }
                    catch (ActivityNotFoundException e) { chooser.onReceiveValue(null); chooser=null; }
                }
                return true;
            }
        });
        updater = new UpdateManager(this);
        migrator = new LegacyMigrator(new File(getFilesDir(), "legacy-migration"), Clock.systemUTC(), BuildConfig.VERSION_NAME);
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = Api33Back.register(this, this::handleBackAction);
        }
        if (!BuildConfig.USE_MODERN_WEB) loadMain();
        else if (migrator.needsCapture()) beginLegacyMigration();
        else if (migrator.getState() == LegacyMigrator.State.FAILED) loadRecovery();
        else if (migrator.getState() == LegacyMigrator.State.STAGED && !migrator.verify()) loadRecovery();
        else loadMain();
    }

    private boolean acceptsImages(WebChromeClient.FileChooserParams params) {
        String[] types = params.getAcceptTypes();
        if (types == null) return false;
        for (String type : types) {
            if (type != null && type.toLowerCase(java.util.Locale.ROOT).startsWith("image/")) return true;
        }
        return false;
    }
    private void openImageGallery() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
        try { startActivityForResult(intent, 43); }
        catch (ActivityNotFoundException e) { chooser.onReceiveValue(null); chooser = null; }
    }
    private void startImageCamera() {
        try {
            File dir = new File(getCacheDir(), "camera");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("无法创建相机缓存目录");
            clearCameraCache();
            File photo = new File(dir, "photo-" + System.currentTimeMillis() + ".jpg");
            cameraUri = FileProvider.getUriForFile(this, getPackageName() + ".files", photo);
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                .putExtra(MediaStore.EXTRA_OUTPUT, cameraUri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            intent.setClipData(ClipData.newRawUri("病历照片", cameraUri));
            startActivityForResult(intent, 43);
        } catch (Exception e) {
            cameraUri = null;
            openImageGallery();
        }
    }

    /** Deletes every cached camera photo. Patient images must not outlive the session. */
    private void clearCameraCache() {
        File[] old = new File(getCacheDir(), "camera").listFiles();
        if (old != null) for (File file : old) file.delete();
    }

    /** Share attachments are temporary; clear stale patient text on every launch/share. */
    private void clearShareCache() {
        File[] old = new File(getCacheDir(), "share").listFiles();
        if (old != null) for (File file : old) file.delete();
    }

    private String safeShareName(String filename) {
        String base = filename == null ? "病历.txt" : new File(filename).getName();
        base = base.replaceAll("[\\\\/:*?\"<>|\\r\\n]+", "_").trim();
        if (base.isEmpty()) base = "病历.txt";
        if (!base.toLowerCase(java.util.Locale.ROOT).endsWith(".txt")) base += ".txt";
        return base;
    }

    /** Offscreen print WebView is only needed while the system print dialog is open. */
    private void destroyPrintWeb() {
        if (printWeb == null) return;
        if (printWeb.getParent() instanceof android.view.ViewGroup) {
            ((android.view.ViewGroup) printWeb.getParent()).removeView(printWeb);
        }
        printWeb.stopLoading();
        printWeb.destroy();
        printWeb = null;
    }

    /** Deletes the single cancelled camera capture; never used after a successful capture. */
    private void deleteCameraPhoto() {
        Uri uri = cameraUri;
        if (uri == null) return;
        String segment = uri.getLastPathSegment();
        if (segment == null) return;
        File file = new File(new File(getCacheDir(), "camera"), new File(segment).getName());
        if (file.exists()) file.delete();
    }

    static final class AssetMatch {
        final String assetPath;
        final String mimeType;
        final String encoding;
        AssetMatch(String assetPath, String mimeType, String encoding) {
            this.assetPath = assetPath;
            this.mimeType = mimeType;
            this.encoding = encoding;
        }
    }

    static AssetMatch resolveSafeAsset(String scheme, String authority, String rawPath) {
        if (!"https".equals(scheme) || !"appassets.androidplatform.net".equals(authority)) return null;
        if (rawPath == null || rawPath.isEmpty()) return null;
        String lower = rawPath.toLowerCase(java.util.Locale.ROOT);
        if (rawPath.indexOf('\0') >= 0 || rawPath.indexOf('\\') >= 0 || rawPath.contains("//")
            || lower.contains("%2e") || lower.contains("%2f") || lower.contains("%5c")) {
            return null;
        }
        if ("/assets/index.html".equals(rawPath)) return new AssetMatch("index.html", "text/html", "UTF-8");
        if ("/assets/legacy-migrate.html".equals(rawPath)) return new AssetMatch("legacy-migrate.html", "text/html", "UTF-8");
        if ("/assets/migrate-recovery.html".equals(rawPath)) return new AssetMatch("migrate-recovery.html", "text/html", "UTF-8");
        if (!rawPath.startsWith("/assets/assets/")) return null;
        String relative = rawPath.substring("/assets/".length());
        String[] segments = relative.split("/", -1);
        if (segments.length < 2) return null;
        for (String seg : segments) {
            if (seg.isEmpty() || ".".equals(seg) || "..".equals(seg) || !seg.matches("[A-Za-z0-9._-]+")) {
                return null;
            }
        }
        String fileName = segments[segments.length - 1].toLowerCase(java.util.Locale.ROOT);
        if (fileName.endsWith(".js")) return new AssetMatch(relative, "application/javascript", "UTF-8");
        if (fileName.endsWith(".css")) return new AssetMatch(relative, "text/css", "UTF-8");
        if (fileName.endsWith(".svg")) return new AssetMatch(relative, "image/svg+xml", "UTF-8");
        if (fileName.endsWith(".png")) return new AssetMatch(relative, "image/png", null);
        if (fileName.endsWith(".woff2")) return new AssetMatch(relative, "font/woff2", null);
        if (fileName.endsWith(".json")) return new AssetMatch(relative, "application/json", "UTF-8");
        if (fileName.endsWith(".webmanifest")) return new AssetMatch(relative, "application/manifest+json", "UTF-8");
        return null;
    }

    private WebResourceResponse assetResponse(Uri uri) {
        if (uri == null || uri.getUserInfo() != null) return blockedResponse();
        String encodedPath = uri.getEncodedPath();
        String decodedPath = uri.getPath();
        if (resolveSafeAsset(uri.getScheme(), uri.getAuthority(), encodedPath) == null
                || !encodedPath.equals(decodedPath)) {
            return blockedResponse();
        }
        WebResourceResponse response = assetLoader.shouldInterceptRequest(uri);
        return response == null ? blockedResponse() : response;
    }

    private WebResourceResponse openBundledAsset(String relativePath) {
        AssetMatch match = resolveSafeAsset("https", WebViewAssetLoader.DEFAULT_DOMAIN, "/assets/" + relativePath);
        if (match == null) return blockedResponse();
        try { return new WebResourceResponse(match.mimeType, match.encoding, getAssets().open(match.assetPath)); }
        catch (IOException e) { return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0])); }
    }
    private WebResourceResponse blockedResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null, new ByteArrayInputStream(new byte[0]));
    }
    private void loadMain() {
        web.setVisibility(View.VISIBLE);
        web.loadUrl(ORIGIN + "/assets/index.html");
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
        migrationWeb.getSettings().setAllowContentAccess(false);
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
        boolean isFailed = failed || migrator.getState() == LegacyMigrator.State.FAILED;
        if (!isFailed && !migrator.verify()) {
            migrator.markFailed("迁移暂存校验失败");
            isFailed = true;
        }
        if (isFailed) loadRecovery(); else loadMain();
    }
    public final class MigrationBridge {
        @JavascriptInterface public void submit(String json) {
            runOnUiThread(() -> {
                try { migrator.capture(json); finishLegacyMigration(false); }
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
                if (payload == null || payload.length() > 7 * 1024 * 1024) throw new IllegalArgumentException();
                org.json.JSONObject p = new org.json.JSONObject(payload);
                org.json.JSONObject image = p.optJSONObject("image");
                if (p.has("image") && image == null) throw new IllegalArgumentException();
                String imageMime = image == null ? null : image.optString("mimeType", null);
                String imageBase64 = image == null ? null : image.optString("dataBase64", null);
                String system = p.getString("system");
                String user = p.getString("user");
                boolean recognize = p.optBoolean("recognize", DeepSeekClient.isRecognizeRequest(system, user));
                if (aiClient.busy()) {
                    aiResult(id, new org.json.JSONObject().put("ok", false).put("code", "busy").put("error", "上一次请求还在进行，请稍后重试"));
                    return;
                }
                boolean accepted = aiClient.request(id, aiKeys.read(), aiKeys.model(), system, user,
                    imageMime, imageBase64, recognize, MainActivity.this::aiResult);
                if (!accepted) aiResult(id, new org.json.JSONObject().put("ok", false).put("code", "invalid_input").put("error", "AI 请求或图片参数无效，请重新选择后再试"));
            } catch (Exception e) {
                try { aiResult(id, new org.json.JSONObject().put("ok", false).put("code", BridgeErrorMapper.codeFor(e)).put("error", BridgeErrorMapper.messageFor(e))); } catch (Exception ignored) { }
            }
        }
        @JavascriptInterface public String versionName() { return BuildConfig.VERSION_NAME; }
        @JavascriptInterface public String stagedLegacy() {
            try {
                if (!BuildConfig.USE_MODERN_WEB || migrator.getState() != LegacyMigrator.State.STAGED) return "";
                LegacyMigrator.Manifest manifest = migrator.manifest();
                if (manifest == null || !migrator.verify()) return "";
                return new JSONObject()
                    .put("payload", new JSONObject(migrator.exportRaw()))
                    .put("manifest", manifest.toJson())
                    .toString();
            } catch (Exception e) { return ""; }
        }
        @JavascriptInterface public void exportLegacyRaw() {
            export(migrator.exportRaw(), "dabingli-legacy-migration.json", "application/json");
        }
        @JavascriptInterface public void retryLegacy() { runOnUiThread(MainActivity.this::beginLegacyMigration); }
        @JavascriptInterface public void legacyImportSucceeded() {
            runOnUiThread(() -> {
                if (migrator.getState() != LegacyMigrator.State.STAGED) return;
                try { migrator.markImported(); }
                catch (Exception e) { failLegacyImport("无法确认迁移暂存"); }
            });
        }
        @JavascriptInterface public void legacyImportFailed(String reason) {
            runOnUiThread(() -> {
                if (migrator.getState() == LegacyMigrator.State.STAGED) {
                    failLegacyImport(reason == null ? "导入失败" : reason.substring(0, Math.min(reason.length(), 300)));
                }
            });
        }
        @JavascriptInterface public void legacyLaunchSucceeded() {
            runOnUiThread(() -> {
                if (!launchConfirmed && migrator.getState() == LegacyMigrator.State.IMPORTED) {
                    migrator.confirmLaunch(true);
                    launchConfirmed = true;
                }
            });
        }
        @JavascriptInterface public void checkUpdates() { runOnUiThread(() -> updater.check(true)); }
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> ((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("病历", text)));
        }
        @JavascriptInterface public void export(String text, String filename, String mime) {
            if (text == null || text.length() > 8 * 1024 * 1024) return;
            final String safeName = filename == null || filename.trim().isEmpty() ? "病历.txt" : new File(filename).getName();
            final String safeMime = "application/json".equals(mime) ? mime : "text/plain";
            runOnUiThread(() -> {
                if (exportText != null) { Toast.makeText(MainActivity.this,"请先完成当前导出",Toast.LENGTH_SHORT).show(); return; }
                exportText = text;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType(safeMime)
                    .putExtra(Intent.EXTRA_TITLE, safeName);
                try { startActivityForResult(intent, 42); } catch (ActivityNotFoundException e) { exportText=null; }
            });
        }
        @JavascriptInterface public void share(String text, String filename, String mime) {
            if (text == null || text.length() > 8 * 1024 * 1024) return;
            final String name = safeShareName(filename);
            runOnUiThread(() -> {
                try {
                    File dir = new File(getCacheDir(), "share");
                    if (!dir.exists() && !dir.mkdirs()) throw new IOException("无法创建分享缓存目录");
                    clearShareCache();
                    File file = new File(dir, name);
                    try (OutputStream out = new FileOutputStream(file)) {
                        out.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    }
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", file);
                    Intent send = new Intent(Intent.ACTION_SEND)
                        .setType("text/plain")
                        .putExtra(Intent.EXTRA_TEXT, text)
                        .putExtra(Intent.EXTRA_SUBJECT, name)
                        .putExtra(Intent.EXTRA_STREAM, uri)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    send.setClipData(ClipData.newRawUri(name, uri));
                    startActivity(Intent.createChooser(send, "分享病历"));
                } catch (Exception e) {
                    clearShareCache();
                    Toast.makeText(MainActivity.this, "分享失败：" + (e.getMessage() == null ? "无法读取病历" : e.getMessage()), Toast.LENGTH_LONG).show();
                }
            });
        }
        @JavascriptInterface public void printDocument(String html, String title) {
            if (html == null || html.length() > 8 * 1024 * 1024) return;
            final String documentTitle = title == null || title.trim().isEmpty() ? "病历" : title.trim();
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed()) return;
                destroyPrintWeb();
                WebView view = new WebView(MainActivity.this);
                printWeb = view;
                view.setAlpha(0f);
                WebSettings settings = view.getSettings();
                settings.setJavaScriptEnabled(false);
                settings.setBlockNetworkLoads(true);
                settings.setAllowFileAccess(false);
                final boolean[] printStarted = {false};
                view.setWebViewClient(new WebViewClient() {
                    @Override public void onPageFinished(WebView loaded, String url) {
                        if (printWeb != loaded || printStarted[0]) return;
                        printStarted[0] = true;
                        try {
                            PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
                            if (manager == null) throw new IllegalStateException("系统打印服务不可用");
                            PrintDocumentAdapter rawAdapter = loaded.createPrintDocumentAdapter(documentTitle);
                            PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                                @Override public void onStart() { rawAdapter.onStart(); }
                                @Override public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras) {
                                    rawAdapter.onLayout(oldAttributes, newAttributes, cancellationSignal, callback, extras);
                                }
                                @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal cancellationSignal, WriteResultCallback callback) {
                                    rawAdapter.onWrite(pages, destination, cancellationSignal, callback);
                                }
                                @Override public void onFinish() {
                                    try { rawAdapter.onFinish(); } finally { if (printWeb == loaded) destroyPrintWeb(); }
                                }
                            };
                            manager.print(documentTitle, adapter, new PrintAttributes.Builder().build());
                        } catch (Exception e) {
                            Toast.makeText(MainActivity.this, "打印失败：" + (e.getMessage() == null ? "无法打开打印服务" : e.getMessage()), Toast.LENGTH_LONG).show();
                        }
                    }
                });
                root.addView(view, new LinearLayout.LayoutParams(1, 1));
                view.loadDataWithBaseURL(ORIGIN, html, "text/html", "UTF-8", null);
            });
        }
    }
    private void failLegacyImport(String reason) {
        migrator.markFailed(reason);
        if (web != null && !isFinishing() && !isDestroyed()) loadRecovery();
    }

    static String escapeJsSeparators(String jsonOrArgs) {
        if (jsonOrArgs == null) return "";
        return jsonOrArgs.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
    }

    private void aiResult(String id, org.json.JSONObject result) {
        runOnUiThread(() -> {
            if (web == null || isFinishing() || isDestroyed()) return;
            String call = escapeJsSeparators(org.json.JSONObject.quote(id) + "," + result.toString());
            web.evaluateJavascript(
                "if(window.BingliWebHost&&typeof window.BingliWebHost.receiveAi==='function'){window.BingliWebHost.receiveAi(" + call + ");}"
                + "else if(typeof BINGLI_AI_TRANSPORT_RECEIVE==='function'){BINGLI_AI_TRANSPORT_RECEIVE(" + call + ");}"
                + "else if(typeof AI_ASSIST!=='undefined'){AI_ASSIST.receive(" + call + ");}",
                null
            );
        });
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if (request == 41 && chooser != null) {
            chooser.onReceiveValue(result == RESULT_OK && data != null ? new Uri[]{data.getData()} : null); chooser=null;
        }
        if (request == 43) {
            if (result == RESULT_OK) {
                // The WebView must still be able to read the captured file here.
                if (chooser != null) {
                    Uri selected = cameraUri != null ? cameraUri : data != null ? data.getData() : null;
                    chooser.onReceiveValue(selected == null ? null : new Uri[]{selected});
                }
            } else {
                // User cancelled the camera: the empty file is deleted immediately.
                if (cameraUri != null) deleteCameraPhoto();
                if (chooser != null) chooser.onReceiveValue(null);
            }
            chooser = null; cameraUri = null;
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
        if (web != null) web.evaluateJavascript(FLUSH_PENDING_SAVE_JS, null);
        super.onPause();
    }
    @Override protected void onStop() {
        if (chooser == null && cameraUri == null) clearCameraCache();
        super.onStop();
    }
    @Override protected void onDestroy() {
        clearCameraCache();
        clearShareCache();
        destroyPrintWeb();
        if (Build.VERSION.SDK_INT >= 33 && backCallback != null) {
            Api33Back.unregister(this, backCallback);
            backCallback = null;
        }
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

    private void handleBackAction() {
        if (web == null || isFinishing() || isDestroyed()) return;
        web.evaluateJavascript(HANDLE_BACK_JS, value -> {
            if ("true".equals(value) || isFinishing() || isDestroyed()) return;
            if (web != null) web.evaluateJavascript(FLUSH_PENDING_SAVE_JS, null);
            new AlertDialog.Builder(this).setMessage("退出大病历？请确认页面没有保存失败提示。")
                .setPositiveButton("退出",(d,w)->finish()).setNegativeButton("继续填写",null).show();
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        handleBackAction();
    }

    @TargetApi(33)
    private static final class Api33Back {
        static OnBackInvokedCallback register(Activity activity, Runnable onBack) {
            OnBackInvokedCallback cb = onBack::run;
            activity.getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, cb);
            return cb;
        }
        static void unregister(Activity activity, Object callback) {
            if (callback instanceof OnBackInvokedCallback) {
                activity.getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(
                    (OnBackInvokedCallback) callback);
            }
        }
    }
}
