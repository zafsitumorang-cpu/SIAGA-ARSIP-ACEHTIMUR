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
  return [...new Set([...administrativeArchiveCategories, ...(Array.isArray(configured) ? configured : [])])].includes(category);
}
