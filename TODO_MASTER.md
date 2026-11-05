# TODO induk — SIAGA ARSIP sampai pilot operasional

Tanggal: **5 November 2026, WIB**. Dasar: [AUDIT_MASTER.md](AUDIT_MASTER.md), dokumen RA 25 halaman, kebutuhan FR-01–22 dan baseline `75a19c6`. Dokumen ini menggantikan urutan/checklist TASKS/ROADMAP lama sebagai daftar pelaksanaan terkini.

Status pekerjaan berurutan tercatat pada checklist di bawah dan [FEATURE_PROGRESS.md](FEATURE_PROGRESS.md), dengan tes/commit/CI/demo terpisah dari penerimaan manusia. Fondasi 01.1 dan fitur lama tetap digunakan; tidak dibangun ulang. Bukti UAT kantor tetap dicatat di MVP_TESTING.md.

## Prioritas pemilik terbaru — fitur dan kelengkapan

Urutan aktif: 02.1 → 02.2 → 02.3 → 02.4 → 03 → 04 → 05 → 07 → 08, lalu alat bantu aplikasi/migrasi sesuai dependensi. 01.2, 01.3, seluruh 06.x dan 11.x berstatus **ditunda: keamanan**. Cek izin dasar, validasi data dan regresi yang diperlukan fitur tetap diterapkan. Deployment publik hanya demo dummy; tidak ada perubahan akun/data nyata atau rahasia dalam repo.

SOP/Juknis, pelatihan, pilot kantor, evaluasi/KPI, inventaris fisik dan penetapan tim/PIC adalah pekerjaan kantor. Pengembangan hanya menyiapkan template/alat bantu; pelaksanaannya tidak dicentang tanpa bukti kantor. Bila keputusan 00 belum ada, gunakan asumsi konservatif yang terdokumentasi dan dapat diubah, tanpa mengklaim persetujuan kantor.

**Batas instruksi pemilik terbaru:** sesi ini hanya menuntaskan 04.4, lalu berhenti. 04.5 dan TODO berikutnya menunggu permintaan baru. Penundaan keamanan/offsite dan batas demo dummy tetap berlaku.

## Cara mengerjakan satu per satu

- Pilih satu ID tugas, misalnya `01.1`; implementasikan dalam paket kecil yang bisa diuji dan ditinjau. Catat commit, hasil tes, bukti deployment dan hasil UAT secara terpisah.
- Centang tugas hanya setelah kriteria selesainya terpenuhi. “Kode tersedia”, “terpasang”, “teruji lokal” dan “diterima pengguna” bukan status yang sama.
- Untuk tugas yang mengubah aturan akses, sepakati kebijakannya dahulu. Perbaikan teknis yang tidak bergantung kebijakan dapat berjalan paralel dengan keputusan kantor, tanpa menambah izin diam-diam.
- Uji mutasi memakai data sementara/staging/dummy yang terkontrol. Migrasi skema, impor data nyata, penghapusan dan konfigurasi server mempunyai runbook serta backup/rollback yang sesuai.
- **Backup/offsite/restore ditunda sesuai arahan pengguna.** Paket 11 tetap dicatat sebagai syarat sebelum data nyata; tidak dijalankan otomatis karena masuk TODO.
- Owner di bawah adalah fungsi yang diusulkan: DEV (pengembang), PO (pemilik produk/pimpinan), ARS (pengelola arsip/operator), OPS (pengelola VPS), UAT (wakil peran kantor). Nama orang ditetapkan kantor.

## Peta urutan dan ketergantungan

