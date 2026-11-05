# Audit kesiapan peluncuran SIAGA ARSIP

Tanggal: 4 November 2026 (Asia/Jakarta). Basis kode: commit a12e258.

**Keputusan teknis: NO-GO untuk peluncuran operasional dan penggunaan arsip nyata.** Cocok untuk demonstrasi/UAT terbatas dengan data dummy, akses terkontrol, dan pemberitahuan bahwa ini MVP. Tampilan siap dipresentasikan tidak sama dengan kontrol produksi siap digunakan.

## Pembaruan setelah migrasi VPS — 5 November 2026

Operator melaporkan upgrade commit 82a9327 mencapai tahap 7/7 dengan snapshot sumber, impor PostgreSQL, reset credential lama, verifikasi kandidat dan pergantian ke layanan baru. Pemeriksaan eksternal read-only mengonfirmasi HTTPS 200, health 200/ok, config 200/demoMode=false, statistik 20 arsip, akses anonim internal 401 dan aset baru; browser login tidak menampilkan akun demo serta layout mobile lulus pemeriksaan. Detail sumber bukti dan checkpoint ada di [deploy/STATUS.md](deploy/STATUS.md). Ini memperbarui catatan lama tentang pemasangan/HTTPS yang belum dilakukan; agen tetap tidak menginspeksi VPS melalui SSH. Backup masih lokal. Status NO-GO untuk arsip nyata tetap berlaku sampai backup offsite/restore, UAT, scope fitur wajib dan gate operasional/penerimaan ditutup.

## Pembaruan implementasi — 5 November 2026

Bagian audit awal di bawah adalah rekaman temuan pada a12e258, bukan hasil pengujian kode terbaru. Paket fondasi telah diuji pada direktori sementara dan PostgreSQL lokal:

- UAT 15/15, regresi keamanan 49/49 (JSON dan PostgreSQL), regresi database 8/8; uji browser 13 pemeriksaan termasuk login, navigasi, loading dan notifikasi lulus. Build dan smoke test Docker (health/login/aset) lulus. npm audit melaporkan nol kerentanan dependensi saat pengujian.
- L-01/L-02: penulisan pencatat dibatasi pada subbagian sendiri, penugasan dibatasi pada pemilik arsip, status/detail tetap memeriksa scope. Probe lintas subbagian ditolak.
- L-03: scrypt, sesi dengan hash token/expiry/revokasi dan penyimpanan persisten, pembatasan login, header keamanan serta pemeriksaan custom header/Origin. Mode produksi mewajibkan PostgreSQL dan origin HTTPS; bootstrap tanpa akun/data demo; impor menonaktifkan kredensial lama. Konfigurasi HTTPS nyata belum diuji pada VPS.
- L-04: transaksi PostgreSQL dengan advisory lock, rollback dan uji dua koneksi mempertahankan perubahan. JSON demo memakai atomic replace; file rusak membatalkan startup tanpa reset. Schema masih memiliki atribut JSONB dan query memuat dataset; uji beban/redeploy pada server nyata belum dilakukan.
- L-05/L-08: batas body, signature/ekstensi/MIME, checksum, validasi tanggal/field wajib/klasifikasi dan surat masuk saja untuk disposisi. Pemindaian malware/karantina belum diterapkan.
- L-06: backup konsisten PostgreSQL dengan manifest, error copy tidak ditelan dan sesi dikecualikan. Scheduler, enkripsi, offsite, alarm serta uji disaster recovery menyeluruh tetap terbuka.
- L-07: audit list/detail ditambahkan dan instruksi disposisi baru tidak masuk log; aplikasi tidak memperbarui event audit PostgreSQL lama. Pembatasan role database, retensi dan pemeriksaan log sensitif lama belum selesai.
- L-09: ekspor CSV mengikuti filter UI; fileAvailable mencerminkan file fisik dan referensi file lama dipertahankan. Edit/soft-delete, XLSX, pagination/filter lengkap dan UI histori versi masih terbuka.
- L-10 dan gate operasional tetap terbuka. Panduan VPS/systemd/Nginx tersedia di deploy/README.md, belum dipasang pada server pengguna. Tidak ada arsip nyata yang dimigrasikan oleh pengujian ini.

**Status keseluruhan tetap NO-GO untuk arsip nyata**, sampai pemasangan server dan gate operasional/fitur diselesaikan. Keberhasilan regresi kode tidak membuktikan keamanan atau pemulihan lingkungan produksi.

## Cakupan dan metode audit awal

