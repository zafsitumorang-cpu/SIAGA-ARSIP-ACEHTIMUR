# Panduan Uji Coba MVP

## Menjalankan

Membutuhkan Node.js 20 atau lebih baru.

```bash
npm start
```

Buka `http://localhost:3000`.

## Akun demo

| Username | Kata sandi | Cakupan |
|---|---|---|
| `admin` | `admin123` | Semua subbagian + audit |
| `pimpinan` | `pimpinan123` | Semua subbagian + disposisi |
| `pegawai.administrasi` | `pegawai123` | Administrasi |
| `pegawai.hukum` | `pegawai123` | Hukum |
| `pegawai.pengawasan` | `pegawai123` | Pengawasan |
| `pegawai.ppps` | `pegawai123` | PPPS |

## Skenario utama

1. Buka halaman publik dan pastikan angka 10 surat masuk, 10 surat keluar, dan total 20 tampil tanpa login.
2. Masuk sebagai `pegawai.hukum`; pastikan daftar hanya menampilkan arsip subbagian Hukum.
3. Masuk sebagai `pimpinan`; buka Arsip surat dan kirim disposisi pada salah satu surat masuk.
4. Masuk sebagai pegawai pada subbagian tujuan; buka Disposisi dan ubah status menjadi `Sedang diproses`, lalu `Selesai`.
5. Masuk sebagai `admin`; tambahkan arsip baru dan cek perubahan jumlah dashboard.
6. Sebagai `admin`, buka Pengaturan; buat akun pegawai baru, ubah peran/subbagian, lalu nonaktifkan dan aktifkan kembali akun tersebut.
7. Tambahkan klasifikasi baru dari Pengaturan, lalu pastikan pilihan muncul pada form arsip.
8. Buat akun `recorder` dan `uploader` pada subbagian yang sama; pastikan pencatat dapat menyimpan metadata dan pengunggah dapat menambahkan berkas privat pada arsip tersebut.
9. Gunakan pencarian dan tombol Ekspor CSV; format XLSX belum tersedia.
10. Buka Audit aktivitas sebagai admin/pimpinan dan pastikan login, pencatatan, disposisi, perubahan status, pengelolaan akun, unggah, dan ekspor tercatat.

## Batasan pilot

Data otomatis disimpan ke `data/data.json`, sedangkan berkas unggahan masuk ke `data/files/`. Folder data tidak di-commit. File dummy awal hanya metadata dan nama file; endpoint unggah menerima PDF, JPG/PNG, XLSX, dan DOCX hingga 15 MB. Sebelum arsip nyata dipakai, ganti kredensial demo, gunakan database/object storage privat, aktifkan TLS, backup, dan tinjau kontrol akses.


## Uji perbaikan metadata

Gunakan data uji dan akun yang disediakan operator, bukan credential demo pada produksi.

1. Sebagai admin, buka Arsip surat → Ubah metadata. Perbaiki nomor/perihal/tanggal/klasifikasi dan simpan. Pastikan nilai baru terlihat di daftar/detail serta waktu/aktor perubahan tampil.
2. Periksa Audit aktivitas: update_metadata mencatat nama field tanpa menyalin perihal/isi dokumen. File, pencatat, waktu pencatatan dan disposisi tetap dipertahankan.
3. Buka surat yang sama di dua tab sebelum menyimpan. Simpan tab pertama, lalu tab kedua: konflik harus menahan draft dan menawarkan muat ulang. Tidak boleh menimpa perubahan pertama secara diam-diam.
4. Pastikan pencatat, pengunggah, pimpinan dan pegawai tidak mendapat tombol edit; API juga menolak PATCH mereka. Pegawai tetap dapat membuka detail surat yang sesuai scope.
5. Pada surat dengan disposisi, jenis/subbagian dikunci. Pada surat tanpa disposisi, perpindahan oleh admin harus memperbarui scope baca/unduh. Pergantian jenis harus memenuhi field wajib tipe baru.
6. Simulasikan koneksi gagal di lingkungan uji: draft tetap ada dan tombol simpan dapat digunakan lagi. Periksa dialog/fokus/keyboard di desktop dan HP.

Regresi API ada dalam npm run test:security (JSON dan PostgreSQL ketika PG_TEST_URL lokal diisi). Uji perubahan produksi yang dilakukan manusia bukan bagian probe eksternal read-only oleh agen.

## Uji filter dan halaman arsip

1. Buka Arsip surat → Filter lanjutan. Gabungkan jenis, tahun, klasifikasi, subbagian dan rentang tanggal surat dengan kata kunci; klik Terapkan. Semua kriteria harus berlaku bersamaan. Batas tanggal termasuk tanggal awal/akhir.
2. Pilih 10 per halaman, berpindah Berikutnya/Sebelumnya dan pastikan baris tidak berulang. Mengubah filter atau ukuran halaman mengembalikan halaman pertama. Pilihan ukuran tersedia 10/25/50/100.
3. Ekspor CSV harus memuat seluruh hasil sesuai filter dan izin, termasuk baris pada halaman lain. Tombol dinonaktifkan ketika gagal memuat atau hasil kosong.
4. Pegawai hanya melihat subbagian sendiri; selector subbagian terkunci. Manipulasi query tidak boleh memperluas akses.
5. Rentang tanggal terbalik ditolak tanpa menghapus isian. Reset filter mengembalikan daftar. Gangguan jaringan menawarkan Coba lagi, dan respons lambat tidak menimpa halaman lain setelah navigasi.
6. Ubah metadata pada hasil filter, lalu pastikan kriteria tetap diterapkan. Beranda/grafik/disposisi tetap memakai seluruh data berizin. Periksa filter/pager pada HP.

Pengujian otomatis: `npm run test:query`, regresi keamanan JSON/PostgreSQL dan `tests/browser/archive-search.cjs`. Daftar kini memakai pagination API, tetapi store dan cache dashboard/disposisi masih memuat data lengkap; uji beban VPS tetap terpisah.