| Paket | Prioritas/status | Fokus | Ketergantungan | Owner utama |
|---|---|---|---|---|
| 00 | Awal, sebagian perlu keputusan | Sumber kebenaran, istilah, izin dan scope | Tidak ada | PO + ARS + DEV |
| 01 | 01.1 selesai; 01.2/01.3 ditunda: keamanan | Retry unggah, admin terakhir, default role aman | Tidak ada untuk perbaikan teknis | DEV |
| 02 | Tinggi | Versi, lampiran dan keutuhan file | 01.1; asumsi lampiran 00 | DEV + ARS |
| 03 | Tinggi | Disposisi end-to-end dan notifikasi | Keputusan penerima 00; detail 02 dapat menyusul | DEV + UAT |
| 04 | Tinggi | Kelengkapan, QC dan indeks arsip | Asumsi 00, 01.1, 02 | DEV + ARS |
| 05 | Wajib/bersyarat sesuai scope | Master klasifikasi dan kategori | 00, 04 | DEV + ARS |
| 06 | ditunda: keamanan (cek izin dasar fitur tetap) | Akun, audit, keamanan file dan akses | 00; berjalan bersama fitur terkait | DEV + OPS |
| 07 | Bertahap bersama paket fitur | UI/UX, aksesibilitas dan konsistensi | Fitur terkait; 06 ditunda | DEV + UAT |
| 08 | Sebelum migrasi massal | Query SQL, performa, kesiapan perubahan skema | Model 02/03/05 dan data uji | DEV + OPS |
| 09 | Sebelum arsip nyata | Inventaris, migrasi dan rekonsiliasi | 00, 02, 04, 05, 06, 08; gate 11 untuk data nyata | ARS + DEV |
| 10 | Sebelum penerimaan kantor | SOP/Juknis, pelatihan dan pengukuran manfaat | Draft 00; pelatihan pada alur stabil | ARS + PO + UAT |
| 11 | ditunda: keamanan | Offsite/restore dan operasi server | Pilihan sarana/PIC; wajib sebelum data nyata | OPS + PO |
| 12 | Gerbang peluncuran | UAT lintas peran, pilot dan go/no-go | Semua MUST/gate relevan, termasuk 11 | PO + UAT + OPS |
| 13 | Setelah pilot/bersyarat | OCR, email, kategori/integrasi lanjutan | Pilot stabil dan keputusan scope | PO + DEV |

Urutan bukan perkiraan hari kerja. Jadwal baru ditetapkan setelah ruang lingkup, keputusan kantor dan kapasitas tim jelas. Pilot dummy dapat berlanjut sambil paket 11 ditunda; peluncuran arsip nyata menunggu gerbangnya selesai.

## 00 — Kunci kebutuhan dan rapikan dokumentasi

- [ ] **00.1 — Sahkan nama dan subbagian.** Catat hubungan ARSIP TERPADU dengan SIAGA ARSIP; cocokkan narasi/bagan RA dan struktur kantor saat ini; tetapkan pemetaan kode/nama unit tanpa mengubah akses/data lama sembarangan. **Selesai:** satu daftar resmi disetujui PO/ARS dan dipakai label, akun, arsip, migrasi, dashboard serta dokumen.
- [ ] **00.2 — Sahkan matriks kemampuan.** Putuskan edit recorder vs admin; penerima disposisi individu vs tim; apakah penugasan lintas subbagian dibutuhkan; satu role atau kombinasi. **Selesai:** matriks create/read/edit/upload/replace/dispose/update/export/delete/audit per role dengan scope dan tes negatif yang harus lulus. Izin admin-only saat ini berlaku sampai keputusan baru.
- [ ] **00.3 — Sahkan scope pilot.** Tetapkan lampiran wajib, arti berkas final/QC, cakupan klasifikasi/kategori FR-11, kebutuhan soft-delete/pemulihan dan aturan nomor. **Selesai:** MUST yang dikerjakan dan pengurangan scope yang disepakati tertulis; kategori lanjut tidak dianggap otomatis selesai oleh endpoint tambah nama.
- [ ] **00.4 — Sinkronkan Markdown.** Pisahkan kontrak aktual/konseptual API dan database; perbarui Node/dependensi, runbook aktif, status timer, mode data contoh dan panduan desain final. **Selesai:** README, API, DATABASE, SECURITY, BACKUP, PRD, DESIGN, DECISIONS, MVP_TESTING serta runbook tidak bertentangan dengan kode/status; audit lama ditandai historis.
- [ ] **00.5 — Tetapkan PIC dan ukuran penerimaan.** Tentukan pemilik produk, admin cadangan, pencatat, pengunggah, reviewer QC, OPS dan kontak bantuan; pilih KPI dan baseline. **Selesai:** penanggung jawab dan target mutu disetujui, bukan hanya daftar nama di bagan RA.

## 01 — Perbaiki integritas alur dan keselamatan akun

