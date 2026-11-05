import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';
import {createStore} from '../lib/store.mjs';
import {tokenHash} from '../lib/security.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;console.log(`✓ ${message}`);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function start(dataDir,port,extra={}){const child=spawn(process.execPath,['app.mjs'],{cwd:root,env:{...process.env,DATABASE_URL:'',NODE_ENV:'test',DEMO_MODE:'true',DATA_DIR:dataDir,PORT:String(port),...extra},stdio:['ignore','pipe','pipe']});let error='';child.stderr.on('data',c=>error+=c);for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error(`Startup gagal: ${error.slice(0,500)}`);try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return child;}catch{}await wait(50);}child.kill();throw Error('Startup timeout');}
async function stop(child){if(child.exitCode!==null)return;child.kill();await new Promise(r=>child.once('exit',r));}
async function suite(extra={},label='JSON',port=3401){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'siaga-security-'));let child;const base=`http://127.0.0.1:${port}`;
async function req(route,{method='GET',data,cookie,headers={},marker=true}={}){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(marker?{'X-SIAGA-Request':'1'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});const bytes=await r.text();let body;try{body=JSON.parse(bytes);}catch{body=bytes;}return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};}
const login=(username,password)=>req('/api/login',{method:'POST',data:{username,password}});
try{child=await start(dir,port,extra);console.log(`Storage: ${label}`);const admin=await login('admin','admin123');check(admin.status===200,'login scrypt');
check((await req('/api/archives')).status===401,'anonymous internal API rejected');
check((await req('/api/login',{method:'POST',data:{username:'admin',password:'admin123'},marker:false})).status===403,'CSRF non-custom request rejected');
check((await req('/api/login',{method:'POST',data:{username:'admin',password:'admin123'},headers:{Origin:'https://attacker.invalid'}})).status===403,'cross-origin request rejected');
check((await req('/')).headers.get('x-content-type-options')==='nosniff','security headers');
await req('/api/admin/users',{method:'POST',cookie:admin.cookie,data:{username:'recorder.test',name:'Recorder',password:'recorder123',role:'recorder',subsection:'Administrasi'}});const recorder=await login('recorder.test','recorder123');
const record={type:'incoming',number:'SEC/1',subject:'Security test',classification:'Administrasi umum',subsection:'Administrasi',letterDate:'2026-11-05',receivedDate:'2026-11-05',origin:'Uji'};
check((await req('/api/archives',{method:'POST',cookie:recorder.cookie,data:{...record,subsection:'Hukum'}})).status===403,'recorder cannot write another subsection');
check((await req('/api/archives',{method:'POST',cookie:recorder.cookie,data:{...record,letterDate:'2026-02-30'}})).status===422,'invalid date rejected');
check((await req('/api/archives',{method:'POST',cookie:admin.cookie,data:{...record,classification:'UNKNOWN'}})).status===422,'unknown classification rejected');
const created=await req('/api/archives',{method:'POST',cookie:recorder.cookie,data:record});check(created.status===201&&!created.body.fileAvailable,'metadata does not pretend to contain a file');
check((await req(`/api/archives/${created.body.id}/dispositions`,{method:'POST',cookie:admin.cookie,data:{assignedSubsection:'Hukum',instruction:'Test'}})).status===422,'cross-subsection assignment rejected');
check((await req('/api/archives/out_1/dispositions',{method:'POST',cookie:admin.cookie,data:{assignedSubsection:'Pengawasan',instruction:'Test'}})).status===422,'outgoing disposition rejected');
const assigned=await req(`/api/archives/${created.body.id}/dispositions`,{method:'POST',cookie:admin.cookie,data:{assignedSubsection:'Administrasi',instruction:'SECRET_INSTRUCTION_TEST'}});check(assigned.status===201,'valid disposition accepted');
const hukum=await login('pegawai.hukum','pegawai123');check((await req(`/api/dispositions/${assigned.body.dispositions[0].id}/status`,{method:'PATCH',cookie:hukum.cookie,data:{status:'Selesai'}})).status===403,'foreign disposition update rejected');
check((await req(`/api/archives/${created.body.id}`,{cookie:hukum.cookie})).status===404,'foreign detail rejected');
const uploadRoute=`/api/archives/${created.body.id}/files`;check((await req(uploadRoute,{method:'POST',cookie:admin.cookie,data:{fileName:'fake.pdf',mimeType:'application/pdf',data:Buffer.from('not a pdf').toString('base64')}})).status===422,'forged MIME rejected');
const pdf=Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');const uploaded=await req(uploadRoute,{method:'POST',cookie:admin.cookie,data:{fileName:'test.pdf',mimeType:'application/pdf',data:pdf.toString('base64')}});check(uploaded.status===201&&uploaded.body.fileChecksum,'valid PDF stores checksum');
await req(`/api/archives/${created.body.id}`,{cookie:admin.cookie});const audit=await req('/api/admin/audit',{cookie:admin.cookie});check(audit.body.items.some(e=>e.action==='view')&&!JSON.stringify(audit.body).includes('SECRET_INSTRUCTION_TEST'),'view audited without leaking instructions');
const employee=await login('pegawai.administrasi','pegawai123');await req('/api/admin/users/u_adm',{method:'PATCH',cookie:admin.cookie,data:{password:'updatedpassword123'}});check((await req('/api/me',{cookie:employee.cookie})).status===401,'password change revokes sessions');
for(let i=0;i<10;i++)await login('bad-user','bad-pass');check((await login('bad-user','bad-pass')).status===429,'login attempts limited');
check((await req('/api/archives',{method:'POST',cookie:admin.cookie,data:{...record,origin:'x'.repeat(25*1024*1024)}})).status===413,'oversized body rejected');
const before=(await req('/api/public/stats')).body.total;await stop(child);child=await start(dir,port,extra);check((await req('/api/public/stats')).body.total===before,'records survive restart');check((await req('/api/me',{cookie:admin.cookie})).status===200,'server sessions survive restart');
const loggedOut=await req('/api/logout',{method:'POST',cookie:admin.cookie});check(loggedOut.status===200&&(await req('/api/me',{cookie:admin.cookie})).status===401,'logout revokes session');
const expiring=await login('admin','admin123');const probeStore=await createStore({file:path.join(dir,'data.json'),databaseUrl:extra.DATABASE_URL});try{await probeStore.transaction(async(d,dirty)=>{const session=d.sessions.find(s=>s.id===tokenHash(expiring.cookie.slice(4)));assert.ok(session);session.expiresAt=Date.now()-1;dirty();assert.ok(!JSON.stringify(d.sessions).includes(expiring.cookie.slice(4)));});}finally{await probeStore.close();}check((await req('/api/me',{cookie:expiring.cookie})).status===401,'server expiry rejects old token; session stores only token hash');
if(!extra.DATABASE_URL){await stop(child);await fs.writeFile(path.join(dir,'data.json'),'{invalid');const bad=spawn(process.execPath,['app.mjs'],{cwd:root,env:{...process.env,DATABASE_URL:'',DATA_DIR:dir,PORT:String(port),DEMO_MODE:'true'},stdio:'ignore'});await new Promise(r=>bad.once('exit',r));check(bad.exitCode!==0&&(await fs.readFile(path.join(dir,'data.json'),'utf8'))==='{invalid','corrupt JSON never resets to demo');}
}finally{if(child)await stop(child);await fs.rm(dir,{recursive:true,force:true});}}
await suite();
if(process.env.PG_TEST_URL){
const url=new URL(process.env.PG_TEST_URL);if(!['127.0.0.1','localhost'].includes(url.hostname))throw Error('PG_TEST_URL harus lokal untuk tes sementara.');
const pool=new pg.Pool({connectionString:url.href});const name=`siaga_security_${Date.now()}`;await pool.query(`CREATE DATABASE ${name}`);url.pathname='/'+name;
try{execFileSync(process.execPath,['scripts/database.mjs','migrate'],{cwd:root,env:{...process.env,DATABASE_URL:url.href},stdio:'pipe'});await suite({DATABASE_URL:url.href},'PostgreSQL',3402);}finally{await pool.query(`DROP DATABASE ${name} WITH (FORCE)`);await pool.end();}
}
console.log(`${checks} security checks passed.`);
