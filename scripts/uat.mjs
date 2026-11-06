import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'siaga-uat-'));
const port = 3100;
const child = spawn(process.execPath, ['app.mjs'], { cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: dataDir }, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
const jar = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
async function request(route, options = {}) { const headers = { 'X-SIAGA-Request':'1', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }; if (jar.sid) headers.Cookie = `sid=${jar.sid}`; const response = await fetch(base + route, { ...options, headers }); const setCookie = response.headers.get('set-cookie'); if (setCookie) jar.sid = setCookie.split(';')[0].split('=')[1]; const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; } if (!response.ok) throw new Error(`${route}: ${response.status} ${JSON.stringify(data)}`); return data; }
function assert(value, message) { if (!value) throw new Error(message); console.log(`✓ ${message}`); }
try {
  for(let attempt=0;attempt<100;attempt++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await wait(50);}
  const publicStats = await request('/api/public/stats'); assert(publicStats.total === 20, 'statistik publik berisi 20 arsip dummy'); assert(Array.isArray(publicStats.bySubsection) && publicStats.bySubsection.length === 4 && publicStats.bySubsection.reduce((sum, item) => sum + item.count, 0) === publicStats.total, 'statistik publik merangkum arsip berdasarkan empat unit kerja');
  await request('/api/login', { method: 'POST', body: JSON.stringify({ username: 'pegawai.hukum', password: 'pegawai123' }) });
  const scoped = await request('/api/archives'); assert(scoped.items.length === 5 && scoped.items.every(x => x.subsection === 'Hukum'), 'pegawai hanya melihat arsip subbagian Hukum');
  const adminJar = {};
  const admin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1' }, body: JSON.stringify({ username: 'pimpinan', password: 'pimpinan123' }) }); adminJar.sid = admin.headers.get('set-cookie').split(';')[0].split('=')[1];
  const incoming = await fetch(base + '/api/archives', { headers: { Cookie: `sid=${adminJar.sid}` } }).then(r => r.json());
  const disp = await fetch(base + `/api/archives/${incoming.items[0].id}/dispositions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${adminJar.sid}` }, body: JSON.stringify({ assignedSubsection: 'Hukum', instruction: 'UAT: tindak lanjuti.' }) }).then(r => r.json());
  assert(disp.dispositions.length === 1, 'pimpinan dapat membuat disposisi');
  await request('/api/logout', { method: 'POST' });
  await request('/api/login', { method: 'POST', body: JSON.stringify({ username: 'pegawai.hukum', password: 'pegawai123' }) });
  const dispositions = await request('/api/archives'); const d = dispositions.items.find(x => x.dispositions.length)?.dispositions[0]; assert(Boolean(d), 'pegawai dapat melihat disposisi yang ditujukan ke subbagian');
  const inbox = await request('/api/notifications'); assert(inbox.items.some(n => n.id === d.id && n.status === 'Belum ditindaklanjuti'), 'notifikasi disposisi diterima oleh subbagian tujuan');
  const otherLogin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1' }, body: JSON.stringify({ username: 'pegawai.administrasi', password: 'pegawai123' }) });
  const otherCookie = otherLogin.headers.get('set-cookie').split(';')[0];
  const otherInbox = await fetch(base + '/api/notifications', { headers: { Cookie: otherCookie } }).then(r => r.json()); assert(!otherInbox.items.some(n => n.id === d.id), 'notifikasi tidak bocor ke subbagian lain');
  const status = await request(`/api/dispositions/${d.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Selesai',expectedVersion:d.version }) }); assert(status.dispositions[0].status === 'Selesai', 'penerima dapat menyelesaikan disposisi');
  const csv = await request('/api/export.csv'); assert(String(csv).replace(/^\uFEFF/,'').startsWith('"Jenis","Kategori","Nomor"')&&String(csv).includes('"Status disposisi"'), 'ekspor CSV tersedia dengan kolom status disposisi');
  const systemAdmin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) }); const systemAdminSid = systemAdmin.headers.get('set-cookie').split(';')[0].split('=')[1];
  const createdUser = await fetch(base + '/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${systemAdminSid}` }, body: JSON.stringify({ username: 'uat.user', name: 'UAT User', password: 'uatpass123', role: 'employee', subsection: 'Administrasi' }) }).then(r => r.json()); assert(createdUser.username === 'uat.user', 'admin dapat membuat akun');
  const recorder = await fetch(base + '/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${systemAdminSid}` }, body: JSON.stringify({ username: 'uat.recorder', name: 'UAT Pencatat', password: 'uatpass123', role: 'recorder', subsection: 'Administrasi' }) }).then(r => r.json());
  const uploader = await fetch(base + '/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${systemAdminSid}` }, body: JSON.stringify({ username: 'uat.uploader', name: 'UAT Pengunggah', password: 'uatpass123', role: 'uploader', subsection: 'Administrasi' }) }).then(r => r.json());
  const recorderLogin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1' }, body: JSON.stringify({ username: 'uat.recorder', password: 'uatpass123' }) }); const recorderSid = recorderLogin.headers.get('set-cookie').split(';')[0].split('=')[1];
  const recorded = await fetch(base + '/api/archives', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${recorderSid}` }, body: JSON.stringify({ type: 'incoming', number: 'UAT/REC/001/2026', letterDate: '2026-11-04', receivedDate: '2026-11-04', origin: 'UAT', destination: 'Administrasi', subject: 'UAT pemisahan tugas', classification: 'Administrasi umum', subsection: 'Administrasi' }) }).then(r => r.json()); assert(recorded.number === 'UAT/REC/001/2026', 'pencatat dapat membuat metadata tanpa berkas');
  const uploaderLogin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1' }, body: JSON.stringify({ username: 'uat.uploader', password: 'uatpass123' }) }); const uploaderSid = uploaderLogin.headers.get('set-cookie').split(';')[0].split('=')[1];
  const uploaded = await fetch(base + `/api/archives/${recorded.id}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${uploaderSid}` }, body: JSON.stringify({ fileName: 'uat.pdf', mimeType: 'application/pdf', data: 'data:application/pdf;base64,'+Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF').toString('base64') }) }).then(r => r.json()); assert(uploaded.fileAvailable === true, 'pengunggah dapat menambahkan berkas privat');
  const downloaded = await fetch(base + `/api/files/${uploaded.fileId}`, { headers: { Cookie: `sid=${uploaderSid}` } }); assert(downloaded.status === 200 && (await downloaded.arrayBuffer()).byteLength > 4, 'pengguna berwenang dapat mengunduh berkas');
  const deniedDownload = await fetch(base + `/api/files/${uploaded.fileId}`, { headers: { Cookie: `sid=${jar.sid}` } }); assert(deniedDownload.status === 404, 'pengguna subbagian lain tidak dapat mengunduh berkas');
  const disabledUser = await fetch(base + `/api/admin/users/${createdUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1', Cookie: `sid=${systemAdminSid}` }, body: JSON.stringify({ active: false }) }).then(r => r.json()); assert(disabledUser.active === false, 'admin dapat menonaktifkan akun');
  const disabledLogin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SIAGA-Request':'1' }, body: JSON.stringify({ username: 'uat.user', password: 'uatpass123' }) }); assert(disabledLogin.status === 422, 'akun nonaktif tidak dapat login');
  console.log('UAT SIAGA ARSIP lulus.');
} finally { child.kill('SIGTERM'); await fs.rm(dataDir, { recursive: true, force: true }); }
