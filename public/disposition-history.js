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
    content.innerHTML=`<p><b>${esc(current.number)}</b> · ${esc(current.subject)}</p><dl class="ws-detail-list"><div><dt>Pengirim</dt><dd>${esc(disposition.createdByName||disposition.createdBy||'Tidak dicatat')}</dd></div><div><dt>Penerima</dt><dd>${esc(disposition.assignedUserName||disposition.assignedSubsection)}</dd></div><div><dt>Status</dt><dd>${esc(disposition.status)}</dd></div></dl><h4>Instruksi</h4><p class="disp-note">${esc(disposition.instruction)}</p>${dispositionTimeline(disposition,esc)}${allowed?`<form id="dispositionUpdateForm" data-managed-submit="true"><div class="field"><label for="dispositionStatus">Status tindak lanjut</label><select id="dispositionStatus" name="status">${choices.map(status=>`<option${status===disposition.status?' selected':''}>${status}</option>`).join('')}</select></div><div class="field"><label for="dispositionNote">Catatan perkembangan / alasan</label><textarea id="dispositionNote" name="note" rows="3" maxlength="2000"></textarea><small>Alasan wajib jika tugas dikembalikan atau dibuka kembali. Tugas selesai hanya dapat dibuka kembali oleh admin/pimpinan.</small></div><p class="archive-edit-error" role="alert" tabindex="-1" hidden></p><button class="btn btn-primary" type="submit">Simpan tindak lanjut</button></form>`:'<p class="muted">Anda dapat membaca kronologi; pembaruan hanya oleh penerima tugas dan admin/pimpinan.</p>'}`;
    const form=content.querySelector('form');if(!form)return;let busy=false;
    form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;const values=Object.fromEntries(new FormData(form)),error=form.querySelector('[role=alert]');error.hidden=true;form.dataset.submitting='true';for(const element of form.elements)element.disabled=true;
      try{const updated=await api(`/api/dispositions/${encodeURIComponent(disposition.id)}/status`,{method:'PATCH',body:JSON.stringify(values)});if(!root.isConnected||!isCurrent())return;render(updated);await onSaved();toast('Tindak lanjut tersimpan.');}
      catch(failure){if(root.isConnected){error.hidden=false;error.textContent=failure.message;error.focus();}}
      finally{busy=false;delete form.dataset.submitting;for(const element of form.elements)element.disabled=false;}
    };
  }
  render(archive);
}
