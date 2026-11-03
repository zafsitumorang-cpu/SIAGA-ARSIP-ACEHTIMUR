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
