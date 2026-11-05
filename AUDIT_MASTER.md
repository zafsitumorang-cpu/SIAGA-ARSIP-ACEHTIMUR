# Audit menyeluruh SIAGA ARSIP

Tanggal: **5 November 2026, WIB**. Baseline kode dan 28 Markdown: `75a19c6dbddf8006701ba379d4cd3755ce4cbaa3`, sama dengan main saat audit. Pelaksana: kajian dokumen, inspeksi kode, uji lokal terisolasi, dan pemeriksaan publik read-only. Rencana pelaksanaan: [TODO_MASTER.md](TODO_MASTER.md).

**Prioritas pemilik kini fitur/kelengkapan:** 01.2, 01.3, 06.x dan paket 11 **ditunda: keamanan**, dengan cek izin dasar tetap berlaku untuk fitur. Status perbaikan setelah baseline, commit, tes dan bukti demo dikelola di [FEATURE_PROGRESS.md](FEATURE_PROGRESS.md). A-03/A-07 bagian histori berkas sudah ditangani pada 02.2; kebutuhan UI lain tetap mengikuti checklist. Tidak ada pengesahan SOP, pelatihan, inventaris fisik, penetapan PIC atau pilot kantor yang dianggap selesai oleh tersedianya fitur.

**Pembaruan implementasi 01.1:** A-01 kini ditutup pada kode dan pengujian lokal: retry create/upload memakai receipt persisten dan formulir mempertahankan arsip yang sudah tercatat. Keamanan JSON/PostgreSQL 187, database 8 dan browser retry 10 lulus. Batas retry/kunci, prosedur UAT dummy dan bukti deployment ada di API.md, MVP_TESTING.md dan deploy/STATUS.md. Temuan lain, termasuk A-02, tetap terbuka. Tabel di bawah adalah catatan baseline sebelum perbaikan ini; tidak ada persetujuan peluncuran arsip nyata dari pembaruan tersebut.

**Pembaruan fitur 03:** penerima individu/tim, kronologi/catatan/reopen, CAS/retry, daftar kerja dan unread persisten telah diimplementasikan serta diuji otomatis; lihat ledger untuk commit/CI/demo per TODO. Tabel di bawah tetap baseline historis. Audit operasional/keamanan, email/push dan penerimaan kantor tidak ikut dianggap selesai.

## Kesimpulan

Aplikasi sudah mempunyai fondasi yang berjalan: login, peran/subbagian, pencatatan surat, unggah/unduh privat, koreksi metadata dengan konflik versi, disposisi dasar, pencarian/filter/pagination, CSV/XLSX, audit, PostgreSQL dan deployment otomatis. UAT pengguna sudah mendukung koreksi metadata serta filter/pagination/CSV. **Belum lengkap untuk operasional arsip nyata**: masih ada masalah integritas alur, histori berkas/disposisi, tata kelola arsip, penerimaan pengguna lintas peran dan bukti pemulihan/operasional.

Dokumen asal menuntut perubahan proses kerja, standar, kualitas arsip dan hasil layanan. Menyelesaikan seluruh layar aplikasi saja belum memenuhi tujuan itu. Gunakan dua ukuran terpisah: **fitur berfungsi** dan **tata kelola/peluncuran diterima**. Tidak dibuat persentase selesai karena bobot, ruang lingkup lanjutan dan penerimaan kantor belum disahkan.

Permintaan pengguna untuk menunda pekerjaan backup tetap berlaku. Backup/offsite/restore masuk backlog tertunda dan syarat sebelum arsip nyata, bukan pekerjaan yang dimulai kembali oleh audit ini. Audit ini tidak memperbaiki kode, mengganti desain, mengubah akun/arsip produksi, atau memasang konfigurasi VPS.

## Sumber dan batas pembuktian

