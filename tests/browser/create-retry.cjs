const {chromium}=require(process.env.SIAGA_PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');const assert=require('node:assert/strict');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));const pass=message=>console.log('PASS',message);
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'siaga-create-ui-')),base='http://127.0.0.1:3507';
 const child=spawn(process.execPath,['app.mjs'],{cwd:path.resolve(__dirname,'../..'),env:{...process.env,PORT:'3507',HOST:'127.0.0.1',DATA_DIR:dir,NODE_ENV:'test',DEMO_MODE:'true',DATABASE_URL:'',APP_ORIGIN:'',COOKIE_SECURE:'false'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Fixture startup timed out')),12000);child.stdout.on('data',data=>{log+=data;if(log.includes('SIAGA ARSIP berjalan')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(Error('Fixture exited: '+code));});child.once('error',reject);});
  browser=await chromium.launch({headless:true,...(process.env.SIAGA_CHROMIUM_PATH?{executablePath:process.env.SIAGA_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/archives')requests.push({number:request.postDataJSON().number,key:request.headers()['idempotency-key']});});
  const pdf={name:'retry.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF')};
  const post=url=>url.pathname==='/api/archives',files=url=>/^\/api\/archives\/[^/]+\/files$/.test(url.pathname);
  async function login(p,username,password){await p.goto(base);await p.locator('[data-login]').first().click();await p.fill('#authUsername',username);await p.fill('#authPassword',password);await p.click('#loginSubmit');await p.waitForSelector('.workspace');}
  async function open(number,{file=true,origin='Uji lokal'}={}){
   await page.locator('[data-page=archives]').click();await page.waitForSelector('#archiveResults[aria-busy=false]');await page.click('#addArchive');
   await page.fill('#create-number',number);await page.fill('#create-subject','Uji pengulangan');await page.fill('#create-origin',origin);
   if(file)await page.setInputFiles('#create-upload',pdf);
  }
  const saved=async number=>(await context.request.get(base+'/api/archives?q='+encodeURIComponent(number))).json();
  const count=number=>requests.filter(item=>item.number===number).length;
  const closed=()=>page.waitForSelector('#archiveForm',{state:'detached'});
  const failed=()=>page.waitForSelector('#archiveSaveError:not([hidden])');
  await login(page,'admin','admin123');
  let failUpload=true;
  await page.route(files,route=>failUpload?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Gangguan unggah uji'})}):route.continue());
  await open('RETRY/UI/PARTIAL');
  assert.equal(await page.locator('#archiveForm input,#archiveForm select,#archiveForm textarea').evaluateAll(items=>items.every(el=>el.labels.length>0)),true);
  await page.click('#saveArchive');await failed();
  assert.equal((await saved('RETRY/UI/PARTIAL')).items.length,1);assert.equal(await page.locator('#create-number').isDisabled(),true);assert.equal(await page.locator('#create-upload').isEnabled(),true);assert.equal(await page.locator('#saveArchive').innerText(),'Ulangi unggah');assert.equal(await page.locator('#archiveSaveNotice').isVisible(),true);
  failUpload=false;await page.click('#saveArchive');await closed();const partial=(await saved('RETRY/UI/PARTIAL')).items;
  assert.equal(count('RETRY/UI/PARTIAL'),1);assert.equal(partial.length,1);assert.equal(partial[0].fileAvailable,true);assert.equal(partial[0].fileVersions.length,0);await page.unroute(files);pass('failed upload retries the same saved archive with clear partial-success feedback');
  let loseCreate=true;
  await page.route(post,async route=>{if(route.request().method()==='POST'&&loseCreate){loseCreate=false;await route.fetch();await route.abort();}else await route.continue();});
  await open('RETRY/UI/LOST-CREATE',{file:false});await page.click('#saveArchive');await failed();assert.equal(await page.locator('#create-number').isDisabled(),true);assert.equal(await page.locator('#saveArchive').innerText(),'Periksa dan lanjutkan');
  await page.click('#saveArchive');await closed();assert.equal((await saved('RETRY/UI/LOST-CREATE')).items.length,1);const lost=requests.filter(item=>item.number==='RETRY/UI/LOST-CREATE');assert.equal(lost.length,2);assert.ok(lost[0].key);assert.equal(lost[0].key,lost[1].key);await page.unroute(post);pass('lost successful metadata response replays one creation request safely');
  let loseUpload=true;
  await page.route(files,async route=>{if(loseUpload){loseUpload=false;await route.fetch();await route.abort();}else await route.continue();});
  await open('RETRY/UI/LOST-UPLOAD');await page.click('#saveArchive');await failed();assert.equal((await saved('RETRY/UI/LOST-UPLOAD')).items[0].fileAvailable,true);await page.click('#saveArchive');await closed();
  assert.equal(count('RETRY/UI/LOST-UPLOAD'),1);assert.equal((await saved('RETRY/UI/LOST-UPLOAD')).items[0].fileVersions.length,0);await page.unroute(files);pass('lost successful upload response creates no duplicate binary or version');
  await page.route(post,async route=>{if(route.request().method()==='POST')await wait(350);await route.continue();});
  await open('RETRY/UI/DOUBLE',{file:false});await page.click('#saveArchive');await page.waitForSelector('#saveArchive:disabled');
  await page.locator('#archiveForm').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.locator('.modal').press('Escape');assert.equal(await page.locator('#archiveForm').count(),1);assert.equal(await page.locator('#closeModal').isDisabled(),true);
  await closed();assert.equal(count('RETRY/UI/DOUBLE'),1);await page.unroute(post);pass('duplicate submit and Escape cannot interrupt the pending save');
  await open('RETRY/UI/VALIDATION',{file:false,origin:''});await page.click('#saveArchive');await failed();assert.equal(await page.locator('#create-number').isEnabled(),true);await page.fill('#create-origin','Asal diperbaiki');await page.click('#saveArchive');await closed();assert.equal((await saved('RETRY/UI/VALIDATION')).items.length,1);pass('metadata validation preserves editable draft before anything has been saved');
  await open('RETRY/UI/INVALID-FILE');await page.setInputFiles('#create-upload',{name:'fake.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});await page.click('#saveArchive');await failed();
  await page.setInputFiles('#create-upload',pdf);await page.click('#saveArchive');await closed();assert.equal(count('RETRY/UI/INVALID-FILE'),1);assert.equal((await saved('RETRY/UI/INVALID-FILE')).items[0].fileAvailable,true);pass('replacing an invalid file retries upload without recreating metadata');
  await page.route(files,route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Unggah belum tersedia"}'}));
  await open('RETRY/UI/CLOSE');await page.click('#saveArchive');await failed();await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.SIAGA_SCREENSHOT)await page.screenshot({path:process.env.SIAGA_SCREENSHOT,fullPage:true});
  assert.equal(await page.locator('#archiveSaveError').evaluate(el=>document.activeElement===el),true);assert.equal(await page.locator('#cancelModal').innerText(),'Selesai tanpa berkas');await page.keyboard.press('Escape');await closed();const unfinished=(await saved('RETRY/UI/CLOSE')).items;assert.equal(unfinished.length,1);assert.equal(unfinished[0].fileAvailable,false);await page.unroute(files);await page.setViewportSize({width:1440,height:1000});pass('partial save can close safely and stays usable on mobile');
  await open('RETRY/UI/REFRESH',{file:false});let refreshFailed=false;
  await page.route('**/api/dashboard?view=overview',route=>{refreshFailed=true;return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Daftar sementara gagal"}'});});await page.click('#saveArchive');await closed();await page.waitForFunction(()=>document.querySelector('#toastStack')?.textContent.includes('Daftar belum dapat diperbarui'));
  assert.equal(refreshFailed,true);assert.equal(count('RETRY/UI/REFRESH'),1);assert.equal((await saved('RETRY/UI/REFRESH')).items.length,1);await page.unroute('**/api/dashboard?view=overview');pass('refresh failure after successful save never offers a second creation');
  const newUser=await context.request.post(base+'/api/admin/users',{headers:{'X-SIAGA-Request':'1'},data:{username:'retry.recorder',name:'Pencatat uji',password:'local-test-password',role:'recorder',subsection:'Hukum'}});assert.equal(newUser.status(),201);
  const recorderContext=await browser.newContext(),recorder=await recorderContext.newPage();recorder.on('pageerror',error=>errors.push(error.message));await login(recorder,'retry.recorder','local-test-password');await recorder.locator('[data-page=archives]').click();await recorder.waitForSelector('#archiveResults[aria-busy=false]');await recorder.click('#addArchive');assert.equal(await recorder.locator('[name=upload]').count(),0);assert.equal(await recorder.locator('#create-subsection option').count(),1);
  await recorder.fill('#create-number','RETRY/UI/RECORDER');await recorder.fill('#create-subject','Pencatat terpisah');await recorder.fill('#create-origin','Uji');await recorder.click('#saveArchive');await recorder.waitForSelector('#archiveForm',{state:'detached'});const recorded=(await saved('RETRY/UI/RECORDER')).items;assert.equal(recorded.length,1);assert.equal(recorded[0].subsection,'Hukum');assert.equal(recorded[0].fileAvailable,false);pass('recorder saves metadata only in own subsection for the separate uploader');
  assert.deepEqual(errors,[]);pass('no browser JavaScript errors');
 }finally{await browser?.close();if(child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});await fs.rm(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exit(1);});
