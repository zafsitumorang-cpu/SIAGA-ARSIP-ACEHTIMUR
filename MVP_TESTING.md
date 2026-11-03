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
9. Gunakan pencarian dan tombol Ekspor Excel/CSV.
10. Buka Audit aktivitas sebagai admin/pimpinan dan pastikan login, pencatatan, disposisi, perubahan status, pengelolaan akun, unggah, dan ekspor tercatat.

## Batasan pilot

Data otomatis disimpan ke `data/data.json`, sedangkan berkas unggahan masuk ke `data/files/`. Folder data tidak di-commit. File dummy awal hanya metadata dan nama file; endpoint unggah menerima PDF, JPG/PNG, XLSX, dan DOCX hingga 15 MB. Sebelum arsip nyata dipakai, ganti kredensial demo, gunakan database/object storage privat, aktifkan TLS, backup, dan tinjau kontrol akses.