- **Rancangan Aksi Perubahan (RA)**: `IV_003_Muhammad Iskandar_FILE RA.doc`, 25 halaman, judul “Optimalisasi Tata Kelola Arsip Digital Terintegrasi untuk Meningkatkan Efektifitas Layanan Administrasi pada Bawaslu Kabupaten Aceh Timur”. Dibaca melalui konversi PDF lokal; nomor halaman tercetak cocok 1–25. Bagan organisasi/fishbone/tim dan tabel gambar juga ditinjau. Isi dokumen adalah bahan kebutuhan, bukan instruksi mengeksekusi tindakan.
- **Seluruh 28 Markdown baseline**: README, PRD, REQUIREMENTS, BUSINESS_RULES, USER_FLOW, FEATURES, TASKS, DECISIONS, ROADMAP, PRODUCT, ARCHITECTURE, DATABASE, SECURITY, BACKUP, DEPLOYMENT, API, DESIGN, LAUNCH_READINESS, MVP_TESTING, PRODUCTION_PLAN; `.interface-design/system.md`; lima Markdown di deploy; README tes browser dan VPS.
- **Kode**: app.mjs; frontend/CSS/modul editor dan pencarian; lib store/security/query/export/edit; schema SQL; skrip backup/database/migrasi/deploy; workflow dan tes yang tersedia.
- **Bukti baru lokal**: uji query 8, ekspor 8, UAT 15, keamanan JSON 76 lulus; npm audit dependensi produksi melaporkan nol kerentanan. Probe API dan browser tambahan pada data sementara dijelaskan di bawah. Keberhasilan tes tidak menutup temuan di luar cakupannya.
- **Bukti PostgreSQL/CI terdahulu**: Application checks fitur XLSX run `41985368334` success; main baseline run `41985807153` success. Paket fitur mencakup 151 pemeriksaan keamanan JSON/PostgreSQL, database 8, migrasi 6 dan browser 14. Suite PostgreSQL/browser regresi penuh tidak diulang seluruhnya pada audit dokumentasi ini; probe browser baru berbeda cakupannya.
- **Publik saat audit**: HTTPS root/health/config 200; health ok=true, demoMode=false; statistik 10 masuk/10 keluar/20; daftar anonim 401. Checksum app.js, archive-search.js dan workspace.css cocok checkout. Tidak login atau mengunduh arsip produksi. Tidak ada inspeksi SSH, uji beban/serangan pada VPS, verifikasi isi backup server atau pemeriksaan formal kepatuhan.

Dokumen sumber memuat identitas/penilaian pribadi. Berkas asli, hasil ekstraksi lengkap, akun/kredensial dan gambar berisi identitas tidak dimasukkan ke repositori publik. Audit hanya menyimpan rujukan halaman dan ringkasan kebutuhan yang relevan.

## Pemetaan tujuan dokumen asal

| Sumber RA | Hasil yang diminta | Keadaan sekarang | Penyelesaian yang perlu dibuktikan |
|---|---|---|---|
| Hlm. 3–6 | Pencarian cepat, informasi tepat, kerja lebih efisien | Pencarian metadata tersedia; peningkatan waktu kerja belum diukur | Baseline tugas pencarian, uji sebelum/sesudah, hasil evaluasi pengguna |
| Hlm. 5, 9–11, 16–17 | Klasifikasi, indeks, penamaan, struktur penyimpanan dan petunjuk teknis | Label klasifikasi sederhana dan direktori privat ada; SOP/kode/indeks resmi belum terbukti | Standar disahkan, indeks/ekspor terstruktur, alur dipahami operator |
| Hlm. 9–10, 16–17 | Inventarisasi dan digitalisasi arsip prioritas | 20 metadata contoh; belum bukti migrasi berkas nyata | Inventaris, metadata lengkap, scan terbaca, hubungan sumber fisik/Drive, QC |
| Hlm. 10, 15–17 | Penyimpanan terintegrasi, hak akses, pencadangan | Web/PostgreSQL/akses privat ada; histori dan pemulihan belum lengkap | Versi/lampiran, alur berizin, backup dan restore teruji sebelum operasional |
| Hlm. 16–20 | Tim, pembagian kerja, penanggung jawab | Peran aplikasi ada; penetapan orang/PIC belum dibuktikan | Penetapan kantor dan matriks tugas, bukan auto-aktivasi nama dari bagan |
| Hlm. 5, 10, 17, 20–21 | Sosialisasi, pelatihan, pegawai mandiri | Ada panduan MVP teknis dan UAT sebagian | Juknis per peran, simulasi, daftar hadir/evaluasi dan dukungan pengguna |
| Hlm. 10–11, 17–18 | Monitoring, mutu, kendala dan keberlanjutan | Dashboard jumlah/status ada; monev perubahan belum tersedia | Laporan kelengkapan, penggunaan, waktu temu kembali, kendala/tindak lanjut |
| Hlm. 6–7, 17–18 | Perluasan jenis arsip dan unit kerja bertahap | Baru surat masuk/keluar; kategori tambahan sebatas endpoint | Setiap perluasan mempunyai skema, pemilik, akses, retensi dan penerimaan |

