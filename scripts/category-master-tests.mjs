import assert from 'node:assert/strict';
import { withApiFixtures } from '../tests/helpers/api-fixture.mjs';
import { categoryRecords, findArchiveCategory, hasArchiveCategory } from '../lib/archive-taxonomy.mjs';

let checks=0;const pass=message=>{checks++;console.log('✓ '+message);};
assert.equal(categoryRecords(['Legacy']).at(0).label,'Legacy');
assert.equal(hasArchiveCategory([{code:'ADM-K-1',label:'Kegiatan',active:false}],'ADM-K-1'),true);
assert.equal(hasArchiveCategory([{code:'ADM-K-1',label:'Kegiatan',active:false}],'ADM-K-1',{activeOnly:true}),false);
assert.equal(findArchiveCategory([{code:'ADM-K-1',label:'Kegiatan',aliases:['Lama']}],'Lama').code,'ADM-K-1');
pass('master kategori menormalisasi label legacy, kode, alias dan status aktif');

await withApiFixtures('categorymaster',async({request,restart})=>{
  const login=async(username,password)=>(await request('/api/login',null,'POST',{username,password})).cookie;
  const admin=await login('admin','admin123'),employee=await login('pegawai.administrasi','pegawai123'),foreignEmployee=await login('pegawai.hukum','pegawai123');
  assert.equal((await request('/api/admin/archive-categories',employee)).status,403);
  const initial=await request('/api/admin/archive-categories',admin);assert.equal(initial.status,200);assert.ok(initial.body.items.some(item=>item.label==='Keuangan'));
  const created=await request('/api/admin/archive-categories',admin,'POST',{code:'ADM-K-99',label:'Kegiatan Dummy',description:'Kategori uji 05.2'});assert.equal(created.status,201);
  assert.equal(created.body.categoryCatalog.find(item=>item.code==='ADM-K-99').active,true);
  assert.equal((await request('/api/admin/archive-categories',admin,'POST',{code:'ADM-K-99',label:'Duplikat'})).status,409);
  pass('admin mengelola kategori dengan kode/nama/deskripsi dan duplikat ditolak');
  const record={type:'administrative',category:'Kegiatan Dummy',number:'CAT/MASTER/001',letterDate:'2026-11-06',subject:'Kategori master dummy',classification:'Administrasi umum',subsection:'Administrasi'};
  const archive=await request('/api/archives',admin,'POST',record);assert.equal(archive.status,201);
  assert.equal((await request(`/api/archives/${archive.body.id}`,foreignEmployee)).status,404);
  const disabled=await request('/api/admin/archive-categories/ADM-K-99',admin,'PATCH',{active:false});assert.equal(disabled.status,200);
  assert.equal((await request('/api/archives',admin,'POST',{...record,number:'CAT/MASTER/002'})).status,422);
  assert.equal((await request('/api/archives?category=ADM-K-99',admin)).body.items.some(item=>item.id===archive.body.id),true);
  pass('kategori nonaktif tidak dipakai untuk arsip baru dan tidak memutus arsip lama');
  const renamed=await request('/api/admin/archive-categories/ADM-K-99',admin,'PATCH',{active:true,label:'Kegiatan Resmi'});assert.equal(renamed.status,200);
  assert.deepEqual(renamed.body.categoryCatalog.find(item=>item.code==='ADM-K-99').aliases,['Kegiatan Dummy']);
  assert.equal((await request('/api/archives?category=Kegiatan%20Dummy',admin)).body.items.some(item=>item.id===archive.body.id),true);
  assert.equal((await request(`/api/archives/${archive.body.id}`,foreignEmployee)).status,404);
  const audit=await request('/api/admin/audit',admin);assert.ok(audit.body.items.some(event=>event.action==='create_category'&&event.entityId==='ADM-K-99'));assert.ok(audit.body.items.some(event=>event.action==='disable_category'&&event.entityId==='ADM-K-99'));
  await restart();assert.equal((await request('/api/admin/archive-categories',admin)).body.items.find(item=>item.code==='ADM-K-99').label,'Kegiatan Resmi');
  pass('alias dan kategori master bertahan setelah restart serta perubahan diaudit');
});
console.log(`${checks} category master checks passed.`);
