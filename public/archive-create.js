import {setupFormA11y} from './form-a11y.js';

export function bindArchiveCreate({form,api,readFile,onClose,onSaved,toast}){
  form.dataset.managedSubmit='true';
  const metadata=form.querySelector('#archiveMetadata'),upload=form.querySelector('[name=upload]'),submit=form.querySelector('#saveArchive');
  const notice=form.querySelector('#archiveSaveNotice'),error=form.querySelector('#archiveSaveError');
  const summary=form.querySelector('#archiveFormErrorSummary');
  const closeButtons=[form.closest('.modal').querySelector('#closeModal'),form.querySelector('#cancelModal')];
  const a11y=setupFormA11y(form,{
    errorSummaryId:'archiveFormErrorSummary',
    statusId:'archiveFormStatus',
    summaryTitle:'Periksa kembali isian arsip:'
  });

  const createKey=crypto.randomUUID();let uploadKey=crypto.randomUUID(),values=null,created=null,busy=false,uncertain=false,completed=false;
  function paint(){
    metadata.disabled=busy||Boolean(created)||uncertain;
    if(upload)upload.disabled=busy;
    for(const button of closeButtons)button.disabled=busy;
    submit.disabled=busy||Boolean(created&&upload&&!upload.files.length);
    submit.textContent=busy?(created?'Mengunggah…':'Menyimpan…'):created?'Ulangi unggah':uncertain?'Periksa dan lanjutkan':'Simpan arsip';
    form.setAttribute('aria-busy',String(busy));
    closeButtons[1].textContent=created?'Selesai tanpa berkas':'Batal';
    notice.hidden=!created&&!uncertain;
    notice.textContent=created?'Metadata sudah tersimpan. Unggah berikutnya memakai arsip yang sama.':uncertain?'Status simpan belum dapat dipastikan. Klik Periksa dan lanjutkan untuk memeriksa permintaan yang sama.':'';
  }
  async function refreshSaved(){try{await onSaved();}catch(failure){toast((created?'Arsip sudah tersimpan. ':'')+'Daftar belum dapat diperbarui: '+failure.message,'error');}}
  async function close(){
    if(busy)return;
    completed=true;onClose();
    if(created){toast('Metadata tetap tersimpan; berkas dapat dilengkapi melalui daftar arsip.');await refreshSaved();}
    else if(uncertain){toast('Periksa daftar arsip sebelum memulai pencatatan baru; status permintaan sebelumnya belum pasti.','error');await refreshSaved();}
  }
  for(const button of closeButtons)button.onclick=close;
  if(upload)upload.onchange=()=>{uploadKey=crypto.randomUUID();paint();};
  // Generic Escape handling also uses this close path, including refresh after partial success.
  form._closeArchive=close;
  form.onsubmit=async event=>{
    event.preventDefault();if(busy||completed)return;
    const file=upload?.files[0];
    if(created&&!file)return;

    if(!created){
      if(!a11y.validate()){
        const firstErr=form.querySelector('[aria-invalid="true"]');
        const msg=firstErr?`${a11y.getFieldLabel(firstErr)} wajib diisi.`:'Lengkapi isian formulir.';
        if(error){
          error.textContent=msg;
          error.hidden=false;
        }
        return;
      }
    }

    if(!created&&!values){values=Object.fromEntries(new FormData(form));delete values.upload;}
    busy=true;form.dataset.submitting='true';
    if(error)error.hidden=true;
    a11y.setSubmitting(created?'Sedang mengunggah berkas…':'Sedang menyimpan metadata arsip…');
    paint();let success=false;
    try{
      if(!created){
        const result=await api('/api/archives',{method:'POST',headers:{'Idempotency-Key':createKey},body:JSON.stringify(values)});
        if(typeof result.id!=='string')throw Error('Respons simpan belum lengkap.');
        created=result;uncertain=false;paint();
      }
      if(file){
        a11y.setSubmitting('Sedang mengunggah berkas…');
        const data=await readFile(file);
        const result=await api(`/api/archives/${encodeURIComponent(created.id)}/files`,{method:'POST',headers:{'Idempotency-Key':uploadKey},body:JSON.stringify({fileName:file.name,mimeType:file.type,data})});
        if(result.id!==created.id)throw Error('Respons unggah belum lengkap.');
      }
      success=true;completed=true;
    }catch(failure){
      if(!created){
        if(!uncertain&&[400,401,403,413,422,429].includes(failure.status))values=null;
        else uncertain=true;
      }
      let msg=(created?'Metadata sudah tersimpan, tetapi unggah belum selesai. ':'')+failure.message;
      if(failure.status===401){
        msg='Sesi Anda telah berakhir. Formulir dan berkas tetap terbuka agar draf Anda tidak hilang. Silakan salin data Anda atau buka tab baru untuk masuk kembali.';
      }
      if(error){
        error.textContent=msg;
        error.hidden=false;
      }
      a11y.setFailure(msg);
    }finally{
      busy=false;delete form.dataset.submitting;paint();
    }
    if(success){
      a11y.setSuccess(file?'Arsip dan berkas berhasil disimpan.':'Metadata berhasil disimpan.');
      onClose();
      toast(file?'Arsip dan berkas berhasil disimpan.':'Metadata berhasil disimpan. Berkas dapat dilengkapi pengunggah.');
      await refreshSaved();
    }else{
      if(error)error.focus();
      else if(summary)summary.focus();
    }
  };
  paint();
}
