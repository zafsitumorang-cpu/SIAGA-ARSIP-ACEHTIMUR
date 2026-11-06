# DESIGN — SIAGA ARSIP

**Panduan aktif:** merah Bawaslu/emas/arang pada navigasi, panel putih, Inter workspace dan Manrope publik/login, drawer mobile, feedback/reduced motion sebagaimana pembaruan terakhir file ini. Bagian hijau/sidebar terang/Figma terdahulu merupakan riwayat, bukan alasan merombak tampilan yang dipilih pengguna. Audit layar dan urutan perbaikan UI/UX: [AUDIT_MASTER.md](AUDIT_MASTER.md), [TODO_MASTER.md](TODO_MASTER.md) paket 07. Keselarasan pixel-level dengan Penpot/Figma belum diklaim terverifikasi.

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
- **Arsip:** satu daftar seluruh tipe arsip dengan filter kategori/jenis, tabel, pencarian, filter, dan ekspor Excel.
- **Detail arsip:** metadata sesuai tipe, kategori, preview/unduh berkas berizin, kronologi disposisi bila ada, status dan riwayat perubahan.
- **Tambah/Edit arsip:** form menyesuaikan surat masuk, surat keluar, atau arsip administrasi umum; subbagian penanggung jawab wajib; kategori dan klasifikasi berasal dari registri.
- **Disposisi:** daftar tugas bagi penerima; pimpinan membuat disposisi dan menetapkan penerima.
- **Manajemen:** akun, peran, subbagian, klasifikasi, kategori arsip, audit log, dan konfigurasi notifikasi.

### Halaman publik

Halaman tanpa login menampilkan jumlah surat masuk dan surat keluar, total bila relevan, dan filter tahun. Tidak menampilkan nomor surat, perihal, nama pihak, isi dokumen, tautan berkas, disposisi, atau statistik yang memudahkan identifikasi rekaman individual.

## Formulir

**Surat masuk:** nomor surat, tanggal surat, tanggal diterima, asal surat, perihal, kategori, klasifikasi, subbagian penanggung jawab, berkas hasil pindai/lampiran, pencatat, tanggal pencatatan. Disposisi dibuat sebagai alur pimpinan.

**Surat keluar:** nomor surat, tanggal surat, tujuan surat, perihal, kategori, penandatangan, klasifikasi, subbagian penanggung jawab, berkas final, pencatat, tanggal pencatatan.

**Arsip administrasi umum:** nomor, tanggal, perihal, kategori, klasifikasi, subbagian, berkas utama/lampiran, pencatat, dan tanggal pencatatan; field asal/tujuan/tanggal diterima/penandatangan tidak dipaksakan.

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

## Dashboard — referensi Able Pro, November 2026

Demo Next.js Able Pro sudah ditinjau melalui login demo pada halaman Default dan Analytics. Dashboard SIAGA menggunakan pola visualnya: sidebar terang 272px dengan border putus tipis, topbar abu muda, kartu putih radius 12px, ikon pastel, panel grafik dan tabel lapang. Aksen Bawaslu merah #BD241F, emas #FFC107; tipografi lokal Manrope. Implementasi sendiri di public/workspace.css dan public/app.js, tanpa ketergantungan pada template berbayar atau perubahan framework. Scope CSS .workspace menjaga portal publik dan login.

Navigasi hanya memuat fungsi yang tersedia sesuai peran. Sidebar dapat dilipat pada desktop dan dibuka sebagai drawer pada ponsel. Pencarian topbar benar-benar memfilter API arsip; kembali ke Beranda menghapus filter pencarian agar statistik dan grafik konsisten. Angka grafik bulanan berasal dari letterDate, dengan tahun pilihan dan label aksesibilitas. Sebaran dari arsip yang dapat diakses. Tidak ada persentase pertumbuhan rekaan atau klaim Cloudflare/enkripsi. Label berkas Tercatat hanya mencerminkan metadata fileAvailable, bukan verifikasi dokumen. Detail arsip berupa dialog dengan fokus keyboard, Escape, metadata, dan unduh berizin.

