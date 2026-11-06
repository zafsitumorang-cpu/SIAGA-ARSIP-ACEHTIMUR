import {fail,text,validateArchive} from './security.mjs';
import {indexFields,indexLimits,validateIndexFields} from './archive-index.mjs';
import {sameSubsection} from './subsection-taxonomy.mjs';
import {defaultArchiveCategory} from './archive-taxonomy.mjs';

export const metadataLabels={type:'Jenis arsip',category:'Kategori arsip',number:'Nomor arsip',letterDate:'Tanggal arsip',receivedDate:'Tanggal diterima',origin:'Asal surat',destination:'Tujuan surat',subject:'Perihal',signatory:'Penandatangan',classification:'Klasifikasi',subsection:'Subbagian',...indexFields};
const limits={type:16,category:200,number:200,letterDate:10,receivedDate:10,origin:500,destination:500,subject:2000,signatory:300,classification:200,subsection:80,...indexLimits};

export function prepareArchiveEdit(archive,body,user,db,subsections){
  const keys=Object.keys(body);
  if(keys.some(key=>key!=='expectedVersion'&&!Object.hasOwn(metadataLabels,key)))fail(422,'Hanya field metadata surat yang dapat diubah.');
  if(!Number.isSafeInteger(body.expectedVersion)||body.expectedVersion<0)fail(422,'Versi data wajib disertakan. Muat ulang arsip.');
  if(body.expectedVersion!==(archive.metadataVersion||0))fail(409,'Arsip sudah diperbarui pengguna lain. Muat ulang data terbaru sebelum menyimpan.');
  if(!keys.some(key=>Object.hasOwn(metadataLabels,key)))fail(422,'Pilih metadata yang akan diperbaiki.');
  const values={};
  for(const key of Object.keys(metadataLabels))values[key]=text(Object.hasOwn(body,key)?body[key]:(archive[key]??(key==='category'?defaultArchiveCategory(archive.type):key==='sourceType'?'unknown':'')),metadataLabels[key],limits[key]);
  // Treat an official label and its legacy alias as the same unit while old
  // dummy records are still present; this avoids a false metadata revision.
  if(sameSubsection(values.subsection,archive.subsection))values.subsection=archive.subsection;
  if(archive.dispositions.length&&(values.type!==archive.type||values.subsection!==archive.subsection))fail(422,'Jenis dan subbagian surat yang memiliki disposisi tidak dapat diubah.');
  validateArchive(values,user,db,subsections);validateIndexFields(values);
  if(values.type!==archive.type){
    if(values.type==='outgoing'){values.receivedDate='';values.origin='';}
    else if(values.type==='incoming'){values.signatory='';values.destination='';}
    else {values.receivedDate='';values.origin='';values.destination='';values.signatory='';}
  }
  return {values,fields:Object.keys(metadataLabels).filter(key=>values[key]!== (archive[key]??(key==='sourceType'?'unknown':'')))};
}
