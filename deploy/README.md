# Paket pemasangan VPS — belum dieksekusi pada VPS pengguna

Domain tidak diperlukan untuk mengerjakan atau menguji kode. Produksi baru dibuka setelah HTTPS, database, akses dan backup tervalidasi. Domain pengguna adalah `siaga-arsipbawasluacehtimur.web.id`, dengan IP VPS `43.173.51.195`. Tidak ada perubahan SSH, DNS, konfigurasi proxy atau data VPS yang dilakukan oleh paket panduan ini.

Pengguna melaporkan Caddy sudah melayani port 80/443, SSH aktif di port 22 dan port aplikasi 3000 dibatasi dari luar. Gunakan Caddy yang sudah berjalan. Verifikasi domain secara publik tidak membuktikan versi Node/database, mode produksi, backup, atau versi backend yang terpasang.

Pemeriksaan read-only 5 November 2026 (Asia/Jakarta): DNS A mengarah ke 43.173.51.195; HTTP mengembalikan 308 dan HTTPS homepage 200. Checksum JavaScript publik cocok dengan `a12e258`, berbeda dari rilis fondasi `810afb7`; health/config mengembalikan 401. Ini membuktikan aset frontend lama masih disajikan dan kontrak endpoint terbaru belum terlihat, bukan identifikasi pasti commit backend. Fokus berikutnya adalah inventarisasi/upgrade aplikasi aktif dengan mempertahankan data, kemudian verifikasi ulang endpoint, mode dan aset. Tidak ada login atau mutasi data VPS dalam pemeriksaan ini.

## Persyaratan

Node.js 22+ (disarankan 24 LTS), npm, PostgreSQL (versi 17 dipakai pada pengujian), Caddy, user Linux khusus `siaga`, direktori aplikasi `/opt/siaga/app`, direktori data privat `/var/lib/siaga/files`. PostgreSQL dan port aplikasi tidak dibuka ke internet. Pilih password database dan admin yang unik; jangan menaruhnya di GitHub.

File `siaga.service` dan `Caddyfile.example` adalah referensi yang harus dicocokkan dengan instalasi nyata. Contoh Nginx dipertahankan sebagai alternatif untuk instalasi yang memakai Nginx; jangan menjalankannya pada port yang telah dipakai Caddy. Firewall penyedia dan firewall Ubuntu harus mengizinkan 80/443 untuk web serta port SSH yang digunakan. Port 3000 dan PostgreSQL tetap privat. Gunakan SSH key dan jangan mematikan akses SSH lama sebelum koneksi baru terbukti bekerja.

## Lingkungan produksi

Buat `/etc/siaga/siaga.env` dengan izin terbatas (misal 0640 root:siaga), dibaca melalui EnvironmentFile systemd:

```
NODE_ENV=production
DEMO_MODE=false
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://siaga-arsipbawasluacehtimur.web.id
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
6. Pasang systemd dan cocokkan blok situs Caddy dengan aplikasi di 127.0.0.1:3000. Jika domain sudah dilayani dengan benar, pertahankan konfigurasi yang ada. Caddy mengelola HTTPS otomatis ketika DNS dan akses 80/443 sesuai. Pengaturan NAT berbeda dan harus dikonfirmasi bila IP bukan dedicated.
7. Cek `/api/health`, login admin, buat akun per role, upload berkas uji, unduh berizin, pembatasan subbagian, restart, backup dan restore.

Jika aplikasi dijalankan dalam container produksi, set HOST=0.0.0.0 dan publish port hanya ke loopback host; DEMO_MODE=false harus di-set eksplisit. Dockerfile default DEMO_MODE=true sengaja mempertahankan demo Railway yang sudah ada—bukan konfigurasi arsip nyata.

## Pemeriksaan instalasi yang sudah berjalan

Melalui Console/Run commands VPS, periksa sebelum mengganti release:

```bash
node --version
psql --version
systemctl is-active caddy postgresql siaga
curl --max-time 5 -sS http://127.0.0.1:3000/api/health
```

Nama service aplikasi aktual bisa berbeda dari `siaga`. Respons 401 pada health/config tidak sesuai kontrak release fondasi yang menyediakan kedua endpoint itu secara publik; cocokkan checkout, service/container yang berjalan dan upstream Caddy. Jangan menganggap git pull saja mengganti proses aktif. Jika endpoint lokal benar tetapi publik berbeda, periksa routing proxy. Hindari mencetak EnvironmentFile, connection string, atau password dalam keluaran diagnostik.

Untuk upgrade dari JSON lama, catat release/proses aktif, lokasi data dan konfigurasi terlebih dahulu. Buat salinan terverifikasi metadata, file dan konfigurasi privat; simpan release lama untuk rollback. Selesaikan bootstrap database baru ATAU impor salinan lama ke database kosong, lalu uji release baru dengan data sementara sebelum mengganti layanan aktif. Impor mereset kredensial lama; lakukan provisioning admin terkontrol. Hindari menimpa data aktif, menghapus volume, atau menjalankan bootstrap pada database yang berisi.

## Caddy dan pemeriksaan HTTPS

Blok referensi tersedia di [Caddyfile.example](Caddyfile.example). Jika hostname sudah ada di Caddyfile aktif, sesuaikan blok tersebut; jangan membuat blok hostname ganda atau menimpa konfigurasi situs lain. Simpan salinan konfigurasi saat ini. Setelah perubahan pada konfigurasi lengkap, validasi dan reload hanya jika validasi berhasil:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
# Jalankan berikut hanya setelah validasi sukses:
sudo systemctl reload caddy
```

Pastikan lokasi konfigurasi cocok dengan unit Caddy yang terpasang. `APP_ORIGIN` harus sama persis dengan origin HTTPS di browser (tanpa path/trailing slash). Caddy meneruskan Host ke upstream secara default. Tidak perlu menaruh sertifikat/private key TLS dalam repositori.

Setelah release benar-benar aktif, periksa dari luar VPS:

```bash
curl -fsS https://siaga-arsipbawasluacehtimur.web.id/api/health
curl -fsS https://siaga-arsipbawasluacehtimur.web.id/api/config
```

Kontrak release fondasi: health `{"ok":true}`, config `{"demoMode":false}` untuk produksi. Ini belum memverifikasi seluruh kebutuhan go-live. Jangan mengganti mode menjadi demo untuk mengatasi kegagalan produksi; periksa Node, environment, schema, akun bootstrap dan koneksi database.

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
