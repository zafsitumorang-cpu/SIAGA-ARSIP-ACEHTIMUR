# API — SIAGA ARSIP

Kontrak konseptual REST/JSON dan catatan implementasi Node.js. Tidak ada migrasi Laravel pada paket saat ini. Semua endpoint internal menerapkan autentikasi, otorisasi per aksi, dan scope subbagian di server.

## Kontrak aktual tahap fondasi — 5 November 2026

Mutasi POST/PATCH memerlukan header `X-SIAGA-Request: 1`, body JSON dan sesi bila endpoint internal. Origin browser harus sama dengan APP_ORIGIN produksi; cross-site ditolak. Body umum maksimal 128 KiB, upload JSON maksimal 24 MiB untuk binary maksimal 15 MiB. `/api/health` dan `/api/config` publik hanya memuat status kesehatan/mode demo. Detail `GET /api/archives/{id}` tersedia dan diaudit. Ekspor aktual masih `GET /api/export.csv` dengan q/type/year/status mengikuti scope pencarian; XLSX belum ada. Filter classification/page, PATCH/DELETE metadata, history khusus, dan endpoint konseptual lain di bawah belum seluruhnya diterapkan. Lihat LAUNCH_READINESS.md untuk celah fitur.

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

### GET /api/notifications
Memerlukan sesi. Mengembalikan maksimal 20 disposisi terbaru, diurutkan berdasarkan createdAt. Admin/pimpinan melihat cakupan lintas subbagian. Pengguna lain hanya menerima disposisi untuk user/subbagiannya dari arsip yang diizinkan canSee. Setiap item: id (ID disposisi), text, subject, status, createdAt. Panel UI mengambil daftar ini ketika dibuka. Endpoint ini tidak menandai dibaca dan bukan layanan push real-time.
