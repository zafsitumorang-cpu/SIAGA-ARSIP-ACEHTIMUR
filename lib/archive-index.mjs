import {fail,text} from './security.mjs';
export const sourceTypes={unknown:'Belum diketahui',physical:'Arsip fisik',drive:'Google Drive',digital:'Sumber digital lain',other:'Sumber lainnya'};
export const indexFields={agendaNumber:'Nomor agenda',classificationCode:'Kode klasifikasi',sourceType:'Jenis sumber',physicalLocation:'Lokasi arsip fisik',sourceReference:'Referensi sumber'};
export const indexLimits={agendaNumber:200,classificationCode:100,sourceType:20,physicalLocation:500,sourceReference:1000};
export function validateIndexFields(values){
  const type=values.sourceType||'unknown';if(!Object.hasOwn(sourceTypes,type))fail(422,'Jenis sumber tidak valid.');
  for(const field of Object.keys(indexFields))if(values[field]!==undefined){text(values[field],indexFields[field],indexLimits[field]);if(/[\x00-\x1f\x7f]/.test(values[field]))fail(422,indexFields[field]+' memuat karakter kontrol.');}
  if(type==='physical'&&!values.physicalLocation?.trim())fail(422,'Lokasi arsip fisik wajib untuk sumber fisik.');
  if(['drive','digital','other'].includes(type)&&!values.sourceReference?.trim())fail(422,'Referensi sumber wajib untuk jenis sumber yang dipilih.');
}
export function archiveIndex(archive){
  return {systemIndex:archive.id,year:String(archive.letterDate||'').slice(0,4),agendaNumber:archive.agendaNumber||'',classificationCode:archive.classificationCode||'',sourceType:archive.sourceType||'unknown',sourceLabel:sourceTypes[archive.sourceType||'unknown']||sourceTypes.unknown,physicalLocation:archive.physicalLocation||'',sourceReference:archive.sourceReference||''};
}
export function structuredFileName(archive,document,version){
  const part=value=>String(value||'').normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu,'-').replace(/^-+|-+$/g,'');
  const extension=version.fileName?.includes('.')?version.fileName.split('.').at(-1):({'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[version.mime]||'bin');
  const name=[archiveIndex(archive).year,archive.subsection,archive.type==='incoming'?'masuk':'keluar',archive.classificationCode||archive.classification,archive.number,document?.kind==='attachment'?document.title:'utama','v'+version.number].map(part).filter(Boolean).join('_');
  return name.slice(0,160)+'.'+part(extension).slice(0,12);
}
