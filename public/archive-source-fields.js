export function archiveSourceFields(values,esc,prefix){
  const field=(name,label,max)=>`<div class="field"><label for="${prefix}-${name}">${label}</label><input id="${prefix}-${name}" name="${name}" maxlength="${max}" value="${esc(values[name]||'')}"></div>`;
  return `<fieldset class="archive-source-fields"><legend>Indeks dan sumber arsip</legend><p class="muted">Nomor agenda/kode mengikuti aturan kantor; kosongkan bila belum ditetapkan. Indeks sistem tetap terpisah. Referensi sumber hanya dicatat, tidak diambil otomatis.</p>${values.systemIndex?`<p>Indeks sistem: <code>${esc(values.systemIndex)}</code> · tahun ${esc(values.year)}</p>`:''}<div class="form-grid">${field('agendaNumber','Nomor agenda (opsional)',200)}${field('classificationCode','Kode klasifikasi (opsional)',100)}<div class="field"><label for="${prefix}-sourceType">Jenis sumber</label><select id="${prefix}-sourceType" name="sourceType">${[['unknown','Belum diketahui'],['physical','Arsip fisik'],['drive','Google Drive'],['digital','Sumber digital lain'],['other','Sumber lainnya']].map(([value,label])=>`<option value="${value}" ${value===(values.sourceType||'unknown')?'selected':''}>${label}</option>`).join('')}</select></div>${field('physicalLocation','Lokasi fisik (wajib jika sumber fisik)',500)}${field('sourceReference','Referensi sumber (ID/tautan/lokasi asal)',1000)}</div></fieldset>`;
}
export function bindArchiveSourceFields(form){
  const type=form.elements.sourceType;if(!type)return;
  function toggle(){form.elements.physicalLocation.required=type.value==='physical';form.elements.sourceReference.required=['drive','digital','other'].includes(type.value);}
  type.addEventListener('change',toggle);toggle();
}
