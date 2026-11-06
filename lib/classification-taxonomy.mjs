import { fail, text } from './security.mjs';

// Classifications are persisted as strings in older demo exports.  The helpers
// below keep those references readable while allowing new records to carry the
// master fields required by the RA workflow.
export function classificationLabel(value) {
  return typeof value === 'string' ? value : String(value?.label || '');
}

export function classificationCode(value) {
  return typeof value === 'object' && value ? String(value.code || '') : '';
}

export function classificationAliases(value) {
  return typeof value === 'object' && value && Array.isArray(value.aliases)
    ? value.aliases.filter(alias => typeof alias === 'string' && alias.trim())
    : [];
}

export function classificationActive(value) {
  return typeof value !== 'object' || value === null || value.active !== false;
}

export function classificationRecords(list = []) {
  return list.map(value => {
    if (typeof value === 'string') return { id: value, code: '', label: value, description: '', active: true, aliases: [], legacy: true };
    return {
      id: String(value?.id || value?.code || value?.label || ''),
      code: String(value?.code || ''),
      label: String(value?.label || ''),
      description: String(value?.description || ''),
      active: value?.active !== false,
      aliases: classificationAliases(value),
      createdBy: value?.createdBy || null,
      createdAt: value?.createdAt || null,
      updatedAt: value?.updatedAt || null
    };
  }).filter(item => item.label);
}

export function classificationLabels(list = []) { return classificationRecords(list).map(item => item.label); }

export function findClassification(list, key) {
  const wanted = String(key || '').trim();
  if (!wanted) return null;
  return list.find(value => {
    const item = classificationRecords([value])[0];
    return item && (item.id === wanted || item.code === wanted || item.label === wanted || item.aliases.includes(wanted));
  }) || null;
}

export function hasClassification(list, key, { activeOnly = false } = {}) {
  const item = findClassification(list, key);
  return Boolean(item && (!activeOnly || classificationActive(item)));
}

export function classificationForArchive(list, key) {
  const item = findClassification(list, key);
  return item && classificationActive(item) ? item : null;
}

export function validateClassificationInput(body, { partial = false } = {}) {
  const label = body.label === undefined && partial ? undefined : text(String(body.label ?? ''), 'Nama klasifikasi', 200, true);
  const code = body.code === undefined && partial ? undefined : text(String(body.code ?? ''), 'Kode klasifikasi', 50, false);
  if (code !== undefined && code && !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(code)) fail(422, 'Kode klasifikasi hanya boleh berisi huruf, angka, titik, garis bawah, garis miring atau tanda hubung.');
  const description = body.description === undefined && partial ? undefined : text(String(body.description ?? ''), 'Deskripsi klasifikasi', 1000, false);
  const active = body.active === undefined ? (partial ? undefined : true) : Boolean(body.active);
  return { label, code, description, active };
}

export function classificationPayload(list = []) { return classificationRecords(list); }