### Navigasi palet Bawaslu
Sidebar dashboard memakai hitam arang #17181B, teks abu terang, menu aktif emas #FFC107 dengan teks hitam. Topbar merah #BD241F, teks putih, input merah gelap #A51F1B, fokus emas. Profil dan drawer ponsel memakai warna yang sama. Panel konten tetap putih pada kanvas abu muda untuk keterbacaan data.

### Default Able Pro — koreksi komposisi
Perbandingan langsung demo Default pada viewport 1440px: sidebar 280px, konten inset 48px, banner mulai y98 dengan tinggi 260px, kartu mulai y378 tinggi 194px, panel utama mulai y592. Font Inter disimpan lokal dengan regular/semibold/bold, sementara landing dan login tetap Manrope. Banner memakai bidang merah berlapis dan ilustrasi arsip 3D buatan sendiri (public/images/dashboard-archive.png); bukan ilustrasi roket demo. Kartu statistik memakai grafik mini bulanan dari data nyata, angka di kanan, dan rasio surat masuk/keluar terhadap jumlah arsip. Grafik utama menjadi garis dan area, kolom samping sekitar seperempat lebar. Data nol tidak direkayasa untuk meniru grafik demo yang ramai. Rincian bulanan tersedia sebagai tabel yang bisa dibuka. Warna navigasi Bawaslu tetap sesuai permintaan pengguna.

## Motion & feedback ruang kerja
Gerakan menjelaskan perubahan keadaan: transisi konten 190ms, dialog 220ms masuk/140ms keluar, panel notifikasi 200ms, hover/tap 120–180ms. WAAPI untuk transisi konten, CSS untuk feedback; tanpa library tambahan. prefers-reduced-motion menghapus perpindahan spasial dan loop, mempertahankan indikator status statis. Tidak ada penundaan buatan untuk memperlihatkan loading.

Request yang berlangsung >120ms menyalakan indikator emas pada topbar. Halaman Pengaturan/Audit memuat skeleton dengan aria-busy, error dan coba lagi; respons terlambat tidak menimpa navigasi baru. Form workspace memiliki status menyimpan dan pencegahan submit ganda. Dialog form memiliki fokus keyboard, Escape dan pemulihan fokus. Toast sukses/gagal dapat ditutup, maksimal tiga, timer berhenti ketika hover/fokus.

Lonceng membuka panel berisi disposisi yang diizinkan server, bukan notifikasi sintetis. Panel mendukung loading, kosong, error/coba lagi, Escape, klik di luar, dan tautan daftar disposisi. Badge berarti penugasan aktif, bukan status belum dibaca. Daftar dimuat saat panel dibuka, tanpa polling atau push real-time. Pengguna luas melihat semua disposisi dalam cakupan; pegawai melihat penugasan untuk dirinya/subbagiannya hanya pada arsip yang diizinkan.


## Koreksi hasil audit UI/UX — 6 November 2026

Menu profil hanya di avatar topbar; popover ditutup dengan klik luar/Escape. Semua dialog memakai fokus awal, penahanan Tab, Escape saat aman, dan pemulihan fokus. Pengaturan dibuka pada Daftar akun; Buat akun melalui tombol dan modal. Tab menyimpan seleksi dan mendukung tombol panah/Home/End serta relasi ARIA.

Hero menyediakan ruang caption terpisah dari catatan akses. Dashboard menampilkan judul/cakupan dan Perbarui data secara terlihat. Kartu dan grafik mengambil seri sesuai kategori; filter bulan berlaku pada angka, garis, titik, label dan tabel. Grafik menyesuaikan lebar ponsel; tabel lebar tetap dapat digeser dengan petunjuk. Target sentuh mobile ditingkatkan ke 44px. Nomor tabel arsip meneruskan offset halaman; master/akun/dashboard juga memiliki nomor. Audit memakai pagination/filter, bukan pemotongan 10 hasil permanen.

Tindakan akun dinamai Nonaktifkan dan Arsipkan akun sesuai perilaku; akun diarsipkan dapat ditampilkan dan dipulihkan. Arsip terhapus tersedia dalam Pengaturan, dengan pemulihan beralasan untuk admin. Istilah navigasi/pencarian mencakup seluruh arsip administrasi.
