import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {archiveFileIds,validFileId} from './archive-files.mjs';

export const stagingFile=name=>/^\.upload_file_[a-zA-Z0-9_-]+\.part$/.test(name);

export async function stageArchiveFile(directory,fileId,bytes,transaction){
  if(!validFileId(fileId)||!transaction?.onRollback)throw Error('Invalid staged file transaction.');
  const pending=path.join(directory,`.upload_${fileId}_${crypto.randomUUID()}.part`),target=path.join(directory,fileId);
  let handle,created=false;
  try{
    handle=await fs.open(pending,'wx',0o600);created=true;
    await handle.writeFile(bytes);await handle.sync();const own=await handle.stat();
    await handle.close();handle=null;
    // Publish complete bytes without overwriting any existing version.
    await fs.link(pending,target);
    transaction.onRollback(async()=>{
      try{const current=await fs.lstat(target);if(current.isFile()&&current.ino===own.ino&&current.dev===own.dev)await fs.unlink(target);}catch(error){if(error.code!=='ENOENT')throw error;}
    });
    await fs.unlink(pending);created=false;
    const folder=await fs.open(directory,'r');try{await folder.sync();}finally{await folder.close();}
  }finally{
    await handle?.close();
    if(created)await fs.unlink(pending).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
}

// Never deletes files. Age alone does not prove that removal would be safe.
export async function inspectArchiveFiles(data,directory,{now=Date.now(),minAgeMs=86400000}={}){
  const refs=[...new Set(data.archives.flatMap(archiveFileIds))],referenced=new Set(refs.filter(validFileId));
  const report={readOnly:true,referenced:referenced.size,missing:[],invalidReferences:refs.filter(id=>!validFileId(id)),orphanCandidates:[],pendingCandidates:[],recentUnreferenced:[],unexpected:[]};
  const available=new Set();
  for(const entry of await fs.readdir(directory)){
    if(entry==='.gitkeep')continue;
    const stat=await fs.lstat(path.join(directory,entry));
    if(!stat.isFile()||(!validFileId(entry)&&!stagingFile(entry))){report.unexpected.push(entry);continue;}
    if(validFileId(entry))available.add(entry);
    if(referenced.has(entry))continue;
    const item={id:entry,size:stat.size,modifiedAt:stat.mtime.toISOString()};
    if(now-stat.mtimeMs<minAgeMs)report.recentUnreferenced.push(item);
    else report[stagingFile(entry)?'pendingCandidates':'orphanCandidates'].push(item);
  }
  report.missing=[...referenced].filter(id=>!available.has(id));
  return report;
}
