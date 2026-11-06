# API — SIAGA ARSIP

Pembaruan 02.1: payload arsip berizin menambahkan view `documents[]` menurut [FILE_MODEL.md](FILE_MODEL.md), tanpa menulis ulang data lama. Header `X-SIAGA-Revision` menampilkan SHA checkout untuk verifikasi rilis demo (unknown bila Git tidak tersedia); body health/config tetap kompatibel.

Kontrak konseptual REST/JSON dan catatan implementasi Node.js. Tidak ada migrasi Laravel pada paket saat ini. Semua endpoint internal menerapkan autentikasi, otorisasi per aksi, dan scope subbagian di server.

## Matriks kemampuan aktif

Default kemampuan mengikuti [BUSINESS_RULES.md](BUSINESS_RULES.md): admin mengelola metadata/akun/QC/audit; pimpinan mengawasi dan membuat disposisi; pencatat membuat metadata unitnya; pengunggah mengelola berkas unitnya; pegawai memperbarui tugas yang ditugaskan; publik hanya statistik agregat. `PATCH /api/archives/:id` tetap admin-only dan soft-delete menunggu TODO 04.5. Penugasan atau ID langsung tidak memberi akses lintas unit.

## Kontrak aktual tahap fondasi — 5 November 2026

Mutasi POST/PATCH memerlukan header `X-SIAGA-Request: 1`, body JSON dan sesi bila endpoint internal. Origin browser harus sama dengan APP_ORIGIN produksi; cross-site ditolak. Body umum maksimal 128 KiB, upload JSON maksimal 24 MiB untuk binary maksimal 15 MiB. `/api/health` dan `/api/config` publik hanya memuat status kesehatan/mode demo. Detail `GET /api/archives/{id}` tersedia dan diaudit. Ekspor aktual `GET /api/export.csv` dan `GET /api/export.xlsx` mengikuti seluruh filter dan scope pencarian. DELETE metadata, history khusus, dan endpoint konseptual lain di bawah belum seluruhnya diterapkan. Lihat LAUNCH_READINESS.md untuk celah fitur.

### Pencarian dan pagination aktual

`GET /api/archives` menerima kriteria opsional berikut, digabungkan dengan AND setelah pembatasan akses pengguna:

| Parameter | Nilai |
|---|---|
| q | Substring literal, tanpa membedakan kapital, maksimal 200 karakter; nomor, kategori, asal, tujuan, perihal, klasifikasi atau subbagian |
| type | incoming / outgoing / administrative |
| category | Nama kategori pada registri kategori aktif; kategori awal mengikuti scope 00.3 |
| year | Empat digit berdasarkan tanggal surat |
| classification | Nama klasifikasi terdaftar |
| subsection | Administrasi / Hukum dan Sengketa Proses / Pencegahan, Partisipasi Masyarakat, dan Humas / Penanganan Pelanggaran dan Data Informasi; alias legacy Hukum/Pengawasan/PPPS tetap diterima selama transisi dan tidak memperluas izin pengguna |
| from, to | YYYY-MM-DD, tanggal surat inklusif; awal tidak boleh melewati akhir |
| status | Belum ditindaklanjuti / Sedang diproses / Selesai pada salah satu disposisi |
| page, page_size | Halaman positif; ukuran 10/25/50/100, default 25 |

Adanya `page` atau `page_size` mengaktifkan respons `{items,page,page_size,total,pages,classifications,subsections,years}`. Urutan berdasarkan createdAt terbaru lalu id menaik; halaman berlebih diarahkan ke halaman terakhir. Hasil kosong memiliki total 0, page 1 dan pages 1. Parameter tidak valid ditolak 422. `years` hanya berasal dari arsip yang boleh dilihat pengguna, sebelum filter pencarian.

Tanpa kedua parameter pagination, kontrak daftar tanpa halaman tetap dipertahankan untuk dashboard/disposisi. Store saat ini masih memuat dataset lengkap ke memori: ini pembatasan respons daftar, belum pagination/query SQL.

### Ekspor aktual

`GET /api/export.csv` dan `GET /api/export.xlsx` menerima sepuluh kriteria yang sama, termasuk kategori dan kelengkapan, mengekspor seluruh hasil berizin dan mengabaikan parameter halaman. Urutan sama dengan daftar paginasi: waktu pencatatan terbaru, lalu id menaik. Keduanya dicatat sebagai event `export` dengan jumlah data dan format; tanpa isi metadata/instruksi dalam audit. Query tidak valid ditolak 422 dan tanpa sesi ditolak 401.

