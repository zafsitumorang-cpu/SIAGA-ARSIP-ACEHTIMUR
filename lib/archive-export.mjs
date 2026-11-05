import writeExcelFile from 'write-excel-file/node';
import {orderedArchives} from './archive-query.mjs';

export const exportHeaders=['Jenis','Nomor','Tanggal','Asal','Tujuan','Perihal','Klasifikasi','Subbagian','Status disposisi'];
const statuses=['Belum ditindaklanjuti','Sedang diproses','Selesai'];

export function archiveExportRows(archives){
  return orderedArchives(archives).map(archive=>[
    archive.type==='incoming'?'Masuk':'Keluar',archive.number,archive.letterDate,archive.origin,archive.destination,
    archive.subject,archive.classification,archive.subsection,
    archive.dispositions.length?statuses.filter(status=>archive.dispositions.some(item=>item.status===status)).join('; '):'Tanpa disposisi'
  ].map(value=>String(value??'')));
}

export function archiveCsv(archives){
  const quote=value=>'"'+value.replace(/^(?=\s*[=+@-]|[\t\r\n])/,"'").replaceAll('"','""')+'"';
  return '\uFEFF'+[exportHeaders,...archiveExportRows(archives)].map(row=>row.map(quote).join(',')).join('\r\n');
}

export function archiveXlsx(archives){
  // Explicit string cells preserve identifiers/ISO dates and never interpret user text as formulas.
  const header=exportHeaders.map(value=>({value,type:String,fontWeight:'bold',color:'#FFFFFF',backgroundColor:'#B91C1C'}));
  const rows=archiveExportRows(archives).map(row=>row.map(value=>({value,type:String,wrap:true,alignVertical:'top'})));
  return writeExcelFile([header,...rows],{
    sheet:'Arsip surat',stickyRowsCount:1,orientation:'landscape',
    columns:[12,26,14,30,30,60,28,20,44].map(width=>({width}))
  },{fontFamily:'Calibri',fontSize:11}).toBuffer();
}
