# DATABASE — SIAGA ARSIP

Skema konseptual; tipe SQL dan provider ditentukan saat pilihan stack disepakati. Semua entitas menggunakan ID stabil dan cap waktu UTC; UI menampilkan waktu Asia/Jakarta. Berkas disimpan di object storage privat, bukan sebagai blob publik di database.

## Entitas utama

### `users`
- `id`, `username` (unik), `password_hash`, `display_name`, `email` (opsional untuk notifikasi), `is_active`, `created_at`, `updated_at`, `last_login_at`.
- Password plaintext tidak pernah disimpan.

### `roles` dan `user_roles`
- `roles`: `id`, `code`, `name`.
- `user_roles`: `user_id`, `role_id`, `assigned_by`, `assigned_at`.
- Role konseptual: system/archive admin, recorder, uploader, employee/disposition recipient, leadership. Kombinasi aktual harus disetujui.

### `subsections`
- `id`, `code`, `name`, `is_active`.
- Seed tahap pertama: Administrasi, Hukum, Pengawasan, PPPS.
- `user_subsection`: `user_id`, `subsection_id`, `assigned_by`; aturan aplikasi membatasi satu subbagian per pegawai. Admin dan pimpinan dapat memiliki cakupan lintas bagian melalui role, bukan penugasan pegawai biasa.

### `archive_categories`
- `id`, `code`, `name`, `description`, `is_active`, `created_by`, `created_at`.
- Seed: Surat Masuk, Surat Keluar. Admin dapat menambah kategori.
- Struktur field untuk kategori lanjutan perlu konfigurasi dan versi skema sebelum dipakai.

### `classifications`
- `id`, `code` (opsional sampai standar resmi tersedia), `label`, `description`, `is_active`, `created_by`, `created_at`.
- Admin mengelola daftar; klasifikasi keamanan/akses arsip perlu model terpisah jika disahkan.

### `archives`
- `id`, `category_id`, `subsection_id`, `record_number`, `letter_date`, `received_date` (surat masuk), `origin` (masuk), `destination` (keluar), `subject`, `signatory` (keluar), `classification_id`, `recorded_by`, `recorded_at`, `updated_by`, `updated_at`, `record_status`, `deleted_at`, `deleted_by`.
- Pertimbangkan field spesifik surat masuk/keluar sebagai kolom nullable atau tabel detail per tipe.
- Belum ditetapkan constraint nomor unik sebelum aturan penomoran dikonfirmasi.

### `archive_files`
- `id`, `archive_id`, `object_key`, `original_filename`, `mime_type`, `size_bytes`, `checksum_sha256`, `uploaded_by`, `uploaded_at`, `file_role` (scan, final, attachment), `is_current`, `scan_status`.
- URL object storage tidak disimpan sebagai publik; akses melalui kontrol aplikasi.

### `dispositions`
- `id`, `archive_id`, `created_by`, `instruction`, `assigned_user_id` atau `assigned_subsection_id`, `created_at`, `due_date` (opsional, belum disepakati).
- Instruksi dapat memuat informasi sensitif dan harus dilindungi seperti arsip.

### `disposition_updates`
- `id`, `disposition_id`, `status` (belum_ditindaklanjuti, sedang_diproses, selesai), `note` (opsional), `updated_by`, `updated_at`.
- Riwayat dipertahankan; perubahan baru tidak menimpa histori.

### `notifications`
- `id`, `user_id`, `kind`, `archive_id`, `disposition_id`, `channel`, `status`, `created_at`, `sent_at`, `read_at`, `error_code`.
- Kanal aplikasi wajib; email opsional saat tersedia.

### `audit_events`
- `id`, `actor_user_id` (nullable untuk pengunjung), `action`, `entity_type`, `entity_id`, `occurred_at`, `result`, `request_id`, `ip_address` (retensi/akses ditentukan kebijakan), `metadata_json` (allowlist, tanpa isi dokumen).

### `system_settings`
- Kunci konfigurasi daftar kategori, klasifikasi, batas file, email, dan kebijakan keamanan. Rahasia layanan dikelola secret store, bukan tabel biasa.

## Relasi

- Satu subbagian memiliki banyak arsip dan pegawai.
- Satu arsip memiliki banyak file, disposisi, dan audit event.
- Satu disposisi memiliki banyak pembaruan status dan notifikasi.
- Kategori dan klasifikasi dapat dipakai banyak arsip.

## Indeks dan integritas

- Indeks pencarian pada kategori, nomor, tanggal, tahun, subbagian, klasifikasi, asal/tujuan, perihal, status.
- Indeks scope subbagian dan urutan waktu untuk query berhalaman.
- Checksum membantu mendeteksi salinan file identik; tidak otomatis menghapus file.
- Foreign key dan transaksi menjaga metadata-file tidak menjadi yatim; proses unggah yang gagal harus dapat dipulihkan.
- OCR text disimpan sebagai turunan yang dapat dibangun ulang, terkait file dan versi; tidak menggantikan dokumen asli.
