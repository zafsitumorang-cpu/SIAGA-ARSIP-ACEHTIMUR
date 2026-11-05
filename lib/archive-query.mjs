import {fail,text,validDate} from './security.mjs';

export function archiveFilters(params,db,subsections){
  const filters=Object.fromEntries(['q','type','year','classification','subsection','from','to','status'].map(key=>[key,params.get(key)||'']));
  filters.q=text(filters.q,'Kata kunci',200).toLowerCase();
  if(filters.type&&!['incoming','outgoing'].includes(filters.type))fail(422,'Jenis surat tidak valid.');
  if(filters.year&&!/^\d{4}$/.test(filters.year))fail(422,'Tahun harus empat digit.');
  if(filters.classification&&!db.classifications.includes(filters.classification))fail(422,'Klasifikasi tidak terdaftar.');
  if(filters.subsection&&!subsections.includes(filters.subsection))fail(422,'Subbagian tidak valid.');
  if(filters.status&&!['Belum ditindaklanjuti','Sedang diproses','Selesai'].includes(filters.status))fail(422,'Status disposisi tidak valid.');
  if(filters.from)validDate(filters.from,'Tanggal awal');
  if(filters.to)validDate(filters.to,'Tanggal akhir');
  if(filters.from&&filters.to&&filters.from>filters.to)fail(422,'Tanggal awal tidak boleh melewati tanggal akhir.');
  return filters;
}

export function matchesArchive(archive,f){
  const date=String(archive.letterDate||'');
  return (!f.type||archive.type===f.type)&&(!f.year||date.startsWith(f.year))
    &&(!f.classification||archive.classification===f.classification)&&(!f.subsection||archive.subsection===f.subsection)
    &&(!f.from||date>=f.from)&&(!f.to||date<=f.to)
    &&(!f.status||archive.dispositions.some(item=>item.status===f.status))
    &&(!f.q||[archive.number,archive.origin,archive.destination,archive.subject,archive.classification,archive.subsection].some(value=>String(value||'').toLowerCase().includes(f.q)));
}

export function orderedArchives(rows){
  return [...rows].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))||a.id.localeCompare(b.id));
}

export function archivePage(rows,params){
  // Existing dashboard/disposition clients retain their unpaged scoped API contract.
  if(!params.has('page')&&!params.has('page_size'))return {items:rows};
  const rawPage=params.get('page')??'1',rawSize=params.get('page_size')??'25';
  if(!/^[1-9]\d*$/.test(rawPage)||!Number.isSafeInteger(Number(rawPage)))fail(422,'Nomor halaman tidak valid.');
  if(!['10','25','50','100'].includes(rawSize))fail(422,'Jumlah per halaman harus 10, 25, 50 atau 100.');
  const total=rows.length,page_size=Number(rawSize),pages=Math.max(1,Math.ceil(total/page_size)),page=Math.min(Number(rawPage),pages);
  const sorted=orderedArchives(rows);
  return {items:sorted.slice((page-1)*page_size,page*page_size),page,page_size,total,pages};
}
