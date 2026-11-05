export const validFileId=value=>typeof value==='string'&&/^file_[a-zA-Z0-9_-]+$/.test(value);

function legacyVersion(ref,number){
  return {id:ref.fileId,fileId:ref.fileId,number,fileName:ref.fileName||'arsip',mime:ref.mime||null,size:ref.size??null,checksum:ref.checksum||null,
    uploadedBy:ref.uploadedBy||null,uploadedAt:ref.uploadedAt||null,reason:ref.reason||null,legacy:!ref.uploadedBy||!ref.uploadedAt};
}

// A read-only view: old JSON fields remain usable during staged rollout/rollback.
export function archiveDocuments(archive){
  const documents=structuredClone(archive.documents||[]);
  const refs=[...(archive.fileVersions||[])];
  if(validFileId(archive.fileId))refs.push({fileId:archive.fileId,fileName:archive.fileName,mime:archive.fileMime,size:archive.fileSize,checksum:archive.fileChecksum,uploadedBy:archive.fileUploadedBy,uploadedAt:archive.fileUploadedAt,reason:archive.fileReason});
  let primary=documents.find(document=>document.kind==='primary');
  for(const ref of refs){
    if(!validFileId(ref.fileId))continue;
    if(!primary){primary={id:'document_primary',kind:'primary',title:'Dokumen utama',purpose:archive.type==='outgoing'?'final':'scan',currentVersionId:null,versions:[]};documents.unshift(primary);}
    if(!primary.versions.some(version=>version.fileId===ref.fileId))primary.versions.push(legacyVersion(ref,Math.max(0,...primary.versions.map(version=>version.number))+1));
  }
  if(primary){
    primary.purpose=archive.type==='outgoing'?'final':'scan';
    if(validFileId(archive.fileId))primary.currentVersionId=archive.fileId;
  }
  return documents;
}

export function archiveFileIds(archive){
  return [...new Set([archive.fileId,...(archive.fileVersions||[]).map(version=>version.fileId),
    ...archiveDocuments(archive).flatMap(document=>document.versions.map(version=>version.fileId))].filter(Boolean))];
}