- [x] **01.1 — Retry unggah tanpa arsip ganda (A-01).** ID metadata dipakai kembali saat upload diulang; feedback sukses parsial, penguncian metadata dan retry berkunci operasi tersedia. Server menjaga replay create/upload, konflik payload, izin dan persistensi restart. **Bukti:** keamanan JSON/PostgreSQL 187, database 8, browser retry 10; regresi metadata/interaksi dan UAT dasar lulus. Batas: kunci/draft hanya selama dialog terbuka, bukan pemulihan lintas reload; file yatim akibat gagal commit DB tetap 02.4. UAT manusia pada dummy mengikuti MVP_TESTING.md; bukan izin memakai arsip nyata.
- [ ] **01.2 — Lindungi admin terakhir (A-02).** **ditunda: keamanan.** Tolak nonaktif/penurunan role yang menghilangkan seluruh admin aktif; periksa pada transaksi termasuk dua perubahan bersamaan. **Selesai:** selalu tersisa admin aktif; perubahan admin lain yang sah tetap berjalan; UI menjelaskan penolakan; ada regresi JSON/PostgreSQL.
- [ ] **01.3 — Default akun dengan hak minimal (A-06).** **ditunda: keamanan.** Pilih role dasar yang sesuai keputusan atau wajib memilih; gunakan nama role Indonesia dan konfirmasi akses admin. **Selesai:** membuat akun biasa tidak tanpa sengaja membuat admin; role/subbagian valid di server dan perubahan diaudit.

## 02 — Versi, lampiran dan keutuhan berkas

- [x] **02.1 — Rancang model versi/lampiran.** **Implementasi:** normalisasi read-only dan kontrak FILE_MODEL.md; 11 pemeriksaan model lulus; regresi lama dan CI menjadi gerbang rilis. Tidak ada migrasi massal/penulisan akun atau arsip demo. Bedakan dokumen utama, berkas final, lampiran dan penggantian versi; simpan ID, nomor versi, nama, tipe, ukuran, checksum, pengunggah/waktu serta alasan penggantian. **Selesai:** relasi stabil dan rencana normalisasi fileVersions lama; aktor/waktu yang tidak diketahui ditandai, tidak direkayasa.
- [x] **02.2 — UI ganti dan riwayat (A-03/A-07).** **Bukti lokal:** 26 tes API JSON/PostgreSQL, browser versi 8 dan regresi keamanan 187 lulus. Penggantian/restore menambah versi immutable dengan provenance; tab usang ditolak dan semua unduh mengikuti scope. Tambahkan aksi Ganti berkas/Riwayat untuk pihak berwenang dan unduh versi lama melalui pemeriksaan scope tiap permintaan. **Selesai:** v1→v2 tidak menghilangkan v1; pegawai asing/anonim ditolak; riwayat terbaca; penetapan kembali versi aktif bila dibutuhkan membuat revisi/audit, bukan menulis ulang bukti lama.
- [x] **02.3 — Lampiran independen.** **Bukti:** model 12, API JSON/PostgreSQL 52, browser 11 lulus; A/B/primary, histori/restore dan retry terisolasi. Unggah/lihat/unduh lebih dari satu lampiran sesuai scope pilot. **Selesai:** penggantian lampiran A tidak mengganti B; kelengkapan utama/lampiran jelas; ukuran/tipe/error setiap file ditangani.
- [x] **02.4 — Konsistensi commit file (A-10).** **Bukti:** 17 tes I/O JSON/PostgreSQL, kegagalan sebelum commit dan hasil commit ambigu; binary lama tetap utuh. Rekonsiliasi hanya read-only, tidak ada penghapusan otomatis. Stage file dan finalisasi metadata secara aman; tangani gagal tulis/DB, retry dan dua unggahan bersamaan; siapkan rekonsiliasi file yatim read-only/dry-run. **Selesai:** kegagalan tidak memberi unduh palsu atau kehilangan versi; cleanup hanya kandidat yang terbukti tidak direferensikan.

## 03 — Lengkapi alur disposisi dan notifikasi

