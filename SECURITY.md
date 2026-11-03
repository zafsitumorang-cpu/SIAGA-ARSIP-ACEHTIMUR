# SECURITY — SIAGA ARSIP

## Tujuan dan data

Sistem memuat korespondensi resmi, berkas lampiran, instruksi disposisi, akun pegawai, dan audit aktivitas. Sebagian arsip lanjutan yang disebutkan pengguna dapat memuat data pribadi atau informasi sensitif. Dokumen asli bersifat privat secara default. Halaman publik hanya memuat hitungan agregat surat masuk/keluar.

## Kontrol wajib untuk pilot

- TLS untuk semua akses web; kata sandi di-hash menggunakan algoritma adaptif modern; tidak pernah dicatat di log.
- Otorisasi ditegakkan di server pada setiap pencarian, record, ekspor, preview, dan download. Jangan mengandalkan penyembunyian tombol di UI.
- Satu subbagian per pegawai; admin/pimpinan lintas bagian. Akun dapat dinonaktifkan dan sesi dicabut.
- Object storage privat; kunci berkas acak; akses sementara/stream lewat aplikasi setelah pengecekan izin. Jangan memakai bucket publik atau URL permanen.
- Validasi ekstensi dan MIME aktual; batas ukuran; nama file disanitasi; pencegahan path traversal; antivirus/karantina bila tersedia.
- Batasi percobaan login, lindungi dari CSRF/XSS/SQL injection, dan gunakan header keamanan serta cookie sesi aman.
- Audit event untuk penambahan, perubahan, pembacaan, unduhan, penghapusan, perubahan role/akses, login penting, dan disposisi. Log terlindungi dari perubahan biasa; jangan masukkan isi surat atau instruksi sensitif ke log.
- Backup harian untuk database dan berkas dengan salinan terpisah; enkripsi backup; batasi akses; catat hasil dan jalankan simulasi pemulihan sebelum pilot.
- Rahasia email/database disimpan di secret manager atau konfigurasi deployment aman, bukan source control.

## Rekomendasi tambahan

- Aktifkan MFA untuk admin dan pimpinan jika sarana tersedia.
- Sediakan notifikasi login/perubahan role admin.
- Pisahkan lingkungan demo dari produksi; gunakan data dummy tanpa data pribadi nyata.
- Terapkan retensi audit log dan klasifikasi akses sesuai kebijakan resmi.
- Terapkan review akses berkala, prosedur insiden, dan daftar kontak pemulihan.
- Lakukan pemeriksaan keamanan sebelum sistem dibuka ke internet.

## Batas akses publik

Endpoint publik hanya membaca agregat dari data yang telah disaring. Tidak boleh mengembalikan metadata granular, ID internal, arsip yang dihapus, jumlah yang dapat ditelusuri sampai orang/dokumen tertentu, atau link berkas. Hindari cache publik untuk respons internal. Uji risiko re-identifikasi untuk kelompok kecil sebelum menambah metrik.

## Hosting dan kepatuhan

Penyedia, lokasi data, kebijakan cloud, klasifikasi sistem, serta persetujuan pengelola TI belum diputuskan. Sebelum arsip nyata dimasukkan, kantor harus menilai kebutuhan kearsipan, keamanan SPBE, pelindungan data pribadi, retensi, dan kebijakan Bawaslu/instansi yang berlaku. Dokumen ini bukan opini hukum.

Rujukan awal untuk ditinjau bersama pejabat/pengelola terkait:
- UU 43/2009 tentang Kearsipan: https://peraturan.bpk.go.id/Details/38788/uu-no-43-
- PP 28/2012 pelaksanaan UU Kearsipan: https://peraturan.bpk.go.id/Details/5240/pp-no-28-tahun-2012
- Perpres 95/2018 tentang SPBE: https://peraturan.bpk.go.id/Details/96913/perpres-no-95-tahun-2018.html
- UU 27/2022 tentang Pelindungan Data Pribadi: https://peraturan.bpk.go.id/Details/229798/uu-no-27-
- Peraturan BSSN 8/2024 tentang audit keamanan SPBE: https://peraturan.bpk.go.id/Details/309821/peraturan-bssn-no-8-tahun-2024

Rujukan ini perlu diperiksa kembali oleh pihak berwenang terhadap regulasi terbaru dan kebijakan internal sebelum keputusan hosting atau migrasi.
