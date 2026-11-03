import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const FILE_DIR = path.join(DATA_DIR, 'files');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const PORT = Number(process.env.PORT || 3000);
const sessions = new Map();

const subsections = ['Administrasi', 'Hukum', 'Pengawasan', 'PPPS'];
const roles = {
  admin: 'admin', leader: 'leader', recorder: 'recorder', uploader: 'uploader', employee: 'employee'
};

function id(prefix = 'id') { return `${prefix}_${crypto.randomUUID()}`; }
function now() { return new Date().toISOString(); }
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

async function seed() {
  await fs.mkdir(FILE_DIR, { recursive: true });
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); } catch {}
  const users = [
    { id: 'u_admin', username: 'admin', name: 'Admin Pengelola Arsip', passwordHash: hash('admin123'), role: roles.admin, subsection: null, email: 'admin@bawaslu.local', active: true },
    { id: 'u_leader', username: 'pimpinan', name: 'Pimpinan Bawaslu Aceh Timur', passwordHash: hash('pimpinan123'), role: roles.leader, subsection: null, email: 'pimpinan@bawaslu.local', active: true },
    { id: 'u_adm', username: 'pegawai.administrasi', name: 'Pegawai Administrasi', passwordHash: hash('pegawai123'), role: roles.employee, subsection: 'Administrasi', email: 'administrasi@bawaslu.local', active: true },
    { id: 'u_huk', username: 'pegawai.hukum', name: 'Pegawai Hukum', passwordHash: hash('pegawai123'), role: roles.employee, subsection: 'Hukum', email: 'hukum@bawaslu.local', active: true },
    { id: 'u_pws', username: 'pegawai.pengawasan', name: 'Pegawai Pengawasan', passwordHash: hash('pegawai123'), role: roles.employee, subsection: 'Pengawasan', email: 'pengawasan@bawaslu.local', active: true },
    { id: 'u_ppps', username: 'pegawai.ppps', name: 'Pegawai PPPS', passwordHash: hash('pegawai123'), role: roles.employee, subsection: 'PPPS', email: 'ppps@bawaslu.local', active: true }
  ];
  const archives = [];
  const classifications = ['Administrasi umum', 'Kepegawaian', 'Koordinasi dan rapat', 'Pengawasan Pemilu', 'Produk hukum'];
  for (let i = 1; i <= 10; i++) archives.push({ id: `in_${i}`, type: 'incoming', number: `IN/AT/${String(i).padStart(3, '0')}/2026`, letterDate: `2026-10-${String((i % 20) + 1).padStart(2, '0')}`, receivedDate: `2026-10-${String((i % 20) + 2).padStart(2, '0')}`, origin: ['Bawaslu Provinsi Aceh', 'KPU Aceh Timur', 'Sekretariat Daerah', 'Panwaslu Kecamatan'][i % 4], destination: ['Pimpinan', 'Subbagian Administrasi', 'Subbagian Hukum', 'Subbagian Pengawasan'][i % 4], subject: ['Undangan koordinasi tahapan pemilu', 'Penyampaian laporan administrasi', 'Permintaan data pengawasan', 'Rapat persiapan kegiatan'][i % 4], classification: classifications[i % classifications.length], subsection: subsections[i % 4], fileName: `surat-masuk-${i}.pdf`, fileId: `file_in_${i}`, createdBy: 'u_admin', createdAt: now(), status: 'registered', dispositions: [] });
  for (let i = 1; i <= 10; i++) archives.push({ id: `out_${i}`, type: 'outgoing', number: `OUT/AT/${String(i).padStart(3, '0')}/2026`, letterDate: `2026-09-${String((i % 20) + 1).padStart(2, '0')}`, destination: ['Bawaslu Provinsi Aceh', 'KPU Aceh Timur', 'Camat setempat', 'Panwaslu Kecamatan'][i % 4], subject: ['Penyampaian surat tugas', 'Undangan rapat koordinasi', 'Permohonan data pendukung', 'Pemberitahuan kegiatan'][i % 4], signatory: 'Ketua Bawaslu Kabupaten Aceh Timur', classification: classifications[(i + 2) % classifications.length], subsection: subsections[(i + 1) % 4], fileName: `surat-keluar-${i}.pdf`, fileId: `file_out_${i}`, createdBy: 'u_admin', createdAt: now(), dispositions: [] });
  const audit = [{ id: id('audit'), actorId: 'u_admin', action: 'seed_demo', entity: 'system', entityId: 'system', at: now(), detail: '20 arsip dummy dibuat untuk demo' }];
  const data = { users, archives, classifications, categories: ['Surat Masuk', 'Surat Keluar'], audit, notifications: [] };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