**Perbedaan yang harus diputuskan, bukan diasumsikan:** RA hlm. 15 memakai nama inovasi **ARSIP TERPADU**; SIAGA ARSIP adalah nama implementasi dari spesifikasi lanjutan. Nomenklatur subbagian pada narasi/bagan RA hlm. 12–13 tidak sepenuhnya sama dengan empat label aplikasi. Kantor perlu mengesahkan pemetaan nama/fungsi. Estimasi **1.000 PDF + 300 fisik**, pilihan enam kelompok pengguna, disposisi tiga status, statistik publik dan format XLSX bersumber dari Markdown/kebutuhan lanjutan; jangan mengatribusikannya sebagai spesifikasi teknis eksplisit RA. Angka itu belum inventaris aktual. Jadwal satu bulan berasal dari rencana lama, bukan komitmen baru audit.

Bagian kompetensi pribadi dan nilai asesmen RA hlm. 22–24 merupakan konteks pelatihan, bukan kebutuhan modul penilaian pegawai pada aplikasi. Tidak ditambahkan ke scope.

## Matriks kebutuhan aplikasi terkini

`Ada` berarti ditemukan pada kode/tes, bukan semua telah diterima kantor. `Sebagian` memerlukan pekerjaan lanjutan. `Bersyarat` memerlukan keputusan kebutuhan/sarana. Referensi tugas adalah paket pada TODO_MASTER.

