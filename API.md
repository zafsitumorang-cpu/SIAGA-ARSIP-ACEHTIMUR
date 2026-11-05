# API — SIAGA ARSIP

Pembaruan 02.1: payload arsip berizin menambahkan view `documents[]` menurut [FILE_MODEL.md](FILE_MODEL.md), tanpa menulis ulang data lama. Header `X-SIAGA-Revision` menampilkan SHA checkout untuk verifikasi rilis demo (unknown bila Git tidak tersedia); body health/config tetap kompatibel.

Kontrak konseptual REST/JSON dan catatan implementasi Node.js. Tidak ada migrasi Laravel pada paket saat ini. Semua endpoint internal menerapkan autentikasi, otorisasi per aksi, dan scope subbagian di server.

## Kontrak aktual tahap fondasi — 5 November 2026

Mutasi POST/PATCH memerlukan header `X-SIAGA-Request: 1`, body JSON dan sesi bila endpoint internal. Origin browser harus sama dengan APP_ORIGIN produksi; cross-site ditolak. Body umum maksimal 128 KiB, upload JSON maksimal 24 MiB untuk binary maksimal 15 MiB. `/api/health` dan `/api/config` publik hanya memuat status kesehatan/mode demo. Detail `GET /api/archives/{id}` tersedia dan diaudit. Ekspor aktual `GET /api/export.csv` dan `GET /api/export.xlsx` mengikuti seluruh filter dan scope pencarian. DELETE metadata, history khusus, dan endpoint konseptual lain di bawah belum seluruhnya diterapkan. Lihat LAUNCH_READINESS.md untuk celah fitur.

### Pencarian dan pagination aktual

`GET /api/archives` menerima kriteria opsional berikut, digabungkan dengan AND setelah pembatasan akses pengguna:

| Parameter | Nilai |
|---|---|
| q | Substring literal, tanpa membedakan kapital, maksimal 200 karakter; nomor, asal, tujuan, perihal, klasifikasi atau subbagian |
| type | incoming / outgoing |
| year | Empat digit berdasarkan tanggal surat |
| classification | Nama klasifikasi terdaftar |
| subsection | Administrasi / Hukum / Pengawasan / PPPS; tidak memperluas izin pengguna |
| from, to | YYYY-MM-DD, tanggal surat inklusif; awal tidak boleh melewati akhir |
| status | Belum ditindaklanjuti / Sedang diproses / Selesai pada salah satu disposisi |
| page, page_size | Halaman positif; ukuran 10/25/50/100, default 25 |

Adanya `page` atau `page_size` mengaktifkan respons `{items,page,page_size,total,pages,classifications,subsections,years}`. Urutan berdasarkan createdAt terbaru lalu id menaik; halaman berlebih diarahkan ke halaman terakhir. Hasil kosong memiliki total 0, page 1 dan pages 1. Parameter tidak valid ditolak 422. `years` hanya berasal dari arsip yang boleh dilihat pengguna, sebelum filter pencarian.

Tanpa kedua parameter pagination, kontrak daftar tanpa halaman tetap dipertahankan untuk dashboard/disposisi. Store saat ini masih memuat dataset lengkap ke memori: ini pembatasan respons daftar, belum pagination/query SQL.

### Ekspor aktual

`GET /api/export.csv` dan `GET /api/export.xlsx` menerima delapan kriteria yang sama, mengekspor seluruh hasil berizin dan mengabaikan parameter halaman. Urutan sama dengan daftar paginasi: waktu pencatatan terbaru, lalu id menaik. Keduanya dicatat sebagai event `export` dengan jumlah data dan format; tanpa isi metadata/instruksi dalam audit. Query tidak valid ditolak 422 dan tanpa sesi ditolak 401.

Kolom: Jenis, Nomor, Tanggal, Asal, Tujuan, Perihal, Klasifikasi, Subbagian, Status disposisi. Kolom terakhir berisi status unik dari semua disposisi arsip, dipisah titik koma; tanpa penugasan ditulis `Tanpa disposisi`. Filter status mencocokkan minimal satu disposisi, sedangkan kolom ekspor tetap merangkum semua status. Instruksi dan catatan tindak lanjut tidak diekspor.

XLSX berisi sheet `Arsip surat`, header beku, lebar kolom dan teks terbungkus. Semua nilai ditulis sebagai tipe String untuk mempertahankan nomor/tanggal ISO dan mencegah interpretasi formula. CSV memakai UTF-8 BOM, kutip standar, CRLF, serta awalan apostrof untuk teks yang berpotensi formula (termasuk setelah whitespace). Hasil kosong API tetap menghasilkan header saja. XLSX dibuat dalam memori; uji 1.300 rekaman sintetis bukan bukti performa/resource VPS.

