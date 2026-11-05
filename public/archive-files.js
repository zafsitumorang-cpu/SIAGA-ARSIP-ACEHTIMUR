export async function openFileHistory({id,api,app,esc,readFile,canUpload,closeModal,onSaved,toast,isCurrent}){
  const initial=await api('/api/archives/'+encodeURIComponent(id));if(!isCurrent())return;
  closeModal();
  app.insertAdjacentHTML('beforeend',`<div class="modal-back" id="modalBack"><section class="modal archive-files-dialog"><div class="modal-head"><h3>Berkas & riwayat versi</h3><button type="button" class="icon-btn" id="closeModal" aria-label="Tutup riwayat berkas">×</button></div><p>${esc(initial.number)} · ${esc(initial.subject)}</p><div id="archiveFilesContent"></div></section></div>`);
  const back=app.querySelector('#modalBack'),root=back.querySelector('#archiveFilesContent'),close=back.querySelector('#closeModal');
  let busy=false;
  close.onclick=()=>{if(!busy)closeModal();};
  const date=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Tidak diketahui';
  function setBusy(value,form){busy=value;form.toggleAttribute('data-submitting',value);root.setAttribute('aria-busy',String(value));for(const element of root.querySelectorAll('button,input,textarea'))element.disabled=value;close.disabled=value;}
  async function saveVersion(form,body,requestKey){
    if(busy)return;const error=form.querySelector('.version-error');error.hidden=true;setBusy(true,form);let result;
    try{result=await api(`/api/archives/${encodeURIComponent(id)}/files`,{method:'POST',headers:{'Idempotency-Key':requestKey},body:JSON.stringify(body)});if(result.id!==id||!Array.isArray(result.documents))throw Error('Respons unggah belum lengkap. Ulangi permintaan yang sama.');}
    catch(failure){result=null;error.textContent=failure.message;error.hidden=false;}
    finally{setBusy(false,form);}
    if(result){render(result,body.documentId||(body.kind==='attachment'?result.documents.at(-1)?.id:null));toast('Berkas berhasil disimpan.');try{await onSaved();}catch(failure){toast('Berkas tersimpan; daftar belum dapat diperbarui: '+failure.message,'error');}}
    else error.focus();
  }
  function render(archive,focusId){
    if(!back.isConnected)return;
    const documents=[...archive.documents];if(!documents.some(document=>document.kind==='primary'))documents.unshift({id:'document_primary',kind:'primary',title:'Dokumen utama',currentVersionId:null,versions:[]});
    root.innerHTML=documents.map(document=>`<section class="archive-document" data-document="${esc(document.id)}"><h4>${esc(document.title)}</h4><p class="muted">${document.kind==='primary'?(archive.type==='outgoing'?'Berkas final surat keluar':'Pindaian surat masuk'):'Lampiran'} · ${document.versions.length} versi. Versi lama tetap disimpan.</p>
    ${document.versions.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Versi / berkas</th><th>Pengunggah / waktu (WIB)</th><th>Alasan</th><th>Aksi</th></tr></thead><tbody>${[...document.versions].reverse().map(version=>`<tr data-version="${version.number}"><td><b>v${version.number} · ${esc(version.fileName)}</b><br>${version.id===document.currentVersionId?'<span class="badge badge-done">Aktif</span>':''}<small>${version.size===null?'Ukuran tidak diketahui':(version.size/1024).toFixed(1)+' KB'}${version.legacy?' · Data lama':''}</small></td><td>${esc(version.uploadedByName||'Tidak diketahui')}<br><small>${esc(date(version.uploadedAt))}</small></td><td>${esc(version.reason||'Tidak dicatat')}</td><td>${version.available?`<a class="btn btn-soft" href="/api/files/${encodeURIComponent(version.fileId)}" target="_blank" rel="noopener">Unduh v${version.number}</a>${canUpload&&version.id!==document.currentVersionId?`<button type="button" class="btn btn-soft restore-version" data-id="${esc(version.id)}" data-number="${version.number}">Gunakan sebagai versi baru</button>`:''}`:'<span class="muted">Berkas belum tersedia</span>'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Berkas belum dilengkapi.</p>'}
    ${canUpload?`<form data-managed-submit="true" class="version-upload-form"><div class="field"><label>Berkas ${document.currentVersionId?'pengganti':'baru'}<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"></label></div><div class="field"><label>Alasan perubahan<textarea name="reason" maxlength="1000" ${document.currentVersionId?'required':''} placeholder="Jelaskan koreksi atau alasan penggantian"></textarea></label></div><p class="version-error archive-edit-error" role="alert" tabindex="-1" hidden></p><div class="actions"><button type="button" class="btn btn-soft reload-versions">Muat ulang riwayat</button><button type="submit" class="btn btn-primary">${document.currentVersionId?'Ganti berkas':'Unggah berkas'}</button></div><small class="muted">PDF, JPG/PNG, XLSX, DOCX · maksimal 15 MB. Muat ulang menghapus pilihan file/alasan yang belum dikirim.</small></form>`:''}</section>`).join('')+(canUpload?`<section class="archive-document attachment-create"><h4>Tambah lampiran</h4><form data-managed-submit="true" class="attachment-create-form"><div class="field"><label>Nama lampiran<input name="title" required maxlength="200" placeholder="Contoh: Daftar peserta"></label></div><div class="field"><label>Berkas lampiran<input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"></label></div><p class="version-error archive-edit-error" role="alert" tabindex="-1" hidden></p><button class="btn btn-primary" type="submit">Tambah lampiran</button><p class="muted">Setiap lampiran punya riwayat versinya sendiri; dokumen utama tetap terpisah.</p></form></section>`:'');
    for(const section of root.querySelectorAll('.archive-document[data-document]')){
      const document=documents.find(item=>item.id===section.dataset.document),form=section.querySelector('form');if(!form)continue;
      const file=form.elements.file,reason=form.elements.reason,error=section.querySelector('.version-error');let key=crypto.randomUUID();const restoreKeys=new Map();
      form.oninput=()=>{key=crypto.randomUUID();restoreKeys.clear();};
      const perform=(body,requestKey)=>saveVersion(form,{documentId:document.id,expectedVersionId:document.currentVersionId,...body},requestKey);
      form.onsubmit=async event=>{
        event.preventDefault();if(busy)return;
        const selected=file.files[0];if(!selected){error.textContent='Pilih berkas yang akan diunggah.';error.hidden=false;error.focus();return;}
        const requestKey=key,reasonText=reason.value.trim();let data;setBusy(true,form);
        try{data=await readFile(selected);}catch(failure){error.textContent=failure.message;error.hidden=false;error.focus();}finally{setBusy(false,form);}
        if(data)await perform({fileName:selected.name,mimeType:selected.type,data,...(document.currentVersionId||reasonText?{reason:reasonText}:{})},requestKey);
      };
      section.querySelector('.reload-versions').onclick=async()=>{if(busy)return;try{const fresh=await api('/api/archives/'+encodeURIComponent(id));render(fresh);}catch(failure){error.textContent=failure.message;error.hidden=false;}};
      for(const button of section.querySelectorAll('.restore-version'))button.onclick=async()=>{
        if(busy)return;let restoreKey=restoreKeys.get(button.dataset.id);if(!restoreKey){restoreKey=crypto.randomUUID();restoreKeys.set(button.dataset.id,restoreKey);}
        await perform({sourceVersionId:button.dataset.id,reason:reason.value.trim()||'Dibuat ulang dari versi '+button.dataset.number},restoreKey);
      };
    }
    const attachmentForm=root.querySelector('.attachment-create-form');
    if(attachmentForm){let key=crypto.randomUUID();attachmentForm.oninput=()=>{key=crypto.randomUUID();};attachmentForm.onsubmit=async event=>{
      event.preventDefault();if(busy)return;const file=attachmentForm.elements.file.files[0],title=attachmentForm.elements.title.value.trim(),requestKey=key;if(!file)return;
      let data;setBusy(true,attachmentForm);try{data=await readFile(file);}catch(failure){const error=attachmentForm.querySelector('.version-error');error.textContent=failure.message;error.hidden=false;error.focus();}finally{setBusy(false,attachmentForm);}
      if(data)await saveVersion(attachmentForm,{kind:'attachment',documentTitle:title,expectedVersionId:null,fileName:file.name,mimeType:file.type,data},requestKey);
    };}
    const target=[...root.querySelectorAll('[data-document]')].find(element=>element.dataset.document===focusId)||root;
    const heading=target.querySelector('h4');if(heading){heading.tabIndex=-1;heading.focus();}
  }
  render(initial);
}
