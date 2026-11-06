# FEATURES — SIAGA ARSIP

## Arah produk yang disetujui pemilik (6 November 2026)

Target produk mencakup seluruh arsip administrasi. Runtime sudah menyediakan tipe `incoming`, `outgoing`, dan `administrative`, metadata umum, kategori 00.3, serta label resmi subbagian RA. Alias Hukum/Pengawasan/PPPS hanya dipertahankan untuk kompatibilitas data dummy lama; pengesahan formal kantor dan alur khusus kategori substantif masih terbuka.

## Pilot / MVP

### Akun dan akses
- Login akun lokal.
- Admin membuat/menonaktifkan akun, menetapkan satu peran atau kombinasi kemampuan yang disetujui dan satu subbagian.
- Subbagian resmi: Administrasi, Hukum dan Sengketa Proses, Pencegahan, Partisipasi Masyarakat, dan Humas, serta Penanganan Pelanggaran dan Data Informasi. Alias lama hanya untuk data dummy.
- Pimpinan dan admin dapat melihat lintas subbagian; pegawai dibatasi satu subbagian.

### Registrasi arsip
- Form surat masuk, surat keluar, dan arsip administrasi umum dengan kolom wajib sesuai tipe.
- Registri 12 kategori awal dengan metadata umum; formulir khusus substantif hanya diaktifkan setelah proses, akses dan retensi disahkan.
- Admin mengelola daftar klasifikasi.
- Pencatatan dan unggah berkas adalah tanggung jawab/peran yang berbeda.
- Berkas PDF/JPG/XLSX/DOCX privat, dapat dilihat/diunduh oleh pihak berwenang.

### Disposisi
- Pimpinan menugaskan surat masuk kepada subbagian/pegawai dan menulis instruksi.
- Penerima memperbarui status: Belum ditindaklanjuti, Sedang diproses, Selesai.
- Notifikasi aplikasi; email bila konfigurasi tersedia.

### Cari, lapor, pantau
- Pencarian metadata; filter kategori, tahun, jenis, klasifikasi, subbagian, kelengkapan, dan status sesuai izin.
- Ekspor hasil metadata ke Excel.
- Dashboard pimpinan: jumlah masuk, keluar, dan disposisi belum selesai; filter tahun.
- Halaman publik: angka agregat masuk/keluar per tahun.

### Audit dan perlindungan
- Audit create/update/view/download/delete, perubahan akses, dan disposisi.
- Snapshot backup lokal harian dilaporkan terpasang; salinan offsite, enkripsi, retensi, dan restore menyeluruh tetap ditunda sebagai gate keamanan.
- Soft-delete/karantina dianjurkan sampai kebijakan retensi disepakati; tidak ada penghapusan permanen otomatis.

## Kesiapan migrasi
- Menyalin sekitar 1.000 PDF dari Google Drive ke penyimpanan privat.
- Memindai 300 surat kertas menjadi PDF.
- Menyiapkan metadata; karena belum ada, buat template migrasi dan contoh dummy.
- Demo memakai 10 surat masuk dan 10 surat keluar dummy.
- Rekonsiliasi jumlah file, cek keterbacaan, duplikasi, dan kecocokan metadata.

## Kandidat lanjutan
- Kategori konfigurabel oleh admin dengan skema metadata per kategori.
- PP Datin: Formulir B.1–B.17, kajian dugaan pelanggaran, katalog keamanan data.
- Penyelesaian Sengketa: Formulir PS, berita acara mediasi, putusan ajudikasi.
- P2H: AKP, IPI, publikasi/dokumentasi, MoU partisipatif.
- Hukum: kajian produk KPU, dokumen advokasi.
- Administrasi: NPHD, pengadaan, kepegawaian, audit internal.
- OCR isi PDF, bila dapat dipenuhi dengan kualitas dan tata kelola yang disetujui.

Kategori awal 00.3 sudah dapat dipilih, divalidasi, dicari, dan diekspor dengan metadata umum. Setiap kategori substantif lanjutan tetap perlu skema field, pemilik data, klasifikasi keamanan, akses, retensi, pelaporan, dan alur persetujuan tersendiri.
