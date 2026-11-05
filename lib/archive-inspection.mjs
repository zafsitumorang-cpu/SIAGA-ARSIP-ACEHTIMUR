import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {archiveDocuments,validFileId} from './archive-files.mjs';

export async function inspectArchiveIntegrity(archive,directory){
  const items=[];
  for(const document of archiveDocuments(archive)){
    const version=document.versions.find(item=>item.id===document.currentVersionId),base={documentId:document.id,title:document.title,fileId:version?.fileId||null,expectedChecksum:version?.checksum||null};
    if(!validFileId(base.fileId)){items.push({...base,check:'missing'});continue;}
    let handle;
    try{
      handle=await fs.open(path.join(directory,base.fileId),constants.O_RDONLY|constants.O_NOFOLLOW);const before=await handle.stat();
      if(!before.isFile()){items.push({...base,check:'invalid'});continue;}
      const hash=crypto.createHash('sha256');let size=0;
      for await(const bytes of handle.createReadStream({autoClose:false})){hash.update(bytes);size+=bytes.length;}
      const after=await handle.stat(),checksum=hash.digest('hex');
      const check=before.size!==after.size||before.mtimeMs!==after.mtimeMs?'changed':!base.expectedChecksum?'baseline':base.expectedChecksum===checksum&&(version.size==null||size===version.size)?'matched':'mismatch';
      items.push({...base,check,checksum,size});
    }catch(error){items.push({...base,check:error.code==='ENOENT'?'missing':'unreadable'});}finally{await handle?.close();}
  }
  return {items,ok:items.length>0&&items.every(item=>['matched','baseline'].includes(item.check)),checkedAt:new Date().toISOString()};
}

const normalized=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
export function archiveDuplicates(archive,candidates,additionalChecksums=[]){
  const checksums=record=>new Set([...archiveDocuments(record).flatMap(document=>document.versions.map(version=>version.checksum)),...(record.qualityReviews||[]).flatMap(review=>(review.integrity?.items||[]).map(item=>item.checksum))].filter(Boolean));
  const own=checksums(archive);for(const checksum of additionalChecksums)if(checksum)own.add(checksum);
  return candidates.filter(other=>other.id!==archive.id).flatMap(other=>{
    const reasons=[],sameContext=archive.type===other.type&&archive.subsection===other.subsection&&archive.letterDate?.slice(0,4)===other.letterDate?.slice(0,4);
    if(sameContext&&normalized(archive.number)&&normalized(archive.number)===normalized(other.number))reasons.push('number');
    if(sameContext&&normalized(archive.agendaNumber)&&normalized(archive.agendaNumber)===normalized(other.agendaNumber))reasons.push('agenda');
    if([...checksums(other)].some(checksum=>own.has(checksum)))reasons.push('checksum');
    return reasons.length?[{id:other.id,number:other.number,subject:other.subject,subsection:other.subsection,reasons}]:[];
  });
}