Kolom: Jenis, Kategori, Nomor, Tanggal, Asal, Tujuan, Perihal, Klasifikasi, Subbagian, Status disposisi, Indeks sistem, Tahun, Kode klasifikasi, Nomor agenda, Jenis sumber, Lokasi fisik, Referensi sumber, Kelengkapan. Kolom Status disposisi berisi status unik dari semua disposisi arsip, dipisah titik koma; tanpa penugasan ditulis `Tanpa disposisi`. Filter status mencocokkan minimal satu disposisi, sedangkan kolom ekspor tetap merangkum semua status. Instruksi dan catatan tindak lanjut tidak diekspor.

XLSX berisi sheet `Arsip surat`, header beku, lebar kolom dan teks terbungkus. Semua nilai ditulis sebagai tipe String untuk mempertahankan nomor/tanggal ISO dan mencegah interpretasi formula. CSV memakai UTF-8 BOM, kutip standar, CRLF, serta awalan apostrof untuk teks yang berpotensi formula (termasuk setelah whitespace). Hasil kosong API tetap menghasilkan header saja. XLSX dibuat dalam memori; uji 1.300 rekaman sintetis bukan bukti performa/resource VPS.

## Publik

- `GET /api/public/stats?year={year}` → jumlah agregat masuk/keluar per tahun (nama kontrak produksi yang direncanakan: `/api/public/statistics`).
- Tidak ada endpoint publik untuk daftar, detail, file, disposisi, atau identitas pihak.

## Autentikasi dan akun

- MVP: `POST /api/login`, `POST /api/logout`, `GET /api/me`.
- `POST /api/admin/users`, `PATCH /api/admin/users/{id}`, `POST /api/admin/users/{id}/disable`
- `GET /api/admin/roles`, `GET /api/admin/subsections`

## Arsip

- `GET /api/archives?type=&category=&q=&year=&classification=&subsection=&from=&to=&status=&page=1&page_size=25`
- `POST /api/archives` — pencatat berwenang membuat metadata; `type=administrative` memakai metadata umum dan `category` dari registri.
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

- `GET /api/admin/classifications` — admin membaca katalog master (`id`, `code`, `label`, `description`, `active`, `aliases`).
- `POST /api/admin/classifications` — admin menambah klasifikasi dengan `label` wajib, `code` opsional (`A-Z`, angka, `.`, `_`, `/`, `-`), deskripsi opsional dan status aktif default.
- `PATCH /api/admin/classifications/{id-or-code-or-label}` — admin mengubah deskripsi/kode/status; nama baru menyimpan nama lama sebagai alias bila kode stabil. Klasifikasi legacy tanpa kode harus diberi kode sebelum ganti nama.
- `GET/POST/PATCH /api/admin/archive-categories`
- `GET /api/admin/audit-events?actor=&action=&from=&to=`
- `GET /api/users` — daftar pengguna aktif untuk admin/pimpinan, tanpa password hash.
- `GET /api/admin/users` — daftar semua akun (termasuk nonaktif) untuk admin, tanpa password hash.
- Klasifikasi nonaktif tidak dapat dipilih untuk arsip baru, tetapi referensi pada arsip lama tetap dapat dibaca, dicari, difilter dan diekspor. Perubahan master dicatat sebagai audit tanpa menyalin isi metadata arsip.
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
Kontrak saat ini memakai event dan status baca per pengguna; lihat bagian 03.5 di bawah. Maksimal 20 event per halaman, terpisah dari hitungan tugas aktif. Tidak ada layanan push real-time.


### PATCH metadata yang sudah diterapkan

`PATCH /api/archives/{id}` memerlukan role admin. Pegawai, recorder, uploader dan leader ditolak 403; anonymous 401. Baca versi terbaru dari GET detail (`metadataVersion`, default 0 untuk data lama), lalu sertakan `expectedVersion` integer pada PATCH. Versi usang menghasilkan 409; field tidak valid/di luar allowlist menghasilkan 422. Field yang dapat diubah: type, category, number, letterDate, receivedDate, origin, destination, subject, signatory, classification, subsection. PATCH sebagian didukung; field lain memakai nilai saat ini.

File/pencatat/waktu pencatatan/disposisi tidak dapat dimasukkan melalui PATCH. Validasi surat masuk/keluar dan klasifikasi tetap berlaku. Jenis atau subbagian tidak boleh berubah jika arsip mempunyai disposisi, termasuk yang telah selesai, karena belum ada alur penugasan ulang. Tanpa disposisi admin boleh mengoreksi keduanya; scope baca/unduh mengikuti subbagian baru. Konversi ke surat keluar mengosongkan asal/tanggal diterima; konversi masuk mengosongkan penandatangan. Koreksi tanpa konversi mempertahankan field opsional lama. File tetap dipertahankan.