## Publik

- `GET /api/public/stats?year={year}` → jumlah agregat masuk/keluar per tahun (nama kontrak produksi yang direncanakan: `/api/public/statistics`).
- Tidak ada endpoint publik untuk daftar, detail, file, disposisi, atau identitas pihak.

## Autentikasi dan akun

- MVP: `POST /api/login`, `POST /api/logout`, `GET /api/me`.
- `POST /api/admin/users`, `PATCH /api/admin/users/{id}`, `POST /api/admin/users/{id}/disable`
- `GET /api/admin/roles`, `GET /api/admin/subsections`

## Arsip

- `GET /api/archives?type=&q=&year=&classification=&subsection=&from=&to=&status=&page=1&page_size=25`
- `POST /api/archives` — pencatat berwenang membuat metadata.
- `GET /api/archives/{id}` — pemeriksaan akses terjadi sebelum mengembalikan metadata.
- `PATCH /api/archives/{id}` — hanya peran pengelola yang berwenang; perubahan tercatat.
- `POST /api/archives/{id}/files` — pengunggah yang berwenang membuat sesi unggah/unggah berkas.
- `GET /api/archives/{id}/files/{fileId}/download` — server memeriksa izin dan mengeluarkan akses singkat/stream privat.
- `GET /api/export.csv`, `GET /api/export.xlsx` — hasil pencarian berizin, seluruh halaman, dengan audit.
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


### PATCH metadata yang sudah diterapkan

`PATCH /api/archives/{id}` memerlukan role admin. Pegawai, recorder, uploader dan leader ditolak 403; anonymous 401. Baca versi terbaru dari GET detail (`metadataVersion`, default 0 untuk data lama), lalu sertakan `expectedVersion` integer pada PATCH. Versi usang menghasilkan 409; field tidak valid/di luar allowlist menghasilkan 422. Field yang dapat diubah: type, number, letterDate, receivedDate, origin, destination, subject, signatory, classification, subsection. PATCH sebagian didukung; field lain memakai nilai saat ini.

File/pencatat/waktu pencatatan/disposisi tidak dapat dimasukkan melalui PATCH. Validasi surat masuk/keluar dan klasifikasi tetap berlaku. Jenis atau subbagian tidak boleh berubah jika arsip mempunyai disposisi, termasuk yang telah selesai, karena belum ada alur penugasan ulang. Tanpa disposisi admin boleh mengoreksi keduanya; scope baca/unduh mengikuti subbagian baru. Konversi ke surat keluar mengosongkan asal/tanggal diterima; konversi masuk mengosongkan penandatangan. Koreksi tanpa konversi mempertahankan field opsional lama. File tetap dipertahankan.

Perubahan nyata menaikkan metadataVersion dan mengisi updatedAt UTC/updatedBy; payload menyertakan updatedByName. No-op tidak menaikkan versi atau membuat audit palsu. Audit update_metadata mencatat aktor/waktu/arsip dan nama field, tanpa nilai lama/baru atau isi perihal. Histori nilai metadata belum tersedia. Data tambahan disimpan pada payload JSONB yang ada; schema SQL tidak berubah.

### Retry pencatatan/unggah — TODO 01.1

`POST /api/archives` dan `POST /api/archives/{id}/files` menerima header opsional `Idempotency-Key` (16–128 karakter huruf/angka/underscore/hyphen). Form tambah arsip mengirim UUID per operasi; kunci unggah baru dibuat bila pilihan file berubah. Klien lama tanpa header tetap berfungsi, tetapi tidak mendapat deduplikasi permintaan.

Permintaan pertama yang berhasil menghasilkan 201; pengulangan kunci/payload sama menghasilkan 200 dengan payload arsip terkini, tanpa menambah arsip, versi berkas atau audit yang sama. Pencatatan membandingkan field metadata yang benar-benar disimpan, bukan urutan properti JSON. Unggah membandingkan nama/tipe/ukuran/checksum isi. Kunci sama dengan data berbeda ditolak 409; format kunci tidak valid ditolak 422. Kunci terikat pengguna, operasi dan arsip untuk upload; izin role dan scope tetap diperiksa pada replay, termasuk setelah arsip dipindahkan.

Receipt berupa hash kunci dan payload disimpan dalam JSONB arsip, tidak dikembalikan lewat payload publik/internal daftar/detail. Receipt bertahan setelah restart; transaksi store menjaga dua retry bersamaan menghasilkan satu perubahan. Koreksi metadata/penggantian berkas yang lebih baru tidak diputar balik saat replay. Tidak ada perubahan schema SQL atau perluasan izin.

