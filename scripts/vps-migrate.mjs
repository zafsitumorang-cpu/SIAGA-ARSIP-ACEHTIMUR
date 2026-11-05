// Internal migration helper. All outputs containing credentials stay in root-only files
// or are piped directly to psql by vps-upgrade.sh; never run role-sql on its own.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createStore,validateData} from '../lib/store.mjs';

const [command,...args]=process.argv.slice(2);
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const write=(file,value)=>fs.writeFile(file,value,{mode:0o600,flag:'wx'});
async function settings(dir){return JSON.parse(await fs.readFile(path.join(dir,'settings.json'),'utf8'));}
function loadEnv(config){Object.assign(process.env,config.env);}

try {
  if(command==='init'){
    const [dir,dataDir,backupDir,dbName,role,domain]=args;
    assert.ok(/^[a-z][a-z0-9_]{1,60}$/.test(dbName)&&/^[a-z][a-z0-9_]{1,60}$/.test(role));
    assert.equal(domain,'siaga-arsipbawasluacehtimur.web.id');
    for(const value of [dir,dataDir,backupDir])assert.ok(/^\/[a-zA-Z0-9_./-]+$/.test(value));
    const dbPassword=crypto.randomBytes(32).toString('hex');
    const credentials={username:'admin',password:crypto.randomBytes(24).toString('base64url')};
    const env={NODE_ENV:'production',DEMO_MODE:'false',HOST:'127.0.0.1',PORT:'3000',APP_ORIGIN:`https://${domain}`,COOKIE_SECURE:'true',DATABASE_URL:`postgres://${role}:${dbPassword}@127.0.0.1:5432/${dbName}`,DATA_DIR:dataDir,BACKUP_DIR:backupDir};
    await write(path.join(dir,'settings.json'),JSON.stringify({env,dbName,role}));
    await write(path.join(dir,'admin-access.json'),JSON.stringify(credentials,null,2));
    await write(path.join(dir,'production.env'),Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');
    await write(path.join(dir,'runtime.env'),Object.entries({...env,PORT:'3100'}).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');
    console.log('Konfigurasi dan akses admin baru disimpan dalam file privat.');
  }else if(command==='role-sql'){
    const config=await settings(args[0]);
    assert.ok(/^[a-z][a-z0-9_]{1,60}$/.test(config.dbName)&&/^[a-z][a-z0-9_]{1,60}$/.test(config.role));
    const password=new URL(config.env.DATABASE_URL).password;assert.match(password,/^[a-f0-9]{64}$/);
    process.stdout.write(`SET password_encryption='scram-sha-256';\nCREATE ROLE ${config.role} LOGIN PASSWORD '${password}';\nCREATE DATABASE ${config.dbName} OWNER ${config.role};\n`);
  }else if(command==='validate-json'){
    validateData(JSON.parse(await fs.readFile(args[0],'utf8')));
  }else if(command==='prepare'){
    const [sourceDir,targetDir,output,summaryFile]=args;
    const original=await fs.readFile(path.join(sourceDir,'data.json'));
    const data=validateData(JSON.parse(original));
    await fs.mkdir(path.join(targetDir,'files'),{mode:0o700});
    const files=[];
    for(const item of await fs.readdir(path.join(sourceDir,'files'),{withFileTypes:true})){
      if(item.name==='.gitkeep')continue;
      assert.ok(item.isFile()&&!item.isSymbolicLink(),'Jenis file sumber tidak sesuai.');
      const bytes=await fs.readFile(path.join(sourceDir,'files',item.name));
      await write(path.join(targetDir,'files',item.name),bytes);
      files.push({name:item.name,size:bytes.length,sha256:digest(bytes)});
    }
    const existing=new Set(files.map(file=>file.name));let placeholders=0;
    function reference(archive,ref){
      if(!ref.fileId)return true;
      assert.match(ref.fileId,/^file_[a-zA-Z0-9_-]+$/);
      if(existing.has(ref.fileId))return true;
      const seed=archive.id.match(/^(in|out)_([1-9]|10)$/);
      const seedName=seed&&`surat-${seed[1]==='in'?'masuk':'keluar'}-${seed[2]}.pdf`;
      assert.ok(seed&&ref.fileId===`file_${archive.id}`&&ref.fileName===seedName,'Berkas sumber hilang dan bukan placeholder demo yang dikenal.');
      archive.unavailableLegacyFiles||=[];
      archive.unavailableLegacyFiles.push({...ref,reason:'legacy_demo_placeholder_without_binary'});placeholders++;
      return false;
    }
    for(const archive of data.archives){
      assert.ok(Array.isArray(archive.dispositions));
      if(!reference(archive,{fileId:archive.fileId,fileName:archive.fileName,mime:archive.fileMime,size:archive.fileSize,checksum:archive.fileChecksum})){
        archive.fileId='';archive.fileName='';delete archive.fileMime;delete archive.fileSize;delete archive.fileChecksum;
      }
      if(archive.fileVersions)archive.fileVersions=archive.fileVersions.filter(ref=>reference(archive,ref));
    }
    const summary={archives:data.archives.length,users:data.users.length,sourceSha256:digest(original),placeholderReferences:placeholders,files};
    await write(output,JSON.stringify(data,null,2));await write(summaryFile,JSON.stringify(summary,null,2));
    console.log(`Snapshot disiapkan: ${summary.archives} arsip, ${summary.users} akun, ${files.length} file; ${placeholders} referensi demo tanpa binary dicatat sebagai tidak tersedia.`);
  }else if(['migrate','import','backup','verify'].includes(command)){
    const [dir,...rest]=args;const config=await settings(dir);loadEnv(config);
    if(command==='migrate'||command==='import'){
      if(command==='import'){
        const credentials=JSON.parse(await fs.readFile(path.join(dir,'admin-access.json'),'utf8'));
        process.env.BOOTSTRAP_ADMIN_USERNAME=credentials.username;process.env.BOOTSTRAP_ADMIN_PASSWORD=credentials.password;
      }
      process.argv=[process.execPath,new URL('./database.mjs',import.meta.url).pathname,command,...rest];
      await import('./database.mjs');
    }else if(command==='backup'){
      await import('./backup.mjs');
    }else{
      const [snapshot,summaryFile,port]=rest;assert.ok(['3100','3000'].includes(port));
      const source=JSON.parse(await fs.readFile(snapshot,'utf8'));
      const summary=JSON.parse(await fs.readFile(summaryFile,'utf8'));
      const credentials=JSON.parse(await fs.readFile(path.join(dir,'admin-access.json'),'utf8'));
      const store=await createStore({databaseUrl:process.env.DATABASE_URL});
      try{await store.transaction(async data=>{
        assert.equal(data.archives.length,source.archives.length);
        for(const archive of source.archives)assert.deepEqual(data.archives.find(item=>item.id===archive.id),archive);
        const expected=source.users.length+(source.users.some(user=>user.username.toLowerCase()===credentials.username)?0:1);
        assert.equal(data.users.length,expected);
        assert.equal(data.users.filter(user=>user.active).length,1);
        for(const old of source.users){const current=data.users.find(user=>user.id===old.id);assert.ok(current);assert.notEqual(current.passwordHash,old.passwordHash);}
        assert.ok(data.audit.length>=source.audit.length+1);
      });}finally{await store.close();}
      for(const file of summary.files){const bytes=await fs.readFile(path.join(process.env.DATA_DIR,'files',file.name));assert.equal(digest(bytes),file.sha256);}
      const base=`http://127.0.0.1:${port}`;
      async function request(url,options={}){return fetch(base+url,{...options,signal:AbortSignal.timeout(10000)});}
      assert.deepEqual(await request('/api/health').then(r=>r.json()),{ok:true});
      assert.deepEqual(await request('/api/config').then(r=>r.json()),{demoMode:false});
      assert.equal((await request('/api/archives')).status,401);
      const headers={'Content-Type':'application/json','X-SIAGA-Request':'1',Origin:process.env.APP_ORIGIN};
      const login=await request('/api/login',{method:'POST',headers,body:JSON.stringify(credentials)});assert.equal(login.status,200);
      const cookie=login.headers.get('set-cookie');assert.ok(cookie?.includes('; Secure'));
      const auth={...headers,Cookie:cookie.split(';')[0]};
      try{
        const result=await request('/api/archives',{headers:auth}).then(r=>r.json());assert.equal(result.items.length,summary.archives);
        assert.equal(result.items.filter(item=>item.fileAvailable).length,source.archives.filter(item=>item.fileId).length);
      }finally{assert.equal((await request('/api/logout',{method:'POST',headers:auth})).status,200);}
      console.log(`Verifikasi PostgreSQL, integritas file dan login produksi pada port ${port} lulus.`);
    }
  }else throw Error('Perintah helper tidak dikenali.');
}catch{
  console.error('Tahap migrasi gagal; data/config tidak dicetak. Periksa checkpoint dan backup privat.');
  process.exitCode=1;
}