Pada scope 00.3, `administrative` memakai metadata umum dan tidak mewajibkan `receivedDate`, `origin`, `destination`, atau `signatory`; API mengosongkan field khusus saat konversi ke tipe tersebut. `category` harus berasal dari registri kategori dan ikut dalam filter, pencarian, detail, dan ekspor. Status lengkap tetap memerlukan berkas utama; lampiran yang didaftarkan dinilai terpisah oleh QC.

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

### Retry dan konflik disposisi (03.3)

POST disposisi menerima `Idempotency-Key` (16–128 huruf/angka/underscore/dash), scoped ke aktor dan arsip. Replay payload sama mengembalikan 200 tanpa penugasan/audit/notifikasi ganda; key sama dengan payload berbeda 409. PATCH `/api/dispositions/:id/status` **mewajibkan** `expectedVersion` integer >=0 dari payload terbaru (`dispositions[].version`). Klien/tab lama tanpa versi menerima 422 dan harus memuat ulang. Ini penguatan kontrak status yang disengaja; fixture regresi mengirim versi hasil baca, tanpa mengubah assertion izin/hasil.

Update memakai key operasi scoped aktor/disposisi. Replay receipt diperiksa sebelum CAS/transisi agar respons sukses yang hilang dapat diulang setelah versi berubah. Konflik versi 409, bukan overwrite. Setiap event baru memiliki ID dan nomor versi monoton; legacy memakai jumlah updates sebagai versi awal tanpa migrasi massal. Receipt privat tidak ada di payload publik/internal API. Receipt dan event disimpan dalam transaksi yang sama, termasuk PostgreSQL antar proses. Kunci/draft UI berlaku selama dialog terbuka; bukan jaminan pemulihan setelah reload browser.

### Daftar kerja disposisi (03.4, aktual)

`GET /api/dispositions?assignment=mine|team|all&status=&q=&year=&page=1&page_size=25` mengembalikan `{items,total,page,page_size,pages,summary,filters}`. Item memuat data disposisi, `canUpdate` dan metadata surat ringkas pada `archive`; detail/kronologi tetap dibaca lewat GET arsip berizin, bukan endpoint history yang masih konseptual di daftar awal dokumen ini. Ukuran halaman 10/25/50/100, halaman berlebih dijepit. Urutan createdAt terbaru lalu ID, sama dengan ekspor.

Default assignment: all untuk admin/pimpinan, mine untuk staf. Mine adalah individu sendiri dan tugas tim subbagian; team hanya penugasan tanpa assignedUserId. All tetap dibatasi scope baca arsip dan menandai tugas individu orang lain baca-saja. Status menerima tiga status, active (belum selesai), atau kosong untuk semua. Q mencari nomor/perihal/instruksi/penerima/unit, tahun mengacu tanggal surat. Filter digabung AND. Summary menghitung tugas yang dapat ditindaklanjuti/diawasi tanpa filter: active/completed/total, sama dengan pending dashboard pada scope dasar; ini bukan jumlah belum dibaca.

`GET /api/dispositions/export.csv` menerima filter sama dan mengekspor semua hasil, tidak terpotong halaman. Kolom nomor/perihal/unit/penerima/status/waktu tanpa instruksi/catatan; UTF-8 BOM dan proteksi formula sama dengan ekspor arsip. Ekspor diaudit. Akses anonim ditolak; scope kosong menghasilkan header saja. Implementasi query masih pada store dataset penuh; SQL terarah/performa tetap paket 08, belum diklaim selesai.

### Notifikasi peristiwa dan status baca (03.5, aktual)

`GET /api/notifications?page=1` memerlukan sesi, mengembalikan maksimal 20 event/halaman serta `{page,pages,total,unread,activeTasks}`. ID penugasan awal tetap ID disposisi; event pembaruan memakai ID event dan legacy tanpa ID memakai kombinasi ID disposisi/index riwayat yang stabil. Item memuat `archiveId`, `dispositionId`, kind created/status/note/reopen, text/subject, status saat event, taskStatus saat ini, createdAt, byName, read. Tidak memuat instruksi, catatan atau receipt pengguna lain. Urut waktu terbaru lalu ID. Halaman berlebih dijepit; halaman invalid 422.