Dibaca seluruh 19 Markdown proyek yang ada sebelum audit: README, PRD, REQUIREMENTS, FEATURES, BUSINESS_RULES, USER_FLOW, ARCHITECTURE, DATABASE, SECURITY, BACKUP, DEPLOYMENT, API, DECISIONS, TASKS, ROADMAP, MVP_TESTING, DESIGN, PRODUCT, serta .interface-design/system.md. Dibandingkan dengan app.mjs, frontend, Dockerfile, environment example, skrip backup dan UAT.

- UAT terbaru: **15/15 lulus** pada data sementara.
- Probe negatif menggunakan server lokal dan DATA_DIR sementara; tidak mengubah data Railway. Hasil di bawah adalah hasil aktual dari kode, bukan hanya dugaan.
- Produksi diperiksa read-only: homepage HTTPS HTTP 200; statistik publik 10 masuk/10 keluar/20 total; GET /api/archives tanpa sesi HTTP 401; JavaScript live memuat toggleNotifications/loadingSkeleton.
- Tidak melakukan login, unggah, perubahan akun, atau uji serangan pada produksi.
- Tidak memiliki bukti konfigurasi Railway volume, replica, region, backup, monitoring, atau persetujuan organisasi. Statusnya **belum terverifikasi**, bukan disimpulkan tidak ada.

## Penghambat peluncuran, urutan prioritas

| ID | Tingkat | Temuan aktual | Bukti dan dampak | Tindakan sebelum produksi |
|---|---|---|---|---|
| L-01 | Kritis | Respons update disposisi bisa membocorkan metadata lintas subbagian | app.mjs:112 memeriksa penugasan tetapi tidak canSee sebelum mengembalikan archivePayload. Probe: surat Administrasi ditugaskan ke Hukum; pegawai Hukum PATCH status mendapat HTTP 200 beserta metadata surat Administrasi. | Tegaskan aturan akses penugasan vs pemilik arsip; cegah penugasan terlarang atau perluas akses secara eksplisit sesuai kebijakan; batasi respons; uji regresi negatif. |
| L-02 | Tinggi | Pencatat dapat menulis arsip ke subbagian lain | app.mjs:108 memeriksa role, bukan kecocokan b.subsection dengan user. Recorder Administrasi membuat arsip Hukum: HTTP 201. | Scope tulis server-side, validasi enum subbagian, klasifikasi resmi, dan pengujian setiap role. |
| L-03 | Tinggi | Fondasi akun/sesi masih demo | app.mjs:22 SHA-256 langsung tanpa salt/adaptive hash; 28–33 kredensial demo di-seed; 13 sesi Map; 49 cookie tanpa Secure; 51 tidak ada expiry server; 65 tanpa rate limit. Sesi lama tetap HTTP 200 setelah password diganti. | Hash adaptif, provisioning akun produksi tanpa autoseed demo, rotasi kredensial, expiry/revokasi sesi, cookie Secure, pembatasan login, proteksi CSRF/Origin dan header keamanan. Kredensial live belum diuji. |
| L-04 | Tinggi | Penyimpanan berisiko kehilangan/inkonsistensi data | app.mjs:45–46 seluruh database dalam memori dan ditulis ulang ke satu JSON tanpa transaksi/atomic replace. 26 menangkap semua error baca/parse lalu seed ulang, sehingga JSON rusak berpotensi ditimpa data demo. Volume persisten Railway belum terverifikasi. | Penyimpanan transaksional, penanganan error fail-safe tanpa reset, migrasi, volume/objek privat yang terverifikasi, uji crash/restart/redeploy dan konkurensi. |
| L-05 | Tinggi | Validasi unggah hanya mempercayai klien | app.mjs:55 menerima body tanpa batas sebelum parsing; 109 mengecek mimeType dari JSON dan batas setelah decoding. String “not a pdf” sebagai application/pdf diterima HTTP 201. | Batas request sebelum buffer, deteksi tipe dari isi, validasi nama/ekstensi/ukuran, checksum dan kebijakan scan/karantina. |
| L-06 | Tinggi | Backup harian terpisah belum terbukti | scripts/backup.mjs hanya snapshot di DATA_DIR/backups; tidak ada scheduler/offsite/enkripsi/alert dalam repo; error copy files ditelan. | Backup terjadwal di lokasi terpisah, error fail jelas, manifest/verifikasi file, alarm, retensi, target RPO/RTO, dan simulasi restore terjadwal. |
| L-07 | Tinggi | Audit belum memenuhi dokumen | app.mjs:72 tidak mencatat baca/detail arsip; audit:48 mutable dalam JSON; audit disposisi:111 menyimpan instruksi ke detail log meskipun SECURITY melarang isi sensitif masuk log. Probe baca tidak menghasilkan view event; instruksi muncul di audit. | Lengkapi event dan hasilnya; minimisasi konten sensitif; akses dan retensi log; perlindungan integritas. |
| L-08 | Sedang | Alur bisnis tidak divalidasi penuh | Disposisi pada surat keluar diterima HTTP 201 (app.mjs:111). Field asal/tanggal/penandatangan/subbagian/klasifikasi tidak divalidasi lengkap server-side; payload tidak sesuai tetap HTTP 201. | Schema validasi per jenis surat, penerima valid, field wajib dan tanggal; larang disposisi surat keluar sesuai dokumen saat ini. |
| L-09 | Sedang | Fitur MUST belum lengkap | Tidak ada PATCH metadata/soft-delete, XLSX, pagination, filter klasifikasi/tanggal yang nyata; kategori hanya POST backend tanpa alur UI; berkas tunggal tanpa versi/riwayat yang dapat diakses. | Implementasikan kebutuhan yang benar-benar wajib atau sepakati pengurangan scope tertulis sebelum pilot. |
| L-10 | Organisasi | Kebijakan produksi belum ditutup dalam dokumen | DECISIONS/TASKS masih menyisakan PIC, persetujuan hosting/lokasi data, klasifikasi, retensi, RPO/RTO, akses nyata dan go/no-go. Railway sudah dipilih secara praktik tetapi bukti persetujuan belum tersedia. | Penetapan PIC dan keputusan kantor; domain, akses, runbook dan persetujuan peluncuran. |

