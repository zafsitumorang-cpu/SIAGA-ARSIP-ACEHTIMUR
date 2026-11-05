// Read-only inventory of the application listening on a port (default 3000).
// Never print full command lines, environments, account data, or file names.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const port = process.argv[2] || '3000';
if (!/^\d+$/.test(port) || +port < 1 || +port > 65535) {
  console.error('Port harus berupa angka 1–65535.');
  process.exit(1);
}
const clean = value => String(value).replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, 500);
const read = file => fs.readFile(file, 'utf8');
const optional = async callback => { try { return await callback(); } catch { return null; } };
console.log(`SIAGA ARSIP — proses aktif pada port ${port}`);
if (process.getuid?.() !== 0) console.log('Jalankan sebagai root melalui Run commands agar metadata proses dapat dibaca.');
let listeners;
try {
  listeners = execFileSync('ss', ['-ltnp', `( sport = :${port} )`], {encoding:'utf8',timeout:5000,stdio:['ignore','pipe','pipe']});
} catch {
  console.error('Tidak dapat membaca listener dengan ss.');
  process.exit(1);
}
const pids = [...new Set([...listeners.matchAll(/pid=(\d+)/g)].map(match => match[1]))];
if (!pids.length) {
  console.log('PID tidak ditemukan. Pastikan aplikasi listen dan pemeriksaan dijalankan sebagai root.');
  process.exit(1);
}
for (const pid of pids) {
  console.log(`\nPID: ${pid}`);
  const proc = `/proc/${pid}`;
  const cwd = await optional(() => fs.readlink(`${proc}/cwd`));
  const comm = await optional(() => read(`${proc}/comm`));
  console.log('Proses:', clean(comm?.trim() || 'tidak diketahui'));
  console.log('Direktori kerja:', clean(cwd || 'tidak terbaca'));
  const cgroup = await optional(() => read(`${proc}/cgroup`));
  const units = [...new Set(cgroup?.match(/[^/\n:]+\.(?:service|scope)/g) || [])];
  console.log('Unit/cgroup:', units.map(clean).join(', ') || 'tidak terdeteksi');

  // Select only deployment paths; never expose the remaining environment.
  const env = {};
  const environment = await optional(() => read(`${proc}/environ`));
  for (const entry of environment?.split('\0') || []) {
    const separator = entry.indexOf('=');
    const key = entry.slice(0, separator);
    if (['DATA_DIR','pm_exec_path'].includes(key)) env[key] = entry.slice(separator + 1);
  }
  const argv = (await optional(() => read(`${proc}/cmdline`)))?.split('\0') || [];
  const entry = env.pm_exec_path || argv.slice(1).find(arg => /\.(?:mjs|cjs|js)$/.test(arg) && !arg.startsWith('-'));
  const appFile = entry && cwd ? path.resolve(cwd, entry) : null;
  console.log('Entrypoint:', clean(appFile || 'tidak terdeteksi'));
  let ancestor = pid;
  const parents = [];
  for (let n = 0; n < 5; n++) {
    const status = await optional(() => read(`/proc/${ancestor}/status`));
    const parent = status?.match(/^PPid:\s+(\d+)/m)?.[1];
    if (!parent || parent === '0') break;
    const name = await optional(() => read(`/proc/${parent}/comm`));
    parents.push(`${parent}:${clean(name?.trim() || 'unknown')}`);
    ancestor = parent;
  }
  console.log('Induk proses:', parents.join(' <- ') || 'tidak terbaca');

  if (cwd) {
    try {
      const commit = execFileSync('git',['-C',`${proc}/cwd`,'rev-parse','--verify','HEAD'],{encoding:'utf8',timeout:5000,stdio:['ignore','pipe','pipe']}).trim();
      console.log('Git commit:', /^[a-f0-9]{40,64}$/.test(commit) ? commit : 'tidak dikenali');
    } catch { console.log('Git commit: checkout tidak tersedia/tidak dapat dibaca'); }
  }
  const dataDir = cwd && env.DATA_DIR ? path.resolve(cwd,env.DATA_DIR)
    : appFile && path.basename(appFile)==='app.mjs' ? path.join(path.dirname(appFile),'data') : null;
  console.log('DATA_DIR:',clean(dataDir || 'tidak dapat disimpulkan'));
  if (!dataDir) continue;
  // Resolve through /proc/PID/root to inspect a container namespace if necessary.
  const sourceDir = path.join(proc,'root',dataDir);
  const jsonFile = path.join(sourceDir,'data.json');
  const stat = await optional(() => fs.stat(jsonFile));
  if (!stat?.isFile()) { console.log('Metadata JSON: tidak ditemukan/tidak terbaca'); continue; }
  console.log('Ukuran JSON:',stat.size,'byte');
  if (stat.size > 64*1024*1024) { console.log('Ringkasan dilewati: JSON melebihi 64 MiB.'); continue; }
  const data = await optional(async() => JSON.parse(await read(jsonFile)));
  if (!data || !Array.isArray(data.archives) || !Array.isArray(data.users)) {
    console.log('Metadata JSON: format tidak sesuai; tidak mencetak isi'); continue;
  }
  console.log(`Ringkasan JSON: ${data.archives.length} arsip, ${data.users.length} akun`);
  const files = await optional(() => fs.readdir(path.join(sourceDir,'files'),{withFileTypes:true}));
  console.log('Jumlah file biasa:',files ? files.filter(file=>file.isFile() && file.name!=='.gitkeep').length : 'tidak terbaca');
}
console.log('\nSelesai. Tidak ada layanan, berkas aplikasi, database, atau konfigurasi yang diubah.');
