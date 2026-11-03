# TASKS — SIAGA ARSIP

## 0. Validasi dan tata kelola
- [ ] Tunjuk pemilik produk, admin, PIC surat, PIC unggah, pimpinan reviewer.
- [ ] Validasi daftar subbagian dan penamaan resmi.
- [ ] Setujui matriks role-permission dan aturan satu subbagian.
- [ ] Validasi field surat dan wajib/tidaknya tiap berkas.
- [ ] Tetapkan klasifikasi awal, aturan nomor, kebijakan retensi.
- [ ] Putuskan provider, lokasi data, domain, biaya, persetujuan TI.

## 1. Desain dan arsitektur
- [ ] Periksa file Figma SIAGA ARSIP dan ambil tokens/komponen yang berlaku.
- [ ] Konfirmasi alur pencatat dan pengunggah yang terpisah.
- [ ] Tetapkan stack, database, object storage, OCR, email, antivirus.
- [ ] Tentukan batas file, RPO/RTO, retensi backup dan audit.
- [ ] Rancang endpoint publik yang hanya mengembalikan agregat.

## 2. Build MVP
- [ ] Login lokal dan administrasi akun.
- [ ] Role dan pembatasan data server-side per subbagian.
- [ ] Modul surat masuk/keluar dan daftar klasifikasi admin.
- [ ] Upload privat PDF/JPG/XLSX/DOCX dan kontrol akses download.
- [ ] Disposisi pimpinan dan tiga status tindak lanjut.
- [ ] Notifikasi aplikasi dan email opsional.
- [ ] Pencarian/filter metadata dan ekspor Excel.
- [ ] Dashboard pimpinan dan statistik publik per tahun.
- [ ] Audit log.
- [ ] Backup harian dan prosedur pemulihan.
- [ ] Evaluasi OCR tanpa memblokir pilot bila belum siap.

## 3. Data dan migrasi
- [ ] Buat template metadata surat masuk/keluar.
- [ ] Buat 10 data dummy tiap jenis untuk demo; pastikan jelas DEMO.
- [ ] Buat inventaris sekitar 1.000 PDF Drive dan rencana copy.
- [ ] Inventaris dan pindai 300 surat kertas.
- [ ] Validasi nama, jumlah, metadata, checksum, keterbacaan, duplikasi.
- [ ] Persetujuan sebelum mengimpor arsip nyata.

## 4. UAT dan peluncuran pilot
- [ ] UAT login, peran, akses satu subbagian dan pimpinan lintas bagian.
- [ ] UAT privasi publik dan tidak adanya akses file.
- [ ] UAT disposisi, status, histori dan notifikasi.
- [ ] UAT pencarian, ekspor dan unggah/unduh.
- [ ] Verifikasi backup dan pemulihan sampel.
- [ ] Perbaiki temuan keamanan/kegagalan kritis.
- [ ] Sosialisasi dan panduan singkat.
- [ ] Persetujuan go/no-go untuk target awal Desember 2026.

## 5. Lanjutan
- [ ] Ukur waktu temu kembali dan kepuasan pengguna.
- [ ] Rencanakan kategori lanjutan dan pemilik data.
- [ ] Review akses, retensi, klasifikasi keamanan dan kepatuhan.
- [ ] Perluas migrasi bertahap setelah pilot stabil.
