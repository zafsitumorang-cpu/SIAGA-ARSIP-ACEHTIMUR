import {archiveSourceFields,bindArchiveSourceFields} from './archive-source-fields.js';
import {setupFormA11y} from './form-a11y.js';
let generation=0;

export async function openArchiveEditor(options){
  const {id,api,app,esc,icon,subsections,classifications,toast,closeModal,onSaved,canShow}=options;
  const request=++generation;
  let archive;
  try{archive=await api('/api/archives/'+encodeURIComponent(id));}catch(error){toast(error.message,'error');return;}
  if(request!==generation||!canShow())return;
  const old=document.querySelector('#modalBack');
  const restore=old?document.querySelector(`.edit-archive[data-id="${CSS.escape(id)}"]`):document.activeElement;
  old?.remove();
  const locked=archive.dispositions.length>0;
  const choices=(items,value)=>items.map(item=>`<option value="${esc(item)}" ${item===value?'selected':''}>${esc(item)}</option>`).join('');
  const input=(name,label,type='text',max=500)=>`<div class="field" data-field="${name}"><label for="edit-${name}">${label} <span id="edit-${name}-req" class="field-opt-text">(opsional)</span></label><input id="edit-${name}" name="${name}" type="${type}" maxlength="${max}" value="${esc(archive[name]||'')}"><span id="edit-${name}-error" class="field-error" role="alert" hidden></span></div>`;
  app.insertAdjacentHTML('beforeend',`<div class="modal-back" id="modalBack"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="editArchiveTitle" tabindex="-1">
    <div class="modal-head"><h3 id="editArchiveTitle">Ubah metadata arsip</h3><button type="button" class="icon-btn" id="closeEditArchive" aria-label="Tutup perubahan">${icon('close')}</button></div>
    <p class="muted archive-edit-intro">Perbaiki informasi surat. Berkas dan riwayat disposisi tetap terkait dengan arsip ini.</p>
    ${locked?'<p class="notice">Jenis dan subbagian dikunci karena surat memiliki disposisi.</p>':''}
    <div id="editArchiveErrorSummary" class="form-error-summary archive-edit-error" role="alert" tabindex="-1" hidden>
      <h4 class="form-error-title" id="editArchiveErrorTitle">Periksa kembali isian formulir:</h4>
      <ul class="error-summary-list" id="editArchiveErrorList"></ul>
      <p class="form-error-desc" id="editArchiveErrorDesc" hidden></p>
    </div>
    <form id="editArchiveForm"><div class="form-grid">
      <div class="field"><label for="edit-type">Jenis surat <span class="field-req-text">(wajib)</span></label><select name="type" id="edit-type" ${locked?'disabled':''}><option value="incoming" ${archive.type==='incoming'?'selected':''}>Surat masuk</option><option value="outgoing" ${archive.type==='outgoing'?'selected':''}>Surat keluar</option></select><span id="edit-type-error" class="field-error" role="alert" hidden></span></div>
      <div class="field"><label for="edit-subsection">Subbagian penanggung jawab <span class="field-req-text">(wajib)</span></label><select name="subsection" id="edit-subsection" ${locked?'disabled':''}>${choices(subsections,archive.subsection)}</select><span id="edit-subsection-error" class="field-error" role="alert" hidden></span></div>
      ${input('number','Nomor surat','text',200)}${input('letterDate','Tanggal surat','date',10)}${input('receivedDate','Tanggal diterima','date',10)}
      <div class="field"><label for="edit-classification">Klasifikasi <span class="field-req-text">(wajib)</span></label><select name="classification" id="edit-classification">${choices([...new Set([archive.classification,...classifications])],archive.classification)}</select><span id="edit-classification-error" class="field-error" role="alert" hidden></span></div>
      ${input('origin','Asal surat')}${input('destination','Tujuan surat')}
      <div class="field full"><label for="edit-subject">Perihal <span class="field-req-text">(wajib)</span></label><textarea id="edit-subject" name="subject" maxlength="2000" rows="3" required>${esc(archive.subject)}</textarea><span id="edit-subject-error" class="field-error" role="alert" hidden></span></div>
      ${input('signatory','Penandatangan','text',300)}
    </div>${archiveSourceFields(archive,esc,'edit')}
    <p id="editArchiveError" class="archive-edit-error" role="alert" tabindex="-1" hidden></p>
    <div id="editArchiveStatus" class="form-status sr-only" role="status" aria-live="polite"></div>
    <div class="actions"><button type="button" class="btn btn-soft" id="reloadEditArchive" hidden>Muat ulang data terbaru</button><button type="button" class="btn btn-soft" id="cancelEditArchive">Batal</button><button type="submit" class="btn btn-primary" id="saveEditArchive">Simpan perubahan</button></div></form>
  </section></div>`);
  const back=document.querySelector('#modalBack'),dialog=back.querySelector('.modal'),form=back.querySelector('form');
  bindArchiveSourceFields(form);
  const select=back.querySelector('#edit-type'),error=back.querySelector('#editArchiveError'),reload=back.querySelector('#reloadEditArchive');
  const a11y=setupFormA11y(form,{
    errorSummaryId:'editArchiveErrorSummary',
    statusId:'editArchiveStatus',
    summaryTitle:'Periksa kembali isian arsip:'
  });
  back._restoreFocus=restore;
  const close=()=>{if(!form.dataset.saving)closeModal();};
  back.querySelector('#closeEditArchive').onclick=close;back.querySelector('#cancelEditArchive').onclick=close;
  back.onclick=event=>{if(event.target===back)close();};
  back.onkeydown=event=>{
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){
      const items=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(item=>item.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  };
  function toggle(){
    const incoming=select.value==='incoming';
    for(const name of ['receivedDate','origin','signatory']){
      const visible=name==='signatory'?!incoming:incoming;
      const field=form.querySelector(`[data-field="${name}"]`);
      field.hidden=!visible;
      const inp=field.querySelector('input');
      inp.disabled=!visible;
      inp.required=visible;
      if(inp.required) inp.setAttribute('aria-required','true'); else inp.removeAttribute('aria-required');
      const reqEl=form.querySelector(`#edit-${name}-req`);
      if(reqEl){
        if(inp.required){ reqEl.textContent='(wajib)'; reqEl.className='field-req-text'; }
        else { reqEl.textContent='(opsional)'; reqEl.className='field-opt-text'; }
      }
    }
    for(const name of ['number','letterDate']) {
      form.elements[name].required=true;
      form.elements[name].setAttribute('aria-required','true');
      const reqEl=form.querySelector(`#edit-${name}-req`);
      if(reqEl){ reqEl.textContent='(wajib)'; reqEl.className='field-req-text'; }
    }
    form.elements.destination.required=!incoming;
    if(!incoming) form.elements.destination.setAttribute('aria-required','true');
    else form.elements.destination.removeAttribute('aria-required');
    const destReq = form.querySelector('#edit-destination-req');
    if(destReq){
      if(!incoming){ destReq.textContent='(wajib)'; destReq.className='field-req-text'; }
      else { destReq.textContent='(opsional)'; destReq.className='field-opt-text'; }
    }
  }
  select.onchange=toggle;toggle();
  reload.onclick=async()=>{if(form.dataset.saving)return;reload.disabled=true;await openArchiveEditor(options);if(reload.isConnected)reload.disabled=false;};
  form.onsubmit=async event=>{
    event.preventDefault();if(form.dataset.saving)return;
    if(!a11y.validate()){
      const firstErr=form.querySelector('[aria-invalid="true"]');
      if(error){
        error.textContent=firstErr?`${a11y.getFieldLabel(firstErr)} wajib diisi.`:'Lengkapi isian formulir.';
        error.hidden=false;
      }
      return;
    }
    form.dataset.saving='true';form.setAttribute('aria-busy','true');error.hidden=true;
    const save=back.querySelector('#saveEditArchive');const buttons=[...back.querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);
    save.innerHTML='<i class="ws-spinner"></i> Menyimpan…';
    a11y.setSubmitting('Sedang menyimpan perubahan metadata arsip…');
    try{
      const values=Object.fromEntries(new FormData(form));
      values.type=select.value;values.subsection=back.querySelector('#edit-subsection').value;values.expectedVersion=archive.metadataVersion;
      const saved=await api('/api/archives/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(values)});
      delete form.dataset.saving;closeModal();toast(saved.metadataVersion===archive.metadataVersion?'Tidak ada perubahan metadata.':'Metadata arsip berhasil diperbarui.');
      a11y.setSuccess('Metadata arsip berhasil diperbarui.');
      try{await onSaved();}catch{toast('Perubahan tersimpan. Daftar belum dapat dimuat; silakan buka ulang halaman arsip.','error');}
    }catch(failure){
      let msg=failure.message+(failure.status===409?' Perubahan Anda belum disimpan. Muat ulang akan mengganti formulir dengan data terbaru.':'');
      if(failure.status===401){
        msg='Sesi Anda telah berakhir. Formulir tetap dibuka agar draf Anda tidak hilang. Silakan salin draf Anda atau buka tab baru untuk masuk kembali.';
      }
      error.textContent=msg;
      error.hidden=false;reload.hidden=failure.status!==409;
      a11y.setFailure(msg);
      error.focus();
    }finally{
      delete form.dataset.saving;form.setAttribute('aria-busy','false');buttons.forEach(button=>button.disabled=false);save.textContent='Simpan perubahan';
    }
  };
  dialog.focus();
}
