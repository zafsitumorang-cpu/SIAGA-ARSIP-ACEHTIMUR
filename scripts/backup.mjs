import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const target = path.join(dataDir, 'backups', stamp);
await fs.mkdir(path.join(target, 'files'), { recursive: true });
await fs.copyFile(path.join(dataDir, 'data.json'), path.join(target, 'data.json'));
try { await fs.cp(path.join(dataDir, 'files'), path.join(target, 'files'), { recursive: true }); } catch {}
console.log(`Backup tersimpan di ${target}`);
