import assert from 'node:assert/strict';
import {dryRunImport} from '../lib/import-dry-run.mjs';

const base = {users:[{id:'u_admin',username:'admin',active:true}],archives:[{id:'a_1',type:'incoming',number:'IN/001',subject:'Dokumen dummy',letterDate:'2026-01-01',subsection:'Administrasi',createdBy:'u_admin',dispositions:[]}],classifications:[],categories:[],audit:[],notifications:[]};
let checks=0;const pass=message=>{checks++;console.log('✓ '+message);};
const valid=dryRunImport(base);assert.equal(valid.ok,true);assert.deepEqual(valid.counts,{users:1,archives:1,classifications:0,categories:0,audit:0,notifications:0});assert.equal(valid.retry.idempotent,true);pass('valid snapshot reports counts and an idempotent retry key without mutation');
const duplicate=structuredClone(base);duplicate.archives.push({...duplicate.archives[0],id:'a_2'});const duplicateReport=dryRunImport(duplicate);assert.equal(duplicateReport.ok,true);assert.equal(duplicateReport.duplicates[0].kind,'archive_number');assert.equal(duplicateReport.retry.idempotent,false);pass('duplicate archive numbers are reported for operator review and disable idempotent retry');
const invalid=structuredClone(base);invalid.archives[0].subsection='Unit tidak dikenal';invalid.archives[0].dispositions=[{id:'d_1',status:'Selesai',assignedUserId:'u_missing'}];const invalidReport=dryRunImport(invalid);assert.equal(invalidReport.ok,false);assert.ok(invalidReport.errors.some(item=>item.code==='invalid_subsection'));assert.ok(invalidReport.errors.some(item=>item.code==='unknown_user'));pass('invalid subsection and recipient references fail before import');
const sourceInvalid=structuredClone(base);sourceInvalid.archives[0].sourceType='physical';const sourceReport=dryRunImport(sourceInvalid);assert.ok(sourceReport.errors.some(item=>item.code==='missing_source_identity'));pass('source identity rules catch physical records without a location');
const original=JSON.stringify(base);dryRunImport(base);assert.equal(JSON.stringify(base),original);pass('dry-run is read-only and does not alter the input snapshot');
console.log(`${checks} import dry-run checks passed.`);
