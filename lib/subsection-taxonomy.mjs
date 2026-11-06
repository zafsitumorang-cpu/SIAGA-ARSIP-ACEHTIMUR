// Official unit names follow the Rancangan Aksi Perubahan. Legacy aliases are
// accepted while dummy data and older records are migrated incrementally.
export const subsectionDefinitions = [
  { id: 'administrasi', label: 'Administrasi', aliases: ['Administrasi'] },
  { id: 'hukum_sengketa', label: 'Hukum dan Sengketa Proses', aliases: ['Hukum'] },
  { id: 'pencegahan_ppm_humas', label: 'Pencegahan, Partisipasi Masyarakat, dan Humas', aliases: ['Pengawasan'] },
  { id: 'penanganan_pelanggaran_datinfo', label: 'Penanganan Pelanggaran dan Data Informasi', aliases: ['PPPS'] }
];

export const officialSubsections = subsectionDefinitions.map(item => item.label);
const byAlias = new Map(subsectionDefinitions.flatMap(item => [item.label, ...item.aliases].map(value => [value.toLocaleLowerCase('id-ID'), item])));

export function subsectionDefinition(value) {
  return typeof value === 'string' ? byAlias.get(value.trim().toLocaleLowerCase('id-ID')) || null : null;
}

export function isSubsection(value) { return Boolean(subsectionDefinition(value)); }
export function subsectionLabel(value) { return subsectionDefinition(value)?.label || (typeof value === 'string' ? value : ''); }
export function sameSubsection(left, right) {
  const a = subsectionDefinition(left), b = subsectionDefinition(right);
  return Boolean(a && b && a.id === b.id);
}