- [x] **03.1 — Penerima tepat (A-04).** **Bukti:** 24 tes API JSON/PG dan 6 browser; default sementara FEATURE_ASSUMPTIONS.md, pengesahan 00 tetap belum diklaim. Pilihan orang aktif/tim sesuai keputusan 00.2; tegaskan prioritas assignedUserId terhadap kelompok. **Selesai:** orang yang tidak ditugasi tidak memperbarui tugas individual kecuali hak supervisi/tim memang disahkan; pemberian akses lintas bagian tidak implisit.
- [x] **03.2 — Kronologi dan tindak lanjut.** **Bukti:** 38 pemeriksaan API JSON/PG dan 10 browser; histori/aktor/waktu, catatan, no-op dan reopen teruji. Detail menampilkan instruksi, pengirim/penerima, status, catatan serta aktor/waktu setiap pembaruan. Validasi note dan aturan transisi/reopen. **Selesai:** perubahan lama dapat ditelusuri, bukan hanya status terakhir; catatan privat tetap mengikuti scope.
- [x] **03.3 — Perubahan aman.** **Bukti:** API JSON/PG 54, browser retry 7 + disposisi 10; replay create/update, versi wajib, CAS paralel/restart, draft/reload dan navigasi teruji. Cegah disposisi/status ganda akibat retry, konflik dua tab dan respons lambat setelah navigasi; pulihkan dropdown jika gagal. **Selesai:** satu tindakan menghasilkan satu event; perubahan baru tidak tertimpa diam-diam dan halaman baru tidak diganti respons lama.
- [x] **03.4 — Daftar kerja.** **Bukti:** API JSON/PG 76, browser daftar kerja 10 + disposisi/retry 17; scope/filter/pagination/CSV lintas halaman dan ringkasan vs dashboard teruji. Tambah filter tugas saya/tim/selesai, pencarian dan pagination; detail surat dapat dibuka langsung. **Selesai:** daftar, ringkasan tugas dan ekspor status konsisten untuk tiap role.
- [x] **03.5 — Notifikasi bermakna.** **Bukti:** notifikasi 29 model/JSON/PG dan 11 browser; baca per pengguna/restart, unread vs aktif, seluruh halaman dan klik kronologi teruji. Tentukan read/unread dan event disposisi/status yang dibutuhkan; persistensi dan tujuan klik ke tugas/arsip. **Selesai:** jumlah tugas aktif dan belum dibaca dibedakan, tidak hilang setelah restart bila dipersist, tidak membuka metadata asing. Email/push ditangani terpisah pada 13.

## 04 — Kelengkapan, mutu dan indeks arsip

- [x] **04.1 — Status kelengkapan/QC.** **Bukti:** kualitas 37 model/JSON/PG, browser QC 8 dan regresi browser 82. Approval admin terikat metadata/versi seluruh berkas; perubahan perlu review ulang. QC rinci tetap 04.3. Bedakan metadata tercatat, berkas belum ada, perlu verifikasi dan lengkap sesuai kebijakan; tampilkan antrean pengunggah/reviewer dan filter berkas belum lengkap. **Selesai:** file fisik ada belum otomatis dianggap scan benar/lengkap.
- [x] **04.2 — Standar metadata dan indeks.** **Bukti:** indeks 28 model/JSON/PG dan browser 8; indeks immutable, agenda/kode opsional, sumber tervalidasi, ekspor dan nama terstruktur teruji. Aturan resmi kantor tetap asumsi, tidak direkayasa. Tentukan kode klasifikasi, tahun, unit, nomor agenda/indeks, penamaan tampilan/unduhan dan lokasi sumber fisik/Drive yang diperlukan. **Selesai:** indeks bisa diekspor, keterkaitan sumber jelas; object key internal tetap privat dan aman, tidak dipaksa menyerupai folder manual.
- [x] **04.3 — QC dan duplikasi.** **Bukti:** inspeksi 26 JSON/PG, browser baru 6; checklist/hash/restart, baseline legacy, scope, duplikat sah dengan alasan dan tidak ada penghapusan teruji. Tandai kecocokan metadata, halaman/keterbacaan, orientasi scan dan checksum; beri peringatan nomor/file yang berpotensi sama. **Selesai:** operator memutuskan duplikat sah; tidak menghapus otomatis atau memaksakan nomor unik global tanpa aturan kantor.
- [x] **04.4 — Koreksi metadata sesuai keputusan.** **Bukti:** 28 tes JSON/PG dan 9 browser; admin-only saat 00.2 belum disahkan, CAS, pembatasan semua disposisi, konsistensi assign-vs-move, histori ringkas tanpa nilai sensitif dan restart teruji. Gunakan aturan sementara admin-only sampai 00.2 disahkan, histori perubahan yang diizinkan dan aturan pemindahan arsip dengan disposisi. **Selesai:** konflik versi tetap terlindungi; nilai sensitif tidak dipindahkan ke audit umum; penugasan ikut konsisten setelah koreksi pemilik.
- [ ] **04.5 — Soft-delete dan pemulihan bila masuk pilot.** Khusus pengelola, alasan wajib, konfirmasi, audit dan restore terkontrol. **Selesai:** arsip terhapus hilang dari daftar/publik/ekspor/unduh biasa dan versi/lampiran ikut scoped; tidak ada hard-delete/pemusnahan otomatis. Jika dikeluarkan dari pilot, catat persetujuan 00.3.