## Matriks kebutuhan versus implementasi

Status “sebagian” bukan lulus penerimaan penuh.

| Requirement | Status | Perbandingan |
|---|---|---|
| FR-01 login | Sebagian | Login berjalan; masih fondasi autentikasi demo, lihat L-03. |
| FR-02 akun admin | Ada | Buat, ubah role/subbagian, aktif/nonaktif berfungsi; sesi setelah perubahan password belum dicabut. |
| FR-03 pemisahan peran | Sebagian | Role tersedia; pembatasan tulis recorder bermasalah. |
| FR-04 metadata CRUD | Sebagian | Create/read ada; update metadata belum ada. |
| FR-05 unggah/ganti dan histori | Sebagian | Upload/ganti ada; pointer file lama ditimpa tanpa model versi/daftar histori file. |
| FR-06 surat masuk dan lampiran | Sebagian | Field form ada; validasi server lemah dan satu file aktif. |
| FR-07 surat keluar | Sebagian | Field ada, validasi field wajib tidak lengkap. |
| FR-08 disposisi penerima | Sebagian | Subbagian/instruksi ada; UI belum pemilihan pegawai individual, batas lintas subbagian perlu diperbaiki. |
| FR-09 pembaruan status | Ada | Tiga status dan updates tersimpan; respons akses perlu diperbaiki. |
| FR-10 pembatasan akses | Sebagian | List/search/export/download scoped; L-01 dan L-02 menghalangi klaim aman end-to-end. |
| FR-11 klasifikasi/kategori | Sebagian | Tambah klasifikasi UI ada; kategori hanya endpoint, tidak terhubung ke skema/form kategori. |
| FR-12 pencarian/filter | Sebagian | q/type/year/status API ada; UI arsip hanya q/type/status, filter klasifikasi/tanggal/subbagian terpisah tidak lengkap. |
| FR-13 XLSX hasil pencarian | Belum sesuai | CSV tersedia, bukan XLSX; link ekspor UI tidak membawa query filter pencarian. Scope akses tetap diterapkan server. |
| FR-14 agregat publik | Ada | Hanya tahun dan hitungan; anonymous list ditolak 401. |
| FR-15 berkas privat sistem | Sebagian | Local filesystem lewat endpoint berizin; storage/backup produksi belum terverifikasi. |
| FR-16 file/batas/scan | Sebagian | Allowlist MIME klien dan batas decoded 15MB; actual MIME, request limit, konfigurasi scan belum ada. |
| FR-17 audit | Sebagian | Banyak event ada; view/update metadata/delete, minimisasi dan integritas belum terpenuhi. |
| FR-18 backup otomatis/offsite | Belum sesuai | Snapshot manual lokal; restore smoke lokal lulus, otomatis/offsite belum terbukti. |
| FR-19 notifikasi SHOULD | Ada untuk inbox dasar | Disposisi/status sesuai scope; dimuat saat panel dibuka, bukan push real-time; belum read/unread/email. |
| FR-20 OCR SHOULD | Belum | Dokumen menempatkannya bersyarat; bukan blocker jika disepakati di luar scope. |
| FR-21/22 LATER | Ditunda | Kategori lanjutan, retensi otomatis, analitik/integrasi bukan syarat wajib peluncuran tahap pertama. |

