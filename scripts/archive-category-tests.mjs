import assert from 'node:assert/strict';
import { withApiFixtures } from '../tests/helpers/api-fixture.mjs';
import { defaultArchiveCategory, isArchiveCategory, administrativeArchiveCategories } from '../lib/archive-taxonomy.mjs';
import { validateArchive } from '../lib/security.mjs';

let checks = 0;
const pass = message => { checks++; console.log('✓ ' + message); };

assert.equal(defaultArchiveCategory('incoming'), 'Surat Masuk');
assert.equal(defaultArchiveCategory('outgoing'), 'Surat Keluar');
assert.equal(defaultArchiveCategory('administrative'), 'Arsip Administrasi Umum');
assert.ok(isArchiveCategory('Keuangan'));
assert.equal(isArchiveCategory('Kategori fiktif'), false);
validateArchive({ type: 'administrative', category: 'Keuangan', number: 'ADM/001', letterDate: '2026-11-06', subject: 'Dokumen dummy', classification: 'Administrasi umum', subsection: 'Administrasi' }, { role: 'admin' }, { classifications: ['Administrasi umum'] }, ['Administrasi']);
assert.throws(() => validateArchive({ type: 'administrative', category: 'Kategori fiktif', number: 'ADM/002', letterDate: '2026-11-06', subject: 'Dokumen dummy', classification: 'Administrasi umum', subsection: 'Administrasi' }, { role: 'admin' }, { classifications: ['Administrasi umum'] }, ['Administrasi']), error => error.status === 422);
pass('registri kategori RA dan validasi arsip administrasi umum menolak kategori di luar registri');

await withApiFixtures('categories', async ({ request }) => {
  const login = async (username, password) => (await request('/api/login', null, 'POST', { username, password })).cookie;
  const admin = await login('admin', 'admin123');
  const created = await request('/api/archives', admin, 'POST', {
    type: 'administrative', category: 'Keuangan', number: 'ADM/CATEGORY/001', letterDate: '2026-11-06',
    subject: 'Rencana anggaran dummy', classification: 'Administrasi umum', subsection: 'Administrasi'
  }, 'category-create-001');
  assert.equal(created.status, 201);
  assert.equal(created.body.type, 'administrative');
  assert.equal(created.body.category, 'Keuangan');
  assert.equal(created.body.origin, '');
  assert.equal(created.body.destination, '');
  pass('API membuat arsip administrasi dengan kategori dan metadata surat masuk/keluar yang tidak dipaksakan');

  const listed = await request('/api/archives?category=Keuangan&q=anggaran', admin);
  assert.equal(listed.status, 200);
  assert.ok(listed.body.items.some(item => item.id === created.body.id && item.category === 'Keuangan'));
  assert.ok(listed.body.categories.includes('Keuangan'));
  assert.equal((await request('/api/archives?category=Kategori%20fiktif', admin)).status, 422);
  pass('filter kategori, pencarian dan registri kategori memakai scope API yang sama');

  const csv = (await request('/api/export.csv?category=Keuangan', admin)).bytes.toString();
  assert.ok(csv.startsWith('\uFEFF"Jenis","Kategori","Nomor"'));
  assert.ok(csv.includes('"Keuangan"') && csv.includes('"ADM/CATEGORY/001"'));
  pass('ekspor kategori mempertahankan kolom kategori dan hanya memuat hasil filter');
}, 3541);

console.log(`${checks} archive category checks passed.`);
