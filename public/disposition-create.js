export function openDispositionForm({archive,app,api,esc,closeModal,refresh,renderPage,toast}){
  app.insertAdjacentHTML('beforeend',`<div class="modal-back" id="modalBack"><section class="modal"><div class="modal-head"><h3>Buat disposisi</h3><button class="icon-btn" id="closeModal" aria-label="Tutup">×</button></div><p class="muted">${esc(archive.number)} · ${esc(archive.subject)}</p><form id="dispForm" data-managed-submit="true"><div class="field"><label for="dispSubsection">Tujuan subbagian</label><select id="dispSubsection" name="assignedSubsection"><option>${esc(archive.subsection)}</option></select></div><div class="field"><label for="dispRecipient">Penerima</label><select id="dispRecipient" name="assignedUserId" disabled><option value="">Tim subbagian ${esc(archive.subsection)}</option></select><small id="dispRecipientHelp">Memuat penerima aktif…</small></div><div class="field"><label for="dispInstruction">Instruksi pimpinan (wajib)</label><textarea id="dispInstruction" name="instruction" rows="4" required maxlength="4000" placeholder="Tuliskan arahan tindak lanjut…"></textarea></div><p class="archive-edit-error" id="dispError" role="alert" tabindex="-1" hidden></p><button type="button" class="btn btn-soft" id="retryRecipients" hidden>Muat ulang penerima</button><div class="actions"><button type="button" class="btn btn-soft" id="cancelModal">Batal</button><button type="submit" class="btn btn-primary" disabled>Kirim disposisi</button></div></form></section></div>`);
  const root=app.querySelector('#modalBack'),form=root.querySelector('form'),select=form.elements.assignedUserId,submit=form.querySelector('[type="submit"]'),error=root.querySelector('#dispError'),retry=root.querySelector('#retryRecipients');
  let ready=false,busy=false;
  root.querySelector('#closeModal').onclick=closeModal;root.querySelector('#cancelModal').onclick=closeModal;
  const fail=failure=>{error.textContent=failure.message;error.hidden=false;error.focus();};
  async function load(){
    error.hidden=true;retry.hidden=true;
    try{const result=await api(`/api/archives/${encodeURIComponent(archive.id)}/disposition-recipients`);if(!root.isConnected)return;
      select.innerHTML=`<option value="">Tim subbagian ${esc(archive.subsection)}</option>`+result.items.map(user=>`<option value="${esc(user.id)}">${esc(user.name)}</option>`).join('');
      root.querySelector('#dispRecipientHelp').textContent='Pilih tim atau satu orang. Tugas individu hanya diperbarui penerima dan admin/pimpinan. Tidak menambah akses lintas subbagian.';
      ready=true;select.disabled=false;submit.disabled=false;select.focus();
    }catch(failure){if(!root.isConnected)return;fail(failure);retry.hidden=false;root.querySelector('#dispRecipientHelp').textContent='Penerima belum dapat dimuat; coba lagi.';}
  }
  retry.onclick=load;
  form.onsubmit=async event=>{event.preventDefault();if(!ready||busy)return;busy=true;error.hidden=true;const values=Object.fromEntries(new FormData(form));for(const control of form.elements)control.disabled=true;form.dataset.submitting='true';
    try{await api(`/api/archives/${encodeURIComponent(archive.id)}/dispositions`,{method:'POST',body:JSON.stringify(values)});if(!root.isConnected)return;delete form.dataset.submitting;closeModal();await refresh();renderPage();toast('Disposisi berhasil dikirim.');}
    catch(failure){if(root.isConnected)fail(failure);else toast(failure.message,'error');}
    finally{busy=false;delete form.dataset.submitting;for(const control of form.elements)control.disabled=false;}
  };
  load();
}
