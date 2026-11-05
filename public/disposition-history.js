const statuses=['Belum ditindaklanjuti','Sedang diproses','Selesai'];
const date=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Waktu tidak dicatat';
export function dispositionTimeline(disposition,esc){
  return `<ol class="disp-timeline"><li><b>Disposisi dibuat</b><p>${esc(disposition.createdByName||disposition.createdBy||'Aktor tidak dicatat')} · ${esc(date(disposition.createdAt))}</p><span>Belum ditindaklanjuti</span></li>${(disposition.updates||[]).map(update=>`<li><b>${esc(update.kind==='reopen'?'Dibuka kembali':update.kind==='note'?'Catatan perkembangan':update.status)}</b><p>${esc(update.byName||update.by||'Aktor tidak dicatat')} · ${esc(date(update.at))}</p>${update.previousStatus?`<small>${esc(update.previousStatus)} → ${esc(update.status)}</small>`:''}${update.note?`<p class="disp-note">${esc(update.note)}</p>`:'<small>Tanpa catatan tambahan.</small>'}</li>`).join('')}</ol>`;
}
export function archiveChronology(archive,esc){
  return `<section class="disp-chronology"><h4>Kronologi disposisi</h4>${archive.dispositions.length?archive.dispositions.map(disposition=>`<article><h5>${esc(disposition.assignedUserName||disposition.assignedSubsection)} · ${esc(disposition.status)}</h5><p class="disp-note">${esc(disposition.instruction)}</p>${dispositionTimeline(disposition,esc)}</article>`).join(''):'<p class="muted">Belum ada disposisi.</p>'}</section>`;
}
export async function openDispositionHistory({archiveId,dispositionId,api,app,esc,closeModal,canUpdate,supervisor,toast,onSaved,isCurrent}){
  const archive=await api('/api/archives/'+encodeURIComponent(archiveId));if(!isCurrent())return;
  const root=document.createElement('div');root.id='modalBack';root.className='modal-back';root.innerHTML='<section class="modal"><div class="modal-head"><h3>Kronologi & tindak lanjut</h3><button class="icon-btn" id="closeModal" aria-label="Tutup">×</button></div><div class="disp-history-content"></div></section>';app.append(root);root.querySelector('#closeModal').onclick=closeModal;
  function render(current){
    const disposition=current.dispositions.find(item=>item.id===dispositionId),content=root.querySelector('.disp-history-content');
    if(!disposition){content.textContent='Disposisi tidak ditemukan.';return;}
    const allowed=canUpdate(disposition),choices=disposition.status==='Selesai'?(supervisor?['Selesai','Sedang diproses']:['Selesai']):statuses;
    content.innerHTML=`<p><b>${esc(current.number)}</b> · ${esc(current.subject)}</p><dl class="ws-detail-list"><div><dt>Pengirim</dt><dd>${esc(disposition.createdByName||disposition.createdBy||'Tidak dicatat')}</dd></div><div><dt>Penerima</dt><dd>${esc(disposition.assignedUserName||disposition.assignedSubsection)}</dd></div><div><dt>Status</dt><dd>${esc(disposition.status)}</dd></div></dl><h4>Instruksi</h4><p class="disp-note">${esc(disposition.instruction)}</p>${dispositionTimeline(disposition,esc)}${allowed?`<form id="dispositionUpdateForm" novalidate data-managed-submit="true"><div class="field"><label for="dispositionStatus">Status tindak lanjut <span class="field-req-text">(wajib)</span></label><select id="dispositionStatus" name="status">${choices.map(status=>`<option${status===disposition.status?' selected':''}>${status}</option>`).join('')}</select></div><div class="field"><label for="dispositionNote">Catatan perkembangan / alasan <span id="dispositionNoteReq" class="field-opt-text">(opsional)</span></label><textarea id="dispositionNote" name="note" rows="3" maxlength="2000" aria-describedby="dispositionNoteHelp"></textarea><small id="dispositionNoteHelp" class="field-help">Alasan wajib jika tugas dikembalikan atau dibuka kembali. Tugas selesai hanya dapat dibuka kembali oleh admin/pimpinan.</small><span id="dispositionNote-error" class="field-error" hidden></span></div><p class="archive-edit-error" id="dispositionUpdateError" role="alert" tabindex="-1" hidden></p><div class="form-status sr-only" role="status" aria-live="polite"></div><div class="actions"><button type="button" class="btn btn-soft" id="reloadDisposition">Muat ulang kronologi</button><button class="btn btn-primary" type="submit" id="saveDispositionUpdate">Simpan tindak lanjut</button></div></form>`:'<p class="muted">Anda dapat membaca kronologi; pembaruan hanya oleh penerima tugas dan admin/pimpinan.</p>'}`;
    const form=content.querySelector('form');if(!form)return;let busy=false,key=crypto.randomUUID();form.oninput=()=>{key=crypto.randomUUID();};
    const statusSelect=form.elements.status,note=form.elements.note,noteErr=form.querySelector('#dispositionNote-error'),error=form.querySelector('[role=alert]'),statusEl=form.querySelector('.form-status');

    function syncNoteRequirement(){
      const targetStatus=statusSelect.value;
      const isReopen=disposition.status==='Selesai'&&targetStatus!=='Selesai';
      const isBackward=disposition.status==='Sedang diproses'&&targetStatus==='Belum ditindaklanjuti';
      const req=isReopen||isBackward;
      const reqEl=form.querySelector('#dispositionNoteReq');
      if(req){
        if(reqEl){reqEl.textContent='(wajib untuk pembukaan kembali / pengembalian)';reqEl.className='field-req-text';}
        note.setAttribute('aria-required','true');
      }else{
        if(reqEl){reqEl.textContent='(opsional)';reqEl.className='field-opt-text';}
        note.removeAttribute('aria-required');
      }
    }
    statusSelect.onchange=syncNoteRequirement;
    syncNoteRequirement();

    form.querySelector('#reloadDisposition').onclick=async()=>{if(busy)return;busy=true;const draft=form.elements.note.value;form.dataset.submitting='true';for(const element of root.querySelectorAll('button,input,select,textarea'))element.disabled=true;try{const fresh=await api('/api/archives/'+encodeURIComponent(archiveId));if(!root.isConnected||!isCurrent())return;render(fresh);root.querySelector('[name=note]').value=draft;}catch(failure){error.textContent=failure.message;error.hidden=false;}finally{busy=false;delete form.dataset.submitting;for(const element of root.querySelectorAll('button,input,select,textarea'))element.disabled=false;}};
    form.onsubmit=async event=>{
      event.preventDefault();if(busy)return;
      note.removeAttribute('aria-invalid');
      note.setAttribute('aria-describedby','dispositionNoteHelp');
      if(noteErr){noteErr.hidden=true;noteErr.textContent='';}
      error.hidden=true;

      const targetStatus=statusSelect.value;
      const isReopen=disposition.status==='Selesai'&&targetStatus!=='Selesai';
      const isBackward=disposition.status==='Sedang diproses'&&targetStatus==='Belum ditindaklanjuti';
      const req=isReopen||isBackward;

      if(req&&!note.value.trim()){
        note.setAttribute('aria-invalid','true');
        note.setAttribute('aria-describedby','dispositionNote-error dispositionNoteHelp');
        if(noteErr){noteErr.textContent='Alasan wajib untuk membuka kembali atau mengembalikan tugas.';noteErr.hidden=false;}
        error.textContent='Alasan wajib untuk membuka kembali atau mengembalikan tugas.';
        error.hidden=false;
        error.focus();
        if(statusEl)statusEl.textContent='Gagal: Alasan wajib untuk membuka kembali atau mengembalikan tugas.';
        return;
      }

      busy=true;const values={...Object.fromEntries(new FormData(form)),expectedVersion:disposition.version};
      form.dataset.submitting='true';for(const element of root.querySelectorAll('button,input,select,textarea'))element.disabled=true;
      if(statusEl)statusEl.textContent='Sedang menyimpan tindak lanjut…';
      try{const updated=await api(`/api/dispositions/${encodeURIComponent(disposition.id)}/status`,{method:'PATCH',headers:{'Idempotency-Key':key},body:JSON.stringify(values)});if(!root.isConnected||!isCurrent())return;if(statusEl)statusEl.textContent='Tindak lanjut tersimpan.';render(updated);await onSaved();toast('Tindak lanjut tersimpan.');}
      catch(failure){
        if(root.isConnected){
          let msg=failure.message;
          if(failure.status===401){
            msg='Sesi Anda telah berakhir. Formulir tetap dibuka agar catatan Anda tidak hilang. Silakan salin catatan Anda atau buka tab baru untuk masuk kembali.';
          }
          error.hidden=false;error.textContent=msg;
          if(statusEl)statusEl.textContent='Gagal: '+msg;
          error.focus();
        }
      }
      finally{busy=false;delete form.dataset.submitting;for(const element of root.querySelectorAll('button,input,select,textarea'))element.disabled=false;}
    };
  }
  render(archive);
}
