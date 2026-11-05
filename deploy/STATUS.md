# Status VPS — 5 November 2026, Asia/Jakarta

## Paket TODO 01.1 — retry unggah

Perbaikan ini melanjutkan working tree audit: metadata sukses tidak dibuat ulang saat upload gagal, dan header Idempotency-Key melindungi replay create/upload termasuk respons sukses terputus serta restart server. Receipt disimpan privat pada payload arsip, tidak memerlukan perubahan SQL dan tidak menambah izin role. Lokal lulus: keamanan JSON/PostgreSQL 187, database 8, browser retry 10, regresi metadata 9/interaksi 15 dan UAT dasar 15; syntax/diff serta npm audit produksi lulus (nol kerentanan). Rilis/CI/rollout dicatat setelah push terverifikasi.

Commit fitur `1716aa155ea51d0cc7b40187df6a00aef66dd926` berhasil didorong ke main. Application checks run `42000447214` selesai success, termasuk UAT, migrasi, query, ekspor, keamanan JSON/PostgreSQL, database dan audit dependensi. Sekitar 50 detik setelah pemantauan dimulai, checksum app.js, archive-create.js dan workspace.css cocok dengan rilis. Root/health/config 200, health ok=true, demoMode=false dan arsip anonim 401. Statistik publik teramati **22 metadata (12 masuk, 10 keluar)**; angka ini bukan klaim rekonsiliasi dengan 20 rekaman pada audit sebelumnya atau verifikasi isi/asal rekaman. Seluruh mutasi tes menggunakan fixture sementara lokal; agen tidak login atau memutasi arsip di domain. Batas operasional tetap demo dummy, bukan penerimaan arsip nyata.

Paket ini hanya menutup 01.1; admin terakhir/default role/riwayat berkas belum dikerjakan. Backup offsite tetap ditunda. Website publik tetap demonstrasi dengan metadata dummy; tidak ada arsip nyata yang dimasukkan atau dimutasi oleh pengujian. DEMO_MODE=false tetap mempertahankan kontrol autentikasi produksi dan tidak berarti data dummy sudah disahkan sebagai arsip operasional. UAT manusia untuk retry memakai data dummy dan tidak membuka gerbang peluncuran nyata.

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

### Fitur perbaikan metadata — 5 November

Commit `be4037a7b439c3fdfa7d9a943a5ab7ea55c34679` menambahkan edit metadata khusus admin, audit nama field dan pemeriksaan versi untuk konflik edit. Application checks run 41975053604 selesai success. Pengujian lokal meliputi 93 pemeriksaan keamanan JSON/PostgreSQL, 8 pemeriksaan database, 15 skenario UAT dan browser (termasuk konflik dua tab, kegagalan simpan, validasi, role dan mobile). Schema SQL tidak berubah. Recorder belum diberi hak edit dan arsip yang memiliki disposisi tetap mengunci jenis/subbagian.

Deployment dipantau melalui HTTPS tanpa menjalankan command baru pada VPS. Sekitar 250 detik setelah probe awal, checksum app.js, archive-editor.js dan workspace.css cocok dengan commit fitur; health/config produksi 200, archives anonymous 401 dan statistik tetap 20 arsip. Ini mendukung bahwa deployment otomatis berhasil menyajikan fitur. Agen tidak mengedit arsip atau memasukkan credential produksi; penerimaan pengguna tetap dilakukan melalui akun admin pada arsip uji.

### Pencarian dan halaman arsip — 5 November

Pengguna melaporkan UAT metadata pada OUT/AT/010/2026 lulus: perihal wajib, perubahan/audit dan konflik dua tab; perihal dikembalikan semula. Paket berikutnya menambahkan filter lengkap, pagination respons daftar dan CSV seluruh hasil sesuai scope. Schema SQL tetap sama. Pemeriksaan lokal: keamanan 133 (JSON/PostgreSQL), database 8, query sintetis 1.300 rekaman 8, migrasi 6, UAT 15, browser pencarian 11 dan regresi browser metadata/interaksi. npm audit melaporkan nol kerentanan. Pengujian dilakukan pada data sementara, bukan mutasi produksi. Ketersediaan rilis di domain dicatat setelah deployment terverifikasi; performa query SQL dan beban VPS belum dibuktikan karena store/cache internal masih membaca dataset penuh.

