import fs from 'node:fs/promises';
import {dryRunImport} from '../lib/import-dry-run.mjs';

const file = process.argv[2];
if (!file || process.argv.includes('--help')) {
  console.error('Gunakan: node scripts/import-dry-run.mjs PATH_JSON [--json]');
  process.exit(file ? 0 : 2);
}
try {
  const snapshot = JSON.parse(await fs.readFile(file, 'utf8'));
  const report = dryRunImport(snapshot);
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Status: ${report.ok ? 'SIAP DITINJAU' : 'DITOLAK'}`);
    console.log(`Arsip: ${report.counts.archives || 0}; pengguna: ${report.counts.users || 0}; duplikasi: ${report.duplicates.length}; error: ${report.errors.length}; peringatan: ${report.warnings.length}`);
    for (const item of [...report.errors, ...report.warnings]) console.log(`${item.code}: ${item.message}${item.path ? ` (${item.path})` : ''}`);
    console.log(`Retry idempoten: ${report.retry.idempotent ? 'ya' : 'tidak'}`);
  }
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  console.error(`Snapshot tidak dapat dibaca: ${error.message}`);
  process.exitCode = 2;
}