## 05 — Master klasifikasi dan kategori

- [ ] **05.1 — Kelola klasifikasi penuh.** Kode/nama/deskripsi/aktif; ubah atau nonaktif tanpa memutus arsip lama. **Selesai:** form/filter/ekspor tetap mengenali referensi lama, pilihan baru valid, perubahan diaudit dan aturan penamaan disetujui ARS.
- [ ] **05.2 — Tutup FR-11 secara eksplisit.** Implementasikan kategori yang benar-benar dapat dipilih, divalidasi dan diakses sesuai skema; atau sahkan pilot hanya dua jenis dan pindahkan kemampuan kategori ke lanjutan. **Selesai:** penambahan nama kategori saja tidak dicentang sebagai modul kategori selesai.
- [ ] **05.3 — Uji perubahan master.** Data lama, label duplikat, kategori nonaktif dan akses diuji. **Selesai:** perubahan master tidak memberikan akses baru atau mengubah arti arsip lama diam-diam.

## 06 — Akun, audit dan keamanan operasional aplikasi

- [ ] **06.1 — Siklus akun.** **ditunda: keamanan.** Ganti password sendiri dengan verifikasi aman, kewajiban ganti awal bila disahkan, reset via admin dan pencabutan sesi yang jelas; validasi profil/email. **Selesai:** semua peran bisa memakai akun riil; pemulihan akun tidak bergantung berbagi password di chat; MFA dievaluasi untuk role tinggi.
- [ ] **06.2 — Audit yang dapat ditelusuri (A-09).** **ditunda: keamanan.** Filter/pagination aktor/aksi/tanggal/arsip, hasil tindakan dan korelasi request; label Indonesia. **Selesai:** create/edit/upload/version/download/access/disposition/export/delete yang tersedia tercatat konsisten tanpa isi sensitif; pembacaan/ekspor log dibatasi sesuai keputusan.
- [ ] **06.3 — Integritas dan retensi audit.** **ditunda: keamanan.** Role DB dengan hak minimal, proteksi perubahan log, kebijakan retensi dan peninjauan log lama. **Selesai:** hak dan batas perlindungan terbukti; jangan mengklaim tamper-proof hanya karena API tidak menyediakan edit.
- [ ] **06.4 — Kebijakan upload.** **ditunda: keamanan.** Batas konfigurabel konsisten UI/proxy/server; signature/ekstensi/checksum tetap; tentukan scan malware/karantina dan timeout/error. **Selesai:** file ditolak/karantina tidak diunduh sebagai dokumen sah. Konversi .doc lama ditangani dalam migrasi bila diperlukan; jangan memperluas allowlist tanpa kebutuhan.
- [ ] **06.5 — Regresi akses menyeluruh.** **ditunda: keamanan.** Uji setiap role untuk ID langsung, versi/lampiran, detail, preview, ekspor, notifikasi, audit dan arsip terhapus. **Selesai:** seluruh endpoint baru memeriksa izin server, termasuk akun nonaktif/perubahan subbagian/sesi habis.
- [ ] **06.6 — Rahasia dan anti-penyalahgunaan.** **ditunda: keamanan.** Rotasi token/kunci yang pernah dibagikan secara privat; evaluasi rate limit di belakang Caddy, percobaan login dan logging tanpa rahasia. **Selesai:** credential lama dicabut sesuai jenisnya, tidak masuk repo/log dan kebijakan limit tidak mengunci seluruh pegawai tanpa penanganan.

