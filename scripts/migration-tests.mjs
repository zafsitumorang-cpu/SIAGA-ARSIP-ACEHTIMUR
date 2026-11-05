import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'siaga-migration-'));
const helper=new URL('./vps-migrate.mjs',import.meta.url).pathname;
const run=(...args)=>spawnSync(process.execPath,[helper,...args],{encoding:'utf8',timeout:15000});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let count=0;
async function fixture(name,archive){
  const dir=path.join(root,name);await fs.mkdir(path.join(dir,'source/files'),{recursive:true});await fs.mkdir(path.join(dir,'target'));
  const data={users:[{id:'u_admin',username:'PRIVATE_USERNAME',passwordHash:'PRIVATE_HASH'}],archives:[{id:'in_1',dispositions:[],...archive}],classifications:[],categories:[],audit:[],notifications:[]};
  await fs.writeFile(path.join(dir,'source/data.json'),JSON.stringify(data));
  return {dir,source:path.join(dir,'source'),target:path.join(dir,'target'),output:path.join(dir,'import.json'),summary:path.join(dir,'summary.json')};
}
function prepare(f){return run('prepare',f.source,f.target,f.output,f.summary);}
function pass(message){count++;console.log('✓ '+message);}
try{
  const seed=await fixture('seed',{fileId:'file_in_1',fileName:'surat-masuk-1.pdf'});
  const before=await fs.readFile(path.join(seed.source,'data.json'));
  let result=prepare(seed);assert.equal(result.status,0,result.stderr);
  const converted=JSON.parse(await fs.readFile(seed.output));
  assert.equal(converted.archives[0].fileId,'');assert.equal(converted.archives[0].unavailableLegacyFiles[0].fileId,'file_in_1');
  assert.equal(sha(await fs.readFile(path.join(seed.source,'data.json'))),sha(before));
  assert.ok(!result.stdout.includes('PRIVATE_'));pass('known missing demo reference retained as unavailable; original JSON unchanged');

  const missing=await fixture('missing',{fileId:'file_real_unknown',fileName:'missing.pdf'});
  result=prepare(missing);assert.notEqual(result.status,0);await assert.rejects(fs.access(missing.output));
  assert.ok(!result.stderr.includes('PRIVATE_'));pass('missing non-demo file aborts without publishing an import');

  const actual=await fixture('actual',{fileId:'file_actual',fileName:'real.pdf'});
  const bytes=Buffer.from('%PDF-1.4\nfixture');await fs.writeFile(path.join(actual.source,'files/file_actual'),bytes);
  result=prepare(actual);assert.equal(result.status,0,result.stderr);
  const summary=JSON.parse(await fs.readFile(actual.summary));assert.equal(summary.files[0].sha256,sha(bytes));
  assert.equal(sha(await fs.readFile(path.join(actual.target,'files/file_actual'))),sha(bytes));
  assert.equal(JSON.parse(await fs.readFile(actual.output)).archives[0].fileId,'file_actual');pass('existing binary copied intact with checksum and reference');

  const link=await fixture('link',{fileId:'file_link',fileName:'link.pdf'});
  await fs.symlink(path.join(actual.source,'files/file_actual'),path.join(link.source,'files/file_link'));
  result=prepare(link);assert.notEqual(result.status,0);await assert.rejects(fs.access(link.output));pass('symlink cannot enter the migrated file store');

  const config=path.join(root,'config');await fs.mkdir(config,{mode:0o700});
  result=run('init',config,path.join(root,'data'),path.join(root,'backup'),'siaga_test','siaga_test','siaga-arsipbawasluacehtimur.web.id');assert.equal(result.status,0,result.stderr);
  const access=JSON.parse(await fs.readFile(path.join(config,'admin-access.json')));assert.ok(access.password.length>=32);assert.ok(!result.stdout.includes(access.password));
  for(const file of await fs.readdir(config)){assert.equal((await fs.stat(path.join(config,file))).mode&0o777,0o600);}
  assert.match(await fs.readFile(path.join(config,'production.env'),'utf8'),/DEMO_MODE=false/);
  assert.match(await fs.readFile(path.join(config,'runtime.env'),'utf8'),/PORT=3100/);pass('random credentials stored privately; production and candidate config separated');

  result=run('init',config,path.join(root,'data'),path.join(root,'backup'),'siaga_test','siaga_test','siaga-arsipbawasluacehtimur.web.id');assert.notEqual(result.status,0);
  assert.equal(JSON.parse(await fs.readFile(path.join(config,'admin-access.json'))).password,access.password);pass('existing credential files are never overwritten');
  console.log(`${count} migration checks passed.`);
}finally{await fs.rm(root,{recursive:true,force:true});}
