# Panduan Uji Coba MVP

## Menjalankan

Membutuhkan Node.js 22 atau lebih baru (disarankan 24 LTS). Akun dan data pada bagian demo hanya untuk lingkungan uji.

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
9. Gunakan pencarian dan tombol Ekspor CSV / Ekspor Excel (.xlsx).
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
3. Ekspor CSV dan Excel harus memuat seluruh hasil sesuai filter dan izin, termasuk baris pada halaman lain, serta urutan sama dengan daftar (waktu pencatatan terbaru lalu ID). Tombol dinonaktifkan ketika gagal memuat atau hasil kosong.
4. Pegawai hanya melihat subbagian sendiri; selector subbagian terkunci. Manipulasi query tidak boleh memperluas akses.
5. Rentang tanggal terbalik ditolak tanpa menghapus isian. Reset filter mengembalikan daftar. Gangguan jaringan menawarkan Coba lagi, dan respons lambat tidak menimpa halaman lain setelah navigasi.
6. Ubah metadata pada hasil filter, lalu pastikan kriteria tetap diterapkan. Beranda/grafik/disposisi tetap memakai seluruh data berizin. Periksa filter/pager pada HP.

Pengujian otomatis: `npm run test:query`, regresi keamanan JSON/PostgreSQL dan `tests/browser/archive-search.cjs`. Daftar kini memakai pagination API, tetapi store dan cache dashboard/disposisi masih memuat data lengkap; uji beban VPS tetap terpisah.

### Hasil UAT pengguna — 5 November 2026

Pengguna melaporkan PPPS=5 arsip, ditambah surat keluar=3, lalu rentang tanggal sampai 8 September=1. Pilihan 10/25/50/100 ada dan halaman kedua menampilkan 11–20. CSV berisi 20/5/1 baris sesuai kriteria; login/ekspor tercatat di audit. Tidak ada arsip diubah. Filter Selesai belum diuji pengguna karena contoh belum memiliki disposisi. Kolom status CSV yang sebelumnya belum ada ditambahkan pada paket ekspor berikutnya.

## Uji Excel dan status disposisi

1. Dengan 10 per halaman dan lebih dari 10 hasil, klik Ekspor Excel (.xlsx). Buka di Excel/LibreOffice dan cocokkan seluruh hasil, filter serta urutan dengan daftar. Periksa nomor surat, aksara Indonesia dan tanggal ISO tetap utuh.
2. Kedua format harus memuat Status disposisi. Arsip tanpa penugasan berisi Tanpa disposisi; beberapa status berbeda dirangkum dengan titik koma. Instruksi/catatan privat tidak ikut.
3. Pada data dummy lingkungan uji, buat disposisi, tandai Selesai lalu terapkan filter Selesai. Cocokkan daftar, CSV dan XLSX; pastikan akun subbagian lain tetap tidak dapat mengekspor arsip itu. Uji ini tidak boleh dilakukan pada arsip nyata tanpa kebutuhan kerja.
4. Pastikan audit mencatat format/jumlah data. Pengujian otomatis tersedia di `npm run test:export`, `npm run test:security` serta browser pencarian. Uji unduh lokal sudah mencakup XLSX terbaca dan filter Selesai; penerimaan pengguna pada produksi masih terpisah.

## Uji retry pencatatan dan unggah — TODO 01.1

Gunakan arsip dummy/staging. Jangan menguji dengan arsip nyata. Deployment publik tetap demonstrasi dengan data dummy sampai gate keamanan/operasional ditutup; mode autentikasi produksi tidak mengubah dummy menjadi arsip operasional.

1. Pada Tambah arsip, isi metadata dan pilih file. Simulasikan upload gagal di lingkungan uji. Metadata tetap satu rekaman; dialog menjelaskan sukses parsial, mengunci metadata tersimpan, mempertahankan pilihan berkas dan menawarkan Ulangi unggah.
2. Pulihkan koneksi, klik Ulangi unggah: file terpasang pada ID arsip yang sama. Audit create/upload masing-masing satu untuk perubahan itu. Respons sukses metadata maupun upload yang terputus juga harus aman diulang.
3. Submit ganda/Escape saat simpan berlangsung tidak mengirim tindakan kedua atau menutup dialog. Validasi metadata gagal mengizinkan koreksi draft. File tidak valid bisa diganti tanpa membuat metadata lagi.
4. Setelah upload gagal, Selesai tanpa berkas atau Escape menutup dialog sambil mempertahankan metadata dan memperbarui daftar. Gangguan refresh setelah sukses menyimpan dilaporkan sebagai gangguan daftar, bukan kegagalan pencatatan.
5. Pencatat tetap hanya mencatat subbagian sendiri dan tidak mengunggah; pengunggah/admin sesuai izin yang sudah berlaku. Uji keyboard dan tampilan HP.