## 07 — UI/UX dan aksesibilitas

- [ ] **07.1 — Form konsisten (A-05).** Hubungkan label/id, bantuan/error per field, indikator wajib/opsional dan status submit; pertahankan draft setelah gagal atau sesi habis. **Selesai:** keyboard dan pembaca layar mengenali semua kontrol; login/editor/tambah/akun/unggah/disposisi setara kualitasnya.
- [ ] **07.2 — Detail sebagai pusat kerja.** Bagian Metadata/Berkas/Kronologi mudah dipahami; preview aman PDF/gambar dan fallback unduh untuk format lain; navigasi kembali mempertahankan filter/halaman. **Selesai:** pengguna menyelesaikan tugas tanpa menebak menu; URL/detail dapat dirujuk tanpa membuka data ke publik.
- [ ] **07.3 — Tabel dan filter di HP.** Pilih pola ringkas/responsif, aksi utama jelas, kriteria aktif/Reset terlihat dan sorting nomor/tanggal/waktu pencatatan dijelaskan. **Selesai:** 360/390/768/1440px dapat dipakai; scroll horizontal bila perlu tidak menyembunyikan akses aksi tanpa petunjuk.
- [ ] **07.4 — Dashboard sesuai pekerjaan.** Jelaskan periode dan scope kartu/grafik; tampilkan kebutuhan per role dan kelengkapan yang faktual. **Selesai:** perubahan tahun tidak memberi kesan semua angka sudah terfilter jika hanya grafik; tidak ada metrik atau notifikasi rekaan.
- [ ] **07.5 — Desain aktif tunggal.** Konsistenkan warna Bawaslu, font, ukuran teks, spasi, tombol, modal, status, loading/toast/error; aset logo/gambar punya sumber jelas. **Selesai:** tampilan profesional yang sudah dipilih tetap dikenali; animasi membantu feedback dan menghormati reduced motion.
- [ ] **07.6 — Aksesibilitas terukur.** Uji kontras, zoom 200%, fokus, urutan keyboard, label status selain warna, target sentuh dan pembaca layar. **Selesai:** temuan otomatis ditinjau manusia, skenario penting lulus dan batas yang tersisa dicatat; tidak mengklaim kepatuhan penuh dari satu alat.
- [ ] **07.7 — Publik/login dan bantuan.** Nama/logo resmi, penjelasan akses dan kontak valid; pisahkan data uji dari angka resmi; pengalaman login/sesi habis/akun nonaktif jelas. **Selesai:** landing tidak memuat rincian surat/kontak fiktif/angka demo yang dianggap operasional.

## 08 — Arsitektur, performa dan perubahan skema

- [ ] **08.1 — Query sesuai scope (A-08).** Pindahkan filter/pagination/sort ke SQL, indeks yang diperlukan dan agregat terarah; hilangkan kebutuhan memuat seluruh arsip/audit/sesi untuk request rutin. **Selesai:** chart/disposisi/ekspor tetap benar; uji akses dan konkurensi lulus; eksport semua hasil memakai strategi yang sesuai kapasitas.
- [ ] **08.2 — Integritas dan migrasi schema.** Model versi/lampiran/event/master punya constraint dan migrasi berversi, dry-run, kompatibilitas serta rollback. **Selesai:** runbook diuji staging; perubahan db/schema.sql tidak dipaksa melewati penolakan auto-deploy yang sekarang.
- [ ] **08.3 — Benchmark representatif.** Sekitar 1.300 metadata + file representatif, beberapa pengguna, pencarian/unggah/ekspor/backup dan disk rendah. **Selesai:** catat waktu p50/p95, RAM/CPU/disk/lock, tetapkan target yang realistis untuk VPS sekitar 2 GiB bersama PO; uji array 1.300 baris tidak dianggap uji beban server.
- [ ] **08.4 — Pemeliharaan kode.** Pisahkan route/service/validasi dan komponen UI saat fitur terkait disentuh; logging/error seragam, konfigurasi terdokumentasi dan lint/check yang bermakna. **Selesai:** perubahan mudah ditinjau dan diuji; tidak perlu rewrite Laravel/Next.js untuk menutup fitur pilot.
- [ ] **08.5 — CI dan staging.** Jadikan tes alur penting/negatif/browser bagian pemeriksaan yang dapat diulang; staging memakai dummy dan rilis teridentifikasi. **Selesai:** tes gagal menahan rilis, schema mempunyai jalur migrasi terencana, rollback kode tidak disalahartikan sebagai rollback data.

