import http from 'node:http';
import fs from 'node:fs/promises';
import { lstatSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileTypeFromBuffer} from 'file-type';
import { fileURLToPath } from 'node:url';
import { createStore, emptyData } from './lib/store.mjs';
import { fail, passwordHash, verifyPassword, tokenHash, text, validateArchive, validateUpload } from './lib/security.mjs';
import {prepareArchiveEdit,metadataLabels} from './lib/archive-edit.mjs';
import {archiveFilters,matchesArchive,archivePage,orderedArchives} from './lib/archive-query.mjs';
import {archiveCsv,archiveXlsx,serializeCsv} from './lib/archive-export.mjs';
import {requestReceipt,matchesReceipt} from './lib/request-receipt.mjs';
import {archiveDocuments,archiveFileIds,appendArchiveVersion,validFileId} from './lib/archive-files.mjs';
import {stageArchiveFile} from './lib/file-io.mjs';
import {canUpdateDisposition,dispositionRecipients,dispositionUpdate} from './lib/dispositions.mjs';
import {dispositionWorklist} from './lib/disposition-query.mjs';
import {notificationPage,markNotifications} from './lib/notifications.mjs';
import {archiveQuality} from './lib/archive-quality.mjs';
import {archiveIndex,indexFields,indexLimits,validateIndexFields,structuredFileName} from './lib/archive-index.mjs';
import {inspectArchiveIntegrity,archiveDuplicates} from './lib/archive-inspection.mjs';
import {officialSubsections,isSubsection,sameSubsection,subsectionLabel} from './lib/subsection-taxonomy.mjs';
import {administrativeArchiveCategories,defaultArchiveCategory} from './lib/archive-taxonomy.mjs';
import {classificationLabels,classificationPayload,findClassification,classificationRecords,validateClassificationInput} from './lib/classification-taxonomy.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
let revision='unknown';
try{const gitDir=path.join(ROOT,'.git'),head=(await fs.readFile(path.join(gitDir,'HEAD'),'utf8')).trim();const value=head.startsWith('ref: ')?(await fs.readFile(path.join(gitDir,head.slice(5)),'utf8')).trim():head;if(/^[a-f0-9]{40}$/.test(value))revision=value;}catch{}
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const FILE_DIR = path.join(DATA_DIR, 'files');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const PORT = Number(process.env.PORT || 3000);
const DEMO_MODE=process.env.DEMO_MODE==='true'||(process.env.NODE_ENV!=='production'&&process.env.DEMO_MODE!=='false');
const SECURE_COOKIE=process.env.COOKIE_SECURE==='true'||!DEMO_MODE;
if(!DEMO_MODE&&(!process.env.DATABASE_URL||!process.env.APP_ORIGIN?.startsWith('https://')))throw Error('Produksi memerlukan DATABASE_URL dan APP_ORIGIN HTTPS.');
const storage=await createStore({file:DATA_FILE,databaseUrl:process.env.DATABASE_URL});
let sessions=new Map(), db, markDirty;
const SESSION_TTL=8*60*60*1000;
const loginAttempts=new Map();

const subsections = officialSubsections;
const demoSubsections = ['Administrasi', 'Hukum', 'Pengawasan', 'PPPS'];
const archiveCategories = [...administrativeArchiveCategories];
const roles = {
  admin: 'admin', leader: 'leader', recorder: 'recorder', uploader: 'uploader', employee: 'employee'
};

function id(prefix = 'id') { return `${prefix}_${crypto.randomUUID()}`; }
function now() { return new Date().toISOString(); }
function categoryRegistry() { return [...new Set([...archiveCategories, ...(db?.categories || [])])]; }
const hash = passwordHash;

async function seed() {
  await fs.mkdir(FILE_DIR, { recursive: true });
  if(!DEMO_MODE)throw Error('Database produksi kosong. Jalankan npm run db:bootstrap.');
  const users = [
    { id: 'u_admin', username: 'admin', name: 'Admin Pengelola Arsip', passwordHash: await hash('admin123'), role: roles.admin, subsection: null, email: 'admin@bawaslu.local', active: true },
    { id: 'u_leader', username: 'pimpinan', name: 'Pimpinan Bawaslu Aceh Timur', passwordHash: await hash('pimpinan123'), role: roles.leader, subsection: null, email: 'pimpinan@bawaslu.local', active: true },
    { id: 'u_adm', username: 'pegawai.administrasi', name: 'Pegawai Administrasi', passwordHash: await hash('pegawai123'), role: roles.employee, subsection: 'Administrasi', email: 'administrasi@bawaslu.local', active: true },
    { id: 'u_huk', username: 'pegawai.hukum', name: 'Pegawai Hukum', passwordHash: await hash('pegawai123'), role: roles.employee, subsection: 'Hukum', email: 'hukum@bawaslu.local', active: true },
    { id: 'u_pws', username: 'pegawai.pengawasan', name: 'Pegawai Pengawasan', passwordHash: await hash('pegawai123'), role: roles.employee, subsection: 'Pengawasan', email: 'pengawasan@bawaslu.local', active: true },
    { id: 'u_ppps', username: 'pegawai.ppps', name: 'Pegawai PPPS', passwordHash: await hash('pegawai123'), role: roles.employee, subsection: 'PPPS', email: 'ppps@bawaslu.local', active: true }
  ];
  const archives = [];
  const classifications = ['Administrasi umum', 'Kepegawaian', 'Koordinasi dan rapat', 'Pengawasan Pemilu', 'Produk hukum'];
  for (let i = 1; i <= 10; i++) archives.push({ id: `in_${i}`, type: 'incoming', number: `IN/AT/${String(i).padStart(3, '0')}/2026`, letterDate: `2026-10-${String((i % 20) + 1).padStart(2, '0')}`, receivedDate: `2026-10-${String((i % 20) + 2).padStart(2, '0')}`, origin: ['Bawaslu Provinsi Aceh', 'KPU Aceh Timur', 'Sekretariat Daerah', 'Panwaslu Kecamatan'][i % 4], destination: ['Pimpinan', 'Subbagian Administrasi', 'Subbagian Hukum', 'Subbagian Pengawasan'][i % 4], subject: ['Undangan koordinasi tahapan pemilu', 'Penyampaian laporan administrasi', 'Permintaan data pengawasan', 'Rapat persiapan kegiatan'][i % 4], classification: classifications[i % classifications.length], subsection: demoSubsections[i % 4], fileName: `surat-masuk-${i}.pdf`, fileId: `file_in_${i}`, createdBy: 'u_admin', createdAt: now(), status: 'registered', dispositions: [] });
  for (let i = 1; i <= 10; i++) archives.push({ id: `out_${i}`, type: 'outgoing', number: `OUT/AT/${String(i).padStart(3, '0')}/2026`, letterDate: `2026-09-${String((i % 20) + 1).padStart(2, '0')}`, destination: ['Bawaslu Provinsi Aceh', 'KPU Aceh Timur', 'Camat setempat', 'Panwaslu Kecamatan'][i % 4], subject: ['Penyampaian surat tugas', 'Undangan rapat koordinasi', 'Permohonan data pendukung', 'Pemberitahuan kegiatan'][i % 4], signatory: 'Ketua Bawaslu Kabupaten Aceh Timur', classification: classifications[(i + 2) % classifications.length], subsection: demoSubsections[(i + 1) % 4], fileName: `surat-keluar-${i}.pdf`, fileId: `file_out_${i}`, createdBy: 'u_admin', createdAt: now(), dispositions: [] });
  const audit = [{ id: id('audit'), actorId: 'u_admin', action: 'seed_demo', entity: 'system', entityId: 'system', at: now(), detail: '20 arsip dummy dibuat untuk demo' }];
  const data = { users, archives, classifications, categories: archiveCategories, audit, notifications: [] };
  data.sessions=[];return data;
}

