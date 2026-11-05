import writeExcelFile from 'write-excel-file/node';
import {orderedArchives} from './archive-query.mjs';
import {archiveIndex} from './archive-index.mjs';

export const exportHeaders=['Jenis','Nomor','Tanggal','Asal','Tujuan','Perihal','Klasifikasi','Subbagian','Status disposisi','Indeks sistem','Tahun','Kode klasifikasi','Nomor agenda','Jenis sumber','Lokasi fisik','Referensi sumber','Kelengkapan'];
const statuses=['Belum ditindaklanjuti','Sedang diproses','Selesai'];

export function archiveExportRows(archives){
  return orderedArchives(archives).map(archive=>[
    archive.type==='incoming'?'Masuk':'Keluar',archive.number,archive.letterDate,archive.origin,archive.destination,
    archive.subject,archive.classification,archive.subsection,
    archive.dispositions.length?statuses.filter(status=>archive.dispositions.some(item=>item.status===status)).join('; '):'Tanpa disposisi',archive.id,archiveIndex(archive).year,archive.classificationCode,archive.agendaNumber,archiveIndex(archive).sourceLabel,archive.physicalLocation,archive.sourceReference,archive.quality?.label
  ].map(value=>String(value??'')));
}

export function serializeCsv(rows){
  const quote=value=>'"'+value.replace(/^(?=\s*[=+@-]|[\t\r\n])/,"'").replaceAll('"','""')+'"';
  return '\uFEFF'+rows.map(row=>row.map(value=>quote(String(value??''))).join(',')).join('\r\n');
}

export const archiveCsv=archives=>serializeCsv([exportHeaders,...archiveExportRows(archives)]);

export function archiveXlsx(archives){
  // Explicit string cells preserve identifiers/ISO dates and never interpret user text as formulas.
  const header=exportHeaders.map(value=>({value,type:String,fontWeight:'bold',color:'#FFFFFF',backgroundColor:'#B91C1C'}));
  const rows=archiveExportRows(archives).map(row=>row.map(value=>({value,type:String,wrap:true,alignVertical:'top'})));
  return writeExcelFile([header,...rows],{
    sheet:'Arsip surat',stickyRowsCount:1,orientation:'landscape',
    columns:[12,26,14,30,30,60,28,20,44,44,10,22,24,24,40,60,36].map(width=>({width}))
  },{fontFamily:'Calibri',fontSize:11}).toBuffer();
}
