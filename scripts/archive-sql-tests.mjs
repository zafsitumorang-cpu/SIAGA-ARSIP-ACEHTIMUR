import assert from 'node:assert/strict';
import {buildArchiveListQuery,archiveSqlPage} from '../lib/archive-sql.mjs';
let checks=0;const pass=message=>{checks++;console.log('✓ '+message);};
const query=buildArchiveListQuery({user:{role:'employee',subsection:'Administrasi'},filters:{type:'incoming',year:'2026',from:'2026-01-01',to:'2026-12-31',subsection:'Administrasi',status:'Selesai',q:'[uji]'},page:2,pageSize:10,classificationValues:['ADM','Administrasi umum'],categoryValues:['Surat Masuk']});
assert.ok(query.count.text.includes('a.subsection = ANY'));assert.ok(query.count.text.includes('EXISTS (SELECT 1 FROM siaga_dispositions'));assert.ok(query.rows.text.includes('LIMIT $'));assert.ok(query.rows.text.includes('jsonb_agg'));assert.equal(query.count.values.at(-1),'%[uji]%');assert.equal(query.rows.values.at(-2),10);assert.equal(query.rows.values.at(-1),10);pass('archive SQL query is parameterized, scoped and bounded with disposition aggregation');
const wide=buildArchiveListQuery({user:{role:'admin'},filters:{},page:1,pageSize:25});assert.ok(!wide.count.text.includes('a.subsection ='));assert.deepEqual(wide.count.values,[]);pass('admin query omits subsection predicate while employee query requires it');
assert.deepEqual(archiveSqlPage(0,99,10),{page:1,page_size:10,total:0,pages:1});assert.deepEqual(archiveSqlPage(21,3,10),{page:3,page_size:10,total:21,pages:3});pass('SQL pagination clamps empty and over-range pages deterministically');
console.log(`${checks} archive SQL checks passed.`);