## Uji tambahan yang benar-benar dilakukan

1. Recorder menulis ke subbagian lain: diterima 201 — gagal aturan bisnis.
2. Metadata dengan klasifikasi tidak dikenal dan field wajib kurang: diterima 201 — gagal validasi.
3. Berkas teks dengan label PDF: diterima 201 — gagal validasi isi.
4. Disposisi surat keluar: diterima 201 — gagal aturan surat masuk saja.
5. Pembaruan disposisi lintas scope mengembalikan metadata: 200 — gagal isolasi.
6. classification tidak ada dan page=999 tetap mengembalikan daftar — parameter diabaikan.
7. Unduh file dummy yang tercatat: 404 — seed hanya metadata, bukan berkas demo sungguhan.
8. Kata sandi diganti: sesi lama masih 200 — belum ada revokasi.
9. Snapshot setelah server uji dihentikan: data.json hasil restore identik byte dengan sumber. Server restore dapat berjalan dan membaca 21 arsip serta direktori dengan 1 file. Ini **smoke test pemulihan lokal**, bukan validasi dokumen asli, backup online konsisten, offsite, atau target RTO/RPO produksi.

Seluruh mutasi di atas hanya pada data sementara yang dihapus setelah tes. Tidak dilakukan uji beban/brute-force/malware atau perubahan produksi.

## Dokumentasi yang dapat menyesatkan keputusan peluncuran

- TASKS mencentang validasi field, matriks izin, ekspor, dan pemulihan: penerimaan end-to-end belum selengkap itu. Checklist selesai perlu dipecah menurut bukti.
- API adalah kontrak konseptual, bukan daftar endpoint yang semuanya tersedia. GET detail/PATCH/DELETE arsip dan beberapa histori/config belum diimplementasikan.
- DECISIONS D-23/TASKS menyebut target Laravel 13 + Livewire 4; ARCHITECTURE masih menyatakan framework terbuka; aplikasi aktual tetap Node.js. Laravel bukan syarat keamanan dengan sendirinya—yang wajib adalah kontrol dan kebutuhan penerimaan.
- README/MVP_TESTING/BACKUP/DEPLOYMENT sendiri menyebut ini MVP/dummy dan mensyaratkan hardening sebelum data nyata. Status ini konsisten dengan temuan audit.
- DESIGN dan .interface-design berisi riwayat arah visual yang saling menimpa. Perlu ringkasan keadaan final agar pengembang tidak menganggap palet/stack/fitur lama masih berlaku.
- Live masih menampilkan data demo dan UI menyediakan akun uji coba. Menyembunyikan daftar akun saja tidak mengubah kredensial yang sudah dikenal publik; akun produksi harus diprovisikan dan dipisahkan.

## Rencana menuju go-live

1. Tutup L-01/L-02, autentikasi/sesi L-03, dan validasi L-05/L-08; tambah regresi negatif akses per role.
2. Tetapkan dan implementasikan persistence produksi yang tahan crash; verifikasi volume/storage privat, restart/redeploy, backup offsite dan restore. Jangan reset otomatis ketika data rusak.
3. Selesaikan atau sahkan pengurangan fitur MUST: edit metadata, ekspor sesuai filter, format XLSX, histori file/audit, filter dan pagination.
4. Pisahkan demo/staging/produksi; akun riil, klasifikasi dan matriks penerima; pastikan file benar-benar ada, rekonsiliasi metadata/berkas sebelum migrasi massal.
5. Verifikasi konfigurasi Railway/domain/TLS/region, monitoring/alert, PIC insiden, retensi dan prosedur operasional. UAT pengguna kantor, uji beban ~1.300 arsip dan uji restore; lalu persetujuan go/no-go.

Perkiraan tanggal selesai tidak diberikan sebelum scope, pilihan penyimpanan, dan persetujuan kantor ditetapkan. Jangan meluncurkan arsip nyata hanya berdasarkan UI yang selesai atau UAT jalur normal yang lulus.