await fs.mkdir(FILE_DIR,{recursive:true,mode:0o700});
await storage.transaction(async(data,dirty,replace)=>{if(!data)await replace(await seed());});
async function persist() { db.sessions=[...sessions.values()];markDirty(); }
function safeUser(user) { const { passwordHash, ...rest } = user; return {...rest, subsectionLabel: subsectionLabel(user.subsection) || null}; }
function audit(actorId, action, entity, entityId, detail = '') { db.audit.unshift({ id: id('audit'), actorId, action, entity, entityId, at: now(), detail }); }
function cookie(name, value, maxAge = 60 * 60 * 8) { return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${SECURE_COOKIE?'; Secure':''}`; }
function parseCookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => { const i = x.indexOf('='); return [x.slice(0, i).trim(), x.slice(i + 1)]; })); }
function getUser(req) { const session=sessions.get(tokenHash(parseCookies(req).sid));if(!session||session.expiresAt<=Date.now()){if(session)sessions.delete(session.id);return null;}return db.users.find(u=>u.id===session.userId&&u.active)||null; }
function revokeSessions(userId){for(const [key,value]of sessions)if(value.userId===userId)sessions.delete(key);}
function isWide(user) { return user && (user.role === 'admin' || user.role === 'leader'); }
function canSee(user, archive) { return isWide(user) || (user && sameSubsection(user.subsection, archive.subsection)); }
function send(res,status,body,type='application/json',extra={}) { const reply={status,body:type==='application/json'?JSON.stringify(body):body,headers:{'Content-Type':type,'Cache-Control':'no-store',...extra}};if(res._defer){res._reply=reply;return;}res.writeHead(status,reply.headers);res.end(reply.body); }
async function body(req){if(req._parsedBody)return req._parsedBody;const max=req.url.split('?')[0].endsWith('/files')?24*1024*1024:128*1024;if(Number(req.headers['content-length'])>max)fail(413,'Request terlalu besar.');const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max)fail(413,'Request terlalu besar.');chunks.push(chunk);}try{const result=JSON.parse(Buffer.concat(chunks).toString()||'{}');if(!result||Array.isArray(result)||typeof result!=='object')fail(422,'Body harus berupa objek JSON.');req._parsedBody=result;return result;}catch(error){if(error.status)throw error;fail(400,'JSON tidak valid.');}}
function requireAuth(req, res) { const user = getUser(req); if (!user) { send(res, 401, { error: 'Silakan login terlebih dahulu.' }); return null; } return user; }
function visibleArchives(user,url){
  const filters=archiveFilters(url.searchParams,db,subsections);
  return db.archives.filter(archive=>canSee(user,archive)).map(archive=>({...archive,quality:archiveQuality(archive,fileAvailable)})).filter(archive=>matchesArchive(archive,filters));
}
function fileAvailable(fileId){if(!validFileId(fileId))return false;try{const stat=lstatSync(path.join(FILE_DIR,fileId));return stat.isFile()&&!stat.isSymbolicLink();}catch{return false;}}
function dispositionPayload(d){const {statusReceipts,notificationReads,...visible}=d;return {...visible,version:d.version??(d.updates||[]).length,createdByName:db.users.find(user=>user.id===d.createdBy)?.name||'',updates:(d.updates||[]).map(update=>({...update,byName:db.users.find(user=>user.id===update.by)?.name||''})),assignedUserName:db.users.find(user=>user.id===d.assignedUserId)?.name||d.assignedSubsection};}
function metadataHistoryPayload(archive){
  return (archive.metadataHistory||[]).map(event=>{
    const fields=(Array.isArray(event.fields)?event.fields:[]).filter(field=>typeof field==='string'&&Object.hasOwn(metadataLabels,field));
    const author=db.users.find(user=>user.id===event.by);
    // Only the allowed summary crosses the API boundary, including for imported legacy entries.
    return {id:event.id,version:event.version,fields,fieldLabels:fields.map(field=>metadataLabels[field]),by:author?.id||null,byName:author?.name||'Pengguna tidak tersedia',at:event.at};
  });
}
function archivePayload(a) { const {creationReceipt,uploadReceipts,dispositionReceipts,qualityReceipts,...visible}=a;const category=a.category||defaultArchiveCategory(a.type);return { ...visible, category, subsectionLabel:subsectionLabel(a.subsection), metadataHistory:metadataHistoryPayload(a), ...archiveIndex(a), quality:archiveQuality(a,fileAvailable),qualityReviews:(a.qualityReviews||[]).map(({duplicates,...review})=>({...review,duplicateCount:duplicates?.length??null,byName:db.users.find(user=>user.id===review.by)?.name||''})), documents:archiveDocuments(a).map(document=>({...document,versions:document.versions.map(version=>({...version,uploadedByName:db.users.find(user=>user.id===version.uploadedBy)?.name||'',available:fileAvailable(version.fileId)}))})), metadataVersion:a.metadataVersion||0, updatedByName:db.users.find(user=>user.id===a.updatedBy)?.name||'', fileAvailable: Boolean(a.fileName&&fileAvailable(a.fileId)), dispositions:a.dispositions.map(dispositionPayload) }; }

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); const pathname = url.pathname;
  if(pathname==='/api/config'&&req.method==='GET')return send(res,200,{demoMode:DEMO_MODE});
  if(pathname==='/api/health'&&req.method==='GET')return send(res,200,{ok:true});
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
    if(req.headers['x-siaga-request']!=='1')fail(403,'Header permintaan tidak valid.');
    const origin=process.env.APP_ORIGIN||`http://${req.headers.host}`;
    if(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&req.headers.origin!==origin))fail(403,'Asal permintaan ditolak.');
  }
  if(pathname==='/api/login'&&req.method==='POST'){
    const b=await body(req);const username=typeof b.username==='string'?b.username.trim():'';
    const ip=req.socket.remoteAddress;const key=`${ip}:${username.toLowerCase()}`;const nowMs=Date.now();
    for(const [k,v]of loginAttempts)if(v.until<nowMs)loginAttempts.delete(k);
    const attempt=loginAttempts.get(key)||{count:0,until:nowMs+15*60*1000};const ipKey=`ip:${ip}`;const ipAttempt=loginAttempts.get(ipKey)||{count:0,until:nowMs+15*60*1000};
    if(attempt.count>=10||ipAttempt.count>=100)fail(429,'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.');
    const u=db.users.find(x=>x.username.toLowerCase()===username.toLowerCase()&&x.active);
    const valid=await verifyPassword(b.password,u?.passwordHash||'scrypt$32768$8$3$00000000000000000000000000000000$'+'0'.repeat(128),DEMO_MODE);
    if(!u||!valid){attempt.count++;ipAttempt.count++;loginAttempts.set(key,attempt);loginAttempts.set(ipKey,ipAttempt);audit(null,'login_failed','auth','login');await persist();return send(res,422,{error:'Username atau kata sandi salah.'});}
    loginAttempts.delete(key);if(!u.passwordHash.startsWith('scrypt$32768$8$3$'))u.passwordHash=await hash(b.password);
    sessions.delete(tokenHash(parseCookies(req).sid));const sid=crypto.randomBytes(32).toString('hex');const id=tokenHash(sid);sessions.set(id,{id,userId:u.id,expiresAt:Date.now()+SESSION_TTL});audit(u.id,'login','user',u.id);await persist();return send(res,200,{user:safeUser(u)},'application/json',{'Set-Cookie':cookie('sid',sid)});
  }
  if (pathname === '/api/logout' && req.method === 'POST') { const u = getUser(req); if (u) audit(u.id, 'logout', 'user', u.id); sessions.delete(tokenHash(parseCookies(req).sid)); await persist(); return send(res, 200, { ok: true }, 'application/json', { 'Set-Cookie': cookie('sid', '', 0) }); }
  if (pathname === '/api/me' && req.method === 'GET') { const u = getUser(req); return u ? send(res, 200, { user: safeUser(u) }) : send(res, 401, { error: 'Unauthorized' }); }
  if (pathname === '/api/public/stats' && req.method === 'GET') { const year = url.searchParams.get('year') || ''; const list = db.archives.filter(a => !year || a.letterDate.startsWith(year)); return send(res, 200, { year: year || 'all', incoming: list.filter(a => a.type === 'incoming').length, outgoing: list.filter(a => a.type === 'outgoing').length, total: list.length }); }
  if (pathname.startsWith('/api/')) {
    const u = requireAuth(req, res); if (!u) return;
    if (pathname === '/api/dashboard' && req.method === 'GET') { const list = visibleArchives(u, url); const open = list.flatMap(a => a.dispositions).filter(d => d.status !== 'Selesai'&&canUpdateDisposition(u,d)).length; return send(res, 200, { incoming: list.filter(a => a.type === 'incoming').length, outgoing: list.filter(a => a.type === 'outgoing').length, pending: open, total: list.length, users: isWide(u) ? db.users.length : undefined,qualityCounts:Object.fromEntries(['metadata_only','missing_file','missing_attachment','needs_review','needs_correction','complete'].map(status=>[status,list.filter(a=>a.quality.status===status).length])) }); }
    if(pathname==='/api/archives'&&req.method==='GET'){
      const result=archivePage(visibleArchives(u,url),url.searchParams);
      const years=[...new Set(db.archives.filter(item=>canSee(u,item)).map(item=>String(item.letterDate||'').slice(0,4)).filter(year=>/^\d{4}$/.test(year)))].sort().reverse();
      audit(u.id,'view_list','archive','list');await persist();
      const response={...result,items:result.items.map(archivePayload),classifications:classificationLabels(db.classifications),categories:categoryRegistry(),subsections,years};
      if(u.role==='admin')response.classificationCatalog=classificationPayload(db.classifications);
      return send(res,200,response);
    }
    if(/^\/api\/archives\/[^/]+$/.test(pathname)&&req.method==='GET'){const a=db.archives.find(x=>x.id===pathname.split('/')[3]);if(!a||!canSee(u,a))return send(res,404,{error:'Arsip tidak ditemukan.'});audit(u.id,'view','archive',a.id);await persist();return send(res,200,archivePayload(a));}
    if(/^\/api\/archives\/[^/]+$/.test(pathname)&&req.method==='PATCH'){
      if(u.role!=='admin')return send(res,403,{error:'Perbaikan metadata hanya tersedia untuk admin.'});
      const archive=db.archives.find(item=>item.id===pathname.split('/')[3]);
      if(!archive||!canSee(u,archive))return send(res,404,{error:'Arsip tidak ditemukan.'});
      const {values,fields}=prepareArchiveEdit(archive,await body(req),u,db,subsections);
      if(fields.length){
        const version=(archive.metadataVersion||0)+1,at=now();
        (archive.metadataHistory||=[]).push({id:id('metadata_change'),version,fields:[...fields],by:u.id,at});
        Object.assign(archive,values,{metadataVersion:version,updatedAt:at,updatedBy:u.id});
        audit(u.id,'update_metadata','archive',archive.id,'Field diperbarui: '+fields.map(key=>metadataLabels[key]).join(', '));
        await persist();
      }
      return send(res,200,archivePayload(archive));
    }
    if (pathname === '/api/users' && req.method === 'GET') { if (!isWide(u)) return send(res, 403, { error: 'Khusus admin/pimpinan.' }); return send(res, 200, { items: db.users.filter(x => x.active).map(safeUser) }); }
    if (pathname === '/api/admin/users' && req.method === 'GET') { if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' }); return send(res, 200, { items: db.users.map(safeUser) }); }
    if (pathname === '/api/admin/roles' && req.method === 'GET') { if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' }); return send(res, 200, { items: Object.values(roles) }); }
    if (pathname === '/api/admin/subsections' && req.method === 'GET') { if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' }); return send(res, 200, { items: subsections }); }
    if (pathname === '/api/admin/users' && req.method === 'POST') {
      if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' });
      const b = await body(req); const username = String(b.username || '').trim();if(!/^[a-zA-Z0-9._-]{3,80}$/.test(username))fail(422,'Username harus 3–80 karakter huruf, angka, titik, garis bawah atau tanda hubung.'); const name = String(b.name || '').trim(); const password = String(b.password || ''); const role = String(b.role || 'employee');
      if (!username || !name || password.length < 8 || password.length>1024 || !Object.values(roles).includes(role)) return send(res, 422, { error: 'Username, nama, kata sandi minimal 8 karakter, dan peran wajib valid.' });
      if (db.users.some(x => x.username.toLowerCase() === username.toLowerCase())) return send(res, 422, { error: 'Username sudah digunakan.' });
      const needsSubsection = !['admin', 'leader'].includes(role); const subsection = needsSubsection ? String(b.subsection || '') : null;
      if (needsSubsection && !isSubsection(subsection)) return send(res, 422, { error: 'Subbagian wajib dipilih untuk peran ini.' });
      const created = { id: id('user'), username, name, passwordHash: await hash(password), role, subsection, email: String(b.email || '').trim(), active: true };
      db.users.push(created); audit(u.id, 'create_user', 'user', created.id, created.username); await persist(); return send(res, 201, safeUser(created));
    }
    if (pathname.startsWith('/api/admin/users/') && req.method === 'PATCH') {
      if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' });
      const uid = pathname.split('/')[4]; const target = db.users.find(x => x.id === uid); if (!target) return send(res, 404, { error: 'Pengguna tidak ditemukan.' });
      const b = await body(req); const role = b.role === undefined ? target.role : String(b.role); const name = b.name === undefined ? target.name : String(b.name).trim();
      if (!Object.values(roles).includes(role) || !name) return send(res, 422, { error: 'Nama atau peran tidak valid.' });
      if (target.id === u.id && b.active === false) return send(res, 422, { error: 'Akun admin yang sedang dipakai tidak dapat dinonaktifkan.' });
      const needsSubsection = !['admin', 'leader'].includes(role); const subsection = needsSubsection ? String(b.subsection === undefined ? target.subsection || '' : b.subsection) : null;
      if (needsSubsection && !isSubsection(subsection)) return send(res, 422, { error: 'Subbagian wajib dipilih untuk peran ini.' });
      if(b.password!==undefined&&String(b.password).length&&(String(b.password).length<8||String(b.password).length>1024))return send(res,422,{error:'Kata sandi harus 8–1024 karakter.'});
      target.name = name; target.email = b.email === undefined ? target.email : String(b.email).trim(); target.role = role; target.subsection = subsection;
      if (b.password !== undefined && String(b.password).length) { if (String(b.password).length < 8) return send(res, 422, { error: 'Kata sandi minimal 8 karakter.' }); target.passwordHash = await hash(String(b.password)); }
      if (b.active !== undefined) target.active = Boolean(b.active);
      revokeSessions(target.id);
      audit(u.id, 'update_user', 'user', target.id, target.username); await persist(); return send(res, 200, safeUser(target));
    }
    if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/disable') && req.method === 'POST') {
      if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' });
      const uid = pathname.split('/')[4]; const target = db.users.find(x => x.id === uid); if (!target) return send(res, 404, { error: 'Pengguna tidak ditemukan.' });
      if (target.id === u.id) return send(res, 422, { error: 'Akun admin yang sedang dipakai tidak dapat dinonaktifkan.' });
      target.active = false; revokeSessions(target.id); audit(u.id, 'disable_user', 'user', target.id, target.username); await persist(); return send(res, 200, safeUser(target));
    }
    if (pathname === '/api/admin/classifications' && req.method === 'GET') {
      if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' });
      return send(res, 200, { items: classificationPayload(db.classifications) });
    }
    if (pathname === '/api/admin/classifications' && req.method === 'POST') {
      if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' });
      const input=validateClassificationInput(await body(req));
      const records=classificationRecords(db.classifications);
      if(records.some(item=>item.label.toLowerCase()===input.label.toLowerCase()||input.code&&item.code.toLowerCase()===input.code.toLowerCase()))return send(res,409,{error:'Nama atau kode klasifikasi sudah digunakan.'});
      const created={id:input.code||id('classification'),code:input.code||'',label:input.label,description:input.description||'',active:input.active!==false,aliases:[],createdBy:u.id,createdAt:now(),updatedAt:now()};
      db.classifications.push(created);audit(u.id,'create_classification','classification',created.id,created.code?`${created.code} — ${created.label}`:created.label);await persist();
      return send(res,201,{classifications:classificationLabels(db.classifications),classificationCatalog:classificationPayload(db.classifications)});
    }
    if (pathname.startsWith('/api/admin/classifications/') && req.method === 'PATCH') {
      if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' });
      const key=decodeURIComponent(pathname.slice('/api/admin/classifications/'.length));const index=db.classifications.findIndex(item=>findClassification([item],key));
      if(index<0)return send(res,404,{error:'Klasifikasi tidak ditemukan.'});
      const current=classificationRecords([db.classifications[index]])[0],input=validateClassificationInput(await body(req),{partial:true});
      if(input.label!==undefined&&input.label!==current.label&&!current.code&&!input.code)return send(res,422,{error:'Klasifikasi lama tanpa kode tidak dapat diganti nama. Tetapkan kode terlebih dahulu agar referensi arsip lama tetap terlacak.'});
      const next={...current,...Object.fromEntries(Object.entries(input).filter(([,value])=>value!==undefined)),id:current.id||input.code||id('classification'),aliases:[...new Set(current.aliases) ],createdBy:current.createdBy||u.id,createdAt:current.createdAt||now(),updatedAt:now()};
      if(input.label!==undefined&&input.label!==current.label)next.aliases=[...new Set([...next.aliases,current.label])];
      const others=classificationRecords(db.classifications).filter((_,i)=>i!==index);
      if(others.some(item=>item.label.toLowerCase()===next.label.toLowerCase()||next.code&&item.code.toLowerCase()===next.code.toLowerCase()||item.aliases.includes(next.label)))return send(res,409,{error:'Nama atau kode klasifikasi sudah digunakan.'});
      db.classifications[index]=next;audit(u.id,next.active?'update_classification':'disable_classification','classification',next.id,next.code?`${next.code} — ${next.label}`:next.label);await persist();
      return send(res,200,{classifications:classificationLabels(db.classifications),classificationCatalog:classificationPayload(db.classifications)});
    }
    if (pathname === '/api/admin/categories' && req.method === 'POST') { if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' }); const b = await body(req); const value = String(b.label || '').trim(); if (!value) return send(res, 422, { error: 'Nama kategori wajib diisi.' }); if (!db.categories.includes(value) && !archiveCategories.includes(value)) db.categories.push(value); audit(u.id, 'create_category', 'category', value); await persist(); return send(res, 201, { categories: categoryRegistry() }); }
    if(pathname==='/api/archives'&&req.method==='POST'){
      if(!['admin','recorder'].includes(u.role))return send(res,403,{error:'Peran ini tidak dapat mencatat arsip.'});
      const b=await body(req);
      const defaultCategory=defaultArchiveCategory(b.type);
      const values={type:b.type,category:b.category||defaultCategory,number:b.number,letterDate:b.letterDate,receivedDate:b.type==='incoming'?b.receivedDate:'',origin:b.origin||'',destination:b.destination||'',subject:b.subject,signatory:b.signatory||'',classification:b.classification,subsection:b.subsection};
      for(const field of Object.keys(indexFields))if(Object.hasOwn(b,field))values[field]=text(b[field],indexFields[field],indexLimits[field]);
      // Keep legacy idempotency fingerprints stable when the caller omitted the
      // additive category field; the stored archive still receives its default.
      const receiptValues=Object.hasOwn(b,'category')?values:{...values};
      if(!Object.hasOwn(b,'category'))delete receiptValues.category;
      const receipt=requestReceipt(req,u.id,'archive:create',receiptValues);
      // ponytail: receipts follow the full-dataset store; use an indexed receipt table when that store is replaced.
      const existing=receipt&&db.archives.find(item=>item.creationReceipt?.keyHash===receipt.keyHash);
      if(existing){
        if(!canSee(u,existing))return send(res,403,{error:'Anda tidak berwenang mengakses arsip ini.'});
        matchesReceipt(existing.creationReceipt,receipt);
        return send(res,200,archivePayload(existing));
      }
      validateArchive(values,u,db,subsections);validateIndexFields(values);
      const archive={id:id('archive'),...values,fileName:'',fileId:'',createdBy:u.id,createdAt:now(),dispositions:[],...(receipt?{creationReceipt:receipt}:{})};
      db.archives.unshift(archive);audit(u.id,'create','archive',archive.id,archive.number);await persist();
      return send(res,201,archivePayload(archive));
    }
    if(pathname.startsWith('/api/archives/')&&pathname.endsWith('/files')&&req.method==='POST'){
      const a=db.archives.find(x=>x.id===pathname.split('/')[3]);if(!a||!canSee(u,a)||!['admin','uploader'].includes(u.role))return send(res,403,{error:'Anda tidak berwenang mengunggah berkas ini.'});
      const b=await body(req),newAttachment=b.kind==='attachment'&&!b.documentId;
      if(b.kind!==undefined&&!['primary','attachment'].includes(b.kind))fail(422,'Jenis dokumen tidak valid.');
      const attachmentTitle=newAttachment?text(b.documentTitle,'Nama lampiran',200,true):null;
      let documentId=newAttachment?'new_attachment':b.documentId||'document_primary';
      if(typeof documentId!=='string')fail(422,'Dokumen tidak valid.');
      const document=newAttachment?null:archiveDocuments(a).find(item=>item.id===documentId);
      if(!document&&documentId!=='document_primary'&&!newAttachment)fail(404,'Dokumen tidak ditemukan.');
      let input=b;
      if(b.sourceVersionId){
        const source=document?.versions.find(version=>version.id===b.sourceVersionId);
        if(!source||!validFileId(source.fileId))fail(404,'Versi sumber tidak ditemukan.');
        let raw;try{raw=await fs.readFile(path.join(FILE_DIR,source.fileId));}catch{fail(404,'Berkas sumber belum tersedia.');}
        let actual;try{actual=await fileTypeFromBuffer(raw);}catch{fail(422,'Isi berkas sumber tidak valid.');}input={fileName:source.fileName,mimeType:actual?.mime,data:raw.toString('base64')};
      }
      const file=await validateUpload(input);
      const reason=b.reason===undefined?null:text(b.reason,'Alasan perubahan',1000,true);
      const fingerprint={name:file.name,mime:file.mime,size:file.raw.length,checksum:file.checksum,...(b.reason!==undefined?{reason}:{}),...(Object.hasOwn(b,'expectedVersionId')?{expectedVersionId:b.expectedVersionId}:{}),...(b.sourceVersionId?{sourceVersionId:b.sourceVersionId}:{}),...(newAttachment?{attachmentTitle}:{})};
      const receipt=requestReceipt(req,u.id,newAttachment?'archive:attachment:'+a.id:'archive:upload:'+a.id+(documentId==='document_primary'?'':':'+documentId),fingerprint);
      if(receipt&&(a.uploadReceipts||[]).some(stored=>matchesReceipt(stored,receipt)))return send(res,200,archivePayload(a));
      if(Object.hasOwn(b,'expectedVersionId')&&b.expectedVersionId!==(document?.currentVersionId||null))fail(409,'Versi aktif sudah berubah. Muat ulang riwayat sebelum mengganti berkas.');
      const fileId=id('file');await stageArchiveFile(FILE_DIR,fileId,file.raw,req.fileTransaction);
      if(newAttachment){documentId=id('document');a.documents=archiveDocuments(a);a.documents.push({id:documentId,kind:'attachment',purpose:'attachment',title:attachmentTitle,currentVersionId:null,versions:[]});}
      appendArchiveVersion(a,documentId,file,{fileId,uploadedBy:u.id,uploadedAt:now(),reason,sourceVersionId:b.sourceVersionId||null});
      if(receipt)(a.uploadReceipts||=[]).push(receipt);audit(u.id,'upload','archive_file',fileId,a.number);await persist();return send(res,201,archivePayload(a));
    }
    if(pathname.startsWith('/api/files/')&&req.method==='GET'){
      const fileId=pathname.split('/')[3];if(!validFileId(fileId))fail(404,'Berkas tidak ditemukan.');
      const archive=db.archives.find(item=>canSee(u,item)&&archiveFileIds(item).includes(fileId));if(!archive)fail(404,'Berkas tidak ditemukan.');
      const version=archiveDocuments(archive).flatMap(document=>document.versions).find(item=>item.fileId===fileId);
      let data;try{data=await fs.readFile(path.join(FILE_DIR,fileId));}catch{fail(404,'Berkas belum diunggah ke penyimpanan sistem.');}
      audit(u.id,'download','archive_file',fileId,archive.number);await persist();
      const naming=url.searchParams.get('filename')||'original';if(!['original','structured'].includes(naming))fail(422,'Pilihan nama unduhan tidak valid.');
      const document=archiveDocuments(archive).find(item=>item.versions.some(item=>item.fileId===fileId));const fileName=naming==='structured'&&version?structuredFileName(archive,document,version):version?.fileName||'arsip';
      return send(res,200,data,version?.mime||'application/pdf',{'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`});
    }
    if(['/api/dispositions','/api/dispositions/export.csv'].includes(pathname)&&req.method==='GET'){
      const result=dispositionWorklist(db.archives.map(archive=>({...archive,dispositions:archive.dispositions.map(dispositionPayload)})),u,url.searchParams);
      if(pathname.endsWith('.csv')){
        // Export every matching task, not merely the current page.
        const ordered=orderedArchives(result.rows);
        const csv=serializeCsv([['Nomor surat','Perihal','Subbagian','Penerima','Status disposisi','Dibuat','Pembaruan terakhir'],...ordered.map(item=>[item.archive.number,item.archive.subject,item.archive.subsection,item.assignedUserName||item.assignedSubsection,item.status,item.createdAt,item.updates.at(-1)?.at||item.createdAt])]);
        audit(u.id,'export','disposition','search',`${result.rows.length} disposisi; CSV`);await persist();return send(res,200,csv,'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="disposisi.csv"'});
      }
      const params=new URLSearchParams(url.searchParams);if(!params.has('page'))params.set('page','1');if(!params.has('page_size'))params.set('page_size','25');
      return send(res,200,{...archivePage(result.rows,params),summary:result.summary,filters:result.filters});
    }
    if(pathname.startsWith('/api/archives/')&&['duplicates','integrity'].includes(pathname.split('/')[4])&&req.method==='GET'){
      const a=db.archives.find(item=>item.id===pathname.split('/')[3]);if(!a||!canSee(u,a))fail(404,'Arsip tidak ditemukan.');
      const candidates=db.archives.filter(item=>canSee(u,item));
      if(pathname.endsWith('/duplicates'))return send(res,200,{items:archiveDuplicates(a,candidates)});
      if(!['admin','uploader'].includes(u.role))fail(403,'Pemeriksaan integritas untuk pengelola/unggah.');
      const integrity=await inspectArchiveIntegrity(a,FILE_DIR);return send(res,200,{...integrity,duplicates:archiveDuplicates(a,candidates,integrity.items.map(item=>item.checksum))});
    }
    if(pathname.startsWith('/api/archives/')&&pathname.endsWith('/quality')&&req.method==='POST'){
      if(u.role!=='admin')fail(403,'Verifikasi hanya tersedia untuk admin.');
      const a=db.archives.find(item=>item.id===pathname.split('/')[3]);if(!a||!canSee(u,a))fail(404,'Arsip tidak ditemukan.');
      const b=await body(req),values={decision:b.decision,note:text(b.note??'','Catatan verifikasi',2000),expectedToken:b.expectedToken,expectedReviewVersion:b.expectedReviewVersion,...(Object.hasOwn(b,'checks')?{checks:b.checks}:{}),...(Object.hasOwn(b,'pageCount')?{pageCount:b.pageCount}:{}),...(Object.hasOwn(b,'duplicatesAccepted')?{duplicatesAccepted:b.duplicatesAccepted}:{})};
      if(!['approved','needs_correction'].includes(values.decision))fail(422,'Keputusan verifikasi tidak valid.');
      if(values.decision==='needs_correction'&&!values.note)fail(422,'Catatan koreksi wajib diisi.');
      const receipt=requestReceipt(req,u.id,'archive:quality:'+a.id,values);
      if(receipt&&(a.qualityReceipts||[]).some(stored=>matchesReceipt(stored,receipt)))return send(res,200,archivePayload(a));
      const quality=archiveQuality(a,fileAvailable);
      if(!Number.isSafeInteger(values.expectedReviewVersion)||values.expectedReviewVersion<0||typeof values.expectedToken!=='string'||!/^[a-f0-9]{64}$/.test(values.expectedToken))fail(422,'Versi verifikasi wajib disertakan.');
      if(values.expectedToken!==quality.token||values.expectedReviewVersion!==quality.reviewVersion)fail(409,'Arsip atau keputusan verifikasi sudah berubah. Muat ulang sebelum memutuskan.');
      if(['metadata_only','missing_file','missing_attachment'].includes(quality.status))fail(422,'Lengkapi berkas utama dan seluruh lampiran terdaftar sebelum verifikasi.');
      validateArchive(a,u,db,subsections);validateIndexFields(a);
      if(values.pageCount!==undefined&&values.pageCount!==null&&(!Number.isSafeInteger(values.pageCount)||values.pageCount<1||values.pageCount>100000))fail(422,'Jumlah halaman harus bilangan positif maksimal 100000.');
      let integrity=null,duplicates=[];
      if(values.decision==='approved'){
        if(!values.checks||['metadata','pages','legibility','orientation'].some(key=>values.checks[key]!==true))fail(422,'Konfirmasi seluruh checklist QC sebelum menyatakan lengkap.');
        integrity=await inspectArchiveIntegrity(a,FILE_DIR);if(!integrity.ok)fail(422,'Pemeriksaan integritas gagal. Periksa/koreksi berkas sebelum approval.');
        duplicates=archiveDuplicates(a,db.archives.filter(item=>canSee(u,item)),integrity.items.map(item=>item.checksum));
        if(duplicates.length&&(values.duplicatesAccepted!==true||!values.note))fail(422,'Potensi duplikat perlu ditinjau: muat ulang, konfirmasi duplikat sah dan isi alasan.');
      }
      (a.qualityReviews||=[]).push({id:id('review'),decision:values.decision,note:values.note,token:quality.token,metadataVersion:a.metadataVersion||0,fileVersions:archiveDocuments(a).map(document=>({documentId:document.id,fileId:document.currentVersionId})),checks:values.checks&&typeof values.checks==='object'?Object.fromEntries(['metadata','pages','legibility','orientation'].map(key=>[key,values.checks[key]===true])):null,pageCount:values.pageCount??null,integrity,duplicates,duplicatesAccepted:duplicates.length>0&&values.duplicatesAccepted===true,by:u.id,at:now()});
      if(receipt)(a.qualityReceipts||=[]).push(receipt);audit(u.id,'review_quality','archive',a.id,values.decision);await persist();return send(res,201,archivePayload(a));
    }
    if(pathname.startsWith('/api/archives/')&&pathname.endsWith('/disposition-recipients')&&req.method==='GET'){
      if(!isWide(u))fail(403,'Khusus admin/pimpinan.');
      const archive=db.archives.find(item=>item.id===pathname.split('/')[3]);if(!archive||!canSee(u,archive))fail(404,'Arsip tidak ditemukan.');
      return send(res,200,{items:dispositionRecipients(db.users,archive)});
    }
    if(pathname.startsWith('/api/archives/')&&pathname.endsWith('/dispositions')&&req.method==='POST'){
      if(!isWide(u))fail(403,'Hanya pimpinan atau admin yang dapat membuat disposisi.');
      const a=db.archives.find(item=>item.id===pathname.split('/')[3]);if(!a||!canSee(u,a))fail(404,'Arsip tidak ditemukan.');
      const b=await body(req),values={assignedSubsection:text(b.assignedSubsection,'Subbagian penerima',40,true),assignedUserId:text(b.assignedUserId??'','Penerima',200),instruction:text(b.instruction,'Instruksi',4000,true)};
      const receipt=requestReceipt(req,u.id,'disposition:create:'+a.id,values);
      if(receipt&&(a.dispositionReceipts||[]).some(stored=>matchesReceipt(stored,receipt)))return send(res,200,archivePayload(a));
      if(a.type!=='incoming')fail(422,'Disposisi hanya untuk surat masuk.');
      if(!sameSubsection(values.assignedSubsection,a.subsection))fail(422,'Tujuan disposisi harus sesuai subbagian arsip.');
      if(values.assignedUserId&&!dispositionRecipients(db.users,a).some(user=>user.id===values.assignedUserId))fail(422,'Penerima tidak valid.');
      const d={id:id('disp'),...values,status:'Belum ditindaklanjuti',version:0,createdBy:u.id,createdAt:now(),updates:[]};
      a.dispositions.push(d);if(receipt)(a.dispositionReceipts||=[]).push(receipt);
      audit(u.id,'create_disposition','archive',a.id,'Disposisi dibuat');await persist();return send(res,201,archivePayload(a));
    }
    if(pathname.startsWith('/api/dispositions/')&&pathname.endsWith('/status')&&req.method==='PATCH'){
      const did=pathname.split('/')[3],a=db.archives.find(item=>item.dispositions.some(d=>d.id===did)),d=a?.dispositions.find(item=>item.id===did);
      if(!a||!d||!canSee(u,a)||!canUpdateDisposition(u,d))fail(403,'Anda tidak berwenang memperbarui disposisi ini.');
      const b=await body(req),receipt=requestReceipt(req,u.id,'disposition:update:'+did,{status:b.status,note:b.note===undefined?'':b.note,expectedVersion:b.expectedVersion});
      if(receipt&&(d.statusReceipts||[]).some(stored=>matchesReceipt(stored,receipt)))return send(res,200,archivePayload(a));
      if(!Number.isSafeInteger(b.expectedVersion)||b.expectedVersion<0)fail(422,'Versi disposisi wajib disertakan. Muat ulang kronologi.');
      const currentVersion=d.version??(d.updates||[]).length;
      if(b.expectedVersion!==currentVersion)fail(409,'Disposisi sudah berubah. Muat ulang kronologi sebelum menyimpan; catatan Anda tetap tersedia.');
      const update=dispositionUpdate(d,b,u,now());
      if(update){d.version=currentVersion+1;d.status=update.status;(d.updates||=[]).push({...update,id:id('event'),version:d.version});audit(u.id,'update_disposition','disposition',did,b.status);}
      if(receipt)(d.statusReceipts||=[]).push(receipt);
      if(update||receipt)await persist();return send(res,200,archivePayload(a));
    }
    if(pathname==='/api/notifications'&&req.method==='GET')return send(res,200,notificationPage(db,u,url.searchParams));
    if((pathname==='/api/notifications/read-all'&&req.method==='POST')||(pathname.startsWith('/api/notifications/')&&pathname.endsWith('/read')&&req.method==='PATCH')){
      const all=pathname.endsWith('/read-all'),b=await body(req);if(!all&&typeof b.read!=='boolean')fail(422,'Status baca harus true atau false.');
      const changed=markNotifications(db,u,all?null:[pathname.split('/')[3]],all?true:b.read,now());
      if(changed){audit(u.id,'read_notification','disposition',all?'all':pathname.split('/')[3],`${changed} notifikasi`);await persist();}
      return send(res,200,notificationPage(db,u,url.searchParams));
    }
    if(['/api/export.csv','/api/export.xlsx'].includes(pathname)&&req.method==='GET'){
      const rows=visibleArchives(u,url),xlsx=pathname.endsWith('.xlsx');
      const data=xlsx?await archiveXlsx(rows):archiveCsv(rows);
      audit(u.id,'export','archive','search',`${rows.length} data; ${xlsx?'XLSX':'CSV'}`);await persist();
      return send(res,200,data,xlsx?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv; charset=utf-8',{'Content-Disposition':`attachment; filename="siaga-arsip-export.${xlsx?'xlsx':'csv'}"`});
    }
    if (pathname === '/api/admin/audit' && req.method === 'GET') { if (!isWide(u)) return send(res, 403, { error: 'Khusus admin/pimpinan.' }); return send(res, 200, { items: db.audit.slice(0, 100).map(x => ({ ...x, actorName: db.users.find(y => y.id === x.actorId)?.name || 'Publik' })) }); }
  }
  if(pathname.startsWith('/assets/')){const target=path.resolve(PUBLIC,pathname.slice(8));if(!target.startsWith(PUBLIC+path.sep))return send(res,404,{error:'Not found'});return staticFile(target,res);}
  if (pathname === '/' || pathname === '/app') return staticFile(path.join(PUBLIC, 'index.html'), res);
  return send(res, 404, { error: 'Not found' });
}
async function staticFile(file, res) { try { const data = await fs.readFile(file); const ext = path.extname(file); const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf' }[ext] || 'application/octet-stream'; send(res, 200, data, type, { 'Cache-Control': 'no-cache' }); } catch { send(res, 404, 'Not found', 'text/plain'); } }
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-SIAGA-Revision',revision);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; font-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");if(SECURE_COOKIE)res.setHeader('Strict-Transport-Security','max-age=31536000');
  try{if(req.url.startsWith('/api/')){if(!['GET','HEAD','OPTIONS'].includes(req.method)){if(req.headers['x-siaga-request']!=='1')fail(403,'Header permintaan tidak valid.');await body(req);}res._defer=true;await storage.transaction(async(data,dirty,_replace,transaction)=>{db=data;markDirty=dirty;req.fileTransaction=transaction;sessions=new Map((db.sessions||[]).filter(s=>s.expiresAt>Date.now()).map(s=>[s.id,s]));await route(req,res);});res._defer=false;const reply=res._reply;if(reply){res.writeHead(reply.status,reply.headers);res.end(reply.body);}}else await route(req,res);}
  catch(error){res._defer=false;if(!res.headersSent)send(res,error.status||500,{error:error.status?error.message:'Terjadi kesalahan server.'});else res.end();if(!error.status)console.error('Request gagal:',error.code||error.name);}
});
server.requestTimeout=30000;server.headersTimeout=10000;
server.listen(PORT,process.env.HOST||(DEMO_MODE?'0.0.0.0':'127.0.0.1'),()=>console.log(`SIAGA ARSIP berjalan di http://localhost:${PORT} (${DEMO_MODE?'demo':'production'})`));
async function shutdown(){server.close(async()=>{await storage.close();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