let db = await seed();
async function persist() { await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2)); }
function safeUser(user) { const { passwordHash, ...rest } = user; return rest; }
function audit(actorId, action, entity, entityId, detail = '') { db.audit.unshift({ id: id('audit'), actorId, action, entity, entityId, at: now(), detail }); }
function cookie(name, value, maxAge = 60 * 60 * 8) { return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }
function parseCookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => { const i = x.indexOf('='); return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))]; })); }
function getUser(req) { const sid = parseCookies(req).sid; const uid = sessions.get(sid); return uid ? db.users.find(u => u.id === uid && u.active) : null; }
function isWide(user) { return user && (user.role === 'admin' || user.role === 'leader'); }
function canSee(user, archive) { return isWide(user) || (user && user.subsection === archive.subsection); }
function send(res, status, body, type = 'application/json', extra = {}) { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra }); res.end(type === 'application/json' ? JSON.stringify(body) : body); }
async function body(req) { let raw = ''; for await (const chunk of req) raw += chunk; try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function requireAuth(req, res) { const user = getUser(req); if (!user) { send(res, 401, { error: 'Silakan login terlebih dahulu.' }); return null; } return user; }
function visibleArchives(user, url) {
  const q = (url.searchParams.get('q') || '').toLowerCase(); const type = url.searchParams.get('type'); const year = url.searchParams.get('year'); const status = url.searchParams.get('status');
  return db.archives.filter(a => canSee(user, a) && (!type || a.type === type) && (!year || a.letterDate.startsWith(year)) && (!status || a.dispositions.some(d => d.status === status)) && (!q || [a.number, a.origin, a.destination, a.subject, a.classification, a.subsection].some(v => String(v || '').toLowerCase().includes(q))));
}
function archivePayload(a) { return { ...a, fileAvailable: Boolean(a.fileName), dispositions: a.dispositions.map(d => ({ ...d, assignedUserName: db.users.find(u => u.id === d.assignedUserId)?.name || d.assignedSubsection })) }; }

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); const pathname = url.pathname;
  if (pathname === '/api/login' && req.method === 'POST') { const b = await body(req); const u = db.users.find(x => x.username === b.username && x.passwordHash === hash(b.password || '') && x.active); if (!u) return send(res, 422, { error: 'Username atau kata sandi salah.' }); const sid = crypto.randomBytes(24).toString('hex'); sessions.set(sid, u.id); audit(u.id, 'login', 'user', u.id); await persist(); return send(res, 200, { user: safeUser(u) }, 'application/json', { 'Set-Cookie': cookie('sid', sid) }); }
  if (pathname === '/api/logout' && req.method === 'POST') { const u = getUser(req); if (u) audit(u.id, 'logout', 'user', u.id); sessions.delete(parseCookies(req).sid); await persist(); return send(res, 200, { ok: true }, 'application/json', { 'Set-Cookie': cookie('sid', '', 0) }); }
  if (pathname === '/api/me' && req.method === 'GET') { const u = getUser(req); return u ? send(res, 200, { user: safeUser(u) }) : send(res, 401, { error: 'Unauthorized' }); }
  if (pathname === '/api/public/stats' && req.method === 'GET') { const year = url.searchParams.get('year') || ''; const list = db.archives.filter(a => !year || a.letterDate.startsWith(year)); return send(res, 200, { year: year || 'all', incoming: list.filter(a => a.type === 'incoming').length, outgoing: list.filter(a => a.type === 'outgoing').length, total: list.length }); }
  if (pathname.startsWith('/api/')) {
    const u = requireAuth(req, res); if (!u) return;
    if (pathname === '/api/dashboard' && req.method === 'GET') { const list = visibleArchives(u, url); const open = list.flatMap(a => a.dispositions).filter(d => d.status !== 'Selesai').length; return send(res, 200, { incoming: list.filter(a => a.type === 'incoming').length, outgoing: list.filter(a => a.type === 'outgoing').length, pending: open, total: list.length, users: isWide(u) ? db.users.length : undefined }); }
    if (pathname === '/api/archives' && req.method === 'GET') return send(res, 200, { items: visibleArchives(u, url).map(archivePayload), classifications: db.classifications, subsections });
    if (pathname === '/api/users' && req.method === 'GET') { if (!isWide(u)) return send(res, 403, { error: 'Khusus admin/pimpinan.' }); return send(res, 200, { items: db.users.filter(x => x.active).map(safeUser) }); }
    if (pathname === '/api/admin/classifications' && req.method === 'POST') { if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' }); const b = await body(req); const value = String(b.label || '').trim(); if (!value) return send(res, 422, { error: 'Nama klasifikasi wajib diisi.' }); if (!db.classifications.includes(value)) db.classifications.push(value); audit(u.id, 'create_classification', 'classification', value); await persist(); return send(res, 201, { classifications: db.classifications }); }
    if (pathname === '/api/admin/categories' && req.method === 'POST') { if (u.role !== 'admin') return send(res, 403, { error: 'Khusus admin.' }); const b = await body(req); const value = String(b.label || '').trim(); if (!value) return send(res, 422, { error: 'Nama kategori wajib diisi.' }); if (!db.categories.includes(value)) db.categories.push(value); audit(u.id, 'create_category', 'category', value); await persist(); return send(res, 201, { categories: db.categories }); }
    if (pathname === '/api/archives' && req.method === 'POST') { if (!['admin', 'recorder'].includes(u.role)) return send(res, 403, { error: 'Peran ini tidak dapat mencatat arsip.' }); const b = await body(req); if (!b.type || !['incoming', 'outgoing'].includes(b.type) || !b.number || !b.subject || !b.classification || !b.subsection) return send(res, 422, { error: 'Lengkapi tipe, nomor, perihal, klasifikasi, dan subbagian.' }); const a = { id: id('archive'), type: b.type, number: b.number, letterDate: b.letterDate || now().slice(0, 10), receivedDate: b.type === 'incoming' ? (b.receivedDate || now().slice(0, 10)) : undefined, origin: b.origin || '', destination: b.destination || '', subject: b.subject, signatory: b.signatory || '', classification: b.classification, subsection: b.subsection, fileName: b.fileName || '', fileId: b.fileName ? id('file') : '', createdBy: u.id, createdAt: now(), dispositions: [] }; db.archives.unshift(a); audit(u.id, 'create', 'archive', a.id, a.number); await persist(); return send(res, 201, archivePayload(a)); }
    if (pathname.startsWith('/api/archives/') && pathname.endsWith('/files') && req.method === 'POST') { const aid = pathname.split('/')[3]; const a = db.archives.find(x => x.id === aid); if (!a || !canSee(u, a) || !['admin', 'uploader'].includes(u.role)) return send(res, 403, { error: 'Anda tidak berwenang mengunggah berkas ini.' }); const b = await body(req); const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']; if (!b.fileName || !b.data || !allowed.includes(b.mimeType)) return send(res, 422, { error: 'Berkas harus PDF, JPG/PNG, XLSX, atau DOCX.' }); const raw = Buffer.from(String(b.data).replace(/^data:[^;]+;base64,/, ''), 'base64'); if (raw.length > 15 * 1024 * 1024) return send(res, 422, { error: 'Ukuran berkas maksimal 15 MB.' }); const fileId = id('file'); const stored = path.join(FILE_DIR, fileId); await fs.writeFile(stored, raw); a.fileId = fileId; a.fileName = b.fileName; a.fileMime = b.mimeType; a.fileSize = raw.length; audit(u.id, 'upload', 'archive_file', fileId, a.number); await persist(); return send(res, 201, archivePayload(a)); }
    if (pathname.startsWith('/api/files/') && req.method === 'GET') { const fileId = pathname.split('/')[3]; const a = db.archives.find(x => x.fileId === fileId); if (!a || !canSee(u, a)) return send(res, 404, { error: 'Berkas tidak ditemukan.' }); const filePath = path.join(FILE_DIR, fileId); try { const data = await fs.readFile(filePath); audit(u.id, 'download', 'archive_file', fileId, a.number); await persist(); return send(res, 200, data, a.fileMime || 'application/pdf', { 'Content-Disposition': `attachment; filename="${String(a.fileName || 'arsip').replaceAll('"', '')}"` }); } catch { return send(res, 404, { error: 'Berkas belum diunggah ke penyimpanan sistem.' }); } }
    if (pathname.startsWith('/api/archives/') && pathname.endsWith('/dispositions') && req.method === 'POST') { if (!isWide(u)) return send(res, 403, { error: 'Hanya pimpinan atau admin yang dapat membuat disposisi.' }); const aid = pathname.split('/')[3]; const a = db.archives.find(x => x.id === aid); if (!a || !canSee(u, a)) return send(res, 404, { error: 'Arsip tidak ditemukan.' }); const b = await body(req); const d = { id: id('disp'), assignedUserId: b.assignedUserId || '', assignedSubsection: b.assignedSubsection || '', instruction: b.instruction || '', status: 'Belum ditindaklanjuti', createdBy: u.id, createdAt: now(), updates: [] }; a.dispositions.push(d); db.notifications.push({ id: id('notif'), userId: d.assignedUserId, text: `Disposisi baru untuk ${a.number}`, read: false, createdAt: now() }); audit(u.id, 'create_disposition', 'archive', a.id, d.instruction); await persist(); return send(res, 201, archivePayload(a)); }
    if (pathname.startsWith('/api/dispositions/') && pathname.endsWith('/status') && req.method === 'PATCH') { const did = pathname.split('/')[3]; const a = db.archives.find(x => x.dispositions.some(d => d.id === did)); const d = a?.dispositions.find(x => x.id === did); if (!a || !d || (!isWide(u) && d.assignedUserId !== u.id && d.assignedSubsection !== u.subsection)) return send(res, 403, { error: 'Anda tidak berwenang memperbarui disposisi ini.' }); const b = await body(req); if (!['Belum ditindaklanjuti', 'Sedang diproses', 'Selesai'].includes(b.status)) return send(res, 422, { error: 'Status tidak valid.' }); d.status = b.status; d.updates.push({ status: b.status, note: b.note || '', by: u.id, at: now() }); audit(u.id, 'update_disposition', 'disposition', did, b.status); await persist(); return send(res, 200, archivePayload(a)); }
    if (pathname === '/api/notifications' && req.method === 'GET') return send(res, 200, { items: db.notifications.filter(n => n.userId === u.id).slice(0, 20) });
    if (pathname === '/api/export.csv' && req.method === 'GET') { const rows = visibleArchives(u, url); const csv = ['Jenis,Nomor,Tanggal,Asal,Tujuan,Perihal,Klasifikasi,Subbagian', ...rows.map(a => [a.type === 'incoming' ? 'Masuk' : 'Keluar', a.number, a.letterDate, a.origin, a.destination, a.subject, a.classification, a.subsection].map(v => `"${String(v || '').replaceAll('"', '""')}"`).join(','))].join('\n'); audit(u.id, 'export', 'archive', 'search', `${rows.length} data`); await persist(); return send(res, 200, csv, 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="siaga-arsip-export.csv"' }); }
    if (pathname === '/api/admin/audit' && req.method === 'GET') { if (!isWide(u)) return send(res, 403, { error: 'Khusus admin/pimpinan.' }); return send(res, 200, { items: db.audit.slice(0, 100).map(x => ({ ...x, actorName: db.users.find(y => y.id === x.actorId)?.name || 'Publik' })) }); }
  }
  if (pathname.startsWith('/assets/')) return staticFile(path.join(PUBLIC, pathname.slice(8)), res);
  if (pathname === '/' || pathname === '/app') return staticFile(path.join(PUBLIC, 'index.html'), res);
  return send(res, 404, { error: 'Not found' });
}
async function staticFile(file, res) { try { const data = await fs.readFile(file); const ext = path.extname(file); const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' }[ext] || 'application/octet-stream'; send(res, 200, data, type, { 'Cache-Control': 'no-cache' }); } catch { send(res, 404, 'Not found', 'text/plain'); } }
const server = http.createServer((req, res) => route(req, res).catch(err => { console.error(err); send(res, 500, { error: 'Terjadi kesalahan server.' }); }));
server.listen(PORT, () => console.log(`SIAGA ARSIP berjalan di http://localhost:${PORT}`));
