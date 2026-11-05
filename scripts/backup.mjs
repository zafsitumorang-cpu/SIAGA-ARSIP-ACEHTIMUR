import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createStore} from '../lib/store.mjs';
import {archiveFileIds} from '../lib/archive-files.mjs';
import {stagingFile} from '../lib/file-io.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const dataDir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
const target=path.join(path.resolve(process.env.BACKUP_DIR||path.join(dataDir,'backups')),new Date().toISOString().replaceAll(':','-').replaceAll('.','-'));
const store=await createStore({file:path.join(dataDir,'data.json'),databaseUrl:process.env.DATABASE_URL});
try{await store.transaction(async(data)=>{
  if(!data)throw Error('Tidak ada database untuk dibackup.');
  await fs.mkdir(path.join(target,'files'),{recursive:true,mode:0o700});const snapshot=structuredClone(data);snapshot.sessions=[];
  await fs.writeFile(path.join(target,'data.json'),JSON.stringify(snapshot,null,2),{mode:0o600});
  const manifest=[];const source=path.join(dataDir,'files');
  for(const name of await fs.readdir(source)){if(name==='.gitkeep'||stagingFile(name))continue;const location=path.join(source,name);const stat=await fs.lstat(location);if(!stat.isFile()||stat.isSymbolicLink())throw Error('File backup tidak valid.');const bytes=await fs.readFile(location);await fs.writeFile(path.join(target,'files',name),bytes,{mode:0o600});manifest.push({name,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
  const required=data.archives.flatMap(archiveFileIds);const missing=required.filter(id=>!manifest.some(f=>f.name===id));
  if(missing.length&&process.env.DEMO_MODE==='false')throw Error('Backup gagal: referensi berkas hilang.');
  await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),archives:data.archives.length,files:manifest,missingReferences:missing},null,2),{mode:0o600});
  console.log(`Backup lengkap: ${target}. Verifikasi manifest dan salin terenkripsi ke lokasi terpisah.`);
});}catch(error){await fs.rm(target,{recursive:true,force:true});throw error;}finally{await store.close();}
