const {chromium}=require(process.env.SIAGA_PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');

const pass=message=>console.log('PASS',message);

(async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'siaga-accessible-forms-ui-'));
  const port='3540';
  const base=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,['app.mjs'],{
    cwd:path.resolve(__dirname,'../..'),
    env:{...process.env,PORT:port,HOST:'127.0.0.1',DATA_DIR:dir,DATABASE_URL:'',NODE_ENV:'test',DEMO_MODE:'true',APP_ORIGIN:'',COOKIE_SECURE:'false'},
    stdio:['ignore','pipe','pipe']
  });
  let browser;

  try{
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Startup timeout')),12000);
      child.stdout.on('data',data=>{
        if(String(data).includes('SIAGA ARSIP berjalan')){
          clearTimeout(timer);
          resolve();
        }
      });
      child.once('exit',code=>{
        clearTimeout(timer);
        reject(Error('Startup failed '+code));
      });
    });

    browser=await chromium.launch({
      headless:true,
      ...(process.env.SIAGA_CHROMIUM_PATH?{executablePath:process.env.SIAGA_CHROMIUM_PATH}:{}),
      args:['--no-sandbox']
    });

    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));

    // ----------------------------------------------------
    // 1. LOGIN FORM ACCESSIBILITY & DRAFT RETENTION
    // ----------------------------------------------------
    await page.goto(base);
    await page.locator('[data-login]').first().click();
    await page.waitForSelector('#loginForm');

    // Check label associations and required cues
    const usernameLabel=await page.locator('label[for="authUsername"]').innerText();
    const passwordLabel=await page.locator('label[for="authPassword"]').innerText();
    assert.ok(usernameLabel.includes('(wajib)'),'Username label has (wajib)');
    assert.ok(passwordLabel.includes('(wajib)'),'Password label has (wajib)');

    // Live status element presence
    assert.equal(await page.locator('#loginStatus[role=status][aria-live=polite]').count(),1);

    // Custom required-field feedback is used instead of browser-native validation
    await page.click('#loginSubmit');
    await page.waitForSelector('#loginError:not([hidden])');
    assert.equal(await page.locator('#authUsername').getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('#authPassword').getAttribute('aria-invalid'),'true');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'loginError');
    await page.click('#loginError a[href="#authUsername"]');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'authUsername','Login summary link focuses the invalid field');

    // Enter wrong password to test failure feedback and draft retention
    await page.fill('#authUsername','admin_dummy');
    await page.fill('#authPassword','wrong_password');
    await page.click('#loginSubmit');

    await page.waitForSelector('#loginError:not([hidden])');
    assert.equal(await page.inputValue('#authUsername'),'admin_dummy','Username draft preserved on auth failure');
    assert.equal(await page.locator('#authUsername').getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('#authPassword').getAttribute('aria-invalid'),'true');
    const isErrorFocused=await page.evaluate(()=>document.activeElement?.id==='loginError');
    assert.ok(isErrorFocused,'Focus moved to loginError alert on failure');
    pass('login form: labels with for, required cues, aria-invalid, focus management, and input draft retention');

    // Perform successful login
    await page.fill('#authUsername','admin');
    await page.fill('#authPassword','admin123');
    await page.click('#loginSubmit');
    await page.waitForSelector('.workspace');
    pass('login form: successful login advances to workspace');

    // ----------------------------------------------------
    // Seed an archive fixture for later editor & disposition tests
    // ----------------------------------------------------
    const headers={'X-SIAGA-Request':'1'};
    const seedRes=await context.request.post(base+'/api/archives',{
      headers,
      data:{
        type:'incoming',
        number:'ACC/SEED/01',
        subject:'Naskah dinas untuk pengujian aksesibilitas',
        origin:'Sekretariat Bawaslu RI',
        letterDate:'2026-11-05',
        receivedDate:'2026-11-05',
        subsection:'Administrasi',
        classification:'Administrasi umum',
        sourceType:'physical',
        physicalLocation:'Lemari A-01'
      }
    });
    const seedArchive=await seedRes.json();
    assert.ok(seedArchive.id);

    // ----------------------------------------------------
    // 2. ARCHIVE CREATE FORM ACCESSIBILITY & DYNAMIC CUES & 401 RETENTION
    // ----------------------------------------------------
    await page.locator('[data-page=archives]').click();
    await page.waitForSelector('#archiveResults[aria-busy=false]');
    await page.click('#addArchive');
    await page.waitForSelector('#archiveForm');

    // Verify explicit label 'for' associations on all primary controls
    const fieldIds=[
      'create-type','create-number','create-subject','create-origin','create-destination',
      'create-letterDate','create-receivedDate','create-subsection','create-classification',
      'create-agendaNumber','create-classificationCode','create-sourceType','create-physicalLocation','create-sourceReference'
    ];
    for(const fid of fieldIds){
      const count=await page.locator(`label[for="${fid}"]`).count();
      assert.ok(count>=1,`Missing explicit label for ${fid}`);
    }

    // Dynamic cue: Type toggle (Surat masuk vs Surat keluar)
    assert.ok((await page.locator('#create-origin-req').innerText()).includes('(wajib)'),'Origin cue is (wajib) for incoming');
    assert.equal(await page.locator('#create-origin').getAttribute('required'),'','Origin is required for incoming');
    assert.equal(await page.locator('#create-origin').getAttribute('aria-required'),'true');
    assert.ok((await page.locator('#create-destination-req').innerText()).includes('(opsional)'),'Destination cue is (opsional) for incoming');
    assert.equal(await page.locator('#create-destination').getAttribute('required'),null);

    await page.selectOption('#create-type','outgoing');
    assert.ok((await page.locator('#create-origin-req').innerText()).includes('(opsional)'),'Origin cue is (opsional) for outgoing');
    assert.equal(await page.locator('#create-origin').getAttribute('required'),null);
    assert.ok((await page.locator('#create-destination-req').innerText()).includes('(wajib)'),'Destination cue is (wajib) for outgoing');
    assert.equal(await page.locator('#create-destination').getAttribute('required'),'');
    assert.equal(await page.locator('#create-destination').getAttribute('aria-required'),'true');

    await page.selectOption('#create-type','incoming');
    assert.ok((await page.locator('#create-origin-req').innerText()).includes('(wajib)'),'Origin restored to (wajib) for incoming');
    assert.equal(await page.locator('#create-origin').getAttribute('required'),'');
    assert.ok((await page.locator('#create-receivedDate-req').innerText()).includes('(wajib)'));
    assert.equal(await page.locator('#create-receivedDate').getAttribute('aria-required'),'true');

    // Dynamic cue: Source Type toggle (physical vs digital drive)
    await page.selectOption('#create-sourceType','physical');
    const physReq=await page.locator('#create-physicalLocation-req').innerText();
    assert.ok(physReq.includes('wajib untuk arsip fisik'),'Physical location marked required for physical source');
    assert.equal(await page.locator('#create-physicalLocation').getAttribute('aria-required'),'true');

    await page.selectOption('#create-sourceType','drive');
    const refReq=await page.locator('#create-sourceReference-req').innerText();
    assert.ok(refReq.includes('wajib untuk sumber ini'),'Source reference marked required for drive source');
    assert.equal(await page.locator('#create-sourceReference').getAttribute('aria-required'),'true');

    // Error summary & inline errors on client validation
    await page.fill('#create-number','');
    await page.fill('#create-subject','');
    await page.click('#saveArchive');
    await page.waitForSelector('#archiveSaveError:not([hidden])');
    assert.equal(await page.locator('#archiveFormErrorSummary').isVisible(),true,'Error summary visible');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'archiveFormErrorSummary','Focus remains on linked summary instead of duplicate alert');
    assert.equal(await page.locator('#create-number').getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('#create-subject').getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('#create-number-error').isVisible(),true);
    assert.equal(await page.locator('#create-subject-error').isVisible(),true);
    const numDescribedBy=await page.locator('#create-number').getAttribute('aria-describedby');
    assert.ok(numDescribedBy.includes('create-number-error'),'create-number aria-describedby includes error ID');

    // Clicking error summary link moves focus to invalid control
    await page.click('#archiveFormErrorSummary a[href="#create-number"]');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'create-number','Clicking error summary link focused create-number');

    // Fill valid draft values with physical source
    await page.fill('#create-number','ACC/DRAFT/401');
    await page.fill('#create-subject','Subjek naskah tersimpan saat sesi habis');
    await page.fill('#create-origin','Instansi Penguji');
    await page.fill('#create-letterDate','2026-11-05');
    await page.fill('#create-receivedDate','2026-11-05');
    await page.selectOption('#create-sourceType','physical');
    await page.fill('#create-physicalLocation','Lemari B-02');

    // Simulate HTTP 401 Session Expiration on save
    await page.route('**/api/archives',route=>{
      if(route.request().method()==='POST'){
        route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
      }else{
        route.continue();
      }
    });

    await page.click('#saveArchive');
    await page.waitForSelector('#archiveSaveError:not([hidden])');
    const saveErrorText=await page.locator('#archiveSaveError').innerText();
    assert.ok(saveErrorText.includes('Sesi Anda telah berakhir'),'Clear Indonesian session expiration message displayed');
    assert.ok(saveErrorText.includes('agar draf Anda tidak hilang'));

    // Modal is STILL open and draft values are INTACT
    assert.equal(await page.locator('#archiveForm').isVisible(),true,'Archive form modal remains open on 401');
    assert.equal(await page.inputValue('#create-number'),'ACC/DRAFT/401','Number draft preserved on 401');
    assert.equal(await page.inputValue('#create-subject'),'Subjek naskah tersimpan saat sesi habis','Subject draft preserved on 401');
    assert.equal(await page.inputValue('#create-origin'),'Instansi Penguji','Origin draft preserved on 401');

    await page.unroute('**/api/archives');
    await page.click('#closeModal');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('archive create: explicit labels, dynamic indicators, error summary focus, and draft preservation on 401');

    // ----------------------------------------------------
    // 3. ARCHIVE EDITOR FORM ACCESSIBILITY & 401 RETENTION
    // ----------------------------------------------------
    await page.locator('[data-page=archives]').click();
    await page.waitForSelector('#archiveResults[aria-busy=false]');
    await page.locator(`.edit-archive[data-id="${seedArchive.id}"]`).click();
    await page.waitForSelector('#editArchiveForm');

    // Check editor field labels and required cues
    const editFieldIds=['edit-number','edit-subject','edit-origin','edit-destination','edit-letterDate','edit-receivedDate'];
    for(const fid of editFieldIds){
      assert.ok(await page.locator(`label[for="${fid}"]`).count()>=1,`Missing label for ${fid}`);
    }

    // Dynamic cue in editor
    assert.ok((await page.locator('#edit-origin-req').innerText()).includes('(wajib)'),'Editor origin cue is (wajib) for incoming');
    assert.equal(await page.locator('#edit-origin').getAttribute('required'),'','Editor origin is required for incoming');
    assert.equal(await page.locator('#edit-origin').getAttribute('aria-required'),'true');
    assert.ok((await page.locator('#edit-destination-req').innerText()).includes('(opsional)'),'Editor destination cue is (opsional) for incoming');
    assert.equal(await page.locator('#edit-destination').getAttribute('required'),null);

    await page.selectOption('#edit-type','outgoing');
    assert.ok((await page.locator('#edit-origin-req').innerText()).includes('(opsional)'),'Editor origin cue is (opsional) for outgoing');
    assert.equal(await page.locator('#edit-origin').getAttribute('required'),null);
    assert.ok((await page.locator('#edit-destination-req').innerText()).includes('(wajib)'),'Editor destination cue is (wajib) for outgoing');
    assert.equal(await page.locator('#edit-destination').getAttribute('required'),'');
    assert.equal(await page.locator('#edit-destination').getAttribute('aria-required'),'true');

    await page.selectOption('#edit-type','incoming');
    assert.ok((await page.locator('#edit-origin-req').innerText()).includes('(wajib)'),'Editor origin restored to (wajib)');
    assert.equal(await page.locator('#edit-origin').getAttribute('required'),'');
    assert.ok((await page.locator('#edit-destination-req').innerText()).includes('(opsional)'));

    // Edit a value
    await page.fill('#edit-subject','Perubahan perihal penting saat revisi');

    // Simulate 401 on PATCH metadata
    await page.route(`**/api/archives/${seedArchive.id}`,route=>{
      if(route.request().method()==='PATCH'){
        route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
      }else{
        route.continue();
      }
    });

    await page.click('#saveEditArchive');
    await page.waitForSelector('#editArchiveError:not([hidden])');
    const editErrText=await page.locator('#editArchiveError').innerText();
    assert.ok(editErrText.includes('Sesi Anda telah berakhir'),'Editor 401 explains session expired');
    assert.equal(await page.locator('#editArchiveForm').isVisible(),true,'Editor stays open on 401');
    assert.equal(await page.inputValue('#edit-subject'),'Perubahan perihal penting saat revisi','Editor draft preserved on 401');

    await page.unroute(`**/api/archives/${seedArchive.id}`);
    await page.click('#cancelEditArchive');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('archive editor: labels, dynamic cues, error handling, and draft retention on 401');

    // ----------------------------------------------------
    // 4. ADMIN USER FORMS (CREATE & EDIT) ACCESSIBILITY & 401
    // ----------------------------------------------------
    await page.locator('[data-page=settings]').click();
    await page.waitForSelector('#userForm');

    // User Create Form labels
    const userCreateIds=['create-user-username','create-user-name','create-user-email','create-user-password','create-user-role','create-user-subsection'];
    for(const uid of userCreateIds){
      assert.ok(await page.locator(`label[for="${uid}"]`).count()>=1,`Missing label for ${uid}`);
    }

    // Dynamic requirement: role switch toggles subsection requirement
    await page.selectOption('#create-user-role','leader');
    assert.ok((await page.locator('#create-user-sub-req').innerText()).includes('tidak berlaku'));
    await page.selectOption('#create-user-role','employee');
    assert.ok((await page.locator('#create-user-sub-req').innerText()).includes('(wajib)'));

    // Status announcement element
    assert.equal(await page.locator('#userFormStatus[role=status][aria-live=polite]').count(),1);

    // Fill user draft
    await page.fill('#create-user-username','user.draft.401');
    await page.fill('#create-user-name','Pegawai Baru Draft');
    await page.fill('#create-user-password','passwordBaru123');

    // Mock 401 on POST /api/admin/users
    await page.route('**/api/admin/users',route=>{
      if(route.request().method()==='POST'){
        route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
      }else{
        route.continue();
      }
    });

    await page.click('#saveNewUser');
    await page.waitForSelector('#userFormErrorSummary:not([hidden])');
    assert.equal(await page.inputValue('#create-user-username'),'user.draft.401','User username draft preserved on 401');
    assert.equal(await page.inputValue('#create-user-name'),'Pegawai Baru Draft','User name draft preserved on 401');
    assert.ok((await page.locator('#userFormErrorSummary').innerText()).includes('Sesi Anda telah berakhir'));

    await page.unroute('**/api/admin/users');
    pass('admin user create form: labels, dynamic subsection cues, status element, and draft preservation on 401');

    // Classification master form: code/name/description and active toggle
    for(const cid of ['newClassificationCode','newClassification','newClassificationDescription']){
      assert.ok(await page.locator(`label[for="${cid}"]`).count()>=1,`Missing label for ${cid}`);
    }
    await page.fill('#newClassificationCode','UI-05-1');
    await page.fill('#newClassification','Klasifikasi UI dummy');
    await page.fill('#newClassificationDescription','Master UI dummy');
    await page.click('#classificationForm button');
    await page.waitForFunction(()=>document.querySelector('#content')?.textContent.includes('Klasifikasi UI dummy'));
    const classificationRow=page.locator('tr').filter({hasText:'Klasifikasi UI dummy'});
    assert.equal(await classificationRow.count(),1);
    await classificationRow.locator('.classification-toggle').click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('tr')).some(row=>row.textContent.includes('Klasifikasi UI dummy')&&row.textContent.includes('Aktifkan')));
    pass('classification master: fields render, a new coded entry is saved, and inactive state is visible');

    // User Edit Form modal
    await page.locator('.user-edit').first().click();
    await page.waitForSelector('#editUserForm');

    const userEditIds=['edit-user-name','edit-user-email','edit-user-password','edit-user-role','edit-user-subsection'];
    for(const uid of userEditIds){
      assert.ok(await page.locator(`label[for="${uid}"]`).count()>=1,`Missing label for ${uid}`);
    }
    assert.equal(await page.locator('#editUserStatus[role=status][aria-live=polite]').count(),1);

    const originalEditRole=await page.locator('#edit-user-role').inputValue();
    await page.selectOption('#edit-user-role','employee');
    assert.equal(await page.locator('#edit-user-subsection').getAttribute('required'),'');
    assert.equal(await page.locator('#edit-user-subsection').getAttribute('aria-required'),'true');
    assert.ok((await page.locator('#edit-user-sub-req').innerText()).includes('(wajib)'));
    await page.selectOption('#edit-user-role','admin');
    assert.equal(await page.locator('#edit-user-subsection').isDisabled(),true);
    assert.equal(await page.locator('#edit-user-subsection').getAttribute('required'),null);
    assert.equal(await page.locator('#edit-user-subsection').getAttribute('aria-required'),null);
    assert.ok((await page.locator('#edit-user-sub-req').innerText()).includes('tidak berlaku'));
    await page.selectOption('#edit-user-role',originalEditRole);

    await page.fill('#edit-user-name','Nama Diedit Draft');
    await page.route('**/api/admin/users/*',route=>{
      if(route.request().method()==='PATCH'){
        route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
      }else{
        route.continue();
      }
    });

    await page.click('#saveEditUser');
    await page.waitForSelector('#editUserErrorSummary:not([hidden])');
    assert.equal(await page.locator('#editUserForm').isVisible(),true,'Edit user modal stays open on 401');
    assert.equal(await page.inputValue('#edit-user-name'),'Nama Diedit Draft','Edit user draft preserved');
    assert.ok((await page.locator('#editUserErrorSummary').innerText()).includes('Sesi Anda telah berakhir'));

    await page.unroute('**/api/admin/users/*');
    await page.click('#closeModal');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('admin user edit form: labels, indicators, status, modal open and draft preserved on 401');

    // ----------------------------------------------------
    // 5. ONE-OFF UPLOAD FORM ACCESSIBILITY & 401
    // ----------------------------------------------------
    await page.locator('[data-page=archives]').click();
    await page.waitForSelector('#archiveResults[aria-busy=false]');
    await page.locator(`.upload-btn[data-id="${seedArchive.id}"]`).first().click();
    await page.waitForSelector('#uploadForm');

    assert.ok(await page.locator('label[for="upload-file"]').count()>=1,'Label for upload-file exists');
    assert.ok((await page.locator('label[for="upload-file"]').innerText()).includes('(wajib)'));
    assert.equal(await page.locator('#upload-file').getAttribute('aria-describedby'),'upload-file-help');
    assert.equal(await page.locator('#uploadFormStatus[role=status][aria-live=polite]').count(),1);

    // Set a file fixture and submit under 401
    const testPdfBytes=Buffer.from('%PDF-1.4\nForm a11y upload test\n%%EOF');
    await page.setInputFiles('#upload-file',{
      name:'sample-doc.pdf',
      mimeType:'application/pdf',
      buffer:testPdfBytes
    });

    await page.route(`**/api/archives/${seedArchive.id}/files`,route=>{
      if(route.request().method()==='POST'){
        route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
      }else{
        route.continue();
      }
    });

    await page.click('#saveUploadModal');
    await page.waitForSelector('#uploadFormErrorSummary:not([hidden])');
    assert.equal(await page.locator('#uploadForm').isVisible(),true,'Upload form modal stays open on 401');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'uploadFormErrorSummary','Upload error summary received focus');
    assert.equal(await page.locator('#upload-file').getAttribute('aria-invalid'),'true','upload-file marked invalid on failure');
    const uploadDescribedBy=await page.locator('#upload-file').getAttribute('aria-describedby');
    assert.ok(uploadDescribedBy.includes('upload-file-error'),'upload-file describedby includes error ID');
    assert.ok(uploadDescribedBy.includes('upload-file-help'),'upload-file describedby preserves help ID');
    assert.ok((await page.locator('#uploadFormErrorSummary').innerText()).includes('Sesi Anda telah berakhir'));
    const filesCount=await page.evaluate(()=>document.querySelector('#upload-file')?.files?.length||0);
    assert.equal(filesCount,1,'Selected file remains attached in file input after 401 failure');

    await page.unroute(`**/api/archives/${seedArchive.id}/files`);
    await page.click('#closeModal');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('one-off upload form: label for, required cue, status, and file retention on 401');

    // Upload an actual file to seed archive to test version upload and attachment upload
    await context.request.post(base+`/api/archives/${seedArchive.id}/files`,{
      headers,
      data:{fileName:'seed.pdf',mimeType:'application/pdf',data:testPdfBytes.toString('base64')}
    });

    // ----------------------------------------------------
    // 6. VERSION & ATTACHMENT UPLOAD FORMS ACCESSIBILITY & 401
    // ----------------------------------------------------
    await page.locator('[data-page=archives]').click();
    await page.waitForSelector('#archiveResults[aria-busy=false]');
    await page.locator(`.file-history[data-id="${seedArchive.id}"]`).click();
    await page.waitForSelector('.archive-files-dialog');

    // Check version upload form elements
    const verForm=page.locator('.version-upload-form').first();
    assert.ok(await verForm.locator('label[for^="version-file-"]').count()>=1);
    assert.ok(await verForm.locator('label[for^="version-reason-"]').count()>=1);
    assert.equal(await verForm.locator('.form-status[role=status][aria-live=polite]').count(),1);

    // Client validation: submitting version form without reason shows inline error
    await verForm.locator('button[type=submit]').click();
    assert.ok(await verForm.locator('.field-error:not([hidden])').count()>=1,'Version error visible');
    const verFileIn=verForm.locator('input[type=file]');
    assert.equal(await verFileIn.getAttribute('aria-invalid'),'true');
    const verFileDesc=await verFileIn.getAttribute('aria-describedby');
    assert.ok(verFileDesc.includes('version-file-error-'),'Version file describedby includes error ID');
    assert.ok(verFileDesc.includes('version-file-help-'),'Version file describedby preserves help ID');

    // Fill reason and test 401 draft retention
    const reasonInput=verForm.locator('[name=reason]');
    await reasonInput.fill('Perbaikan halaman 2 draft');

    await page.route(`**/api/archives/${seedArchive.id}/files`,route=>{
      route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
    });

    // Attach file to version input
    const fileInput=verForm.locator('input[type=file]');
    await fileInput.setInputFiles({
      name:'version2.pdf',
      mimeType:'application/pdf',
      buffer:testPdfBytes
    });
    await verForm.locator('button[type=submit]').click();
    await page.waitForSelector('.version-upload-form .version-error:not([hidden])');
    assert.equal(await page.locator('.archive-files-dialog').isVisible(),true,'Files dialog stays open on 401');
    assert.equal(await reasonInput.inputValue(),'Perbaikan halaman 2 draft','Version reason draft preserved');
    assert.ok((await verForm.locator('.version-error').innerText()).includes('Sesi Anda telah berakhir'));

    await page.unroute(`**/api/archives/${seedArchive.id}/files`);

    // Check attachment create form
    const attForm=page.locator('.attachment-create-form');
    assert.ok(await attForm.locator('label[for="attachment-title"]').count()>=1);
    assert.ok(await attForm.locator('label[for="attachment-file"]').count()>=1);
    assert.equal(await attForm.locator('.form-status[role=status][aria-live=polite]').count(),1);

    // Client validation: empty attachment submit triggers inline error and describedby linkage
    await attForm.locator('button[type=submit]').click();
    assert.equal(await attForm.locator('#attachment-title').getAttribute('aria-invalid'),'true');
    const attTitleDesc=await attForm.locator('#attachment-title').getAttribute('aria-describedby');
    assert.ok(attTitleDesc.includes('attachment-title-error'),'Attachment title describedby includes error ID');
    assert.ok(attTitleDesc.includes('attachment-title-help'),'Attachment title describedby preserves help ID');

    // Fill typed title and selected dummy file, test 401 retention of both
    await attForm.locator('#attachment-title').fill('Lampiran Uji Aksesibilitas 401');
    const dummyAttBytes=Buffer.from('%PDF-1.4\nAttachment dummy test\n%%EOF');
    await attForm.locator('#attachment-file').setInputFiles({
      name:'lampiran-draft.pdf',
      mimeType:'application/pdf',
      buffer:dummyAttBytes
    });

    await page.route(`**/api/archives/${seedArchive.id}/files`,route=>{
      route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
    });

    await attForm.locator('button[type=submit]').click();
    await page.waitForSelector('.attachment-create-form .version-error:not([hidden])');
    assert.equal(await page.locator('.archive-files-dialog').isVisible(),true,'Files dialog stays open on attachment 401');
    assert.equal(await attForm.locator('#attachment-title').inputValue(),'Lampiran Uji Aksesibilitas 401','Attachment title draft preserved on 401');
    const attFilesCount=await page.evaluate(()=>document.querySelector('#attachment-file')?.files?.length||0);
    assert.equal(attFilesCount,1,'Attachment dummy file remains selected after 401');
    assert.ok((await attForm.locator('.version-error').innerText()).includes('Sesi Anda telah berakhir'));

    await page.unroute(`**/api/archives/${seedArchive.id}/files`);

    await page.click('#closeModal');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('version and attachment forms: labels with for, inline errors, status, and draft preserved on 401');

    // ----------------------------------------------------
    // 7. DISPOSITION CREATE FORM ACCESSIBILITY & 401
    // ----------------------------------------------------
    await page.locator('[data-page=archives]').click();
    await page.waitForSelector('#archiveResults[aria-busy=false]');
    await page.locator(`.dispose-btn[data-id="${seedArchive.id}"]`).click();
    await page.waitForSelector('#dispForm');
    await page.waitForFunction(()=>!document.querySelector('#dispRecipient')?.disabled);

    assert.ok(await page.locator('label[for="dispSubsection"]').count()>=1);
    assert.ok(await page.locator('label[for="dispRecipient"]').count()>=1);
    assert.ok(await page.locator('label[for="dispInstruction"]').count()>=1);
    assert.ok((await page.locator('label[for="dispSubsection"]').innerText()).includes('(wajib)'));
    assert.ok((await page.locator('label[for="dispRecipient"]').innerText()).includes('(opsional)'));
    assert.ok((await page.locator('label[for="dispInstruction"]').innerText()).includes('(wajib)'));
    assert.equal(await page.locator('#dispInstruction').getAttribute('aria-describedby'),'dispInstructionHelp');
    assert.equal(await page.locator('#dispRecipient').getAttribute('aria-describedby'),'dispRecipientHelp');
    assert.equal(await page.locator('#dispFormStatus[role=status][aria-live=polite]').count(),1);

    await page.fill('#dispInstruction','Catatan instruksi rahasia draft');

    await page.route(`**/api/archives/${seedArchive.id}/dispositions`,route=>{
      if(route.request().method()==='POST'){
        route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
      }else{
        route.continue();
      }
    });

    await page.click('#dispForm [type=submit]');
    await page.waitForSelector('#dispError:not([hidden])');
    assert.equal(await page.locator('#dispForm').isVisible(),true,'Disposition modal stays open on 401');
    assert.equal(await page.inputValue('#dispInstruction'),'Catatan instruksi rahasia draft','Instruction draft preserved');
    assert.ok((await page.locator('#dispError').innerText()).includes('Sesi Anda telah berakhir'));

    await page.unroute(`**/api/archives/${seedArchive.id}/dispositions`);
    await page.click('#closeModal');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('disposition create: labels, indicators, help linkages, status, and draft retention on 401');

    // Create a real disposition on seedArchive to test disposition update form
    const dispRes=await context.request.post(base+`/api/archives/${seedArchive.id}/dispositions`,{
      headers,
      data:{
        assignedSubsection:'Administrasi',
        instruction:'Tugas untuk pengujian disposisi update'
      }
    });
    const dispArchive=await dispRes.json();
    const createdDisp=dispArchive.dispositions[0];
    assert.ok(createdDisp.id);

    // ----------------------------------------------------
    // 8. DISPOSITION UPDATE FORM ACCESSIBILITY & 401
    // ----------------------------------------------------
    await page.locator('[data-page=dispositions]').click();
    await page.waitForSelector('.disp-history');
    await page.locator(`.disp-history[data-id="${createdDisp.id}"]`).click();
    await page.waitForSelector('#dispositionUpdateForm');

    assert.ok(await page.locator('label[for="dispositionStatus"]').count()>=1);
    assert.ok(await page.locator('label[for="dispositionNote"]').count()>=1);
    assert.ok((await page.locator('label[for="dispositionStatus"]').innerText()).includes('(wajib)'));
    assert.ok((await page.locator('#dispositionNoteReq').innerText()).includes('(opsional)'));

    // Dynamic cue: update status to Selesai first, then reopen to Sedang diproses
    await page.selectOption('#dispositionStatus','Selesai');
    await page.fill('#dispositionNote','Selesai tahap pertama');
    await page.click('#saveDispositionUpdate');
    await page.waitForFunction(()=>document.querySelector('.disp-timeline')?.textContent.includes('Selesai tahap pertama'));

    // Reopen task: Sedang diproses
    await page.selectOption('#dispositionStatus','Sedang diproses');
    assert.ok((await page.locator('#dispositionNoteReq').innerText()).includes('wajib untuk pembukaan kembali'));
    assert.equal(await page.locator('#dispositionNote').getAttribute('aria-required'),'true');

    // Fill note draft and test 401 retention
    await page.fill('#dispositionNote','Alasan dibuka kembali draft 401');

    await page.route(`**/api/dispositions/${createdDisp.id}/status`,route=>{
      route.fulfill({status:401,json:{error:'Sesi telah berakhir.'}});
    });

    await page.click('#saveDispositionUpdate');
    await page.waitForSelector('#dispositionUpdateError:not([hidden])');
    assert.equal(await page.locator('#dispositionUpdateForm').isVisible(),true,'Disposition update form stays open on 401');
    assert.equal(await page.inputValue('#dispositionNote'),'Alasan dibuka kembali draft 401','Disposition note draft preserved on 401');
    assert.ok((await page.locator('#dispositionUpdateError').innerText()).includes('Sesi Anda telah berakhir'));

    await page.unroute(`**/api/dispositions/${createdDisp.id}/status`);
    await page.click('#closeModal');
    await page.waitForSelector('#modalBack',{state:'detached'});
    pass('disposition update: labels, dynamic reopen cue, status, and draft preservation on 401');

    assert.deepEqual(errors,[]);
    pass('accessible-forms: complete acceptance suite passed with 0 browser errors');
  }finally{
    await browser?.close();
    if(child.exitCode===null){
      await new Promise(resolve=>{
        child.once('exit',resolve);
        child.kill();
      });
    }
    await fs.rm(dir,{recursive:true,force:true});
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