Event berasal dari riwayat disposisi persisten dan hanya ditampilkan jika scope arsip serta penerima/tim/supervisi saat ini mengizinkan. Tindakan sendiri tidak menjadi notifikasi masuk. GET tidak menandai baca. `PATCH /api/notifications/:id/read` dengan `{read:true|false}` mengubah status pengguna sesi sendiri; ID di luar cakupan 404. `POST /api/notifications/read-all` menandai seluruh event yang dapat diakses (semua halaman). Mutasi baca idempoten; audit hanya saat state berubah. Status baca disimpan pada JSONB disposisi, termasuk PostgreSQL dan restart, bukan antrean in-memory.

Unread menghitung seluruh event belum dibaca; activeTasks menghitung tugas yang dapat ditindaklanjuti/diawasi dan belum selesai. Dibaca tidak menyelesaikan tugas. Panel mengambil data saat dibuka/Perbarui; klik event membuka kronologi scoped dan mencoba menandai baca. Tidak ada klaim push real-time/email, polling latar atau pelaksanaan tindak lanjut kantor; kanal eksternal tetap 13.2.

### Kelengkapan dan verifikasi (04.1)

Payload arsip menambahkan `quality:{status,label,token,reviewVersion,reviewCurrent,missingFiles}` dan `qualityReviews[]` append-only. Status: metadata_only, missing_file, missing_attachment, needs_review, needs_correction, complete. Filter `completeness` pada arsip/ekspor menerima status itu atau missing (gabungan tiga status berkas belum lengkap), digabung AND dengan filter lain sebelum pagination/ekspor. Dashboard menyertakan qualityCounts sesuai scope; antrean unggah/verifikasi tersedia bagi peran terkait. Status ini terpisah dari disposisi.

`POST /api/archives/:id/quality` khusus admin sebagai reviewer sementara. Body `{decision:'approved'|'needs_correction',note,expectedToken,expectedReviewVersion}`. Catatan maksimal 2.000 karakter, wajib untuk koreksi. Token mengikat versi metadata dan seluruh currentVersionId dokumen/lampiran; revision mengikat keputusan sebelumnya. Versi eksplisit wajib; konflik 409. Utama dan seluruh lampiran terdaftar harus tersedia sebagai file biasa; metadata harus valid. Idempotency-Key melindungi retry respons hilang (201 baru, 200 replay, 409 key/payload berbeda); receipt privat disembunyikan.

Review menyimpan keputusan/catatan/aktor/waktu, metadataVersion, fileVersions snapshot dan token. Metadata/file/lampiran baru memensiunkan persetujuan; histori tetap ada. File tersedia belum otomatis complete. UI approval memerlukan konfirmasi pemeriksaan manual; rincian checklist/checksum/duplikasi dijelaskan pada 04.3. Bukan bukti pemeriksaan scan otomatis atau pelaksanaan QC kantor. Tidak ada migrasi massal/skema baru.

### Indeks dan sumber metadata (04.2)

`systemIndex` adalah ID arsip stabil yang sudah ada, read-only dan terpisah dari nomor agenda resmi. `year` berasal dari tanggal surat. Field baru yang dapat dicatat/diedit admin: agendaNumber (200), classificationCode (100), sourceType (unknown/physical/drive/digital/other), physicalLocation (500), sourceReference (1000). Angka di depan dipertahankan sebagai teks. Kode/agenda tidak dibangkitkan sebagai aturan resmi; kosong diperbolehkan. Sumber physical memerlukan lokasi; drive/digital/other memerlukan referensi, tanpa fetch URL atau perubahan izin sumber. Data lama dibaca sebagai unknown tanpa penulisan/migrasi massal. Scope dan konflik metadataVersion tetap berlaku. Pencarian meliputi ID, agenda, kode, lokasi dan referensi. Perubahan sumber menginvalidasi approval QC lewat metadataVersion.

CSV/XLSX mempertahankan sembilan kolom awal dan menambahkan Indeks sistem, Tahun, Kode klasifikasi, Nomor agenda, Jenis sumber, Lokasi fisik, Referensi sumber, Kelengkapan. Hasil tetap sesuai filter/scope dan seluruh halaman. Kunci retry create lama mempertahankan fingerprint semula bila field baru tidak disertakan.

`GET /api/files/:id` tetap memakai nama asli. Opsi `?filename=structured` menghasilkan nama tahun_unit_jenis_klasifikasi_nomor_dokumen_vN.ext, sanitasi karakter/ukuran, tanpa mengganti object key atau bytes. Scope setiap permintaan/versi tetap diperiksa. Pilihan ini tersedia di detail arsip; penamaan tampilan bukan penetapan nomor agenda kantor.

