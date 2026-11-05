# Paket pemasangan VPS — belum dieksekusi pada VPS pengguna

Domain tidak diperlukan untuk mengerjakan atau menguji kode. Produksi baru dibuka setelah HTTPS, database, akses dan backup tervalidasi. IP server diterima melalui chat; tidak ada koneksi/perubahan SSH atau DNS yang dilakukan oleh perubahan ini.

## Persyaratan

Node.js 22+ (disarankan 24 LTS), npm, PostgreSQL 17, Nginx, user Linux khusus `siaga`, direktori aplikasi `/opt/siaga/app`, direktori data privat `/var/lib/siaga/files`. PostgreSQL dan port aplikasi tidak dibuka ke internet. Pilih password database dan admin yang unik; jangan menaruhnya di GitHub.

File `siaga.service` dan `nginx.conf.example` adalah contoh yang memerlukan path/domain nyata dan sertifikat sebelum diaktifkan. Firewall hanya membuka layanan yang diperlukan. Gunakan SSH key dan jangan mematikan akses SSH lama sebelum koneksi baru terbukti bekerja.

## Lingkungan produksi

Buat `/etc/siaga/siaga.env` dengan izin terbatas (misal 0640 root:siaga), dibaca melalui EnvironmentFile systemd:

```
NODE_ENV=production
DEMO_MODE=false
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://DOMAIN_ANDA
COOKIE_SECURE=true
DATABASE_URL=postgres://siaga:PASSWORD_URL_ENCODED@127.0.0.1:5432/siaga
DATA_DIR=/var/lib/siaga
BACKUP_DIR=/var/lib/siaga/backups
```

Password pada URL koneksi harus di-percent-encode bila mengandung karakter khusus. `.env` tidak otomatis dimuat oleh `npm start`. Untuk CLI, gunakan Node `--env-file` atau environment yang disiapkan operator. Mode produksi gagal startup jika DATABASE_URL/APP_ORIGIN HTTPS tidak diisi atau database kosong. Tidak ada fallback ke demo.

## Persiapan kode dan database baru

1. Checkout commit yang telah diuji, jalankan `npm ci --omit=dev`. Pastikan Node 22+.
2. Siapkan database dan role PostgreSQL khusus. Untuk tahap ini schema/operasi aplikasi mengasumsikan satu database khusus SIAGA.
3. Jalankan schema dengan environment database: `node --env-file=/etc/siaga/siaga.env scripts/database.mjs migrate`.
4. Jalankan bootstrap dengan BOOTSTRAP_ADMIN_USERNAME dan BOOTSTRAP_ADMIN_PASSWORD >=12 karakter yang dimasukkan melalui mekanisme environment rahasia, bukan literal di history/commit. Perintah: `node --env-file=/etc/siaga/siaga.env scripts/database.mjs bootstrap`.
5. Hapus variabel bootstrap dari environment setelah selesai. Bootstrap menolak database yang sudah berisi.
6. Pasang systemd, Nginx dan sertifikat domain; uji sebelum cutover DNS/domain. Pengaturan NAT berbeda dan harus dikonfirmasi bila IP bukan dedicated.
7. Cek `/api/health`, login admin, buat akun per role, upload berkas uji, unduh berizin, pembatasan subbagian, restart, backup dan restore.

Jika aplikasi dijalankan dalam container produksi, set HOST=0.0.0.0 dan publish port hanya ke loopback host; DEMO_MODE=false harus di-set eksplisit. Dockerfile default DEMO_MODE=true sengaja mempertahankan demo Railway yang sudah ada—bukan konfigurasi arsip nyata.

## Impor JSON lama

- Backup sumber dan kerjakan pada salinan; jangan hapus JSON/files asli.
- Database tujuan harus kosong dan telah di-migrate. Jangan bootstrap dahulu bila ingin mengimpor.
- Jalankan `scripts/database.mjs import /path/salinan/data.json` dengan DATABASE_URL dan variabel bootstrap admin.
- Semua akun lama dinonaktifkan dan hash passwordnya diganti; hanya akun bootstrap pilihan yang aktif. Ini mencegah kredensial demo ikut hidup pada produksi. Admin menetapkan password baru sebelum mengaktifkan akun riil.
- Impor tidak menyalin berkas. Salin file ke DATA_DIR/files secara privat; rekonsiliasi ID, jumlah, checksum, dan file yang benar-benar ada. File dummy lama memang tidak memiliki binary.
- Periksa kategori, klasifikasi dan penugasan lama. Disposisi lintas subbagian lama tidak otomatis memberikan akses baru; selesaikan pemetaan dengan pengelola.
- Export logis: `scripts/database.mjs export /path/snapshot-baru.json`, tidak menyertakan sesi dan menolak menimpa file.

## Backup dan operasional

`node --env-file=/etc/siaga/siaga.env scripts/backup.mjs` menghasilkan snapshot logis tanpa sesi, salinan file, dan manifest SHA-256. Pada PostgreSQL, lock transaksi menjaga snapshot dan file tetap konsisten dengan operasi aplikasi. Error copy/missing reference menggagalkan backup produksi, bukan dilaporkan berhasil.

Jadwalkan melalui cron/systemd timer setelah mengukur durasi; salin backup terenkripsi ke lokasi terpisah dan pantau kegagalannya. Script belum memasang scheduler, offsite storage atau enkripsi otomatis. Untuk disaster recovery PostgreSQL utuh, gunakan juga pg_dump/pg_restore sesuai runbook DBA; impor logis menonaktifkan akun lama sehingga bukan restore identik kredensial/sesi.

## Batas tahap ini

Database sudah memisahkan users, archives, dispositions, sessions, audit, classifications dan categories, dengan FK/index kunci. Atribut fleksibel masih JSONB. Operasi memakai lock transaksi dan antrean per proses; sesuai fondasi pilot satu VPS, bukan klaim siap skala besar. Rate limiter login per proses (alamat socket; jangan percaya forwarded header sembarang). Uji beban 1.300 arsip dan resource server nyata tetap diperlukan.

Belum termasuk: scanner malware/karantina, pengiriman backup offsite, pagination/search SQL lengkap, edit/soft-delete metadata, XLSX, MFA, email/OCR. Tidak ada pernyataan bahwa seluruh gate produksi sudah lulus.
