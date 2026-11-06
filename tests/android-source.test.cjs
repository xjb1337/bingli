const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const mainRoot=path.join(__dirname,'../android/app/src/main');
const javaRoot=path.join(mainRoot,'java/com/xjb/bingli');
const readMain=()=>fs.readFileSync(path.join(javaRoot,'MainActivity.java'),'utf8');
const readClient=()=>fs.readFileSync(path.join(javaRoot,'DeepSeekClient.java'),'utf8');

test('Android launcher label preserves Chinese UTF-8 through string resource',()=>{
  assert.match(fs.readFileSync(path.join(mainRoot,'AndroidManifest.xml'),'utf8'),/android:label="@string\/app_name"/);
  assert.match(fs.readFileSync(path.join(mainRoot,'res/values/strings.xml'),'utf8'),/<string name="app_name">大病历生成器<\/string>/);
});

test('P0-2 image requests force deepseek-flash in the request body and result only',()=>{
  const source=readClient();
  assert.match(source,/boolean hasImage\s*=\s*imageMime\s*!=\s*null\s*\|\|\s*imageBase64\s*!=\s*null/);
  assert.match(source,/String requestModel\s*=\s*hasImage\s*\?\s*"deepseek-flash"\s*:\s*model/);
  assert.ok((source.match(/\.put\("model",\s*requestModel\)/g)||[]).length>=2,
    'request body and result model must both use the per-request model');
  assert.doesNotMatch(source,/aiKeys\.(save|write)/i);
});

test('P0-7 back gesture asks the web app first, flushes, then confirms exit',()=>{
  const source=readMain();
  assert.match(source,/window\.APP&&window\.APP\.handleBack&&APP\.handleBack\(\)/);
  assert.match(source,/APP\._test\.flushPendingSave/);
  assert.match(source,/退出大病历？/);
  const back=source.slice(source.indexOf('public void onBackPressed'));
  assert.match(back,/super\.onBackPressed\(\)/);
  assert.match(source,/public class MainActivity extends Activity/);
  assert.doesNotMatch(source,/androidx\.activity/);
});

test('P0-8 camera cache is cleared at lifecycle points and cancelled photos are deleted immediately',()=>{
  const source=readMain();
  assert.match(source,/private void clearCameraCache\(\)/);
  assert.ok((source.match(/clearCameraCache\(\)/g)||[]).length>=4,
    'clearCameraCache must be declared and called from onCreate/startImageCamera/onStop/onDestroy');
  assert.match(source,/onStop\(\)\s*\{[^}]*chooser\s*==\s*null\s*&&\s*cameraUri\s*==\s*null[^}]*clearCameraCache\(\)/s);
  assert.match(source,/onDestroy\(\)\s*\{[^}]*clearCameraCache\(\)/s);
  const resultMethod=source.slice(source.indexOf('@Override protected void onActivityResult'),source.indexOf('@Override protected void onStop()'));
  const cameraBlock=resultMethod.slice(resultMethod.indexOf('if (request == 43)'),resultMethod.indexOf('if (request == 42)'));
  const successBranch=cameraBlock.slice(cameraBlock.indexOf('if (result == RESULT_OK)'),cameraBlock.indexOf('} else {'));
  const cancelBranch=cameraBlock.slice(cameraBlock.indexOf('} else {'));
  assert.match(cancelBranch,/deleteCameraPhoto\(\)/);
  assert.doesNotMatch(successBranch,/deleteCameraPhoto\(\)|clearCameraCache\(\)/);
});

test('P1-8 recognize requests get 8192 tokens and finish reasons map to stable codes',()=>{
  const source=readClient();
  assert.match(source,/MAX_TOKENS_RECOGNIZE\s*=\s*8192/);
  assert.match(source,/MAX_TOKENS_DEFAULT\s*=\s*4096/);
  assert.match(source,/content_filtered/);
  assert.match(source,/内容被服务端安全策略拦截/);
  assert.match(source,/truncated_response/);
  assert.match(source,/request_failed/);
});

test('P1-11 bridge returns busy and invalid_input codes without falling back to missing_key',()=>{
  const source=readMain();
  assert.match(source,/put\("code",\s*"busy"\)/);
  assert.match(source,/BridgeErrorMapper\.codeFor/);
  const mapper=fs.readFileSync(path.join(javaRoot,'BridgeErrorMapper.java'),'utf8');
  assert.match(mapper,/JSONException/);
  assert.match(mapper,/invalid_input/);
});
