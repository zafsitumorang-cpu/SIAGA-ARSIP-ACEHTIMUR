# API — SIAGA ARSIP

Kontrak konseptual REST/JSON. Jalur di bawah ini juga dipakai oleh MVP Node.js untuk uji coba; pada migrasi Laravel, prefix autentikasi dapat disesuaikan tanpa mengubah aturan bisnis. Semua endpoint internal menerapkan autentikasi, otorisasi per aksi, dan scope subbagian di server.

## Publik

- `GET /api/public/stats?year={year}` → jumlah agregat masuk/keluar per tahun (nama kontrak produksi yang direncanakan: `/api/public/statistics`).
- Tidak ada endpoint publik untuk daftar, detail, file, disposisi, atau identitas pihak.

## Autentikasi dan akun

- MVP: `POST /api/login`, `POST /api/logout`, `GET /api/me`.
- `POST /api/admin/users`, `PATCH /api/admin/users/{id}`, `POST /api/admin/users/{id}/disable`
- `GET /api/admin/roles`, `GET /api/admin/subsections`

## Arsip

- `GET /api/archives?type=&q=&year=&classification=&status=&page=`
- `POST /api/archives` — pencatat berwenang membuat metadata.
- `GET /api/archives/{id}` — pemeriksaan akses terjadi sebelum mengembalikan metadata.
- `PATCH /api/archives/{id}` — hanya peran pengelola yang berwenang; perubahan tercatat.
- `POST /api/archives/{id}/files` — pengunggah yang berwenang membuat sesi unggah/unggah berkas.
- `GET /api/archives/{id}/files/{fileId}/download` — server memeriksa izin dan mengeluarkan akses singkat/stream privat.
- `POST /api/archives/export` — hasil XLSX dibatasi pada rekaman yang terlihat dan field yang diizinkan.
- `DELETE /api/archives/{id}` — penghapusan logis/admin sesuai kebijakan yang kelak disahkan; tidak ada hard delete umum.

## Disposisi

- `POST /api/archives/{id}/dispositions`
- `GET /api/dispositions?status=&year=`
- `PATCH /api/dispositions/{id}/status` — penerima yang ditugaskan memperbarui tiga status yang disepakati.
- `GET /api/dispositions/{id}/history`

## Konfigurasi dan audit

- `GET/POST/PATCH /api/admin/classifications`
- `GET/POST/PATCH /api/admin/archive-categories`
- `GET /api/admin/audit-events?actor=&action=&from=&to=`
- `GET /api/users` — daftar pengguna aktif untuk admin/pimpinan, tanpa password hash.
- `GET /api/admin/users` — daftar semua akun (termasuk nonaktif) untuk admin, tanpa password hash.
- `POST /api/admin/classifications` — admin menambah pilihan klasifikasi.
- `POST /api/admin/categories` — admin menambah kategori arsip untuk perluasan bertahap.
- Endpoint konfigurasi tidak boleh mengubah hak akses secara implisit.

## Pola respons

- Gunakan pagination (`items`, `page`, `page_size`, `total` bila aman).
- Validasi menghasilkan field error yang jelas.
- Akses ditolak menggunakan respons generik; jangan membocorkan apakah ID arsip ada.
- Unggah membatasi tipe/ukuran dan menetapkan status pemindaian/karantina bila antivirus digunakan.
- Tindakan penting menerima `request_id`/idempotency key untuk mencegah unggah atau disposisi ganda.

## OCR dan email

OCR dijalankan melalui pekerjaan latar belakang setelah berkas lolos pemeriksaan. Status: pending, processing, complete, failed. Email dikirim melalui adaptor provider dan kegagalannya dicatat tanpa menggagalkan pembuatan disposisi.
