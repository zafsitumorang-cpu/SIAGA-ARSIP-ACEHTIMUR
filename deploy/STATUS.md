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

1. Pemilik server mengambil credential admin secara privat, login, mengganti password awal dan memetakan akun riil/peran/subbagian.
2. Jadwalkan backup, salin terenkripsi ke lokasi terpisah, tetapkan retensi dan alarm, lalu uji restore database beserta binary ke lingkungan bersih. Backup yang dilaporkan masih lokal.
3. UAT pengguna: catat surat uji, unggah/unduh berizin, disposisi, pembatasan peran/subbagian dan pergantian sesi. Data 20 arsip lama bukan bukti dokumen asli telah tersedia.
4. Verifikasi restart/redeploy dan beban representatif. Selesaikan atau sepakati ruang lingkup fitur wajib yang masih terbuka (edit metadata, XLSX, pagination/filter, histori versi).
5. Tutup gate keamanan/operasional dan penerimaan LAUNCH_READINESS.md sebelum memakai arsip nyata. Mode produksi aktif tidak berarti seluruh kebutuhan peluncuran telah selesai.
