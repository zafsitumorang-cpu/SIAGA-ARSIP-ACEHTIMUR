# DESIGN — SIAGA ARSIP

## Prinsip desain

1. **Temu kembali lebih cepat:** pencarian dan filter utama mudah ditemukan.
2. **Akses jelas:** setiap daftar dan detail menunjukkan konteks subbagian; data lintas bagian hanya tersedia bagi pimpinan/admin.
3. **Status mudah dipahami:** gunakan label yang konsisten untuk disposisi.
4. **Privasi secara default:** dokumen privat; halaman publik hanya angka agregat.
5. **Dapat diperluas:** kategori dan klasifikasi dapat ditambah admin tanpa mengubah alur surat yang sudah ada.
6. **Konsisten dengan prototipe:** ikuti dashboard SIAGA ARSIP high-fidelity yang telah dibahas di Figma; detail token warna, tipografi, dan komponen final perlu diambil dari file desain saat implementasi.

## Navigasi dan halaman

### Area internal

- **Dashboard:** kartu jumlah surat masuk/keluar, disposisi belum selesai, filter tahun; pimpinan melihat lintas subbagian, pengguna lain hanya lingkupnya.
- **Arsip:** tab Surat Masuk dan Surat Keluar; tabel, pencarian, filter, ekspor Excel.
- **Detail surat masuk:** metadata, preview/unduh berkas berizin, kronologi disposisi, status dan pembaruan tindak lanjut.
- **Detail surat keluar:** metadata, berkas final, riwayat perubahan.
- **Tambah/Edit arsip:** form sesuai tipe surat; subbagian penanggung jawab wajib; klasifikasi dari daftar pilihan admin.
- **Disposisi:** daftar tugas bagi penerima; pimpinan membuat disposisi dan menetapkan penerima.
- **Manajemen:** akun, peran, subbagian, klasifikasi, kategori arsip, audit log, dan konfigurasi notifikasi.

### Halaman publik

Halaman tanpa login menampilkan jumlah surat masuk dan surat keluar, total bila relevan, dan filter tahun. Tidak menampilkan nomor surat, perihal, nama pihak, isi dokumen, tautan berkas, disposisi, atau statistik yang memudahkan identifikasi rekaman individual.

## Formulir

**Surat masuk:** nomor surat, tanggal surat, tanggal diterima, asal surat, perihal, tujuan/disposisi, klasifikasi, subbagian penanggung jawab, berkas hasil pindai/lampiran, pencatat, tanggal pencatatan. Kolom yang menyangkut disposisi muncul sebagai bagian alur pimpinan.

**Surat keluar:** nomor surat, tanggal surat, tujuan surat, perihal, penandatangan, klasifikasi, subbagian penanggung jawab, berkas final, pencatat, tanggal pencatatan.

Jangan memaksakan nomor surat unik secara global sebelum aturan penomoran kantor diverifikasi. Validasi minimum: kolom wajib terisi, tanggal valid, tipe file yang diizinkan, dan ukuran file di bawah batas konfigurasi.

## Pola interaksi

- Tabel menyediakan pencarian teks metadata, filter tahun, klasifikasi, subbagian (hanya bagi yang berwenang), dan status disposisi.
- Detail dokumen menampilkan tombol **Lihat/Unduh** hanya setelah pemeriksaan izin server.
- Pengguna menerima notifikasi di sistem ketika menerima disposisi; email dikirim jika layanan email telah dikonfigurasi.
- Tindakan yang mengubah arsip menampilkan konfirmasi dan identitas perubahan.
- Form memberikan pesan validasi berbahasa Indonesia dan tidak menghapus input saat kesalahan.
- Tampilan mendukung desktop dan tablet; kebutuhan seluler tetap responsif untuk pencarian, detail, dan pembaruan status.

## Aksesibilitas dan visual

Gunakan kontras yang memadai, label teks selain warna untuk status, fokus keyboard yang terlihat, tabel dengan judul kolom jelas, dan ukuran klik yang nyaman. Pertahankan gaya dashboard SIAGA ARSIP yang sudah disepakati; jangan mengarang token pasti sebelum file Figma diperiksa.

## Status dan warna

- Belum ditindaklanjuti
- Sedang diproses
- Selesai

Warna status harus selalu disertai teks. Palet utama mengikuti desain SIAGA ARSIP yang ada.

## Keputusan desain yang tertunda

- Token desain dan ukuran layar dari file Figma.
- Bentuk preview berkas tiap jenis, ukuran unggah maksimum, serta dukungan preview XLSX/DOCX.
- Detail dashboard admin/pimpinan dan metrik selain jumlah arsip serta disposisi tertunda.
- Template email dan format ekspor Excel.

## Landing page — redesign November 2026

Portal publik menggunakan gaya editorial institusi untuk pembaca publik dan staf kantor: latar putih hangat (#faf9f5), teks arang (#272825), aksen merah marun (#8c2634), heading serif Georgia, body sans. Komposisi: identitas dan login; pembuka dengan foto koleksi sebagai ilustrasi; statistik agregat dari API dan filter tahun; tiga langkah pengelolaan; penjelasan akses; footer. Foto disimpan di public/images/archive-library.jpg, sumber Unsplash, atribusi pada footer. Tidak digunakan sebagai foto kantor Bawaslu.

Semua kelas baru dibatasi pada lp-* dan landing. Pertahankan tampilan internal. Hindari pencarian publik semu, angka kuartal fiktif, klaim Cloudflare/Next.js dan alamat kontak yang belum terverifikasi. Error statistik menyediakan coba lagi; angka nol tetap ditampilkan. Mode halaman: Persuade, dengan penekanan pada keterbacaan dan informasi institusi.

### Pembaruan palet Bawaslu
Landing memakai merah logo #E32F27 pada identitas, merah #BD241F untuk tombol yang kontras dengan teks putih, emas #FFC107 untuk penekanan dan CTA pada merah, hitam #17181B, serta putih. Font Manrope disimpan lokal di public/fonts. Hero gelap, heading sans tebal, foto dengan sudut 18px, statistik putih pada latar abu muda. Ini palet dari desain Bawaslu yang tersedia sebelumnya; aset logo resmi belum tersedia.

### Header, footer, et authentification
Header publik merah #BD241F dengan teks putih dan tombol emas; footer #17181B dengan teks abu terang. Login memakai kelas auth-* dengan panel identitas gelap, judul emas, form putih, dan CTA merah. Username/password kosong saat dibuka, label terhubung ke input, toggle kata sandi, indikator pengiriman, serta error inline. Peran ditentukan server, bukan pilihan dekoratif. Akun demo dalam details; bantuan akun diarahkan ke admin tanpa tautan pemulihan fiktif.

Panel gelap login memakai foto abstrak Pexels ID 3109807 (https://www.pexels.com/photo/3109807/), disimpan lokal di public/images/login-abstract.jpg, dengan lapisan hitam 83–88% melalui CSS. Gambar dekoratif; teks tetap memiliki opacity penuh.