| ID | Status sekarang | Bukti/kesenjangan | Paket |
|---|---|---|---|
| FR-01 login | Ada, penerimaan belum penuh | Scrypt, sesi persisten/expiry/revokasi, Secure cookie; uji akun riil semua peran tersisa | 01, 06, 12 |
| FR-02 akun admin | Sebagian | CRUD akun ada; admin terakhir bisa kehilangan peran admin; peran default form admin | 01, 06 |
| FR-03 pemisahan peran | Ada dengan keputusan terbuka | Satu role dan subbagian; pemetaan pegawai/kewenangan tugas perlu disahkan | 00, 03, 12 |
| FR-04 metadata | Sebagian | Create/read recorder dan edit admin ada; konflik FR-04 recorder edit vs aturan 21/keputusan D-18 | 00, 04 |
| FR-05 berkas/ganti/histori | Sebagian | Upload/ganti API dan referensi fileVersions ada; UI ganti, aktor/waktu versi dan unduh lama belum ada | 02 |
| FR-06 surat masuk/lampiran | Sebagian | Metadata dan satu file aktif; multi-lampiran, kelengkapan/QC dan retry unggah perlu selesai | 01, 02, 04 |
| FR-07 surat keluar | Ada untuk dasar | Field wajib dan berkas aktif ada; penandaan final/riwayat/QC belum lengkap | 02, 04 |
| FR-08 disposisi | Sebagian | Subbagian pemilik dan instruksi tervalidasi; UI belum memilih pegawai individual | 00, 03 |
| FR-09 status | Ada untuk dasar | Tiga status dan updates tersimpan; UI histori/catatan dan konflik perubahan belum ada | 03 |
| FR-10 akses | Ada untuk scope dasar | List/detail/upload/download/ekspor scoped; eksklusivitas tugas individual belum tegas | 00, 03, 06, 12 |
| FR-11 klasifikasi/kategori | Sebagian | Tambah klasifikasi ada; ubah/nonaktif/master kode dan kategori end-to-end belum ada | 00, 05 |
| FR-12 pencarian | Ada, UAT sebagian lulus | Delapan kriteria dan pagination respons; belum query SQL berhalaman/benchmark VPS | 07, 08, 12 |
| FR-13 XLSX | Ada, UAT kantor tertunda | XLSX/CSV semua halaman, status disposisi, minimisasi dan perlindungan formula teruji lokal | 12 |
| FR-14 publik | Ada, penerimaan data tertunda | Agregat/tahun saja; mode produksi memuat metadata dummy yang masih perlu dipisah sebelum peluncuran | 07, 09, 12 |
| FR-15 penyimpanan privat | Ada pada kode, operasi sebagian | Filesystem privat lewat aplikasi; belum migrasi nyata/rekonsiliasi/perlindungan siklus file lengkap | 02, 08, 09, 11 |
| FR-16 format/batas/scan | Sebagian | PDF/JPG/PNG/XLSX/DOCX, signature/MIME/ekstensi, 15 MB; belum konfigurabel/scan malware | 06 |
| FR-17 audit | Sebagian | Login/baca/ubah/unduh/ekspor/akses akun/disposisi ada; filter/pagination/hasil/integritas/retensi belum penuh | 06 |
| FR-18 backup/pemulihan | Sebagian, pekerjaan ditunda pengguna | Backup lokal harian dilaporkan aktif; offsite/enkripsi/retensi/alert dan DR menyeluruh belum | 11 |
| FR-19 notifikasi | Sebagian | Inbox dari disposisi, maksimum 20 saat dibuka; belum read/unread, histori status event, push/email | 03, 13 |
| FR-20 OCR | Bersyarat, belum | Bukan prasyarat mencari metadata; perlu kualitas scan, biaya dan uji bahasa/kapasitas | 13 |
| FR-21 kategori lanjutan | Ditunda | Persetujuan skema/kepemilikan/akses/retensi belum ada | 05, 13 |
| FR-22 analitik/integrasi/retensi otomatis | Ditunda | Scope terpisah, bukan otomatis diwajibkan untuk pilot surat | 13 |

## Temuan baru dan risiko teknis

