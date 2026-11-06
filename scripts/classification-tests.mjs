import assert from 'node:assert/strict';
import { withApiFixtures } from '../tests/helpers/api-fixture.mjs';
import { classificationRecords, findClassification, hasClassification } from '../lib/classification-taxonomy.mjs';

let checks = 0;
const pass = message => { checks++; console.log('✓ ' + message); };

assert.equal(classificationRecords(['Legacy']).at(0).label, 'Legacy');
assert.equal(hasClassification([{ code: 'ADM-1', label: 'Administrasi', active: false }], 'ADM-1'), true);
assert.equal(hasClassification([{ code: 'ADM-1', label: 'Administrasi', active: false }], 'ADM-1', { activeOnly: true }), false);
assert.equal(findClassification([{ code: 'ADM-1', label: 'Administrasi', aliases: ['Lama'] }], 'Lama').code, 'ADM-1');
pass('master helper mempertahankan string lama, kode, alias dan status aktif');

await withApiFixtures('classifications', async ({ request, restart }) => {
  const login = async (username, password) => (await request('/api/login', null, 'POST', { username, password })).cookie;
  const admin = await login('admin', 'admin123');
  const employee = await login('pegawai.administrasi', 'pegawai123');
  assert.equal((await request('/api/admin/classifications', employee)).status, 403);
  const initial = await request('/api/admin/classifications', admin);
  assert.equal(initial.status, 200);
  assert.ok(initial.body.items.every(item => item.label && 'active' in item));
  pass('admin melihat katalog klasifikasi terstruktur tanpa membuka endpoint ke pegawai');

  const created = await request('/api/admin/classifications', admin, 'POST', { code: 'ADM-99', label: 'Retensi dummy', description: 'Klasifikasi uji 05.1' });
  assert.equal(created.status, 201);
  const item = created.body.classificationCatalog.find(entry => entry.code === 'ADM-99');
  assert.equal(item.active, true);
  assert.equal(item.description, 'Klasifikasi uji 05.1');
  assert.equal((await request('/api/admin/classifications', admin, 'POST', { code: 'ADM-99', label: 'Duplikat kode' })).status, 409);
  assert.equal((await request('/api/admin/classifications', admin, 'POST', { label: 'retensi dummy' })).status, 409);
  pass('pembuatan master menyimpan kode/nama/deskripsi dan menolak duplikat');

  const record = { type: 'administrative', category: 'Arsip Administrasi Umum', number: 'CLASS/001', letterDate: '2026-11-06', subject: 'Arsip klasifikasi dummy', classification: 'Retensi dummy', subsection: 'Administrasi' };
  const archive = await request('/api/archives', admin, 'POST', record);
  assert.equal(archive.status, 201);
  const disabled = await request('/api/admin/classifications/ADM-99', admin, 'PATCH', { active: false });
  assert.equal(disabled.status, 200);
  assert.equal(disabled.body.classificationCatalog.find(entry => entry.code === 'ADM-99').active, false);
  assert.equal((await request('/api/archives', admin, 'POST', { ...record, number: 'CLASS/002' })).status, 422);
  const oldArchive = await request('/api/archives?classification=ADM-99', admin);
  assert.equal(oldArchive.status, 200);
  assert.ok(oldArchive.body.items.some(entry => entry.id === archive.body.id));
  const exported = await request('/api/export.csv?classification=Retensi%20dummy', admin);
  assert.equal(exported.status, 200);
  assert.ok(exported.bytes.toString().includes('CLASS/001'));
  pass('klasifikasi nonaktif menolak arsip baru tetapi arsip lama tetap terbaca, terfilter dan terekspor');

  const renamed = await request('/api/admin/classifications/ADM-99', admin, 'PATCH', { active: true, label: 'Retensi resmi', description: 'Nama yang disahkan' });
  assert.equal(renamed.status, 200);
  const renamedItem = renamed.body.classificationCatalog.find(entry => entry.code === 'ADM-99');
  assert.deepEqual(renamedItem.aliases, ['Retensi dummy']);
  assert.equal((await request('/api/archives?classification=Retensi%20dummy', admin)).body.items.some(entry => entry.id === archive.body.id), true);
  assert.equal((await request('/api/archives', admin, 'POST', { ...record, number: 'CLASS/003', classification: 'Retensi resmi' })).status, 201);
  const audit = await request('/api/admin/audit', admin);
  assert.ok(audit.body.items.some(event => event.action === 'create_classification' && event.entityId === 'ADM-99'));
  assert.ok(audit.body.items.some(event => event.action === 'disable_classification' && event.entityId === 'ADM-99'));
  assert.ok(audit.body.items.some(event => event.action === 'update_classification' && event.entityId === 'ADM-99'));
  pass('perubahan status dan nama memakai alias kompatibel serta mencatat audit tanpa isi arsip');

  assert.equal((await request('/api/admin/classifications/Administrasi%20umum', admin, 'PATCH', { label: 'Nama legacy baru' })).status, 422);
  await restart();
  const afterRestart = await request('/api/admin/classifications', admin);
  assert.equal(afterRestart.body.items.find(entry => entry.code === 'ADM-99').label, 'Retensi resmi');
  assert.equal((await request('/api/archives?classification=Retensi%20dummy', admin)).body.items.some(entry => entry.id === archive.body.id), true);
  pass('master dan alias bertahan setelah restart');
});

console.log(`${checks} classification checks passed.`);
