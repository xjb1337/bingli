package com.xjb.bingli;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import org.json.*;
import java.io.*;
import java.net.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;

final class UpdateManager {
    private final Activity activity;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private boolean busy;
    private File ready;
    private ProgressDialog progress;
    UpdateManager(Activity activity) { this.activity=activity; }
    private void ui(Runnable task) { activity.runOnUiThread(() -> { if(!activity.isFinishing() && !activity.isDestroyed()) task.run(); }); }
    private void message(String text) { ui(() -> new AlertDialog.Builder(activity).setTitle("应用更新").setMessage(text).setPositiveButton("确定",null).show()); }

    void check(boolean manual) {
        if(busy) return;
        if(ready != null && manual) { install(); return; }
        SharedPreferences prefs=activity.getSharedPreferences("updates",0);
        if(!manual && System.currentTimeMillis()-prefs.getLong("checked",0)<86400000L) return;
        busy=true;
        if(manual) android.widget.Toast.makeText(activity,"正在检查更新…",android.widget.Toast.LENGTH_SHORT).show();
        worker.execute(() -> {
            try {
                JSONObject release = new JSONObject(new String(read("https://api.github.com/repos/"+BuildConfig.UPDATE_REPOSITORY+"/releases/latest", 1024*1024), "UTF-8"));
                if(release.optBoolean("draft") || release.optBoolean("prerelease")) throw new IOException("暂无正式更新");
                JSONArray assets=release.getJSONArray("assets");
                String metadata=asset(assets,"update.json");
                JSONObject manifest=new JSONObject(new String(read(metadata,65536),"UTF-8"));
                validate(manifest);
                prefs.edit().putLong("checked",System.currentTimeMillis()).apply();
                if(manifest.getLong("versionCode")<=BuildConfig.VERSION_CODE) { if(manual) message("已是最新版本 "+BuildConfig.VERSION_NAME); return; }
                if(manifest.getInt("minSdk")>Build.VERSION.SDK_INT) throw new IOException("新版本不支持当前 Android 版本");
                String apk=asset(assets,manifest.getString("apkAssetName"));
                ui(() -> new AlertDialog.Builder(activity).setTitle("发现新版本 "+manifest.optString("versionName"))
                    .setMessage(manifest.optString("releaseNotes")+"\n\n更新保留本机病历，建议先导出备份。")
                    .setNegativeButton("稍后",null).setPositiveButton("下载更新",(d,w)->download(apk,manifest)).show());
            } catch(Exception e) { if(manual) message("检查失败："+e.getMessage()+"\n可稍后重试，离线填写不受影响。"); }
            finally { busy=false; }
        });
    }
    private String asset(JSONArray assets,String name) throws Exception {
        String found=null;
        for(int i=0;i<assets.length();i++) {
            JSONObject a=assets.getJSONObject(i);
            if(name.equals(a.getString("name"))) {
                if(found!=null) throw new IOException("更新资源重复");
                found=a.getString("browser_download_url");
                if(!found.startsWith("https://github.com/"+BuildConfig.UPDATE_REPOSITORY+"/releases/download/")) throw new IOException("更新来源不匹配");
            }
        }
        if(found==null) throw new IOException("未找到更新资源 "+name);
        return found;
    }
    private void validate(JSONObject m) throws Exception {
        if(m.getInt("schemaVersion")!=1 || !BuildConfig.APPLICATION_ID.equals(m.getString("applicationId"))) throw new IOException("更新包配置不匹配");
        if(!m.getString("apkSha256").matches("[a-fA-F0-9]{64}") || !m.getString("signingCertSha256").matches("[a-fA-F0-9]{64}")) throw new IOException("更新校验信息无效");
        if(m.getLong("apkSizeBytes")<=0 || m.getLong("apkSizeBytes")>100*1024*1024) throw new IOException("更新包大小无效");
        PackageInfo installed=info(null);
        if(!cert(installed).equalsIgnoreCase(m.getString("signingCertSha256"))) throw new IOException("更新签名与本机版本不同");
    }
    private void download(String url,JSONObject manifest) {
        if(busy) return; busy=true;
        progress=new ProgressDialog(activity); progress.setTitle("正在下载并校验更新"); progress.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
        progress.setMax(100); progress.setCancelable(false); progress.show();
        worker.execute(() -> {
            File file=new File(activity.getCacheDir(),"updates/bingli.apk");
            try {
                if(!file.getParentFile().isDirectory() && !file.getParentFile().mkdirs()) throw new IOException("无法创建更新目录");
                HttpURLConnection connection=connect(url); long size=manifest.getLong("apkSizeBytes"); long total=0;
                MessageDigest digest=MessageDigest.getInstance("SHA-256");
                try(InputStream input=connection.getInputStream(); OutputStream output=new FileOutputStream(file)) {
                    byte[] buffer=new byte[32768]; int n;
                    while((n=input.read(buffer))!=-1) {
                        total+=n; if(total>size) throw new IOException("下载大小超出预期");
                        output.write(buffer,0,n); digest.update(buffer,0,n);
                        int percent=(int)(total*100/size); ui(()->progress.setProgress(percent));
                    }
                } finally { connection.disconnect(); }
                UpdatePolicy.verifyDownload(size, total, manifest.getString("apkSha256"), hex(digest.digest()));
                PackageInfo archive=info(file.getAbsolutePath());
                if(archive==null) throw new IOException("无法读取 APK 信息");
                UpdatePolicy.verifyArchive(BuildConfig.APPLICATION_ID, archive.packageName, BuildConfig.VERSION_CODE,
                    manifest.getLong("versionCode"), version(archive), cert(info(null)), cert(archive),
                    manifest.getString("versionName"), archive.versionName);
                ready=file;
                ui(()->new AlertDialog.Builder(activity).setMessage("更新包已校验，开始安装？").setPositiveButton("安装",(d,w)->install()).setNegativeButton("稍后",null).show());
            } catch(Exception e) { file.delete(); ready=null; message("更新失败："+e.getMessage()); }
            finally { busy=false; ui(()->progress.dismiss()); }
        });
    }
    private void install() {
        if(ready==null || !ready.isFile()) return;
        if(!activity.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(activity).setMessage("请在系统页面允许本应用安装更新，返回后再点检查更新继续安装。")
                .setPositiveButton("前往设置",(d,w)->activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+BuildConfig.APPLICATION_ID))))
                .setNegativeButton("取消",null).show(); return;
        }
        Uri uri=FileProvider.getUriForFile(activity,BuildConfig.APPLICATION_ID+".files",ready);
        activity.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
    }
    @SuppressWarnings("deprecation") private PackageInfo info(String path) throws Exception {
        PackageManager pm=activity.getPackageManager(); int flags=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
        return path==null?pm.getPackageInfo(BuildConfig.APPLICATION_ID,flags):pm.getPackageArchiveInfo(path,flags);
    }
    @SuppressWarnings("deprecation") private String cert(PackageInfo p) throws Exception {
        android.content.pm.Signature[] signatures=Build.VERSION.SDK_INT>=28?p.signingInfo.getApkContentsSigners():p.signatures;
        if(signatures==null || signatures.length!=1) throw new IOException("无法确认唯一签名证书");
        return hex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()));
    }
    @SuppressWarnings("deprecation") private long version(PackageInfo p) { return Build.VERSION.SDK_INT>=28?p.getLongVersionCode():p.versionCode; }
    private static String hex(byte[] data) { StringBuilder s=new StringBuilder(); for(byte b:data)s.append(String.format(Locale.ROOT,"%02x",b&255)); return s.toString(); }
    private static HttpURLConnection connect(String address) throws IOException {
        for(int i=0;i<6;i++) {
            URL url=new URL(address); if(!"https".equals(url.getProtocol())) throw new IOException("更新必须使用 HTTPS");
            HttpURLConnection c=(HttpURLConnection)url.openConnection(); c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","Bingli-Android");
            int code=c.getResponseCode(); if(code>=300 && code<400) { String location=c.getHeaderField("Location"); c.disconnect(); address=new URL(url,location).toString(); continue; }
            if(code!=200) {c.disconnect();throw new IOException("HTTP "+code); } return c;
        }
        throw new IOException("更新重定向过多");
    }
    private static byte[] read(String url,int limit) throws IOException {
        HttpURLConnection c=connect(url);
        try(InputStream input=c.getInputStream(); ByteArrayOutputStream out=new ByteArrayOutputStream()) {
            byte[] buf=new byte[8192]; int n; while((n=input.read(buf))!=-1) { if(out.size()+n>limit)throw new IOException("响应过大");out.write(buf,0,n); } return out.toByteArray();
        } finally {c.disconnect();}
    }
}
