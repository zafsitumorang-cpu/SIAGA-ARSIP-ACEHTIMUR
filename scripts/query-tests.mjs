import assert from 'node:assert/strict';
import {archiveFilters,matchesArchive,archivePage} from '../lib/archive-query.mjs';
const classifications=['Administrasi umum','Kepegawaian'];const subsections=['Administrasi','Hukum','Pengawasan','PPPS'];
const records=Array.from({length:1300},(_,index)=>({id:`archive_${String(index).padStart(5,'0')}`,type:index%2?'incoming':'outgoing',number:`TEST/${index}`,letterDate:`2026-${String(index%12+1).padStart(2,'0')}-${String(index%28+1).padStart(2,'0')}`,createdAt:new Date(Date.UTC(2026,0,1)+index*1000).toISOString(),subject:index===17?'Kata [UJI] literal':'Arsip contoh',origin:'Asal',destination:'Tujuan',classification:classifications[index%2],subsection:subsections[index%4],dispositions:index%3?[{status:'Sedang diproses'}]:[]}));
let checks=0;function pass(message){checks++;console.log('✓ '+message);}
const original=records.map(record=>record.id);const ids=[];
for(let page=1;page<=52;page++){
  const result=archivePage(records,new URLSearchParams({page:String(page),page_size:'25'}));
  assert.equal(result.items.length,25);assert.equal(result.total,1300);assert.equal(result.pages,52);ids.push(...result.items.map(item=>item.id));
}
assert.equal(new Set(ids).size,1300);assert.equal(ids[0],'archive_01299');assert.deepEqual(records.map(record=>record.id),original);pass('1300 synthetic records paginate without gaps duplicates or source mutation');
const query=new URLSearchParams({type:'incoming',year:'2026',classification:'Kepegawaian',subsection:'Hukum',from:'2026-02-01',to:'2026-08-31',status:'Sedang diproses'});
const filters=archiveFilters(query,{classifications},subsections);
const filtered=records.filter(record=>matchesArchive(record,filters));
assert.ok(filtered.length);assert.ok(filtered.every(record=>record.type==='incoming'&&record.classification==='Kepegawaian'&&record.subsection==='Hukum'&&record.letterDate>='2026-02-01'&&record.letterDate<='2026-08-31'&&record.dispositions.some(task=>task.status==='Sedang diproses')));pass('combined filters intersect type year classification scope dates and task status');
const literal=archiveFilters(new URLSearchParams({q:'  [uji]  '}),{classifications},subsections);assert.deepEqual(records.filter(record=>matchesArchive(record,literal)).map(record=>record.id),['archive_00017']);pass('search is trimmed case insensitive literal text');
const empty=archivePage([],new URLSearchParams({page:'999',page_size:'10'}));assert.deepEqual(empty,{items:[],page:1,page_size:10,total:0,pages:1});pass('empty search has stable bounded pagination');
const tied=[{id:'b',createdAt:'2026-01-01'},{id:'a',createdAt:'2026-01-01'}];assert.deepEqual(archivePage(tied,new URLSearchParams({page:'1'})).items.map(item=>item.id),['a','b']);pass('equal timestamps use stable ID ordering');
assert.equal(archivePage(records,new URLSearchParams()).items,records);pass('unpaged internal clients retain compatible full scoped contract');
for(const params of [{page:'9007199254740992'},{page:'1e2'},{page_size:'5'}])assert.throws(()=>archivePage(records,new URLSearchParams(params)),error=>error.status===422);pass('unsafe or unsupported page parameters rejected');
assert.throws(()=>archiveFilters(new URLSearchParams({q:'a'.repeat(201)}),{classifications},subsections),error=>error.status===422);pass('search text length bounded');
console.log(`${checks} query checks passed.`);
