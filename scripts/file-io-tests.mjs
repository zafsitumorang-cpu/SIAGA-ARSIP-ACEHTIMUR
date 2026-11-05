import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';import pg from 'pg';
import {createStore,emptyData} from '../lib/store.mjs';
import {stageArchiveFile,inspectArchiveFiles} from '../lib/file-io.mjs';
let checks=0;const pass=name=>{checks++;console.log('✓ '+name);};
async function suite(databaseUrl){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'siaga-file-io-')),files=path.join(dir,'files'),file=path.join(dir,'data.json');await fs.mkdir(files);
 const store=await createStore({file,databaseUrl});const pool=databaseUrl?new pg.Pool({connectionString:databaseUrl}):null;
 const initial=emptyData();initial.users=[{id:'u_fixture',username:'fixture'}];initial.archives=[{id:'a_fixture',subsection:'Administrasi',createdBy:'u_fixture',fileId:'file_original',fileName:'Original',dispositions:[]}];
 await fs.writeFile(path.join(files,'file_original'),'original');await store.transaction(async(_data,_dirty,replace)=>replace(initial));
 const update=(id,fail=false)=>store.transaction(async(data,dirty,_replace,transaction)=>{await stageArchiveFile(files,id,Buffer.from(id),transaction);data.archives[0].fileId=id;dirty();if(fail)throw Error('injected callback failure');});
 try{
  console.log('Storage: '+(pool?'PostgreSQL':'JSON'));
  await assert.rejects(update('file_callback_failure',true),/injected/);assert.equal((await fs.readdir(files)).join(','),'file_original');await store.transaction(data=>assert.equal(data.archives[0].fileId,'file_original'));pass('callback failure rolls back metadata and only its new binary');
  await update('file_committed');assert.equal(await fs.readFile(path.join(files,'file_original'),'utf8'),'original');assert.equal(await fs.readFile(path.join(files,'file_committed'),'utf8'),'file_committed');await store.transaction(data=>assert.equal(data.archives[0].fileId,'file_committed'));pass('successful transaction preserves old version and durable new bytes');
  await assert.rejects(update('file_original'),{code:'EEXIST'});assert.equal(await fs.readFile(path.join(files,'file_original'),'utf8'),'original');assert.equal((await fs.readdir(files)).some(name=>name.endsWith('.part')),false);pass('collision cannot overwrite existing file and removes only owned staging file');
  await assert.rejects(store.transaction(async(data,dirty,_replace,tx)=>{await stageArchiveFile(path.join(dir,'missing'),'file_fail',Buffer.from('x'),tx);data.archives[0].fileId='file_fail';dirty();}),{code:'ENOENT'});await store.transaction(data=>assert.equal(data.archives[0].fileId,'file_committed'));pass('write failure does not publish phantom download reference');
  // A pre-publication database failure is different from an ambiguous COMMIT response.
  if(pool){
   await pool.query("CREATE FUNCTION reject_archive() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected db failure'; END $$");await pool.query('CREATE TRIGGER reject_archive BEFORE UPDATE ON siaga_archives FOR EACH ROW EXECUTE FUNCTION reject_archive()');
   try{await assert.rejects(update('file_db_failure'),/injected db failure/);}finally{await pool.query('DROP TRIGGER reject_archive ON siaga_archives');}
  }else{
   await assert.rejects(store.transaction(async(data,dirty,_replace,tx)=>{await stageArchiveFile(files,'file_db_failure',Buffer.from('x'),tx);data.audit=null;dirty();}),/Data audit rusak/);
  }
  assert.equal((await fs.readdir(files)).includes('file_db_failure'),false);await store.transaction(data=>assert.equal(data.archives[0].fileId,'file_committed'));pass('known save failure cleans new binary while previous metadata remains intact');
  if(pool){
   const connect=pg.Pool.prototype.connect;
   pg.Pool.prototype.connect=async function(...args){const client=await connect.apply(this,args),query=client.query;client.query=async function(sql,...rest){const result=await query.call(this,sql,...rest);if(sql==='COMMIT'){client.query=query;throw Error('injected lost commit response');}return result;};return client;};
   try{await assert.rejects(update('file_ambiguous'),/lost commit response/);}finally{pg.Pool.prototype.connect=connect;}
  }else{
   const rename=fs.rename;fs.rename=async(...args)=>{await rename(...args);throw Error('injected lost rename response');};try{await assert.rejects(update('file_ambiguous'),/lost rename response/);}finally{fs.rename=rename;}
  }
  await store.transaction(data=>assert.equal(data.archives[0].fileId,'file_ambiguous'));assert.equal(await fs.readFile(path.join(files,'file_ambiguous'),'utf8'),'file_ambiguous');pass('ambiguous publication retains binary when metadata actually committed');
  const results=await Promise.allSettled([update('file_parallel_a'),update('file_parallel_b')]);assert.ok(results.every(result=>result.status==='fulfilled'));assert.equal(await fs.readFile(path.join(files,'file_parallel_a'),'utf8'),'file_parallel_a');await store.transaction(data=>assert.equal(data.archives[0].fileId,'file_parallel_b'));pass('concurrent transactions keep each published version independent');
  const old=Date.now()-172800000;
  for(const name of ['file_orphan','.upload_file_crash_abc.part']){await fs.writeFile(path.join(files,name),'old');await fs.utimes(path.join(files,name),old/1000,old/1000);}
  await fs.writeFile(path.join(files,'file_recent'),'recent');await fs.writeFile(path.join(dir,'outside'),'do not touch');await fs.symlink(path.join(dir,'outside'),path.join(files,'file_symlink'));
  const data=structuredClone(initial);data.archives[0].fileVersions=[{fileId:'file_missing'},{fileId:'../invalid'}];
  const before=await fs.readdir(files),report=await inspectArchiveFiles(data,files);
  assert.deepEqual(report.missing,['file_missing']);assert.deepEqual(report.invalidReferences,['../invalid']);assert.equal(report.orphanCandidates.some(item=>item.id==='file_orphan'),true);assert.equal(report.pendingCandidates.length,1);assert.equal(report.recentUnreferenced.some(item=>item.id==='file_recent'),true);assert.deepEqual(report.unexpected,['file_symlink']);assert.deepEqual(await fs.readdir(files),before);assert.equal(await fs.readFile(path.join(dir,'outside'),'utf8'),'do not touch');pass('reconciliation is read-only and separates missing old recent pending and invalid files');
  if(!pool){execFileSync(process.execPath,['scripts/reconcile-files.mjs'],{env:{...process.env,DATA_DIR:dir,DATABASE_URL:''}});assert.deepEqual(await fs.readdir(files),before);pass('CLI dry-run never mutates fixture data or binaries');}
 }finally{await store.close();await pool?.end();await fs.rm(dir,{recursive:true,force:true});}
}
await suite();
if(process.env.PG_TEST_URL){const url=new URL(process.env.PG_TEST_URL);if(!['127.0.0.1','localhost'].includes(url.hostname))throw Error('Local PostgreSQL required.');const pool=new pg.Pool({connectionString:url.href}),name='siaga_fileio_'+Date.now();await pool.query(`CREATE DATABASE ${name}`);url.pathname='/'+name;try{execFileSync(process.execPath,['scripts/database.mjs','migrate'],{env:{...process.env,DATABASE_URL:url.href},stdio:'pipe'});await suite(url.href);}finally{await pool.query(`DROP DATABASE ${name} WITH (FORCE)`);await pool.end();}}
console.log(`${checks} file I/O checks passed.`);
