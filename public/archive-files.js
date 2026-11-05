export async function openFileHistory({id,api,app,esc,canUpload,closeModal,onSaved,toast,isCurrent}){
  const initial=await api('/api/archives/'+encodeURIComponent(id));if(!isCurrent())return;
  closeModal();
  app.insertAdjacentHTML('beforeend',`<div class="modal-back" id="modalBack"><section class="modal archive-files-dialog"><div class="modal-head"><h3>Berkas & riwayat versi</h3><button type="button" class="icon-btn" id="closeModal" aria-label="Tutup riwayat berkas">×</button></div><p>${esc(initial.number)} · ${esc(initial.subject)}</p><div id="archiveFilesContent"></div></section></div>`);
  const back=app.querySelector('#modalBack'),root=back.querySelector('#archiveFilesContent'),close=back.querySelector('#closeModal');
  let busy=false;
  close.onclick=()=>{if(!busy)closeModal();};
  const date=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Tidak diketahui';
  function setBusy(value,form){busy=value;form.toggleAttribute('data-submitting',value);root.setAttribute('aria-busy',String(value));for(const element of root.querySelectorAll('button,input,textarea'))element.disabled=value;close.disabled=value;}
  function render(archive){
    if(!back.isConnected)return;
    const documents=archive.documents.length?archive.documents:[{id:'document_primary',kind:'primary',title:'Dokumen utama',currentVersionId:null,versions:[]}];
    root.innerHTML=documents.map(document=>`<section class="archive-document" data-document="${esc(document.id)}"><h4>${esc(document.title)}</h4><p class="muted">${document.kind==='primary'?(archive.type==='outgoing'?'Berkas final surat keluar':'Pindaian surat masuk'):'Lampiran'} · ${document.versions.length} versi. Versi lama tetap disimpan.</p>
    ${document.versions.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Versi / berkas</th><th>Pengunggah / waktu (WIB)</th><th>Alasan</th><th>Aksi</th></tr></thead><tbody>${[...document.versions].reverse().map(version=>`<tr data-version="${version.number}"><td><b>v${version.number} · ${esc(version.fileName)}</b><br>${version.id===document.currentVersionId?'<span class="badge badge-done">Aktif</span>':''}<small>${version.size===null?'Ukuran tidak diketahui':(version.size/1024).toFixed(1)+' KB'}${version.legacy?' · Data lama':''}</small></td><td>${esc(version.uploadedByName||'Tidak diketahui')}<br><small>${esc(date(version.uploadedAt))}</small></td><td>${esc(version.reason||'Tidak dicatat')}</td><td>${version.available?`<a class="btn btn-soft" href="/api/files/${encodeURIComponent(version.fileId)}" target="_blank" rel="noopener">Unduh v${version.number}</a>${canUpload&&version.id!==document.currentVersionId?`<button type="button" class="btn btn-soft restore-version" data-id="${esc(version.id)}" data-number="${version.number}">Gunakan sebagai versi baru</button>`:''}`:'<span class="muted">Berkas belum tersedia</span>'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Berkas belum dilengkapi.</p>'}
    ${canUpload?`<form data-managed-submit="true" class="version-upload-form"><div class="field"><label>Berkas ${document.currentVersionId?'pengganti':'baru'}<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"></label></div><div class="field"><label>Alasan perubahan<textarea name="reason" maxlength="1000" ${document.currentVersionId?'required':''} placeholder="Jelaskan koreksi atau alasan penggantian"></textarea></label></div><p class="version-error archive-edit-error" role="alert" tabindex="-1" hidden></p><div class="actions"><button type="button" class="btn btn-soft reload-versions">Muat ulang riwayat</button><button type="submit" class="btn btn-primary">${document.currentVersionId?'Ganti berkas':'Unggah berkas'}</button></div><small class="muted">PDF, JPG/PNG, XLSX, DOCX · maksimal 15 MB. Muat ulang menghapus pilihan file/alasan yang belum dikirim.</small></form>`:''}</section>`).join('');
    for(const section of root.querySelectorAll('.archive-document')){
      const document=documents.find(item=>item.id===section.dataset.document),form=section.querySelector('form');if(!form)continue;
      const file=form.elements.file,reason=form.elements.reason,error=section.querySelector('.version-error');let key=crypto.randomUUID();const restoreKeys=new Map();
      form.oninput=()=>{key=crypto.randomUUID();restoreKeys.clear();};
      async function perform(body,requestKey){
        if(busy)return;error.hidden=true;setBusy(true,form);let result;
        try{
          result=await api(`/api/archives/${encodeURIComponent(id)}/files`,{method:'POST',headers:{'Idempotency-Key':requestKey},body:JSON.stringify({documentId:document.id,expectedVersionId:document.currentVersionId,...body})});
          if(result.id!==id||!Array.isArray(result.documents))throw Error('Respons unggah belum lengkap. Ulangi permintaan yang sama.');
        }catch(failure){result=null;error.textContent=failure.message;error.hidden=false;}
        finally{setBusy(false,form);}
        if(result){render(result);toast('Versi berkas berhasil disimpan.');try{await onSaved();}catch(failure){toast('Berkas tersimpan; daftar belum dapat diperbarui: '+failure.message,'error');}}
        else error.focus();
      }
      form.onsubmit=async event=>{
        event.preventDefault();if(busy)return;
        const selected=file.files[0];if(!selected){error.textContent='Pilih berkas yang akan diunggah.';error.hidden=false;error.focus();return;}
        const requestKey=key,reasonText=reason.value.trim();let data;setBusy(true,form);
        try{data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Berkas belum dapat dibaca.'));reader.readAsDataURL(selected);});}catch(failure){error.textContent=failure.message;error.hidden=false;error.focus();}finally{setBusy(false,form);}
        if(data)await perform({fileName:selected.name,mimeType:selected.type,data,...(document.currentVersionId||reasonText?{reason:reasonText}:{})},requestKey);
      };
      section.querySelector('.reload-versions').onclick=async()=>{if(busy)return;try{const fresh=await api('/api/archives/'+encodeURIComponent(id));render(fresh);}catch(failure){error.textContent=failure.message;error.hidden=false;}};
      for(const button of section.querySelectorAll('.restore-version'))button.onclick=async()=>{
        if(busy)return;let restoreKey=restoreKeys.get(button.dataset.id);if(!restoreKey){restoreKey=crypto.randomUUID();restoreKeys.set(button.dataset.id,restoreKey);}
        await perform({sourceVersionId:button.dataset.id,reason:reason.value.trim()||'Dibuat ulang dari versi '+button.dataset.number},restoreKey);
      };
    }
    const heading=root.querySelector('h4');if(heading){heading.tabIndex=-1;heading.focus();}
  }
  render(initial);
}
