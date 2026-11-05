# Backup dan pemulihan MVP

Demo JSON menyimpan metadata di `data/data.json`; produksi memakai PostgreSQL melalui DATABASE_URL. Berkas berada di DATA_DIR/files. Untuk membuat snapshot lokal (gunakan environment yang sama dengan aplikasi):

```bash
npm run backup
```

Snapshot dibuat di BACKUP_DIR atau DATA_DIR/backups/<UTC-timestamp>/, berisi data.json tanpa sesi, salinan files dan manifest checksum SHA-256. PostgreSQL memakai lock transaksi bersama aplikasi agar snapshot konsisten. Kegagalan salin dan referensi file hilang menggagalkan backup ketika DEMO_MODE=false. Demo mengizinkan referensi file dummy yang hilang dan mencatatnya di manifest. Salinan tidak boleh diletakkan di repository. Scheduler, enkripsi, offsite, retensi dan alarm belum dipasang.

Untuk pemulihan demo JSON, hentikan aplikasi, salin data.json dan files dari snapshot ke DATA_DIR, lalu jalankan ulang. Untuk PostgreSQL, gunakan database tujuan kosong dengan schema terpasang dan CLI import; alat ini mereset kredensial serta menonaktifkan akun lama, sehingga bukan restore identik akun/sesi. Salin files secara terpisah dan verifikasi semua checksum manifest, jumlah arsip, akses berkas dan audit. Gunakan juga pg_dump/pg_restore untuk pemulihan PostgreSQL penuh sesuai runbook operator. Jangan menimpa database aktif tanpa snapshot dan rencana rollback. Panduan: [deploy/README.md](deploy/README.md).

MVP ini belum menggantikan backup terkelola. Sebelum data nyata dimasukkan, gunakan database dan object storage privat dengan backup terenkripsi, salinan terpisah, serta uji pemulihan berkala.
