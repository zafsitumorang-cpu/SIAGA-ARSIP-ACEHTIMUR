# Import dry-run

Gunakan `templates/archive-import.template.json` sebagai bentuk awal snapshot. Bagian `mappings` disediakan untuk pemetaan klasifikasi, subbagian dan identitas sumber yang disahkan operator. Alat ini tidak mengimpor, tidak mengubah PostgreSQL/JSON, dan tidak membaca binary; alat hanya memeriksa metadata sebelum operator menjalankan prosedur impor yang disetujui.

```bash
npm run import:dry-run -- /path/ke/snapshot.json
npm run import:dry-run -- /path/ke/snapshot.json --json > laporan-dry-run.json
```

Laporan memuat jumlah entitas, error dengan lokasi baris, peringatan, nomor arsip atau file yang berulang, dan indikator retry berbasis ID. `ok` berarti bentuk dan referensi internal lolos pemeriksaan dasar, bukan persetujuan untuk memakai arsip nyata. Duplikasi nomor arsip menjadi peringatan untuk peninjauan operator dan membuat retry idempoten bernilai `false`; ID file berulang atau referensi pengguna/unit tidak dikenal menjadi error.

Simpan laporan bersama batch sintetis/staging. Sebelum data kantor diproses, operator tetap perlu manifest klasifikasi/subbagian yang disahkan, backup/restore yang diuji, izin pilot, rekonsiliasi binary, dan prosedur rollback.