| ID | Prioritas | Hasil audit dan dampak | Bukti baseline | Tindak lanjut |
|---|---|---|---|---|
| A-01 | Tinggi | Simpan metadata berhasil, unggah gagal, lalu submit ulang menciptakan dua arsip | Probe browser: dua upload 503 yang disimulasikan menghasilkan 2 rekaman dengan nomor uji sama dan form masih terbuka; public/app.js:176 | Simpan ID rekaman yang sudah terbentuk, retry hanya unggah, idempotensi server; 01 |
| A-02 | Tinggi | Admin terakhir dapat mengubah role dirinya sehingga tidak ada admin aktif | Probe PATCH u_admin → employee 200, tersisa 0 admin; app.mjs:136 | Invariant minimal satu admin aktif, transaksi/konkurensi dan UI penjelasan; 01 |
| A-03 | Tinggi | Versi lama tersimpan fisik tetapi belum dapat diambil; aktor/waktu versi tidak lengkap | Dua upload 201; kedua binary ada; fileVersions 1; GET lama 404, baru 200; tanpa uploadedBy/uploadedAt; app.mjs:160 | Model versi dan endpoint berizin, UI Ganti/Riwayat, normalisasi legacy; 02 |
| A-04 | Sedang/keputusan | Penerima individual tidak eksklusif untuk perubahan status | Pegawai kedua satu subbagian berhasil PATCH 200 pada tugas yang assignedUserId-nya orang lain; app.mjs:168 | Sahkan apakah tugas per orang atau tim; selaraskan UI/server/tes. Bukan bukti kebocoran lintas subbagian; 00, 03 |
| A-05 | Sedang | Label visual belum terhubung ke kontrol form | Probe DOM tambah arsip: 11 kontrol (termasuk kondisional) tanpa label native/ARIA; buat akun: 6. Login/editor/filter lebih baik; public/app.js:160,176 | id/for, petunjuk/error per field, audit keyboard/screen reader; 07 |
| A-06 | Sedang | Pengaturan membuat akun dengan role awal admin | Opsi pertama /api/admin/roles dan screenshot form memilih admin; nama role internal berbahasa Inggris; public/app.js:163 | Default hak minimal, label Indonesia, konfirmasi pemberian akses admin; 01, 07 |
| A-07 | Sedang | Detail belum mendukung kerja arsip lengkap | UI hanya metadata inti/unduh; tidak ada preview, histori versi/disposisi, catatan, atau tombol ganti file tersedia; public/app.js:147 | Detail bertab/bagian jelas, fungsi versi/lampiran/kronologi; 02, 03, 07 |
| A-08 | Risiko belum diukur | Semua request API memuat dataset dan mengambil lock global; cache dashboard tidak berhalaman | lib/store.mjs:8,34; public/app.js:85. Hash login, ekspor, baca binary dan backup berlangsung dalam alur transaksi | Benchmark dan query SQL terarah, observasi lock/resource; 08 |
| A-09 | Kesenjangan | Audit dan notifikasi belum memenuhi rancangan penuh | Audit API hanya 100 terbaru; notifications dibangun dari disposisi, read state tidak dipersist sebagai entitas PostgreSQL; app.mjs:169,179, lib/store.mjs:19 | Desain event/retensi dan UI yang sesuai arti badge; 03, 06 |
| A-10 | Risiko statis | File ditulis sebelum commit metadata; kegagalan DB berpotensi meninggalkan file yatim | app.mjs:162. Kejadian DB gagal tidak diinjeksi pada audit ini | Stage/finalize, cleanup aman dan rekonsiliasi dry-run; 02, 08 |
| A-11 | Kesenjangan tertunda | Manifest mencakup checksum binary, belum checksum data.json; impor bukan restore kredensial identik | scripts/backup.mjs:13–18; scripts/database.mjs import mengganti kredensial | Verifikasi snapshot/restore terpisah + offsite, sesuai keputusan menunda; 11 |
| A-12 | Kesenjangan keputusan | Istilah, izin edit dan scope kategori bertentangan antar sumber | RA vs aplikasi; FR-04 vs BR-21/D-18; FR-11 MUST vs kategori lanjutan LATER | Keputusan tercatat sebelum mengubah izin/skema; 00 |

Probe baru dijalankan dengan Node lokal, DATA_DIR sementara dan browser Chromium, lalu proses/data fixture dibersihkan. Tidak ada username/password, perihal nyata atau isi dokumen yang masuk hasil audit. Pada baseline, A-01/A-02 belum tercakup regresi lama. A-01 kemudian diperbaiki pada paket 01.1 sebagaimana pembaruan di atas; A-02 belum dikerjakan.

## Audit UI/UX per layar

Arah visual dipertahankan: palet Bawaslu merah/emas/arang, konten putih, Inter untuk workspace, Manrope untuk publik/login, pola dashboard referensi Able Pro. Tidak ada alasan mengganti framework atau menyalin aset template berbayar untuk menyelesaikan kebutuhan ini. Observasi visual memakai fixture lokal 1440px dan 390px; ini bukan sertifikasi aksesibilitas menyeluruh.