Bukti lokal: keamanan 187 pemeriksaan JSON/PostgreSQL, database 8, browser retry 10, regresi browser metadata 9 dan interaksi 15; UAT dasar 15 lulus. Petunjuk browser ada di tests/browser/README.md. Perlindungan ini berlaku untuk retry dengan kunci operasi sama; draft/kunci belum dipulihkan setelah reload/menutup dialog dan memulai operasi baru.

## Uji berkas dan riwayat versi — 02.2

Pada dummy, buka Arsip → Berkas & versi (atau Detail → Berkas & riwayat versi). Unggah v1, Ganti berkas dengan alasan menjadi v2, unduh v1 dan cocokkan isi/nama. Pastikan pengunggah/waktu/alasan tampil. Gunakan v1 sebagai versi baru: hasil v3 baru dengan riwayat v1/v2 utuh. Data legacy yang tidak mencatat aktor/waktu harus tertulis Tidak diketahui, file hilang tertulis belum tersedia.

Simulasikan respons sukses upload terputus lalu retry; jumlah versi tetap satu untuk tindakan itu. Perubahan dari tab lain menghasilkan konflik dan mempertahankan draft sampai Muat ulang dipilih. Pegawai satu subbagian dapat melihat/unduh histori tanpa kontrol ganti; pegawai asing dan anonim ditolak server. Uji HP/keyboard. `npm run test:versions` menjalankan suite JSON serta PostgreSQL bila PG_TEST_URL lokal tersedia; browser: tests/browser/file-versions.cjs. Pelaksanaan UAT kantor belum diklaim oleh tersedianya skenario ini.

### Lampiran — 02.3

Tambahkan Lampiran A dan B, lalu ganti A. Pastikan B dan dokumen utama tetap aktif pada file sebelumnya, sementara A1 masih bisa diunduh. Coba restore A1 sebagai A3; main/B tidak berubah. Respons pembuatan lampiran yang terputus harus aman diulang tanpa menambah lampiran kedua. Lampiran boleh dibuat sebelum primary; setelah primary diisi, lampiran awal tetap ada. Judul kosong/file invalid ditolak. Pembaca hanya memiliki unduh sesuai scope.

Bukti pengembangan 02.3: model 12, API versi/lampiran JSON/PostgreSQL 52 dan browser versi/lampiran 11 skenario; CI tetap menjalankan regresi lama. Ini bukti aplikasi dengan dummy, bukan bukti digitalisasi/QC/pilot kantor.

### Regresi 02.4 — konsistensi binary/metadata

Jalankan `PG_TEST_URL=<PostgreSQL lokal fixture> npm run test:file-io`: 17 pemeriksaan JSON/PG, termasuk trigger DB yang sengaja menolak save dan COMMIT/rename yang berhasil tetapi responsnya hilang. Binary lama tetap utuh, binary transaksi yang pasti batal dibersihkan, binary ambigu tetap ada. Dry-run memisahkan yatim lama, staging, baru, missing dan symlink tanpa menghapus. Tambahkan `test:versions` (52), `test:security` (187), `test:database` (8) serta browser `file-versions.cjs` (11). Semua mutasi pada fixture sementara; UAT kantor dan restore/offsite bukan klaim pengujian ini.

### 03.1 — penerima individu/tim

`PG_TEST_URL=<fixture lokal> npm run test:dispositions` menjalankan 24 pemeriksaan JSON/PostgreSQL: daftar penerima minimal/aktif/scoped, individu vs tim, rekan tak ditugasi ditolak, supervisi, penerima nonaktif/asing ditolak, notifikasi dan restart. Browser `tests/browser/dispositions.cjs` menguji pilihan orang/tim, penyimpanan nama, muat gagal/retry, HP/keyboard dan editor status yang tidak ditampilkan ke non-penerima. Asumsi penerima ada di FEATURE_ASSUMPTIONS.md; persetujuan kantor tetap belum dicentang.

### 03.2 — kronologi dan tindak lanjut

Suite `test:dispositions` diperluas menjadi 38 pemeriksaan JSON/PG. Bukti meliputi provenance dan histori immutable, catatan teks/limit, no-op, aturan reopen/reset, scope serta restart. Browser `dispositions.cjs` menjadi 10 skenario: catatan HTML di-escape, validasi alasan tanpa kehilangan draft, reopen mempertahankan bukti selesai, serta kronologi di detail arsip. UAT kantor belum dilakukan; default transisi di FEATURE_ASSUMPTIONS.md memerlukan tinjauan pemilik proses.

### 03.3 — retry, dua tab dan respons terlambat

`test:dispositions`: 54 pemeriksaan JSON/PostgreSQL, termasuk create/update receipt, payload conflict, paralel, version CAS wajib, ID event, receipt privat dan persistensi replay setelah restart. Fixture regresi status lama kini menyertakan expectedVersion hasil baca. Browser `disposition-retry.cjs`: 7 skenario double-submit, respons create/update sengaja diputus setelah backend sukses, konflik dua tab dengan draft, reload tanpa menghapus catatan, dropdown gagal pulih dan respons setelah navigasi. Browser disposisi lama 10 tetap lulus; data/akun semua lokal sementara.