### QC rinci, integritas dan duplikasi (04.3)

`GET /api/archives/:id/duplicates` menampilkan kandidat dalam scope pembaca: nomor/agenda ternormalisasi pada jenis+tahun+unit sama, atau checksum tercatat yang sama (termasuk versi historis). Nama file saja tidak menjadi duplikat. `GET /api/archives/:id/integrity` khusus admin/uploader membaca binary dokumen aktif dan mengembalikan items/checksum/size/check/checkedAt serta kandidat scoped. Check matched, baseline (hash lama tidak tersedia), mismatch, missing, invalid, changed, unreadable; tidak mengubah metadata versi atau menulis baseline buatan ke histori. Pemeriksaan on-demand, bukan monitoring kontinu/antivirus.

Approval baru POST quality mewajibkan `checks:{metadata:true,pages:true,legibility:true,orientation:true}`. pageCount opsional bilangan 1–100000 adalah hitungan petugas, bukan parser/OCR. Server memeriksa ulang isi binary sebelum approval; hash berubah/hilang/tidak terbaca ditolak 422. Baseline legacy boleh diverifikasi dengan pemeriksaan manual tetapi tidak diklaim memiliki hash historis. Bila kandidat duplikat ada, wajib duplicatesAccepted true dan catatan alasan nonkosong. Tidak ada unique constraint nomor global, merge atau penghapusan otomatis.

Review menyimpan checklist, pageCount, bukti checksum, keputusan duplikat dan alasan. Receipt sukses sebelum checklist ditambahkan tetap dapat direplay dengan fingerprint lama; bukan approval baru tanpa checklist. Payload riwayat menyembunyikan rincian kandidat lintas arsip, hanya menyajikan duplicateCount/duplicatesAccepted; daftar kandidat saat ini selalu dihitung ulang sesuai scope. Approval/status lama menggambarkan keputusan pada snapshot saat itu; bila inspeksi mendeteksi kerusakan setelahnya UI meminta peninjauan dan menolak approval baru. Penanganan koreksi tetap keputusan petugas, tidak ada klaim integritas kontinu.

### Koreksi metadata dan histori yang diizinkan (04.4)

`PATCH /api/archives/:id` tetap **admin-only** karena keputusan 00.2 belum disahkan. Peran lain ditolak 403, anonim 401. `expectedVersion` integer wajib; versi usang 409, metadata tidak valid/field di luar allowlist 422. Bila arsip mempunyai disposisi apa pun, perubahan jenis atau subbagian ditolak 422 dengan pesan jelas, termasuk ketika seluruh disposisi sudah Selesai. Koreksi field lain mempertahankan identitas pencatat, berkas/versi/lampiran serta seluruh penugasan dan histori tugas. Pemindahan subbagian hanya tersedia tanpa disposisi; seluruh akses detail/histori/file kemudian mengikuti pemilik baru dan pemilik lama kehilangan akses.

### Taksonomi subbagian 00.1

`GET /api/admin/subsections` dan payload arsip menggunakan empat label resmi dari RA. Record dummy/legacy yang menyimpan `Hukum`, `Pengawasan`, atau `PPPS` tetap diterima sebagai alias kompatibilitas; respons menambahkan `subsectionLabel` resmi. Perbandingan scope, filter dan disposisi memakai identitas unit yang sama sehingga pergantian label tidak memindahkan atau memperluas akses.

Perubahan nyata menambah satu `metadataHistory` pada transaksi yang sama dengan kenaikan metadataVersion: `{id,version,fields,by,at}`. Tidak menyimpan nilai sebelum/sesudah atau salinan isi metadata. No-op dan request ditolak tidak menambah histori/revisi. Audit umum tetap hanya memuat nama kolom yang berubah, tanpa nilai, termasuk perihal/lokasi/referensi sumber. Konflik dua tab dan balapan pemindahan terhadap pembuatan disposisi diperiksa di dalam transaksi/lock yang sama.

GET detail/daftar arsip berizin mengembalikan ringkasan histori `{id,version,fields,fieldLabels,by,byName,at}` melalui allowlist; properti snapshot/nilai/label tambahan dari record impor tidak diteruskan. Izin baca histori sama dengan izin baca arsip, bukan izin edit. Tidak ada endpoint histori publik atau snapshot isi lama. Detail menampilkan versi/pelaku/waktu/kolom, mengakui histori lama yang belum tersedia, dan tidak menebak perubahan sebelum fitur ini. Respons detail terlambat diabaikan setelah navigasi/logout.