| Layar | Yang sudah baik | TODO yang mempunyai manfaat kerja |
|---|---|---|
| Landing | Identitas, CTA login, agregat/tahun, gambar lokal dan kegagalan statistik ditangani | Selaraskan nama/logo resmi; status uji vs angka operasional; bantuan/kontak terverifikasi dan klaim layanan faktual |
| Login | Label terhubung, lihat kata sandi, busy/error, akun demo tersembunyi pada produksi | Pengalaman sesi habis, ganti password sendiri/awal, alur pemulihan via admin yang aman; uji password manager dan keyboard |
| Beranda | Grafik dari data, scope subbagian, drawer responsif, reduced motion | Jelaskan kartu semua tahun vs filter grafik; angka kelengkapan/pekerjaan per peran; kurangi ruang banner bila menghambat tugas di HP |
| Arsip/filter | Filter lengkap, Terapkan/Reset, jumlah hasil, pager, CSV/XLSX dan urutan dijelaskan | Filter berkas belum lengkap; ringkasan filter aktif; pilihan sort nomor/tanggal yang benar; densitas tabel/action pada HP; deep-link detail dan kembali ke posisi/filter |
| Tambah/koreksi | Tipe masuk/keluar; editor admin validasi dan konflik versi | Pisahkan sukses metadata/gagal unggah; label/field error konsisten; wajib/opsional jelas; cegah kehilangan draft saat sesi habis/navigasi |
| Detail/berkas | Detail berizin, metadata dan unduh, fokus modal | Versi/lampiran, pengunggah/waktu/checksum, preview aman PDF/gambar, metadata lengkap serta kronologi; DOCX/XLSX tetap unduh bila preview aman belum tersedia |
| Disposisi | Status berteks dan perubahan dasar | Pilih orang/tim, riwayat/catatan, filter tugas saya/tim/selesai, konfirmasi dan konflik perubahan; feedback gagal mengembalikan nilai UI yang benar |
| Notifikasi | Loading/kosong/error/retry, scope, badge berarti tugas aktif | Bedakan tugas aktif dari belum dibaca; tujuan klik ke surat/tugas; update status dan histori event bila disepakati; jangan label real-time sebelum ada mekanismenya |
| Pengguna/klasifikasi | Akun aktif/nonaktif dan tambah label tersedia | Default role aman, nama role Indonesia, konfirmasi akses, proteksi admin terakhir; master klasifikasi berkode dan nonaktif tanpa memutus arsip lama |
| Audit | Aktor/waktu/aksi terlihat sesuai role | Bahasa aksi, pencarian/filter/pagination, detail per rekaman dan zona waktu WIB konsisten; ekspor audit hanya untuk role yang disahkan |

Lintas layar: evaluasi ukuran teks sekunder 9–11px, kontras terukur, target sentuh, zoom 200%, label programatis, urutan fokus dan pembaca layar. Probe tidak mendeteksi overflow dokumen pada 390px atau error JavaScript, tetapi tabel tetap membutuhkan scroll horizontal dan lebih dari itu belum dianggap lulus otomatis. Existing toast/loading/microinteraction cukup sebagai fondasi; prioritas berikutnya kejelasan alur dan aksesibilitas.

## Arsitektur, data dan operasi

- Pertahankan Node.js + PostgreSQL + frontend yang berjalan. Pecah modul app.mjs/public/app.js saat mengerjakan fitur terkait; migrasi total ke Laravel/Next.js bukan prasyarat penerimaan.
- Versi berbeda dari lampiran: satu dokumen dapat mempunyai beberapa versi; surat juga bisa mempunyai beberapa lampiran independen. Rancang keduanya agar mengganti lampiran A tidak menimpa B.
- Normalisasi entitas/indeks secara terukur. Optimasi SQL, persistensi event dan migrasi bertahap memerlukan rencana cutover, sebab auto-deploy saat ini **menolak perubahan db/schema.sql**.
- Status kelengkapan/QC berbeda dari status disposisi. File ada tidak membuktikan scan terbaca, halaman lengkap atau metadata tepat.
- Nomor surat belum disepakati unik global. Peringatan potensi duplikasi dan idempotensi submit diperlukan tanpa memaksakan constraint yang merusak nomor sah.
- Rencana migrasi harus mempunyai manifest sumber, checksum, verifikasi operator, dry-run, penanganan duplikat/gagal, laporan rekonsiliasi dan batch pilot sebelum sekitar 1.300 arsip.
- VPS/Caddy/HTTPS/auto-deploy sudah berjalan menurut bukti yang tersedia. Region, patch OS, kapasitas, hardening DB/SSH, reboot, monitoring, retensi release/backup dan simulasi kegagalan masih memerlukan bukti operasional. Backup tiap deployment tanpa retensi juga menambah pemakaian disk.
- Kredensial/tokens/kunci yang pernah dibagikan perlu dirotasi melalui saluran privat. Audit ini tidak mengakses atau mencetak rahasia. Penetapan kantor terhadap hosting/data/retensi tetap diperlukan; audit bukan pemeriksaan hukum.

