# SECURITY — SIAGA ARSIP

## Kontrol kode saat ini — 5 November 2026

- Password scrypt dengan salt unik (N=32768, r=8, p=3); SHA-256 lama hanya diterima untuk upgrade login di demo. Impor produksi mengganti password dan menonaktifkan akun lama, kecuali admin bootstrap pilihan.
- Token sesi acak disimpan sebagai hash, kedaluwarsa delapan jam, bertahan saat restart, dicabut saat logout/perubahan akun. Produksi mewajibkan PostgreSQL, APP_ORIGIN HTTPS dan cookie Secure/HttpOnly/SameSite=Lax; tidak melakukan seed demo.
- Mutasi API memerlukan X-SIAGA-Request: 1; Origin dan Sec-Fetch-Site diperiksa. Rate limiter login per proses, header CSP dan header keamanan lain diterapkan. Nginx satu VPS membuat alamat socket sama bagi pengguna; batas per username tetap berlaku, batas IP gabungan perlu dipantau.
- Scope tulis pencatat dan pembacaan/pembaruan disposisi diperiksa di server. Penugasan dibatasi pada subbagian pemilik arsip sampai kebijakan berbagi ditetapkan.
- Body dibatasi sebelum buffering; unggah maksimal 15 MB dengan pemeriksaan signature/ekstensi/MIME dan checksum SHA-256. Ini belum pemindaian malware.
- Audit baca/detail ditambahkan; instruksi disposisi baru tidak disalin ke audit. Pada PostgreSQL, aplikasi menambahkan event tanpa memperbarui event lama. Role database pemilik masih dapat mengubah tabel; audit belum tamper-proof dan log lama saat impor perlu ditinjau.

Regresi otomatis: `npm run test:security`; pengujian PostgreSQL memerlukan PG_TEST_URL lokal. Kontrol VPS, HTTPS nyata, offsite backup, pemindaian malware dan kebijakan retensi belum diverifikasi. Daftar di bawah tetap merupakan sasaran pilot, bukan klaim semuanya sudah dipasang.

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