## 09 — Inventaris dan migrasi arsip nyata

- [ ] **09.1 — Inventaris aktual.** Verifikasi perkiraan 1.000 PDF Drive + 300 fisik: sumber, pemilik, tahun, unit, format/ukuran, prioritas dan izin pemindahan. **Selesai:** ada daftar nyata dan penanggung jawab; sumber belum dihapus.
- [ ] **09.2 — Template dan import dry-run.** Sediakan template metadata, pemetaan klasifikasi/unit dan identitas sumber; laporan validasi baris, duplikasi, error dan percobaan ulang idempoten. **Selesai:** batch yang sama tidak menggandakan arsip; operator bisa meninjau sebelum import.
- [ ] **09.3 — Standar scanning.** Tentukan keterbacaan/resolusi/format, kelengkapan halaman, penamaan, QC reviewer dan lokasi fisik. **Selesai:** sampel lolos pemeriksaan manusia; pilihan OCR tidak menggantikan dokumen asli.
- [ ] **09.4 — Batch pilot dan rekonsiliasi.** Salin binary privat, hitung checksum dan cocokkan arsip/file/versi; catat penolakan dan hasil QC; bersihkan data demo hanya melalui prosedur terkontrol. **Selesai:** manifest sumber/tujuan cocok, file berizin dapat dibuka, akses asing ditolak, tidak ada penghapusan sumber otomatis. Arsip nyata menunggu gate 11/12.

## 10 — SOP, pelatihan dan bukti hasil aksi perubahan

- [ ] **10.1 — Juknis per peran.** Penerimaan, pencatatan, scan, klasifikasi/penamaan, upload/QC, pencarian, disposisi, koreksi, pemeliharaan dan insiden. **Selesai:** panduan bergambar dapat diikuti pegawai, disahkan pemilik proses dan mempunyai versi/tanggal.
- [ ] **10.2 — Pelatihan/simulasi.** Latihan tugas nyata memakai dummy, dukungan dan FAQ; pisahkan materi pengguna dari panduan VPS. **Selesai:** peserta menyimpan/menemukan/memproses surat mandiri; daftar hadir, evaluasi dan kebutuhan pendampingan dicatat.
- [ ] **10.3 — Pengukuran manfaat.** Ukur waktu temu kembali sebelum/sesudah dengan tugas sebanding, kelengkapan/QC, pemakaian dan kendala; sumber metrik jelas. **Selesai:** hasil terukur dan tindak lanjut, bukan angka klaim marketing; target ditetapkan setelah baseline.
- [ ] **10.4 — Paket evidence RA.** Pemetaan milestone→output→bukti: penetapan tim, inventaris, SOP, scan/QC, screenshot, hasil UAT, pelatihan dan monev. **Selesai:** laporan periodik dapat disusun tanpa membocorkan dokumen/identitas sensitif ke halaman publik; koordinasi rutin/PIC keberlanjutan ada.

## 11 — Backup, pemulihan dan operasi VPS — DITUNDA

Bagian ini hanya rencana. Pengguna sudah meminta melewatinya untuk sementara; jangan memasang layanan baru atau meminta credential sampai pekerjaan ini dilanjutkan.

