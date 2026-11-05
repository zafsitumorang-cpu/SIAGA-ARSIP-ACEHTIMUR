# Status VPS — 5 November 2026, Asia/Jakarta

## Migrasi yang dilaporkan operator

Operator menjalankan skrip upgrade dari commit `82a93274a2435da41763c764894a6cfad36b8758` melalui panel VPS. Output mencapai tahap 7/7, termasuk verifikasi kandidat, verifikasi setelah pergantian port, backup PostgreSQL dan pengecekan health/config HTTPS. Run ID `20261105040416_0344aa` menunjukkan pukul 11:04:16 WIB.

- Domain: https://siaga-arsipbawasluacehtimur.web.id
- IP VPS: 43.173.51.195.
- Inventaris operator: Ubuntu 24.04.4, Node 22.23.4, RAM sekitar 2 GiB, swap sekitar 2 GiB, disk 40 GiB, Caddy 2.11.8.
- Layanan baru sesuai skrip: `siaga.service`, loopback 127.0.0.1:3000. Layanan lama `siaga-arsip.service` dinonaktifkan setelah tes berhasil.
- Kode baru sesuai skrip: `/opt/siaga-arsip-releases/20261105040416_0344aa`.
- DATA_DIR baru sesuai skrip: `/var/lib/siaga-arsip-pg-20261105040416_0344aa`.
- Konfigurasi privat: `/etc/siaga-migrations/20261105040416_0344aa`.
- Backup yang dilaporkan: `/var/backups/siaga-arsip/20261105040416_0344aa`.
- Data lama yang diinventarisasi: 20 arsip, 6 akun, 0 file fisik. Skrip mempertahankan arsip, mencatat placeholder PDF tanpa binary sebagai referensi tidak tersedia, mereset password lama dan menonaktifkan akun selain admin bootstrap.

Path konfigurasi bukan isi credential. Password tidak diterima/dicatat dalam repositori. Akses admin baru harus diambil pemilik server melalui Console privat, lalu diganti melalui Pengaturan. Kode/data lama tetap dipertahankan untuk kebutuhan pemulihan; jangan menyalakan layanan lama setelah pengguna mulai menulis ke PostgreSQL tanpa rekonsiliasi.

## Pemeriksaan independen dari luar VPS

Read-only, tanpa login atau mutasi data produksi:

| Pemeriksaan | Hasil |
|---|---|
| HTTP root | 308 ke origin HTTPS yang benar |
| HTTPS root | 200, judul SIAGA ARSIP |
| GET /api/health | 200, `{"ok":true}` |
| GET /api/config | 200, `{"demoMode":false}` |
| Statistik publik | 10 masuk, 10 keluar, 20 total |
| GET /api/archives tanpa sesi | 401 |
| GET /api/me tanpa sesi | 401 |
| JavaScript publik | Checksum cocok dengan aset release yang diminta; header custom CSRF tersedia |
| Header health | CSP, HSTS, nosniff, DENY frame dan no-store terlihat |
| Browser | Landing/statistik dan halaman login terbuka, akun demo tidak ditampilkan, field credential kosong, layout mobile tidak overflow, tanpa error JavaScript |

Pemeriksaan ini mendukung hasil migrasi yang dilaporkan, tetapi bukan inspeksi SSH independen terhadap systemd, isi database, firewall, restart server atau file backup. Verifikasi autentikasi/admin dan perbandingan data dilakukan skrip yang dijalankan operator; pemeriksaan browser independen tidak memasukkan credential atau melakukan login.

## Pekerjaan berikutnya

Operator kemudian menyatakan penggantian password dan pemasangan backup harian telah selesai. Output timer tidak diterima, sehingga ini dicatat sebagai laporan operator, bukan inspeksi unit independen. Controller deployment otomatis yang memeriksa CI tersedia melalui [AUTO_DEPLOY.md](AUTO_DEPLOY.md); timer deployment belum dinyatakan aktif sebelum hasil pemasang diterima. Pemasang deployment memeriksa bahwa aplikasi serta timer backup benar-benar aktif sebelum melanjutkan.

### Otomatisasi terpasang — pembaruan berikutnya pada 5 November

Operator menjalankan pemasang commit `2949fcab4b99ec6c689fbf33dbbb41eaf5a866a5` dan mengirim keluaran sukses: symlink timer dibuat, `Deployment otomatis aktif`, dan siaga-auto-deploy.timer terdaftar. Pemasang memverifikasi siaga.service dan timer backup aktif sebelum melanjutkan, menjalankan job awal serta mengaktifkan jadwal deployment sekitar setiap lima menit. Ini memperbarui catatan sebelumnya yang masih menunggu pemasangan.

Pemeriksaan eksternal setelah pemasangan mengonfirmasi health 200/ok, config demoMode=false, statistik tetap 20 arsip, anonymous archives 401 dan checksum JavaScript cocok dengan kode terbaru. Helper tanggal WIB terlihat dan tanggal tetap lama tidak lagi ada pada aset. Dengan laporan pemasang, ini mendukung bahwa update aplikasi baru berhasil tersaji. Agent tetap tidak membaca unit/journal melalui SSH dan tidak memasukkan credential admin ke browser.

Peringatan PIDFile pada tat_agent.service berasal dari unit agen Tencent yang ikut diperiksa systemd; pemasang tetap mencapai keluaran sukses. Nilai NEXT `-` dapat muncul ketika job timer sedang aktif: interval OnUnitInactiveSec dihitung setelah job selesai. Kolom waktu CST mengikuti timezone host; kalender backup tetap eksplisit Asia/Jakarta dan interval deployment tidak bergantung pada timezone tersebut.

Update dokumentasi/installer saja tidak perlu mengubah release web; marker commit yang sudah diperiksa dapat berbeda dari commit aktif aplikasi. Pengembangan aplikasi biasa berikutnya dapat dilakukan melalui GitHub dan CI, dengan backup/kandidat/verifikasi otomatis. Offsite/enkripsi/retensi/alert, migrasi schema dan gate penerimaan belum selesai secara otomatis.

1. Pemilik server mengambil credential admin secara privat, login, mengganti password awal dan memetakan akun riil/peran/subbagian.
2. Jadwalkan backup, salin terenkripsi ke lokasi terpisah, tetapkan retensi dan alarm, lalu uji restore database beserta binary ke lingkungan bersih. Backup yang dilaporkan masih lokal.
3. UAT pengguna: catat surat uji, unggah/unduh berizin, disposisi, pembatasan peran/subbagian dan pergantian sesi. Data 20 arsip lama bukan bukti dokumen asli telah tersedia.
4. Verifikasi restart/redeploy dan beban representatif. Selesaikan atau sepakati ruang lingkup fitur wajib yang masih terbuka (edit metadata, XLSX, pagination/filter, histori versi).
5. Tutup gate keamanan/operasional dan penerimaan LAUNCH_READINESS.md sebelum memakai arsip nyata. Mode produksi aktif tidak berarti seluruh kebutuhan peluncuran telah selesai.
