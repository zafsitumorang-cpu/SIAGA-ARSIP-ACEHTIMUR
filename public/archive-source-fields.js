export function archiveSourceFields(values,esc,prefix){
  const isPhysical = (values.sourceType || 'unknown') === 'physical';
  const isRefReq = ['drive', 'digital', 'other'].includes(values.sourceType);

  return `<fieldset class="archive-source-fields"><legend>Indeks dan sumber arsip</legend>
    <p class="muted">Nomor agenda/kode mengikuti aturan kantor; kosongkan bila belum ditetapkan. Indeks sistem tetap terpisah. Referensi sumber hanya dicatat, tidak diambil otomatis.</p>
    ${values.systemIndex ? `<p>Indeks sistem: <code>${esc(values.systemIndex)}</code> · tahun ${esc(values.year)}</p>` : ''}
    <div class="form-grid">
      <div class="field">
        <label for="${prefix}-agendaNumber">Nomor agenda <span class="field-opt-text">(opsional)</span></label>
        <input id="${prefix}-agendaNumber" name="agendaNumber" maxlength="200" value="${esc(values.agendaNumber||'')}">
        <span id="${prefix}-agendaNumber-error" class="field-error" role="alert" hidden></span>
      </div>
      <div class="field">
        <label for="${prefix}-classificationCode">Kode klasifikasi <span class="field-opt-text">(opsional)</span></label>
        <input id="${prefix}-classificationCode" name="classificationCode" maxlength="100" value="${esc(values.classificationCode||'')}">
        <span id="${prefix}-classificationCode-error" class="field-error" role="alert" hidden></span>
      </div>
      <div class="field">
        <label for="${prefix}-sourceType">Jenis sumber <span class="field-req-text">(wajib)</span></label>
        <select id="${prefix}-sourceType" name="sourceType">
          ${[['unknown','Belum diketahui'],['physical','Arsip fisik'],['drive','Google Drive'],['digital','Sumber digital lain'],['other','Sumber lainnya']].map(([value,label])=>`<option value="${value}" ${value===(values.sourceType||'unknown')?'selected':''}>${label}</option>`).join('')}
        </select>
        <span id="${prefix}-sourceType-error" class="field-error" role="alert" hidden></span>
      </div>
      <div class="field">
        <label for="${prefix}-physicalLocation">Lokasi fisik <span id="${prefix}-physicalLocation-req" class="${isPhysical?'field-req-text':'field-opt-text'}">${isPhysical?'(wajib untuk arsip fisik)':'(opsional)'}</span></label>
        <input id="${prefix}-physicalLocation" name="physicalLocation" maxlength="500" value="${esc(values.physicalLocation||'')}" aria-describedby="${prefix}-physicalLocation-help">
        <small id="${prefix}-physicalLocation-help" class="field-help">Wajib jika jenis sumber adalah arsip fisik.</small>
        <span id="${prefix}-physicalLocation-error" class="field-error" role="alert" hidden></span>
      </div>
      <div class="field">
        <label for="${prefix}-sourceReference">Referensi sumber <span id="${prefix}-sourceReference-req" class="${isRefReq?'field-req-text':'field-opt-text'}">${isRefReq?'(wajib untuk sumber ini)':'(opsional)'}</span></label>
        <input id="${prefix}-sourceReference" name="sourceReference" maxlength="1000" value="${esc(values.sourceReference||'')}" aria-describedby="${prefix}-sourceReference-help">
        <small id="${prefix}-sourceReference-help" class="field-help">ID/tautan Google Drive atau lokasi sumber digital asal.</small>
        <span id="${prefix}-sourceReference-error" class="field-error" role="alert" hidden></span>
      </div>
    </div>
  </fieldset>`;
}

export function bindArchiveSourceFields(form){
  const type=form.elements.sourceType;
  if(!type)return;
  const prefix=type.id ? type.id.split('-')[0] : 'create';

  function toggle(){
    const isPhysical = type.value === 'physical';
    const isRefReq = ['drive', 'digital', 'other'].includes(type.value);

    const physInput = form.elements.physicalLocation;
    const physReq = form.querySelector(`#${prefix}-physicalLocation-req`);
    if(physInput){
      physInput.required = isPhysical;
      if(isPhysical){
        physInput.setAttribute('aria-required','true');
        if(physReq){ physReq.textContent='(wajib untuk arsip fisik)'; physReq.className='field-req-text'; }
      }else{
        physInput.removeAttribute('aria-required');
        if(physReq){ physReq.textContent='(opsional)'; physReq.className='field-opt-text'; }
      }
    }

    const refInput = form.elements.sourceReference;
    const refReq = form.querySelector(`#${prefix}-sourceReference-req`);
    if(refInput){
      refInput.required = isRefReq;
      if(isRefReq){
        refInput.setAttribute('aria-required','true');
        if(refReq){ refReq.textContent='(wajib untuk sumber ini)'; refReq.className='field-req-text'; }
      }else{
        refInput.removeAttribute('aria-required');
        if(refReq){ refReq.textContent='(opsional)'; refReq.className='field-opt-text'; }
      }
    }
  }

  type.addEventListener('change',toggle);
  toggle();
}