- [ ] **11.1 — Verifikasi backup/restore.** **ditunda: keamanan.** Tambah checksum snapshot metadata, validasi manifest/binary/referensi, pemulihan ke database/direktori kosong, pertahankan akun/hak akses dengan sesi dicabut. **Selesai:** DB dan file bisa dipulihkan di lingkungan bersih; snapshot rusak/target berisi ditolak; uji ini berbeda dari impor yang mereset akun.
- [ ] **11.2 — Offsite terenkripsi.** **ditunda: keamanan.** Pilih tujuan sesuai anggaran/kebijakan kantor; konfigurasi privat, pengiriman, verifikasi hasil, retensi dan alarm. **Selesai:** satu salinan terenkripsi tersimpan di luar VPS dan dapat dipulihkan; ada PIC serta catatan RPO/RTO.
- [ ] **11.3 — Monitoring dan kapasitas.** **ditunda: keamanan.** Health eksternal/DB/disk, backup terakhir, kegagalan deployment, retensi backup/release dan patch/reboot terencana. **Selesai:** alarm diuji dan diterima PIC; cleanup tidak menghapus release aktif/cadangan yang dibutuhkan.
- [ ] **11.4 — Hardening/runbook.** **ditunda: keamanan.** Verifikasi firewall/Caddy, DB/SSH privat, user service, rahasia, rotasi kunci, sertifikat, lokasi data dan prosedur insiden. **Selesai:** bukti server nyata, bukan hanya fixture container, serta persetujuan lokasi/operasi kantor tercatat.

## 12 — UAT dan gerbang peluncuran

- [ ] **12.1 — Tutup penerimaan yang tertunda.** XLSX dibuka di Excel/LibreOffice kantor; filter Selesai, versi/lampiran dan alur baru diuji pengguna yang tepat. **Selesai:** hasil dicatat per skenario/peran, termasuk kegagalan, HP dan dua tab.
- [ ] **12.2 — UAT lintas peran.** Pencatat→pengunggah/QC→pimpinan→pegawai→pengelola; cari/detail/preview/unduh/versi/disposisi/ekspor/audit, sesi habis dan larangan lintas scope. **Selesai:** seluruh MUST yang disahkan lulus dan temuan berat ditutup.
- [ ] **12.3 — Pilot terkontrol.** Mulai batch kecil setelah izin khusus pilot data nyata serta gate keamanan/backup 11 lulus; rekonsiliasi, monitor pemakaian/kendala dan ukur KPI. **Selesai:** kualitas data, performa dan dukungan operasional diterima; masalah punya PIC/tindak lanjut. Sebelum izin ini, migrasi 09 diuji dengan data sintetis/salinan yang diizinkan.
- [ ] **12.4 — Go/no-go tertulis.** Tinjau scope, keamanan, mutu data, SOP/pelatihan, monitoring, backup offsite/restore, biaya/lokasi data dan PIC. **Selesai:** PO/OPS/UAT menyetujui bukti; daftar batas yang diterima jelas. Mode produksi dan homepage 200 saja tidak mencukupi.

## 13 — Pengembangan bersyarat/setelah pilot

- [ ] **13.1 — OCR/full-text.** Uji sampel scan Indonesia, akurasi, indeks dengan akses setara dokumen, biaya/worker/resource dan reprocessing versi. Aktif hanya bila manfaat dan kapasitas disetujui.
- [ ] **13.2 — Email/push notifikasi.** Pilih kanal/provider, antrean/retry, minimisasi metadata pada pesan, template dan persetujuan; kegagalan pengiriman tidak menggagalkan disposisi.
- [ ] **13.3 — Kategori/unit lanjut.** Pelanggaran, sengketa, hukum, kepegawaian, pengadaan dan lainnya hanya setelah proses, skema, klasifikasi keamanan, pemilik serta retensi disahkan; jangan menjadikan aplikasi surat sebagai sistem perkara tanpa kajian.
- [ ] **13.4 — Integrasi/tanda tangan/retensi otomatis.** Kebutuhan, kewenangan, keamanan dan dampak biaya dibuat sebagai proyek lanjutan; tidak ada pemusnahan otomatis sebelum kebijakan resmi.

## Titik lanjut setelah 04.4

Status sampai 04.4 beserta tes/CI/demo ada pada checklist dan FEATURE_PROGRESS.md. **04.5 belum dimulai dan menunggu permintaan pemilik.** 01.2, 01.3, 06.x dan paket 11 tetap ditunda: keamanan. Dokumen/alat bantu kantor tidak membuktikan kegiatan kantor terlaksana. Demo publik tetap dummy sampai gerbang keamanan/operasional dipenuhi.
