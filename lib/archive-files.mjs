export const validFileId=value=>typeof value==='string'&&/^file_[a-zA-Z0-9_-]+$/.test(value);

function legacyVersion(ref,number){
  return {id:ref.fileId,fileId:ref.fileId,number,fileName:ref.fileName||'arsip',mime:ref.mime||null,size:ref.size??null,checksum:ref.checksum||null,
    uploadedBy:ref.uploadedBy||null,uploadedAt:ref.uploadedAt||null,reason:ref.reason||null,legacy:!ref.uploadedBy||!ref.uploadedAt};
}

// A read-only view: old JSON fields remain usable during staged rollout/rollback.
export function archiveDocuments(archive){
  const documents=structuredClone(archive.documents||[]);
  let primary=documents.find(document=>document.kind==='primary');
  const recordedFlat=!primary||primary.versions.some(version=>version.fileId===archive.fileId);
  const refs=[...(archive.fileVersions||[])];
  if(validFileId(archive.fileId))refs.push({fileId:archive.fileId,fileName:archive.fileName,mime:archive.fileMime,size:archive.fileSize,checksum:archive.fileChecksum,uploadedBy:recordedFlat?archive.fileUploadedBy:null,uploadedAt:recordedFlat?archive.fileUploadedAt:null,reason:recordedFlat?archive.fileReason:null});
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

export function appendArchiveVersion(archive,documentId,file,{fileId,uploadedBy,uploadedAt,reason=null,sourceVersionId=null}){
  const documents=archiveDocuments(archive);
  let document=documents.find(item=>item.id===documentId);
  if(!document&&documentId==='document_primary'){
    document={id:documentId,kind:'primary',title:'Dokumen utama',purpose:archive.type==='outgoing'?'final':'scan',currentVersionId:null,versions:[]};documents.unshift(document);
  }
  if(!document)throw Error('Document not found');
  const version={id:fileId,fileId,number:Math.max(0,...document.versions.map(item=>item.number))+1,fileName:file.name,mime:file.mime,size:file.raw.length,checksum:file.checksum,uploadedBy,uploadedAt,reason,legacy:false,...(sourceVersionId?{sourceVersionId}:{})};
  document.versions.push(version);document.currentVersionId=fileId;archive.documents=documents;
  if(document.kind==='primary'){
    archive.fileVersions=document.versions.filter(item=>item.id!==fileId).map(item=>({fileId:item.fileId,fileName:item.fileName,mime:item.mime,size:item.size,checksum:item.checksum,uploadedBy:item.uploadedBy,uploadedAt:item.uploadedAt,reason:item.reason}));
    Object.assign(archive,{fileId,fileName:file.name,fileMime:file.mime,fileSize:file.raw.length,fileChecksum:file.checksum,fileUploadedBy:uploadedBy,fileUploadedAt:uploadedAt,fileReason:reason});
  }
  return version;
}
