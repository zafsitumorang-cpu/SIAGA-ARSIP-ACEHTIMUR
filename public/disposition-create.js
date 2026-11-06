export function openDispositionForm({archive,app,api,esc,closeModal,refresh,renderPage,toast,isCurrent}){
  app.insertAdjacentHTML('beforeend',`<div class="modal-back" id="modalBack"><section class="modal"><div class="modal-head"><h3>Buat disposisi</h3><button class="icon-btn" id="closeModal" aria-label="Tutup">×</button></div><p class="muted">${esc(archive.number)} · ${esc(archive.subject)}</p>
  <div id="dispFormErrorSummary" class="form-error-summary archive-edit-error" role="alert" tabindex="-1" hidden>
    <h4 class="form-error-title" id="dispFormErrorTitle">Periksa isian disposisi:</h4>
    <ul class="error-summary-list"></ul>
    <p class="form-error-desc" hidden></p>
  </div>
  <form id="dispForm" data-managed-submit="true">
    <div class="field">
      <label for="dispSubsection">Tujuan subbagian <span class="field-req-text">(wajib)</span></label>
      <select id="dispSubsection" name="assignedSubsection"><option>${esc(archive.subsection)}</option></select>
    </div>
    <div class="field">
      <label for="dispRecipient">Penerima <span class="field-opt-text">(opsional)</span></label>
      <select id="dispRecipient" name="assignedUserId" disabled aria-describedby="dispRecipientHelp"><option value="">Tim subbagian ${esc(archive.subsection)}</option></select>
      <small id="dispRecipientHelp" class="field-help">Memuat penerima aktif…</small>
      <span id="dispRecipient-error" class="field-error" hidden></span>
    </div>
    <div class="field">
      <label for="dispInstruction">Instruksi pimpinan <span class="field-req-text">(wajib)</span></label>
      <textarea id="dispInstruction" name="instruction" rows="4" required maxlength="4000" placeholder="Tuliskan arahan tindak lanjut…" aria-describedby="dispInstructionHelp"></textarea>
      <small id="dispInstructionHelp" class="field-help">Tuliskan instruksi atau arahan pimpinan secara jelas.</small>
      <span id="dispInstruction-error" class="field-error" hidden></span>
    </div>
    <p class="archive-edit-error" id="dispError" role="alert" tabindex="-1" hidden></p>
    <button type="button" class="btn btn-soft" id="retryRecipients" hidden>Muat ulang penerima</button>
    <div id="dispFormStatus" class="form-status sr-only" role="status" aria-live="polite"></div>
    <div class="actions">
      <button type="button" class="btn btn-soft" id="cancelModal">Batal</button>
      <button type="submit" class="btn btn-primary" disabled id="sendDisposition">Kirim disposisi</button>
    </div>
  </form></section></div>`);

  const root=app.querySelector('#modalBack'),form=root.querySelector('form'),select=form.elements.assignedUserId,instruction=form.elements.instruction,submit=form.querySelector('[type="submit"]'),error=root.querySelector('#dispError'),summary=root.querySelector('#dispFormErrorSummary'),statusEl=root.querySelector('#dispFormStatus'),retry=root.querySelector('#retryRecipients');
  let ready=false,busy=false,loading=false,key=crypto.randomUUID();form.oninput=()=>{key=crypto.randomUUID();};
  root.querySelector('#closeModal').onclick=closeModal;root.querySelector('#cancelModal').onclick=closeModal;

  const fail=failure=>{
    let msg=failure.message;
    if(failure.status===401){
      msg='Sesi Anda telah berakhir. Formulir tetap dibuka agar instruksi Anda tidak hilang. Silakan salin instruksi Anda atau buka tab baru untuk masuk kembali.';
    }
    error.textContent=msg;
    error.hidden=false;
    if(summary){
      summary.innerHTML=`<h4 class="form-error-title">Gagal mengirim disposisi:</h4><p class="form-error-desc">${esc(msg)}</p>`;
      summary.hidden=false;
    }
    if(statusEl) statusEl.textContent='Gagal: '+msg;
    error.focus();
  };

  async function load(){
    if(loading)return;loading=true;retry.disabled=true;
    error.hidden=true;if(summary)summary.hidden=true;retry.hidden=true;
    try{const result=await api(`/api/archives/${encodeURIComponent(archive.id)}/disposition-recipients`);if(!root.isConnected||!isCurrent())return;
      select.innerHTML=`<option value="">Tim subbagian ${esc(archive.subsection)}</option>`+result.items.map(user=>`<option value="${esc(user.id)}">${esc(user.name)}</option>`).join('');
      root.querySelector('#dispRecipientHelp').textContent='Pilih tim atau satu orang. Tugas individu hanya diperbarui penerima dan admin/pimpinan. Tidak menambah akses lintas subbagian.';
      ready=true;select.disabled=false;submit.disabled=false;select.focus();
    }catch(failure){if(!root.isConnected||!isCurrent())return;fail(failure);retry.hidden=false;root.querySelector('#dispRecipientHelp').textContent='Penerima belum dapat dimuat; coba lagi.';}finally{loading=false;retry.disabled=false;}
  }
  retry.onclick=load;
  form.onsubmit=async event=>{
    event.preventDefault();if(!ready||busy)return;
    const instErr=root.querySelector('#dispInstruction-error');
    instruction.removeAttribute('aria-invalid');
    instruction.setAttribute('aria-describedby','dispInstructionHelp');
    if(instErr){ instErr.hidden=true; instErr.textContent=''; }
    error.hidden=true;
    if(summary){ summary.hidden=true; summary.innerHTML=''; }

    if(!instruction.value.trim()){
      instruction.setAttribute('aria-invalid','true');
      instruction.setAttribute('aria-describedby','dispInstruction-error dispInstructionHelp');
      if(instErr){ instErr.textContent='Instruksi pimpinan wajib diisi.'; instErr.hidden=false; }
      error.textContent='Instruksi pimpinan wajib diisi.';
      error.hidden=false;
      if(summary){
        summary.innerHTML=`<h4 class="form-error-title">Periksa isian disposisi:</h4><ul class="error-summary-list"><li><a href="#dispInstruction">Instruksi pimpinan wajib diisi.</a></li></ul>`;
        summary.hidden=false;
        summary.querySelector('a')?.addEventListener('click',e=>{e.preventDefault();instruction.focus();});
        summary.focus();
      }else{
        error.focus();
      }
      if(statusEl) statusEl.textContent='Gagal: instruksi pimpinan wajib diisi.';
      return;
    }

    busy=true;const values=Object.fromEntries(new FormData(form));for(const control of root.querySelectorAll('button,input,select,textarea'))control.disabled=true;form.dataset.submitting='true';form.setAttribute('aria-busy','true');
    if(statusEl) statusEl.textContent='Sedang mengirim disposisi…';
    try{await api(`/api/archives/${encodeURIComponent(archive.id)}/dispositions`,{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(values)});if(!root.isConnected||!isCurrent())return;delete form.dataset.submitting;if(statusEl)statusEl.textContent='Disposisi berhasil dikirim.';closeModal();await refresh();if(isCurrent())renderPage();toast('Disposisi berhasil dikirim.');}
    catch(failure){if(root.isConnected)fail(failure);else toast(failure.message,'error');}
    finally{busy=false;delete form.dataset.submitting;form.setAttribute('aria-busy','false');for(const control of root.querySelectorAll('button,input,select,textarea'))control.disabled=false;}
  };
  load();
}
