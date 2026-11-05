import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';import pg from 'pg';
let checks=0;const pass=message=>{checks++;console.log('✓ '+message);};
const root=process.cwd();
async function suite(extra={},port=3514){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'siaga-file-versions-')),base='http://127.0.0.1:'+port;
 const start=async()=>{const child=spawn(process.execPath,['app.mjs'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:dir,DATABASE_URL:'',NODE_ENV:'test',DEMO_MODE:'true',...extra},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timeout')),12000);child.stdout.on('data',data=>{if(String(data).includes('SIAGA ARSIP berjalan')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(Error('Startup failed '+code));});});return child;};
 const stop=async child=>{if(child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});};
 let child;
 async function request(route,cookie,method='GET',data,key){const response=await fetch(base+route,{method,headers:{'X-SIAGA-Request':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(key?{'Idempotency-Key':key}:{})},...(data?{body:JSON.stringify(data)}:{})});const bytes=Buffer.from(await response.arrayBuffer());let body;try{body=JSON.parse(bytes.toString());}catch{}return {status:response.status,body,bytes,headers:response.headers,cookie:response.headers.get('set-cookie')?.split(';')[0]};}
 try{
  child=await start();console.log('Storage: '+(extra.DATABASE_URL?'PostgreSQL':'JSON'));
  const admin=(await request('/api/login',null,'POST',{username:'admin',password:'admin123'})).cookie;
  const hukum=(await request('/api/login',null,'POST',{username:'pegawai.hukum',password:'pegawai123'})).cookie;
  const leader=(await request('/api/login',null,'POST',{username:'pimpinan',password:'pimpinan123'})).cookie;
  const archive=(await request('/api/archives',admin,'POST',{type:'incoming',number:'VERSION/TEST',subject:'Uji versi sementara',origin:'Fixture',letterDate:'2026-11-05',receivedDate:'2026-11-05',subsection:'Administrasi',classification:'Administrasi umum'})).body;
  const route=`/api/archives/${archive.id}/files`,one=Buffer.from('%PDF-1.4\nFirst version\n%%EOF'),two=Buffer.from('%PDF-1.4\nSecond version\n%%EOF');
  const upload=(bytes,name,expectedVersionId,reason)=>({fileName:name,mimeType:'application/pdf',data:bytes.toString('base64'),expectedVersionId,reason});
  const first=await request(route,admin,'POST',upload(one,'first.pdf',null,'Dokumen awal'),'version-first-key-001');assert.equal(first.status,201);const v1=first.body.documents[0].versions[0];assert.equal(v1.number,1);assert.equal(v1.uploadedBy,'u_admin');assert.ok(v1.uploadedAt);assert.equal(v1.reason,'Dokumen awal');assert.equal(v1.legacy,false);pass('first version records uploader timestamp reason and binary metadata');
  const second=await request(route,admin,'POST',upload(two,'second.pdf',v1.id,'Koreksi scan'),'version-second-key-001');assert.equal(second.status,201);const doc=second.body.documents[0],v2=doc.versions[1];assert.equal(doc.currentVersionId,v2.id);assert.equal(doc.versions.length,2);assert.equal(second.body.fileId,v2.id);assert.equal(second.body.fileVersions[0].fileId,v1.id);assert.equal(doc.versions[0].checksum,v1.checksum);pass('replacement appends immutable history and preserves legacy primary mirrors');
  const old=await request('/api/files/'+v1.fileId,admin);assert.equal(old.status,200);assert.deepEqual(old.bytes,one);assert.ok(old.headers.get('content-disposition').includes('first.pdf'));pass('old version downloads original bytes and filename');
  assert.deepEqual((await request('/api/files/'+v2.fileId,leader)).bytes,two);assert.equal((await request('/api/files/'+v1.fileId,hukum)).status,404);assert.equal((await request('/api/files/'+v1.fileId)).status,401);pass('historical download follows archive scope for leader employee and anonymous');
  assert.equal((await request(route,leader,'POST',upload(one,'denied.pdf',v2.id,'Denied'))).status,403);pass('reader role cannot replace or restore a document');
  const restoredBody={sourceVersionId:v1.id,documentId:'document_primary',expectedVersionId:v2.id,reason:'Dibuat ulang dari versi 1'};
  const restored=await request(route,admin,'POST',restoredBody,'version-restore-key-001');assert.equal(restored.status,201);const v3=restored.body.documents[0].versions[2];assert.notEqual(v3.id,v1.id);assert.equal(v3.sourceVersionId,v1.id);assert.equal(v3.checksum,v1.checksum);assert.equal(v3.number,3);assert.deepEqual((await request('/api/files/'+v3.fileId,admin)).bytes,one);pass('restore creates a new version with source lineage without rewriting history');
  const replay=await request(route,admin,'POST',restoredBody,'version-restore-key-001');assert.equal(replay.status,200);assert.equal(replay.body.documents[0].versions.length,3);pass('restore retry is idempotent after current version changes');
  const stale=await request(route,admin,'POST',upload(two,'stale.pdf',v1.id,'Stale'));assert.equal(stale.status,409);pass('stale replacement cannot overwrite a newer active version');
  assert.equal((await request(route,admin,'POST',{...restoredBody,sourceVersionId:'file_foreign',expectedVersionId:v3.id})).status,404);pass('restore cannot select a version outside the document');
  const invalid=await request(route,admin,'POST',upload(two,'bad.pdf',v3.id,'   '));assert.equal(invalid.status,422);pass('provided replacement reason must contain meaningful text');
  const after=(await request('/api/archives/'+archive.id,admin)).body;assert.equal(after.documents[0].versions.length,3);assert.equal(after.fileId,v3.id);assert.equal(after.metadataVersion,0);pass('failed replacements leave active version metadata and history unchanged');
  const audit=(await request('/api/admin/audit',admin)).body.items;assert.equal(audit.filter(item=>item.action==='upload'&&[v1.id,v2.id,v3.id].includes(item.entityId)).length,3);pass('version changes and historical downloads remain auditable without duplicate writes');
  await stop(child);child=await start();const persisted=(await request('/api/archives/'+archive.id,admin)).body;assert.equal(persisted.documents[0].versions.length,3);assert.deepEqual((await request('/api/files/'+v1.id,admin)).bytes,one);pass('version model active pointer and historical binary survive restart');
 }finally{if(child)await stop(child);await fs.rm(dir,{recursive:true,force:true});}
}
await suite();
if(process.env.PG_TEST_URL){const url=new URL(process.env.PG_TEST_URL);if(!['127.0.0.1','localhost'].includes(url.hostname))throw Error('Local PostgreSQL required.');const pool=new pg.Pool({connectionString:url.href}),name='siaga_versions_'+Date.now();await pool.query(`CREATE DATABASE ${name}`);url.pathname='/'+name;try{execFileSync(process.execPath,['scripts/database.mjs','migrate'],{cwd:root,env:{...process.env,DATABASE_URL:url.href},stdio:'pipe'});await suite({DATABASE_URL:url.href},3515);}finally{await pool.query(`DROP DATABASE ${name} WITH (FORCE)`);await pool.end();}}
console.log(`${checks} file version checks passed.`);
