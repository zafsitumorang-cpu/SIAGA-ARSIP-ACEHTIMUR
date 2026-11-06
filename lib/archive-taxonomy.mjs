export const administrativeArchiveCategories = [
  'Surat Masuk', 'Surat Keluar', 'Arsip Administrasi Umum',
  'Surat Tugas', 'Laporan Hasil Pengawasan', 'Dokumen Kegiatan',
  'Keuangan', 'Kepegawaian', 'Produk Hukum', 'Notulensi',
  'Dokumentasi Kegiatan', 'Dokumen Pendukung'
];

export function defaultArchiveCategory(type) {
  return type === 'incoming' ? 'Surat Masuk' : type === 'outgoing' ? 'Surat Keluar' : 'Arsip Administrasi Umum';
}

export function isArchiveCategory(category, configured = []) {
  return hasArchiveCategory([...administrativeArchiveCategories, ...(Array.isArray(configured) ? configured : [])], category);
}

export function categoryLabel(value) { return typeof value === 'string' ? value : String(value?.label || ''); }
export function categoryAliases(value) { return typeof value === 'object' && value && Array.isArray(value.aliases) ? value.aliases.filter(alias => typeof alias === 'string' && alias.trim()) : []; }
export function categoryRecords(list = []) {
  return list.map(value => typeof value === 'string'
    ? { id: value, code: '', label: value, description: '', active: true, aliases: [], legacy: true }
    : { id: String(value?.id || value?.code || value?.label || ''), code: String(value?.code || ''), label: String(value?.label || ''), description: String(value?.description || ''), active: value?.active !== false, aliases: categoryAliases(value), createdBy: value?.createdBy || null, createdAt: value?.createdAt || null, updatedAt: value?.updatedAt || null })
    .filter(item => item.label);
}
export function categoryLabels(list = []) { return categoryRecords(list).map(item => item.label); }
export function findArchiveCategory(list, key) {
  const wanted = String(key || '').trim(); if (!wanted) return null;
  return list.find(value => { const item = categoryRecords([value])[0]; return item && (item.id === wanted || item.code === wanted || item.label === wanted || item.aliases.includes(wanted)); }) || null;
}
export function hasArchiveCategory(list, key, { activeOnly = false } = {}) {
  const item = findArchiveCategory(list, key); return Boolean(item && (!activeOnly || item.active !== false));
}
export function validateCategoryInput(body, { partial = false } = {}) {
  const invalid = (message) => { const error = new Error(message); error.status = 422; throw error; };
  const text = (value, label, max, required = false) => { if (typeof value !== 'string' || value.length > max || (required && !value.trim())) invalid(`${label} tidak valid.`); return value.trim(); };
  const label = body.label === undefined && partial ? undefined : text(String(body.label ?? ''), 'Nama kategori', 200, true);
  const code = body.code === undefined && partial ? undefined : text(String(body.code ?? ''), 'Kode kategori', 50, false);
  if (code !== undefined && code && !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(code)) invalid('Kode kategori hanya boleh berisi huruf, angka, titik, garis bawah, garis miring atau tanda hubung.');
  const description = body.description === undefined && partial ? undefined : text(String(body.description ?? ''), 'Deskripsi kategori', 1000, false);
  const active = body.active === undefined ? (partial ? undefined : true) : Boolean(body.active);
  return { label, code, description, active };
}
