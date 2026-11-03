# Backup dan pemulihan MVP

MVP menyimpan metadata di `data/data.json` dan berkas di `data/files/`. Untuk membuat snapshot lokal:

```bash
npm run backup
```

Snapshot dibuat di `data/backups/<UTC-timestamp>/`. Salinan tersebut tidak boleh diletakkan di repository produksi. Jadwalkan perintah ini dengan Task Scheduler/cron setelah menentukan lokasi data dan kebijakan retensi.

Untuk pemulihan, hentikan aplikasi, salin `data.json` dan isi `files/` dari snapshot yang dipilih ke `DATA_DIR`, lalu jalankan ulang aplikasi. Setelah pemulihan, cek jumlah arsip, buka beberapa berkas, dan periksa Audit aktivitas.

MVP ini belum menggantikan backup terkelola. Sebelum data nyata dimasukkan, gunakan database dan object storage privat dengan backup terenkripsi, salinan terpisah, serta uji pemulihan berkala.
