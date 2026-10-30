package com.xjb.bingli;

import android.app.*;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.view.View;
import android.widget.*;
import org.json.JSONObject;

final class AISettings {
    static void show(Activity activity, AIKeyStore vault, DeepSeekClient client) {
        LinearLayout layout = new LinearLayout(activity); layout.setOrientation(LinearLayout.VERTICAL);
        int pad = (int)(20 * activity.getResources().getDisplayMetrics().density); layout.setPadding(pad, pad / 2, pad, pad / 2);
        TextView intro = new TextView(activity); intro.setText("使用你自己的 DeepSeek API Key。密钥在本机加密保存，不进入病历备份。连接测试只发送固定测试文字。\n服务地址：https://api.deepseek.com\n留空密钥可保留原设置。"); layout.addView(intro);
        EditText input = new EditText(activity); input.setSingleLine(true); input.setHint(vault.hasKey() ? "已有密钥；输入新密钥可替换" : "输入 DeepSeek API Key");
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        input.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS); layout.addView(input);
        Spinner spinner = new Spinner(activity);
        spinner.setAdapter(new ArrayAdapter<>(activity, android.R.layout.simple_spinner_dropdown_item, new String[]{"Flash · 日常整理", "Pro · 复杂资料"}));
        spinner.setSelection("deepseek-v4-pro".equals(vault.model()) ? 1 : 0); layout.addView(spinner);
        TextView status = new TextView(activity); status.setPadding(0, pad / 2, 0, pad / 2); layout.addView(status);
        Button test = new Button(activity); test.setText("保存并测试连接"); layout.addView(test);
        Button remove = new Button(activity); remove.setText("删除本机密钥"); layout.addView(remove);
        ScrollView scroll = new ScrollView(activity); scroll.addView(layout);
        AlertDialog dialog = new AlertDialog.Builder(activity).setTitle("DeepSeek 设置").setView(scroll)
            .setPositiveButton("保存", null).setNegativeButton("关闭", null).create();
        final String[] testId = {""};
        java.util.concurrent.Callable<Boolean> save = () -> {
            try {
                vault.save(input.getText().toString().trim(), spinner.getSelectedItemPosition() == 0 ? "deepseek-flash" : "deepseek-v4-pro");
                input.setText("");
                if (vault.read().isEmpty()) { status.setText("请先输入 API Key"); return false; }
                status.setText("已加密保存到本机"); return true;
            } catch (Exception e) { status.setText("保存或读取密钥失败，请重新输入有效密钥；旧资料未改动"); return false; }
        };
        test.setOnClickListener(v -> {
            if (client.busy()) { status.setText("已有 AI 请求进行中，请先取消或等待完成"); return; }
            try {
                if (!save.call()) return;
                testId[0] = "test_" + System.nanoTime(); status.setText("正在验证密钥、模型和 JSON 返回…"); test.setEnabled(false);
                boolean accepted = client.request(testId[0], vault.read(), vault.model(),
                    "只返回 JSON：{\"ok\":true}。", "这是合成连接测试，不含患者资料。",
                    (id, result) -> new Handler(Looper.getMainLooper()).post(() -> {
                        if (!dialog.isShowing()) return;
                        test.setEnabled(true);
                        JSONObject content = result.optJSONObject("content");
                        status.setText(result.optBoolean("ok") && content != null && content.optBoolean("ok") ?
                            "连接成功：密钥、模型与 JSON 返回均可用" : result.optString("error", "测试返回不符合约定，请重试"));
                    }));
                if (!accepted) { test.setEnabled(true); status.setText("请求未开始，请稍后重试"); }
            } catch (Exception e) { test.setEnabled(true); status.setText("无法读取密钥，请重新保存"); }
        });
        remove.setOnClickListener(v -> new AlertDialog.Builder(activity).setMessage("删除本机保存的 API Key？不会删除病历。")
            .setPositiveButton("删除", (d, which) -> { try { client.cancel(testId[0]); vault.clear(); input.setText(""); status.setText("密钥已删除"); test.setEnabled(true); } catch (Exception e) { status.setText("删除失败，请重试"); } }).setNegativeButton("取消", null).show());
        dialog.setOnDismissListener(d -> { client.cancel(testId[0]); input.setText(""); });
        dialog.setOnShowListener(d -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> { try { if (save.call()) dialog.dismiss(); } catch (Exception ignored) { } }));
        dialog.show();
        dialog.getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE, android.view.WindowManager.LayoutParams.FLAG_SECURE);
    }
}
