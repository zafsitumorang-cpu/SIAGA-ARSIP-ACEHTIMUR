# DATABASE — SIAGA ARSIP

Model dokumen/versi/lampiran bertahap TODO 02.1 dijelaskan di [FILE_MODEL.md](FILE_MODEL.md). Reader menghasilkan view read-only dari fileVersions lama dan documents JSONB; field primary flat tetap kompatibel. Tidak ada migrasi massal atau perubahan schema SQL pada langkah ini.

## Implementasi saat ini — 5 November 2026

Schema PostgreSQL v1 tersedia di [db/schema.sql](db/schema.sql), diakses melalui [lib/store.mjs](lib/store.mjs). Tabel aktual: siaga_users, siaga_archives, siaga_dispositions, siaga_audit, siaga_sessions, siaga_classifications, siaga_categories dan siaga_meta. FK mengikat pencatat/arsip, disposisi/arsip dan sesi/pengguna. Atribut lainnya masih JSONB; riwayat file/status tersimpan di payload, bukan seluruh tabel konseptual terpisah. Transaksi dan advisory lock menjaga perubahan antarproses; aplikasi masih memuat seluruh dataset, sehingga pagination/query SQL dan uji beban diperlukan. CLI migrate/bootstrap/import/export dan batas pemulihannya dijelaskan di [deploy/README.md](deploy/README.md).

## Skema sasaran

Bagian berikut adalah skema konseptual, belum seluruhnya diterapkan. Semua entitas menggunakan ID stabil dan cap waktu UTC; format waktu UI mengikuti browser. Berkas saat ini berada di direktori privat, bukan blob publik di database; object storage adalah opsi pengembangan.

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
- Seed target mengikuti RA: Administrasi; Hukum dan Sengketa Proses; Pencegahan, Partisipasi Masyarakat, dan Humas; Penanganan Pelanggaran dan Data Informasi.
- Reader runtime menerima alias legacy Hukum/Pengawasan/PPPS selama transisi dummy tanpa mengubah identitas scope; migrasi arsip nyata memerlukan manifest pemetaan yang disetujui.
- `user_subsection`: `user_id`, `subsection_id`, `assigned_by`; aturan aplikasi membatasi satu subbagian per pegawai. Admin dan pimpinan dapat memiliki cakupan lintas bagian melalui role, bukan penugasan pegawai biasa.

### `archive_categories`
- `id`, `code`, `name`, `description`, `is_active`, `created_by`, `created_at`.
- Seed runtime 00.3: Surat Masuk, Surat Keluar, Arsip Administrasi Umum, Surat Tugas, Laporan Hasil Pengawasan, Dokumen Kegiatan, Keuangan, Kepegawaian, Produk Hukum, Notulensi, Dokumentasi Kegiatan, dan Dokumen Pendukung. Runtime menerima string legacy dan record master kategori (`id`, `code`, `label`, `description`, `active`, `aliases`, cap waktu) pada registri JSONB/`siaga_categories`.
- Tipe `administrative` memakai metadata umum; field asal/tujuan/tanggal diterima/penandatangan nullable dan tidak diwajibkan. Admin dapat menambah, mengubah dan menonaktifkan kategori; kategori nonaktif diblokir untuk arsip baru, sementara referensi lama tetap terbaca, terfilter dan terekspor. Nama lama menjadi alias bila kode stabil; aturan kode mengikuti klasifikasi. Retensi dan alur substantif tetap perlu keputusan kantor.

### `classifications`
- `id`, `code` (opsional sampai standar resmi tersedia), `label`, `description`, `is_active`, `created_by`, `created_at`.
- Runtime JSON/JSONB menerima string legacy dan record master terstruktur (`id`, `code`, `label`, `description`, `active`, `aliases`, cap waktu). Reader menormalisasi keduanya sehingga arsip lama tetap valid. Admin dapat menambah, mengubah metadata atau menonaktifkan klasifikasi; klasifikasi nonaktif diblokir untuk arsip baru, sementara referensi lama tetap terbaca dan terindeks. Perubahan nama dengan kode stabil menyimpan nama lama sebagai alias. Klasifikasi legacy tanpa kode harus diberi kode sebelum penggantian nama. Aturan kode saat ini: 1–50 karakter, diawali huruf/angka, lalu huruf, angka, `.`, `_`, `/`, atau `-`. Klasifikasi keamanan/akses arsip perlu model terpisah jika disahkan.

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

## Implementasi event/read state 03.5

Event notifikasi in-app diturunkan dari createdAt/createdBy dan updates riwayat disposisi persisten. Read receipt `notificationReads[userId][eventId] = readAt` berada dalam payload siaga_dispositions (JSONB), sehingga tidak memerlukan DDL/migrasi massal; legacy updates tanpa ID memakai ID kombinasi yang stabil. GET tidak menulis; tanda baca/unread eksplisit menggunakan transaksi/advisory lock yang sama. DTO arsip/daftar kerja menyembunyikan map baca serta receipt retry. Array notifications lama bukan sumber inbox dan tidak menjadi antrean pengiriman. Tabel notifications konseptual di atas tetap opsi normalisasi/kanal eksternal, bukan tabel yang sudah dipasang. Pemisahan/constraint/index/migrasi lanjutan tetap paket 08.

## Siklus soft-delete arsip 04.5

Soft-delete tidak menghapus baris arsip atau binary. Record menyimpan `deletedAt`, `deletedBy`, `deleteReason` dan cap pemulihan (`restoredAt`, `restoredBy`) pada payload JSON/JSONB. Query daftar, statistik publik, ekspor, detail, disposisi, QC, unggah dan unduh memeriksa status aktif sehingga arsip terhapus tidak muncul atau dapat diakses melalui jalur biasa. Admin memulihkan dengan alasan wajib; operasi delete/restore append audit tanpa menulis ulang versi/lampiran. Uji JSON/PostgreSQL memverifikasi restart, scope pegawai, ekspor dan penolakan role.

## Histori koreksi metadata 04.4

Record append-only `metadataHistory[]` berada pada payload JSONB siaga_archives (atau arsip yang sama pada JSON): id event, metadataVersion hasil koreksi, array nama field yang berubah, ID admin dan timestamp UTC. Tidak ada before/after, snapshot perihal, lokasi, referensi sumber atau nilai metadata lain dalam event. Label/nama pelaku hanya diproyeksikan saat dibaca; DTO menggunakan allowlist sehingga field ekstra pada histori impor tidak bocor melalui API.

Pembaruan metadata, kenaikan versi, histori ringkas dan audit nama field berada dalam satu transaksi; JSON memakai publikasi atomik dan PostgreSQL memakai transaksi/advisory lock yang sudah ada. Tidak ada DDL, migrasi massal atau pengisian ulang histori lama. No-op/validasi gagal/konflik tidak menambah event. Ketika tidak ada disposisi, koreksi unit memindahkan scope seluruh arsip beserta file dan historinya. Bila ada disposisi, perubahan unit/jenis diblokir untuk mempertahankan penugasan, termasuk tugas selesai. Izin edit tetap admin-only sementara 00.2 belum disahkan; bukan keputusan matriks kantor baru. Mekanisme ini bukan log tamper-proof atau riwayat isi lengkap.
