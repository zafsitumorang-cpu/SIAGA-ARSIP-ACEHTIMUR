# PRD — SIAGA ARSIP

**Status:** Draf awal untuk validasi pemangku kepentingan  
**Organisasi:** Bawaslu Kabupaten Aceh Timur  
**Target uji coba:** sekitar satu bulan sejak 4 November 2026 (perkiraan awal: awal Desember 2026)  
**Rujukan:** Laporan Rancangan Aksi Perubahan “Optimalisasi Tata Kelola Arsip Digital Terintegrasi untuk Meningkatkan Efektivitas Layanan Administrasi”.

## Ringkasan

SIAGA ARSIP adalah sistem web untuk menata seluruh arsip administrasi digital, membantu temu kembali dokumen, mengelola disposisi pada arsip yang memerlukannya, dan menyediakan statistik agregat publik. Implementasi dilakukan bertahap: surat masuk/keluar menjadi alur awal, sedangkan kategori arsip administrasi lain memakai metadata umum sebelum alur khususnya disahkan. Sistem perlu dapat dikembangkan agar admin dapat menambah kategori dan formulir metadata melalui pengaturan.

## Masalah

Arsip saat ini tersebar antara sekitar 300 surat fisik dalam map ordner dan sekitar 1.000 PDF di Google Drive. Metadata belum tersedia sebagai daftar terstruktur. Pencarian, konsistensi penamaan/klasifikasi, distribusi informasi, dan pengendalian akses belum terintegrasi. Sasaran awal migrasi adalah sekitar 1.300 arsip: 1.000 file Drive yang disalin ke penyimpanan sistem dan 300 surat fisik yang dipindai menjadi PDF serta dicatat metadatanya.

## Sasaran

- Mewujudkan pencatatan arsip surat yang tertib dan dapat dicari dengan metadata.
- Mempercepat penemuan surat dan pemantauan disposisi.
- Mengelola berkas digital secara terpusat dengan batas akses per subbagian.
- Memberikan pimpinan gambaran jumlah arsip dan tindak lanjut.
- Menampilkan angka agregat surat masuk/keluar kepada pengunjung publik tanpa membuka arsip atau rincian surat.
- Menyediakan fondasi untuk kategori arsip lain.

## Pengguna dan akses

| Kelompok | Kebutuhan utama |
|---|---|
| Admin sistem/pengelola arsip (satu peran) | Membuat akun, mengelola konfigurasi dan klasifikasi, mencatat arsip, mengelola metadata dan berkas, memelihara akses, melihat audit log, menghapus arsip sesuai kebijakan |
| Pencatat surat | Mendaftarkan surat dan metadata sesuai subbagian yang ditugaskan |
| Pengunggah berkas | Mengunggah atau mengganti berkas arsip sesuai subbagian yang ditugaskan; peran ini berbeda dari pencatat |
| Pegawai/penerima disposisi | Melihat dan mengunduh arsip subbagiannya serta memperbarui status tindak lanjut disposisi yang ditugaskan |
| Pimpinan | Melihat arsip lintas subbagian, disposisi, dan ringkasan dashboard |
| Pengunjung publik | Melihat jumlah agregat surat masuk dan keluar, termasuk filter tahun; tanpa login |

Setiap pegawai dibatasi pada satu subbagian: Administrasi; Hukum dan Sengketa Proses; Pencegahan, Partisipasi Masyarakat, dan Humas; atau Penanganan Pelanggaran dan Data Informasi. Satu arsip juga ditetapkan ke satu subbagian penanggung jawab. Pimpinan dan admin memiliki cakupan lintas subbagian. Pemetaan akun nyata dan penetapan jabatan tetap perlu dikonfirmasi oleh kantor.

## Ruang lingkup target dan tahap implementasi

- Akun lokal yang dikelola admin; login bagi pegawai dan pimpinan. Sistem dapat diakses melalui internet setelah login.
- Registri seluruh arsip administrasi, dengan alur surat masuk dan surat keluar sebagai alur awal yang paling lengkap.
- Kategori awal: surat tugas, laporan pengawasan, dokumen kegiatan, keuangan, kepegawaian, produk hukum, notulensi, dokumentasi dan dokumen pendukung menggunakan metadata umum sampai alur khusus disahkan.
- Metadata, klasifikasi yang dikelola admin, unggah dan unduh berkas PDF/JPG/XLSX/DOCX.
- Alur disposisi surat masuk dan status tindak lanjut: Belum ditindaklanjuti, Sedang diproses, Selesai.
- Notifikasi dalam sistem; notifikasi email diupayakan jika konfigurasi email tersedia.
- Pencarian dan filter metadata; OCR/full-text untuk isi PDF sebagai kemampuan bersyarat.
- Dashboard pimpinan dan halaman publik agregat.
- Ekspor daftar hasil pencarian ke Excel bagi pengguna yang berwenang.
- Audit aktivitas, backup otomatis harian dengan salinan di lokasi terpisah.
- Migrasi awal sekitar 1.300 arsip; 10 data dummy masuk dan 10 data dummy keluar digunakan untuk demo, bukan arsip nyata.

## Di luar tahap pertama

Kategori lanjutan yang dicatat sebagai backlog: berkas penanganan pelanggaran dan kajian PP Datin; penyelesaian sengketa; AKP, IPI, dokumentasi/publikasi, dan MoU; kajian/advokasi hukum; NPHD, pengadaan, arsip kepegawaian, dan pengawasan internal. Masing-masing perlu persetujuan proses, metadata, klasifikasi keamanan, dan hak akses sebelum diaktifkan. Fitur kasus substantif atau pengelolaan seluruh kategori tersebut tidak dianggap termasuk MVP.

## Ukuran keberhasilan awal

- 20 data dummy dapat dibuat, dicari, difilter, dan diekspor.
- Surat masuk dapat melalui alur pencatatan → disposisi pimpinan → pembaruan status penerima.
- Pegawai hanya melihat arsip subbagiannya; pimpinan/admin melihat lintas subbagian; publik hanya melihat agregat.
- PDF dapat disimpan privat dan diunduh oleh pengguna berwenang.
- Backup harian dan pencatatan aktivitas tersedia.
- Uji coba dengan pengguna kantor menunjukkan pencarian metadata dan alur disposisi dapat dijalankan.
- Rencana pemindaian dan pemindahan 1.000 PDF memiliki rekonsiliasi jumlah serta pemeriksaan metadata/berkas.

## Asumsi dan keputusan terbuka

Hosting dan domain belum diputuskan. Rekomendasi awal adalah layanan hosting terkelola yang disetujui organisasi, dengan aplikasi web, basis data relasional, penyimpanan objek privat, TLS, backup harian terpisah, serta opsi lokasi data yang sesuai kebijakan instansi. Anggaran, penyedia, region/lokasi data, kebijakan retensi arsip, MFA, volume ukuran file, dan target ketersediaan perlu diputuskan melalui musyawarah.
