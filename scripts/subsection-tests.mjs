import assert from 'node:assert/strict';
import {officialSubsections,isSubsection,sameSubsection,subsectionLabel} from '../lib/subsection-taxonomy.mjs';
import {archiveFilters,matchesArchive} from '../lib/archive-query.mjs';
import {validateArchive} from '../lib/security.mjs';

let checks=0;
const pass=message=>{checks++;console.log('✓ '+message);};
assert.deepEqual(officialSubsections,[
  'Administrasi',
  'Hukum dan Sengketa Proses',
  'Pencegahan, Partisipasi Masyarakat, dan Humas',
  'Penanganan Pelanggaran dan Data Informasi'
]);
assert.equal(subsectionLabel('Hukum'),'Hukum dan Sengketa Proses');
assert.equal(subsectionLabel('PPPS'),'Penanganan Pelanggaran dan Data Informasi');
assert.equal(isSubsection('Pengawasan'),true);
assert.equal(sameSubsection('Hukum','Hukum dan Sengketa Proses'),true);
assert.equal(sameSubsection('Pengawasan','PPPS'),false);
pass('RA subbagian labels and legacy aliases resolve to stable units');

const legacy={id:'legacy',type:'incoming',number:'LEGACY/001',letterDate:'2026-11-06',subject:'Dummy',classification:'Administrasi umum',subsection:'Hukum',dispositions:[]};
const filters=archiveFilters(new URLSearchParams({subsection:'Hukum dan Sengketa Proses'}),{classifications:['Administrasi umum']},officialSubsections);
assert.equal(matchesArchive(legacy,filters),true);
pass('official subsection filter retains visibility of legacy dummy records');

const user={id:'u_recorder',role:'recorder',subsection:'Hukum'};
validateArchive({type:'incoming',number:'TEST/001',subject:'Dummy',classification:'Administrasi umum',subsection:'Hukum dan Sengketa Proses',letterDate:'2026-11-06',receivedDate:'2026-11-06',origin:'Fixture'},user,{classifications:['Administrasi umum']},officialSubsections);
assert.throws(()=>validateArchive({type:'incoming',number:'TEST/002',subject:'Dummy',classification:'Administrasi umum',subsection:'Administrasi',letterDate:'2026-11-06',receivedDate:'2026-11-06',origin:'Fixture'},user,{classifications:['Administrasi umum']},officialSubsections),error=>error.status===403);
pass('recorder scope compares official labels and legacy aliases without widening access');

console.log(`${checks} subsection checks passed.`);
