# TASKS — SIAGA ARSIP

## 0. Validasi dan tata kelola
- [ ] Tunjuk pemilik produk, admin, PIC surat, PIC unggah, pimpinan reviewer — menunggu penetapan kantor.
- [x] Validasi daftar subbagian dan penamaan resmi — Administrasi, Hukum, Pengawasan, PPPS.
- [x] Setujui matriks role-permission dan aturan satu subbagian — diterapkan pada MVP dan UAT.
- [x] Validasi field surat dan wajib/tidaknya tiap berkas — diterapkan pada form MVP.
- [ ] Tetapkan klasifikasi awal, aturan nomor, kebijakan retensi — klasifikasi demo tersedia; kebijakan resmi menunggu musyawarah.
- [ ] Putuskan provider, lokasi data, domain, biaya, persetujuan TI — blocker deployment produksi.

## 1. Desain dan arsitektur
- [ ] Periksa file Figma SIAGA ARSIP dan ambil tokens/komponen yang berlaku — perlu akses/desain final untuk penyelarasan pixel-level.
- [x] Konfirmasi alur pencatat dan pengunggah yang terpisah — role dan endpoint disiapkan.
- [x] Tetapkan stack pilot — Node.js 20 tanpa dependensi; target produksi Laravel 13 + Livewire 4/PostgreSQL/object storage.
- [x] Tentukan batas file pilot — 15 MB; RPO/RTO dan retensi produksi masih terbuka.
- [x] Rancang endpoint publik yang hanya mengembalikan agregat.

## 2. Build MVP
- [x] Login lokal dan administrasi akun — akun demo siap; UI administrasi penuh menunggu pemilik produk.
- [x] Role dan pembatasan data server-side per subbagian.
- [x] Modul surat masuk/keluar dan daftar klasifikasi admin endpoint.
- [x] Upload privat PDF/JPG/XLSX/DOCX dan kontrol akses download.
- [x] Disposisi pimpinan dan tiga status tindak lanjut.
- [x] Notifikasi aplikasi — endpoint notifikasi siap; email provider belum dikonfigurasi.
- [x] Pencarian/filter metadata dan ekspor CSV yang kompatibel dengan Excel.
- [x] Dashboard pimpinan dan statistik publik per tahun endpoint.
- [x] Audit log.
- [x] Backup snapshot dan prosedur pemulihan terdokumentasi di BACKUP.md.
- [ ] Evaluasi OCR — ditunda sampai engine, bahasa, biaya, dan kebutuhan kualitas disetujui.

## 3. Data dan migrasi
- [x] Buat template metadata surat masuk/keluar — tercermin di PRD/DATABASE dan form MVP.
- [x] Buat 10 data dummy tiap jenis untuk demo; pastikan jelas DEMO.
- [ ] Buat inventaris sekitar 1.000 PDF Drive dan rencana copy — membutuhkan akses Drive dan persetujuan migrasi.
- [ ] Inventaris dan pindai 300 surat kertas — membutuhkan arsip fisik dan operator scan.
- [ ] Validasi nama, jumlah, metadata, checksum, keterbacaan, duplikasi — dilakukan saat data nyata tersedia.
- [ ] Persetujuan sebelum mengimpor arsip nyata.

## 4. UAT dan peluncuran pilot
- [x] UAT login, peran, akses satu subbagian dan pimpinan lintas bagian — `npm run uat` lulus.
- [x] UAT privasi publik dan tidak adanya akses file — endpoint publik hanya agregat.
- [x] UAT disposisi, status, histori dan notifikasi — `npm run uat` lulus.
- [x] UAT pencarian, ekspor dan unggah/unduh — endpoint dan kontrol akses tersedia; unggah nyata tersedia di form.
- [x] Verifikasi backup dan pemulihan sampel — backup snapshot berhasil dibuat.
- [ ] Perbaiki temuan keamanan/kegagalan kritis — perlu review keamanan sebelum internet publik.
- [x] Sosialisasi dan panduan singkat — MVP_TESTING.md dan README tersedia.
- [ ] Persetujuan go/no-go untuk target awal Desember 2026 — keputusan kantor.

## 5. Lanjutan
- [ ] Ukur waktu temu kembali dan kepuasan pengguna — lakukan bersama pengguna kantor.
- [x] Rencanakan kategori lanjutan dan pemilik data — daftar kandidat ada di FEATURES.md; pemilik resmi menunggu penetapan.
- [ ] Review akses, retensi, klasifikasi keamanan dan kepatuhan — wajib sebelum produksi.
- [ ] Perluas migrasi bertahap setelah pilot stabil — menunggu hasil UAT dan data nyata.