## Dokumen yang perlu diselaraskan

| Dokumen/kelompok | Masalah baseline | Perlakuan |
|---|---|---|
| TASKS/ROADMAP | Checklist “selesai” mencampur kode, persetujuan dan pemulihan; tanggal/urutan lama | TASKS menjadi pintu ke TODO_MASTER; roadmap lama ditandai riwayat |
| DECISIONS D-23 | Node 20 tanpa dependensi dan target Laravel/Livewire tidak menggambarkan rilis aktif | Catat stack aktual dan pisahkan aspirasi lama dari keputusan implementasi |
| LAUNCH_READINESS | Temuan awal a12e258 masih bisa terbaca sebagai cacat aktif | Pertahankan bukti historis; rujuk audit ini untuk status kini |
| API/DATABASE | Endpoint/tabel konseptual tercampur kontrak aktual; contoh path download konseptual berbeda dari /api/files/{id} | Pisahkan aktual/target dalam paket 00, jangan implementasikan endpoint hanya karena tercantum |
| DESIGN/.interface-design | Beberapa token/sidebar/font lama saling menimpa | Ringkasan aktif tunggal sesuai pilihan Bawaslu dan implementasi; perubahan desain mengikuti kebutuhan kerja |
| BACKUP/deploy README | Scheduler dinyatakan belum ada, padahal ada laporan pemasangan; batas restore belum mudah dibaca | Bedakan laporan operator, bukti lokal dan verifikasi server; pekerjaan 11 tetap tertunda |
| MVP_TESTING/README/PRD | Minimum Node lama, dependensi/tanggal/hosting dan deskripsi mode demo perlu pemutakhiran | Sinkronkan fakta, tandai target lama dan instruksi hanya demo; jangan menampilkan data dummy sebagai bukti operasional |

## Definisi sistem lengkap untuk pilot surat

1. Kebutuhan MUST ditutup dengan bukti atau pengurangan scope disahkan; konflik kewenangan/nomenklatur/kategori diputuskan.
2. Masalah integritas/alur prioritas tinggi terselesaikan, versi/lampiran dan kronologi dapat dipakai, serta akses teruji untuk seluruh peran.
3. Pencatatan → unggah/QC → pencarian/unduh → disposisi/tindak lanjut → ekspor/audit lulus UAT pengguna; XLSX dibuka di alat kantor.
4. SOP/Juknis, klasifikasi/indeks, PIC, pelatihan dan pengukuran hasil layanan tersedia; migrasi direkonsiliasi, bukan sekadar jumlah file naik.
5. Beban representatif, rollback/migrasi, monitoring, backup terpisah/restore dan penerimaan operasional dibuktikan sebelum arsip nyata.
6. Keputusan go/no-go kantor tercatat. Kategori lanjut, OCR, email dan integrasi mempunyai scope terpisah; tidak menghalangi pilot jika bukan kebutuhan yang disahkan.

Urutan kerja dan kriteria selesai setiap paket ada di [TODO_MASTER.md](TODO_MASTER.md). Langkah pertama pengembangan yang direkomendasikan adalah **paket 01: perbaikan integritas alur dan perlindungan admin**, sambil menyelesaikan keputusan paket 00. Riwayat berkas tetap prioritas setelah itu.