Perlindungan mengikuti kunci operasi, bukan keunikan nomor surat atau checksum global. Kunci/draft form saat ini hanya selama dialog terbuka; reload browser atau menutup lalu memulai pencatatan baru membuat operasi baru. Jika status simpan belum pasti, UI meminta retry/periksa daftar sebelum memulai lagi. Pemulihan draft lintas reload dan rekonsiliasi file yatim karena kegagalan commit DB tetap pekerjaan terpisah (07.1/02.4).

### Versi berkas — TODO 02.2

Payload documents memuat versi dengan `available`, `uploadedByName` serta provenance. `POST /api/archives/{id}/files` tetap menerima upload lama; tambahan opsional: `documentId` (default document_primary), `reason` dan `expectedVersionId` (ID aktif yang dibaca klien, null untuk awal). Ketidaksesuaian versi aktif menghasilkan 409 sebelum binary ditulis. Alasan yang disediakan harus berisi 1–1000 karakter. UI penggantian meminta alasan; klien lama boleh tidak menyertakannya dan histori menyatakan tidak dicatat.

Setiap upload menambah versi immutable, pengunggah/waktu, checksum dan cermin primary flat. `GET /api/files/{fileId}` kini melayani versi terdahulu juga, dengan nama/tipe versi itu dan scope arsip yang sama; anonim 401, rekaman di luar scope 404. Tidak ada URL berkas publik.

Untuk memakai versi lama sebagai revisi baru, POST endpoint files dengan `sourceVersionId`, `documentId`, `expectedVersionId` dan `reason`. Binary sumber harus menjadi versi dalam dokumen itu; hasil memakai ID baru dan sourceVersionId untuk lineage, tanpa menulis ulang riwayat. Admin/uploader yang berwenang dapat mengganti/memulihkan; role pembaca hanya melihat/unduh. Receipt replay diperiksa sebelum konflik expectedVersionId sehingga respons sukses terputus aman diulang.

### Lampiran independen — TODO 02.3

POST files dengan `kind: "attachment"`, `documentTitle` (1–200 karakter), fileName/mimeType/data dan optional Idempotency-Key membuat dokumen lampiran baru dengan ID sendiri. UI mengirim expectedVersionId null untuk pembuatan. Mengganti/memulihkan lampiran yang sudah ada memakai documentId lampiran dan kontrak versi yang sama. Nama boleh sama; identitas ditentukan ID, bukan nama atau posisi tabel.

Menambah/mengganti lampiran tidak mengubah fileId primary atau riwayat lampiran lain. Lampiran boleh dicatat sebelum primary; fileAvailable flat tetap false sampai primary tersedia. Download setiap versi tetap memakai scope arsip. Retry pembuatan lampiran memakai operasi terpisah agar tidak membuat dokumen tambahan; kunci penggantian juga terikat documentId.

### Konsistensi upload (02.4)

Binary dipublikasikan lengkap tanpa overwrite sebelum commit metadata; respons sukses ditahan sampai commit selesai. Kegagalan sebelum publikasi metadata membersihkan binary baru milik transaksi, tidak versi lama. Hasil commit yang ambigu mempertahankan binary untuk rekonsiliasi; retry tetap menggunakan Idempotency-Key yang sama. Perintah lokal `npm run files:check` menghasilkan laporan read-only dan tidak tersedia sebagai endpoint publik.

### Penerima disposisi (03.1)

`GET /api/archives/:id/disposition-recipients` khusus admin/pimpinan mengembalikan `{items:[{id,name,subsection}]}` staf aktif pada subbagian arsip. POST disposisi menerima `assignedUserId` kosong untuk tim, atau ID dari daftar aktif tersebut. Penugasan individu memprioritaskan ID orang: rekan satu subbagian tidak dapat memperbarui statusnya. Admin/pimpinan tetap mengawasi; tugas tim dapat diperbarui staf subbagian sesuai scope baca. Notifikasi tugas individu memakai aturan yang sama. Tidak ada pemberian akses lintas subbagian secara implisit.

### Kronologi disposisi (03.2)

Payload arsip menyertakan `createdByName` dan `updates[].byName` sebagai label akun saat dibaca; identitas sumber tetap `createdBy`/`by`. Update status menerima `note` opsional berupa teks maksimal 2.000 karakter. Event baru menyimpan `previousStatus`, `status`, `note`, `by`, `at` dan `kind` (status/note/reopen); event lama tidak ditulis ulang. Kembali dari sedang diproses ke belum ditindaklanjuti membutuhkan alasan. Membuka tugas selesai hanya admin/pimpinan, ke sedang diproses dengan alasan (403/422 jika melanggar). Catatan pada status sama membuat event note; status sama tanpa catatan no-op. Seluruh detail tetap melalui scope arsip. Urutan disposisi PostgreSQL stabil menurut createdAt dan ID, bukan posisi fisik baris setelah UPDATE.
