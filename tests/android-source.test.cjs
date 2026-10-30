const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Android launcher label preserves Chinese UTF-8 through string resource',()=>{
  const root=path.join(__dirname,'../android/app/src/main');
  assert.match(fs.readFileSync(path.join(root,'AndroidManifest.xml'),'utf8'),/android:label="@string\/app_name"/);
  assert.match(fs.readFileSync(path.join(root,'res/values/strings.xml'),'utf8'),/<string name="app_name">大病历生成器<\/string>/);
});
