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
async function request(route, options = {}) { const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }; if (jar.sid) headers.Cookie = `sid=${jar.sid}`; const response = await fetch(base + route, { ...options, headers }); const setCookie = response.headers.get('set-cookie'); if (setCookie) jar.sid = setCookie.split(';')[0].split('=')[1]; const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; } if (!response.ok) throw new Error(`${route}: ${response.status} ${JSON.stringify(data)}`); return data; }
function assert(value, message) { if (!value) throw new Error(message); console.log(`✓ ${message}`); }
try {
  await wait(500);
  const publicStats = await request('/api/public/stats'); assert(publicStats.total === 20, 'statistik publik berisi 20 arsip dummy');
  await request('/api/login', { method: 'POST', body: JSON.stringify({ username: 'pegawai.hukum', password: 'pegawai123' }) });
  const scoped = await request('/api/archives'); assert(scoped.items.length === 5 && scoped.items.every(x => x.subsection === 'Hukum'), 'pegawai hanya melihat arsip subbagian Hukum');
  const adminJar = {};
  const admin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'pimpinan', password: 'pimpinan123' }) }); adminJar.sid = admin.headers.get('set-cookie').split(';')[0].split('=')[1];
  const incoming = await fetch(base + '/api/archives', { headers: { Cookie: `sid=${adminJar.sid}` } }).then(r => r.json());
  const disp = await fetch(base + `/api/archives/${incoming.items[0].id}/dispositions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `sid=${adminJar.sid}` }, body: JSON.stringify({ assignedSubsection: 'Hukum', instruction: 'UAT: tindak lanjuti.' }) }).then(r => r.json());
  assert(disp.dispositions.length === 1, 'pimpinan dapat membuat disposisi');
  await request('/api/logout', { method: 'POST' });
  await request('/api/login', { method: 'POST', body: JSON.stringify({ username: 'pegawai.hukum', password: 'pegawai123' }) });
  const dispositions = await request('/api/archives'); const d = dispositions.items.find(x => x.dispositions.length)?.dispositions[0]; assert(Boolean(d), 'pegawai dapat melihat disposisi yang ditujukan ke subbagian');
  const status = await request(`/api/dispositions/${d.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Selesai' }) }); assert(status.dispositions[0].status === 'Selesai', 'penerima dapat menyelesaikan disposisi');
  const csv = await request('/api/export.csv'); assert(String(csv).includes('Jenis,Nomor'), 'ekspor CSV tersedia');
  const systemAdmin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) }); const systemAdminSid = systemAdmin.headers.get('set-cookie').split(';')[0].split('=')[1];
  const createdUser = await fetch(base + '/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `sid=${systemAdminSid}` }, body: JSON.stringify({ username: 'uat.user', name: 'UAT User', password: 'uatpass123', role: 'employee', subsection: 'Administrasi' }) }).then(r => r.json()); assert(createdUser.username === 'uat.user', 'admin dapat membuat akun');
  const disabledUser = await fetch(base + `/api/admin/users/${createdUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: `sid=${systemAdminSid}` }, body: JSON.stringify({ active: false }) }).then(r => r.json()); assert(disabledUser.active === false, 'admin dapat menonaktifkan akun');
  const disabledLogin = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'uat.user', password: 'uatpass123' }) }); assert(disabledLogin.status === 422, 'akun nonaktif tidak dapat login');
  console.log('UAT SIAGA ARSIP lulus.');
} finally { child.kill('SIGTERM'); await fs.rm(dataDir, { recursive: true, force: true }); }
