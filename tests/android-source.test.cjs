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
