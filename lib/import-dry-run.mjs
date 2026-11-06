import {validateData} from './store.mjs';
import {isSubsection} from './subsection-taxonomy.mjs';

const archiveTypes = new Set(['incoming','outgoing','administrative']);
const dispositionStatuses = new Set(['Belum ditindaklanjuti','Sedang diproses','Selesai']);
const sourceTypes = new Set(['unknown','physical','drive','digital','other']);
const idPattern = /^[A-Za-z0-9._:-]{1,160}$/;

function issue(code, message, path = '') { return {code, message, ...(path ? {path} : {})}; }
function duplicateValues(items, value) {
  const groups = new Map();
  for (const item of items) { const key = value(item); if (!key) continue; const ids = groups.get(key) || []; ids.push(item.id); groups.set(key, ids); }
  return [...groups].filter(([, ids]) => ids.length > 1).map(([value, ids]) => ({value, ids}));
}

/**
 * Validate a JSON snapshot before any import side effect. The function is pure
 * and intentionally reports metadata only; passwords, file contents and
 * private payloads never appear in the result.
 */
export function dryRunImport(input) {
  const errors = [], warnings = [], duplicates = [];
  let data;
  try { data = structuredClone(input); validateData(data); }
  catch (error) { return {ok:false, counts:{}, errors:[issue('invalid_snapshot', error.message)], warnings, duplicates, retry:{idempotent:false, key:'id'}}; }

  const collections = ['users','archives','classifications','categories','audit','notifications'];
  const counts = Object.fromEntries(collections.map(key => [key, data[key].length]));
  const mappings = data.mappings || {};
  if (data.mappings !== undefined && (!mappings || typeof mappings !== 'object' || Array.isArray(mappings))) errors.push(issue('invalid_mappings','Pemetaan harus berupa objek dengan array classifications, subsections dan sources.','mappings'));
  for (const key of ['classifications','subsections','sources']) {
    if (mappings[key] !== undefined && !Array.isArray(mappings[key])) errors.push(issue('invalid_mapping_rows',`Pemetaan ${key} harus berupa array.`,`mappings.${key}`));
  }
  for (const key of collections) {
    const seen = new Set();
    for (const [index, item] of data[key].entries()) {
      if (!item || typeof item !== 'object') { errors.push(issue('invalid_record','Record harus berupa objek',`${key}[${index}]`)); continue; }
      if (typeof item.id !== 'string' || !idPattern.test(item.id)) errors.push(issue('invalid_id','ID wajib berupa teks tanpa karakter kontrol',`${key}[${index}].id`));
      else if (seen.has(item.id)) errors.push(issue('duplicate_id','ID muncul lebih dari sekali',`${key}[${index}].id`));
      else seen.add(item.id);
    }
  }
  const usernames = duplicateValues(data.users, item => String(item.username || '').trim().toLowerCase());
  for (const duplicate of usernames) duplicates.push({kind:'username',...duplicate});
  for (const duplicate of duplicateValues(data.archives, item => String(item.number || '').trim())) duplicates.push({kind:'archive_number',...duplicate});
  for (const duplicate of duplicateValues(data.archives, item => String(item.fileId || '').trim())) duplicates.push({kind:'file_id',...duplicate});
  if (usernames.length) errors.push(issue('duplicate_username','Username harus unik setelah dinormalisasi.'));
  if (duplicates.some(item => item.kind === 'archive_number')) warnings.push(issue('duplicate_archive_number','Nomor arsip berulang perlu dikonfirmasi operator sebelum impor.'));
  if (duplicates.some(item => item.kind === 'file_id')) errors.push(issue('duplicate_file_id','File ID utama dipakai oleh lebih dari satu arsip.'));

  const userIds = new Set(data.users.map(item => item.id));
  const archiveIds = new Set(data.archives.map(item => item.id));
  for (const [index, archive] of data.archives.entries()) {
    const path = `archives[${index}]`;
    if (!archiveTypes.has(archive.type)) errors.push(issue('invalid_archive_type','Jenis arsip tidak dikenal',`${path}.type`));
    for (const field of ['number','subject','letterDate','subsection']) if (!String(archive[field] || '').trim()) errors.push(issue('missing_archive_field',`Kolom ${field} wajib diisi`,`${path}.${field}`));
    if (archive.subsection && !isSubsection(archive.subsection)) errors.push(issue('invalid_subsection','Subbagian tidak cocok dengan taksonomi resmi/alias legacy',`${path}.subsection`));
    if (archive.sourceType && !sourceTypes.has(archive.sourceType)) errors.push(issue('invalid_source_type','Jenis sumber tidak dikenal',`${path}.sourceType`));
    if (archive.sourceType === 'physical' && !String(archive.physicalLocation || '').trim()) errors.push(issue('missing_source_identity','Sumber fisik memerlukan lokasi sumber',`${path}.physicalLocation`));
    if (['drive','digital','other'].includes(archive.sourceType) && !String(archive.sourceReference || '').trim()) errors.push(issue('missing_source_identity','Sumber digital/rujukan memerlukan identitas sumber',`${path}.sourceReference`));
    if (archive.createdBy && !userIds.has(archive.createdBy)) errors.push(issue('unknown_user','Pencatat arsip tidak ditemukan pada batch',`${path}.createdBy`));
    if (!Array.isArray(archive.dispositions)) errors.push(issue('invalid_dispositions','Disposisi harus berupa array',`${path}.dispositions`));
    for (const [dIndex, disposition] of (archive.dispositions || []).entries()) {
      const dPath = `${path}.dispositions[${dIndex}]`;
      if (!disposition.id || !idPattern.test(String(disposition.id))) errors.push(issue('invalid_id','ID disposisi tidak valid',`${dPath}.id`));
      if (!dispositionStatuses.has(disposition.status)) errors.push(issue('invalid_disposition_status','Status disposisi tidak dikenal',`${dPath}.status`));
      if (disposition.assignedUserId && !userIds.has(disposition.assignedUserId)) errors.push(issue('unknown_user','Penerima disposisi tidak ditemukan pada batch',`${dPath}.assignedUserId`));
      if (disposition.archiveId && disposition.archiveId !== archive.id) errors.push(issue('archive_reference_mismatch','Referensi arsip disposisi tidak cocok',`${dPath}.archiveId`));
    }
    if (archive.id && !archiveIds.has(archive.id)) errors.push(issue('unknown_archive','Referensi arsip tidak ditemukan',`${path}.id`));
  }
  const dispositionIds = data.archives.flatMap(archive => (archive.dispositions || []).map(disposition => disposition.id).filter(Boolean));
  if (new Set(dispositionIds).size !== dispositionIds.length) errors.push(issue('duplicate_disposition_id','ID disposisi harus unik dalam seluruh batch.'));
  const missingMetadata = data.archives.filter(archive => !archive.classification && !archive.classificationCode).length;
  if (missingMetadata) warnings.push(issue('missing_classification','Sebagian arsip belum memiliki klasifikasi; pemetaan manual diperlukan.'));
  const duplicateCount = duplicates.length;
  return {
    ok: errors.length === 0,
    counts,
    errors,
    warnings,
    duplicates,
    retry: {idempotent: errors.length === 0 && duplicateCount === 0, key:'id', note:'Batch yang sama hanya boleh dijalankan ulang setelah operator menyimpan laporan ini dan memeriksa ID.'}
  };
}
