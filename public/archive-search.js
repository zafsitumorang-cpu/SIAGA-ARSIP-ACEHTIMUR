const keys=['q','type','year','classification','subsection','from','to','status','completeness'];
export function renderArchiveSearch({root,state,api,esc,subsections,canRecord,onAdd,rowsHtml,bindActions,loading,isCurrent}){
  const wide=['admin','leader'].includes(state.user.role);
  const filters=Object.fromEntries(keys.map(key=>[key,state.filters[key]||'']));
  if(!wide)filters.subsection='';state.filters=filters;
  const options=(items,value,empty)=>`<option value="">${empty}</option>`+items.map(item=>`<option value="${esc(item)}" ${item===value?'selected':''}>${esc(item)}</option>`).join('');
  const years=[...new Set([filters.year,String(new Date().getFullYear()),...state.archives.map(item=>item.letterDate?.slice(0,4))].filter(Boolean))].sort().reverse();
  root.innerHTML=`<div class="title-row archive-page-heading"><div><div class="eyebrow">Pusat dokumen</div><h1>Arsip surat</h1></div><div class="archive-header-actions"><a class="btn btn-soft" id="archiveExport" aria-disabled="true" tabindex="-1" target="_blank" rel="noopener">Ekspor CSV</a><a class="btn btn-soft" id="archiveExportXlsx" aria-disabled="true" tabindex="-1" target="_blank" rel="noopener">Ekspor Excel (.xlsx)</a>${canRecord()?'<button class="btn btn-primary" id="addArchive">+ Tambah arsip</button>':''}</div></div>
  <section class="panel"><form id="archiveSearchForm" role="search" aria-label="Filter arsip surat"><fieldset class="archive-filter-fields"><legend class="sr-only">Kriteria pencarian arsip</legend><div class="archive-basic-grid">
  <div class="field"><label for="search">Kata kunci</label><input id="search" name="q" type="search" maxlength="200" value="${esc(filters.q)}" placeholder="Nomor, perihal, asal atau tujuan"></div>
  <div class="field"><label for="type">Jenis surat</label><select id="type" name="type"><option value="">Semua jenis</option><option value="incoming" ${filters.type==='incoming'?'selected':''}>Surat masuk</option><option value="outgoing" ${filters.type==='outgoing'?'selected':''}>Surat keluar</option></select></div>
  <div class="field"><label for="status">Status disposisi</label><select id="status" name="status">${options(['Belum ditindaklanjuti','Sedang diproses','Selesai'],filters.status,'Semua status')}</select></div></div>
  <details id="archiveAdvanced" ${['year','classification','subsection','from','to','completeness'].some(key=>filters[key])?'open':''}><summary>Filter lanjutan <span class="muted">Tahun, klasifikasi, subbagian dan tanggal</span></summary><div class="archive-filter-grid">
  <div class="field"><label for="archiveCompleteness">Kelengkapan / verifikasi</label><select id="archiveCompleteness" name="completeness">${[['','Semua kelengkapan'],['missing','Antrean unggah (berkas belum lengkap)'],['needs_review','Antrean verifikasi'],['needs_correction','Perlu koreksi'],['complete','Lengkap; sudah diverifikasi'],['metadata_only','Metadata tanpa berkas utama'],['missing_file','Berkas utama hilang'],['missing_attachment','Lampiran belum tersedia']].map(([value,label])=>`<option value="${value}" ${value===filters.completeness?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label for="archiveYear">Tahun surat</label><select id="archiveYear" name="year">${options(years,filters.year,'Semua tahun')}</select></div>
  <div class="field"><label for="archiveClassification">Klasifikasi</label><select id="archiveClassification" name="classification">${options(state.classifications,filters.classification,'Semua klasifikasi')}</select></div>
  <div class="field"><label for="archiveSubsection">Subbagian</label><select id="archiveSubsection" name="subsection" ${wide?'':'disabled'}>${wide?options(subsections,filters.subsection,'Semua subbagian'):`<option>${esc(state.user.subsection)}</option>`}</select></div>
  <div class="field"><label for="archiveFrom">Tanggal surat mulai</label><input id="archiveFrom" name="from" type="date" value="${esc(filters.from)}"></div>
  <div class="field"><label for="archiveTo">Tanggal surat sampai</label><input id="archiveTo" name="to" type="date" value="${esc(filters.to)}"></div></div></details>
  <div class="archive-filter-actions"><span class="muted">Semua kriteria diterapkan bersamaan.</span><button type="button" class="btn btn-soft" id="reset">Reset filter</button><button type="submit" class="btn btn-primary" id="applyArchiveFilters">Terapkan</button></div></fieldset></form>
  <p id="archiveFilterError" class="archive-edit-error" role="alert" hidden></p><div id="archiveResults" aria-busy="true">${loading()}</div></section>`;
  const form=root.querySelector('#archiveSearchForm'),results=root.querySelector('#archiveResults'),error=root.querySelector('#archiveFilterError'),exports=[root.querySelector('#archiveExport'),root.querySelector('#archiveExportXlsx')];
  let sequence=0,lastResult=null;
  const current=()=>isCurrent()&&root.querySelector('#archiveSearchForm')===form;
  const params=()=>new URLSearchParams(Object.entries(state.filters).filter(([,value])=>value));
  function busy(value){
    form.querySelector('fieldset').disabled=value;results.setAttribute('aria-busy',String(value));results.inert=value;results.classList.toggle('is-loading',value);
    const previous=root.querySelector('#archivePrevious'),next=root.querySelector('#archiveNext'),size=root.querySelector('#archivePageSize');
    if(previous)previous.disabled=value||!lastResult||lastResult.page<=1;
    if(next)next.disabled=value||!lastResult||lastResult.page>=lastResult.pages;
    if(size)size.disabled=value;
  }
  function paint(data){
    const first=data.total?(data.page-1)*data.page_size+1:0,last=Math.min(data.total,data.page*data.page_size);
    results.innerHTML=`<p class="archive-result-summary" role="status">${data.total?`Menampilkan ${first}–${last} dari ${data.total} arsip`:'Tidak ada arsip yang sesuai filter.'}</p><p class="muted archive-sort-hint">Urutan: waktu pencatatan terbaru. Ekspor mengikuti urutan yang sama.</p>${data.items.length?rowsHtml(data.items):'<div class="empty">Coba ubah kriteria atau gunakan Reset filter.</div>'}<div class="archive-pagination"><label for="archivePageSize">Per halaman <select id="archivePageSize">${[10,25,50,100].map(size=>`<option ${size===data.page_size?'selected':''}>${size}</option>`).join('')}</select></label><span>Halaman ${data.page} dari ${data.pages}</span><div><button class="btn btn-soft" id="archivePrevious" ${data.page<=1?'disabled':''}>Sebelumnya</button><button class="btn btn-soft" id="archiveNext" ${data.page>=data.pages?'disabled':''}>Berikutnya</button></div></div>`;
    bindActions();root.querySelector('#archivePrevious').onclick=()=>load(data.page-1);root.querySelector('#archiveNext').onclick=()=>load(data.page+1);
    root.querySelector('#archivePageSize').onchange=event=>{state.archivePageSize=Number(event.target.value);load(1);};
  }
  async function load(page=state.archivePage||1){
    const request=++sequence,query=params();query.set('page',String(page));query.set('page_size',String(state.archivePageSize||25));
    error.hidden=true;for(const link of exports){link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.tabIndex=-1;}busy(true);
    try{
      const data=await api('/api/archives?'+query);
      if(request!==sequence||!current())return;
      if(!Array.isArray(data.items)||!Number.isInteger(data.total)||!Number.isInteger(data.page)||!Number.isInteger(data.pages))throw Error('Format daftar arsip belum sesuai. Muat ulang halaman.');
      state.archiveItems=data.items;state.archivePage=data.page;state.archivePageSize=data.page_size;lastResult=data;
      if(Array.isArray(data.classifications)){state.classifications=data.classifications;form.elements.classification.innerHTML=options(data.classifications,form.elements.classification.value,'Semua klasifikasi');}
      if(Array.isArray(data.years)){const selected=form.elements.year.value;form.elements.year.innerHTML=options([...new Set([selected,...data.years].filter(Boolean))].sort().reverse(),selected,'Semua tahun');}
      const criteria=new URLSearchParams(query);criteria.delete('page');criteria.delete('page_size');
      if(data.total)exports.forEach((link,index)=>{link.href=`/api/export.${index?'xlsx':'csv'}?`+criteria;link.removeAttribute('aria-disabled');link.tabIndex=0;});
      paint(data);
    }catch(failure){
      if(request!==sequence||!current())return;
      error.textContent=failure.message;error.hidden=false;results.innerHTML='<div class="empty">Daftar belum dapat dimuat. Filter Anda tetap tersimpan.<br><button type="button" class="btn btn-soft" id="retryArchiveSearch">Coba lagi</button></div>';
      root.querySelector('#retryArchiveSearch').onclick=()=>load(page);
    }finally{if(request===sequence&&current())busy(false);}
  }
  form.onsubmit=async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(form));state.filters=Object.fromEntries(keys.map(key=>[key,values[key]||'']));state.archivePage=1;await load(1);};
  root.querySelector('#reset').onclick=()=>{for(const key of keys){state.filters[key]='';if(form.elements[key]&&!form.elements[key].disabled)form.elements[key].value='';}state.archivePage=1;load(1);};
  root.querySelector('#addArchive')?.addEventListener('click',onAdd);
  load();
}
