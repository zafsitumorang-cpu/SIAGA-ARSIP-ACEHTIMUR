import {fail,text,validDate} from './security.mjs';
import {completenessLabels,matchesCompleteness} from './archive-quality.mjs';
import {isSubsection,sameSubsection} from './subsection-taxonomy.mjs';
import {isArchiveCategory} from './archive-taxonomy.mjs';
import {hasClassification,findClassification,classificationLabel,classificationAliases} from './classification-taxonomy.mjs';

export function archiveFilters(params,db,subsections){
  const filters=Object.fromEntries(['q','type','category','year','classification','subsection','from','to','status','completeness'].map(key=>[key,params.get(key)||'']));
  filters.q=text(filters.q,'Kata kunci',200).toLowerCase();
  if(filters.type&&!['incoming','outgoing','administrative'].includes(filters.type))fail(422,'Jenis arsip tidak valid.');
  if(filters.year&&!/^\d{4}$/.test(filters.year))fail(422,'Tahun harus empat digit.');
  if(filters.classification){const entry=findClassification(db.classifications,filters.classification);if(!entry)fail(422,'Klasifikasi tidak terdaftar.');filters.classificationValues=[classificationLabel(entry),...classificationAliases(entry)];}
  if(filters.category&&!isArchiveCategory(filters.category,db.categories))fail(422,'Kategori arsip tidak terdaftar.');
  if(filters.subsection&&!isSubsection(filters.subsection))fail(422,'Subbagian tidak valid.');
  if(filters.status&&!['Belum ditindaklanjuti','Sedang diproses','Selesai'].includes(filters.status))fail(422,'Status disposisi tidak valid.');
  if(filters.completeness&&!['missing',...Object.keys(completenessLabels)].includes(filters.completeness))fail(422,'Status kelengkapan tidak valid.');
  if(filters.from)validDate(filters.from,'Tanggal awal');
  if(filters.to)validDate(filters.to,'Tanggal akhir');
  if(filters.from&&filters.to&&filters.from>filters.to)fail(422,'Tanggal awal tidak boleh melewati tanggal akhir.');
  return filters;
}

export function matchesArchive(archive,f){
  const date=String(archive.letterDate||'');
  return matchesCompleteness(archive.quality,f.completeness)&&(!f.type||archive.type===f.type)&&(!f.category||archive.category===f.category)&&(!f.year||date.startsWith(f.year))
    &&(!f.classification||f.classificationValues?.includes(archive.classification)||archive.classification===f.classification)&&(!f.subsection||sameSubsection(archive.subsection,f.subsection))
    &&(!f.from||date>=f.from)&&(!f.to||date<=f.to)
    &&(!f.status||archive.dispositions.some(item=>item.status===f.status))
    &&(!f.q||[archive.id,archive.agendaNumber,archive.classificationCode,archive.physicalLocation,archive.sourceReference,archive.number,archive.origin,archive.destination,archive.subject,archive.classification,archive.category,archive.subsection].some(value=>String(value||'').toLowerCase().includes(f.q)));
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
