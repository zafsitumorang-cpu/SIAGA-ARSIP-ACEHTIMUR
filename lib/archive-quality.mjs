import crypto from 'node:crypto';
import {archiveDocuments} from './archive-files.mjs';

export const completenessLabels={metadata_only:'Metadata tercatat; berkas belum ada',missing_file:'Berkas utama belum tersedia',missing_attachment:'Lampiran belum tersedia',needs_review:'Perlu verifikasi',needs_correction:'Perlu koreksi',complete:'Lengkap; sudah diverifikasi'};
export function archiveQuality(archive,available){
  const documents=archiveDocuments(archive),primary=documents.find(item=>item.kind==='primary'),files=documents.map(document=>({documentId:document.id,fileId:document.currentVersionId||null})).sort((a,b)=>a.documentId.localeCompare(b.documentId));
  const token=crypto.createHash('sha256').update(JSON.stringify({metadataVersion:archive.metadataVersion||0,files})).digest('hex');
  const review=archive.qualityReviews?.at(-1),current=review?.token===token;
  let status;
  if(!primary?.currentVersionId)status='metadata_only';
  else if(!available(primary.currentVersionId))status='missing_file';
  else if(files.some(item=>!item.fileId||!available(item.fileId)))status='missing_attachment';
  else if(current&&review.decision==='approved')status='complete';
  else if(current&&review.decision==='needs_correction')status='needs_correction';
  else status='needs_review';
  return {status,label:completenessLabels[status],token,reviewVersion:archive.qualityReviews?.length||0,reviewCurrent:Boolean(current),missingFiles:files.filter(item=>!item.fileId||!available(item.fileId)).length+(!primary?1:0)};
}
export function matchesCompleteness(quality,value){
  return !value||(value==='missing'?['metadata_only','missing_file','missing_attachment'].includes(quality?.status):quality?.status===value);
}
