# USER FLOW — SIAGA ARSIP

## 1. Login

Pengguna internal membuka sistem melalui internet → memasukkan akun lokal → server mengautentikasi → sistem memuat peran dan satu subbagian pengguna → pengguna melihat dashboard sesuai cakupan. Admin membuat dan menonaktifkan akun. Pengunjung umum membuka halaman statistik tanpa login.

## 2. Registrasi arsip dan unggah

1. Pencatat memilih **Surat Masuk**, **Surat Keluar**, atau **Arsip Administrasi Umum**, lalu mengisi metadata wajib sesuai tipe, kategori, klasifikasi, serta subbagian penanggung jawab.
2. Sistem memvalidasi field dan akses; surat disimpan dengan status proses pencatatan.
3. Pengunggah yang berwenang memilih rekaman dan menambahkan PDF/JPG/XLSX/DOCX hasil pindai atau lampiran.
4. Sistem memeriksa tipe/ukuran, menyimpan berkas secara privat, membuat audit event, dan menampilkan status kelengkapan.
5. Pimpinan membuka surat dan membuat disposisi berisi instruksi serta penerima.
6. Penerima mendapat notifikasi di aplikasi dan email jika tersedia, membuka surat sesuai kewenangan, lalu memperbarui status.
7. Sistem mencatat setiap perubahan status dan waktu.

## 3. Surat keluar

Pencatat membuat rekaman dengan nomor/tanggal, tujuan, perihal, penandatangan, klasifikasi, dan subbagian → pengunggah melampirkan berkas final → sistem menyimpan privat dan mencatat audit → pegawai berwenang melihat/mengunduh atau mencari rekaman.

## 4. Pencarian dan ekspor

Pengguna membuka Arsip → memasukkan kata metadata atau filter → server menerapkan scope subbagian sebelum mengembalikan hasil → pengguna membuka detail/unduh berkas atau mengekspor daftar metadata ke XLSX. Ekspor hanya memuat field yang disetujui dan rekaman yang dapat diakses.

## 5. Pengelolaan klasifikasi/kategori

Admin membuka Pengaturan → tambah/ubah pilihan klasifikasi atau kategori → sistem meminta konfirmasi dan mencatat audit → pilihan baru tersedia pada form. Mengubah kategori arsip lanjutan tidak otomatis memperluas akses pengguna.

## 6. Statistik

Pimpinan/admin melihat jumlah surat masuk/keluar dan disposisi tertunda lintas subbagian, dengan filter tahun. Pengunjung publik hanya melihat angka masuk/keluar yang telah diagregasi; tidak ada tautan ke arsip.

## 7. Backup dan pemulihan

Timer lokal membuat snapshot database dan file → admin memeriksa status keberhasilan/kegagalan → offsite, enkripsi, retensi dan uji pemulihan menyeluruh tetap menunggu paket 11 sebelum arsip nyata.

## Jalur pengecualian

- Berkas ditolak jika format atau ukuran melewati kebijakan.
- Gagal unggah meninggalkan rekaman metadata dengan indikator berkas belum tersedia, tanpa menampilkan tautan rusak.
- Pengguna nonaktif atau tidak berhak menerima penolakan generik dan tidak memperoleh bocoran keberadaan surat.
- Salah metadata diperbaiki admin; perubahan tercatat.
- Penghapusan mengikuti kebijakan retensi dan perlu audit; pemusnahan permanen tidak otomatis.