Commit fitur `510923efed3adcb382d63b3e2d923de3f3bed672` sudah didorong ke main; Application checks run 41980336831 selesai success. Pemantauan HTTPS sekitar 252 detik mendeteksi checksum app.js, archive-search.js dan workspace.css sesuai rilis. Root/health/config HTTP 200, health ok=true, demoMode=false, arsip anonim HTTP 401, dan statistik tetap 20 arsip (10 masuk/10 keluar). Ini mengonfirmasi penyajian aset baru melalui deployment otomatis; tidak ada login atau mutasi produksi oleh agen. Penerimaan filter/pagination oleh pengguna tetap perlu dilakukan melalui akun sendiri.

### UAT pencarian dan paket XLSX — 5 November

Pengguna melaporkan filter PPPS=5, PPPS+keluar=3, ditambah tanggal sampai 8 September=1. Ukuran halaman 10/25/50/100 tersedia; halaman kedua memuat arsip 11–20. CSV 20/5/1 baris sesuai filter. Tidak ada arsip diubah; login dan ekspor tercatat di audit. Selesai belum dapat diuji pengguna karena data contoh belum memiliki disposisi. Ini memperbarui catatan penerimaan pencarian di atas.

Paket ekspor menambahkan XLSX yang dapat diunduh, kolom Status disposisi di kedua format, keterangan urutan pencatatan terbaru dan urutan ekspor sesuai daftar. Semua status unik dirangkum; tanpa penugasan ditulis Tanpa disposisi; instruksi/catatan tidak diekspor. Schema SQL tetap sama. Lokal: keamanan 151 (JSON/PostgreSQL), ekspor/round trip XLSX 8 termasuk 1.300 arsip, query 8, UAT 15 dan browser 14. Browser menguji unduh seluruh halaman/hasil filter dan disposisi Selesai pada data sementara. Instalasi dependensi produksi saja dapat menghasilkan XLSX; npm audit nol kerentanan. Penerimaan XLSX/Selesai di produksi dan pengujian resource VPS masih terpisah. Bukti rollout dicatat setelah aset baru terverifikasi dari domain.

Commit fitur `6b2cfc66e624d146d96770eda148b71b0c631406` didorong ke main; Application checks run 41985368334 selesai success (termasuk query/ekspor/keamanan/database/migrasi/UAT/audit dependensi). Sekitar 178 detik setelah pemantauan dimulai, checksum archive-search.js dan workspace.css cocok dengan rilis. Root/health/config HTTP 200, health ok=true, demoMode=false; ekspor XLSX dan arsip anonim HTTP 401; statistik tetap 20 (10 masuk/10 keluar). Pemeriksaan eksternal hanya read-only dan belum mengunduh XLSX dengan sesi produksi. Ini memverifikasi penyajian aset baru dan kesehatan setelah rollout otomatis; penerimaan unduh oleh pengguna tetap diperlukan.

1. Pemilik server mengambil credential admin secara privat, login, mengganti password awal dan memetakan akun riil/peran/subbagian.
2. Jadwalkan backup, salin terenkripsi ke lokasi terpisah, tetapkan retensi dan alarm, lalu uji restore database beserta binary ke lingkungan bersih. Backup yang dilaporkan masih lokal.
3. UAT pengguna: catat surat uji, unggah/unduh berizin, disposisi, pembatasan peran/subbagian dan pergantian sesi. Data 20 arsip lama bukan bukti dokumen asli telah tersedia.
4. Verifikasi restart/redeploy dan beban representatif. Selesaikan atau sepakati ruang lingkup fitur wajib yang masih terbuka (izin edit recorder, histori versi); lakukan penerimaan pengguna untuk XLSX/status Selesai.
5. Tutup gate keamanan/operasional dan penerimaan LAUNCH_READINESS.md sebelum memakai arsip nyata. Mode produksi aktif tidak berarti seluruh kebutuhan peluncuran telah selesai.
