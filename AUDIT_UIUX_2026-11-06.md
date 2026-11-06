# Audit UI/UX dan tombol SIAGA ARSIP — 6 November 2026

## Kesimpulan

Baseline kode: `fbfd232`. Ditemukan **24 temuan: 8 P1 (utama), 16 P2 (perlu diperbaiki)**. Tidak ada P0 yang dibuktikan pada alur yang dijalankan. Ini hasil audit, bukan tanda seluruh bug sudah diperbaiki.

Identitas merah/emas/arang sudah konsisten dan alur utama berjalan. Namun beberapa tombol menjanjikan perilaku yang tidak sesuai implementasi, grafik dapat menampilkan informasi menyesatkan, serta pola dialog dan pengaturan belum konsisten.

Seluruh mutasi memakai server localhost dengan direktori data sementara dan akun dummy. Tidak login atau mengubah data kantor/produksi, tidak mengirim arsip nyata, tidak mengubah kebijakan backup offsite. Audit tidak mengubah kode aplikasi dan tidak menerbitkan deployment.

## Cakupan dan bukti

- Browser Chromium lokal; desktop 1440px, ponsel 390px; pemeriksaan tambahan dashboard 320px/768px.
- 31 keadaan halaman/dialog direkam pada putaran utama, ditambah dua screenshot ukuran layar lanjutan.
- Halaman: Home, Tentang, Statistik publik, FAQ, login, dashboard, arsip, disposisi, empat tab pengaturan, audit, editor metadata, riwayat berkas, QC, profil.
- Pemeriksaan langsung: pagination, penomoran, tambah master, pindah tab setelah simpan, hapus akun dummy, filter bulan, dialog dengan Escape, menu profil dengan klik luar, unggah foto, pilihan master nonaktif.
- 14 suite browser dijalankan: **12 selesai lulus; 2 berhenti/gagal**. Ada **120 checkpoint PASS** sebelum penghentian; ini jumlah checkpoint, bukan jumlah assertion atau bukti seluruh pengujian hijau.
- Dua script audit tambahan selesai tanpa error fatal; pada putaran utama tidak ada `pageerror` JavaScript. Tidak dilakukan sertifikasi WCAG atau pengukuran beban VPS.
- Temuan PostgreSQL berasal dari inspeksi jalur penyimpanan, belum reproduksi database pada putaran ini. Temuan lain diberi bentuk bukti di bawah.

Artefak lokal:

- [Bukti terstruktur putaran utama](/tmp/siaga-audit-nov06/evidence.json)
- [Bukti pemeriksaan lanjutan](/tmp/siaga-audit-nov06/targeted.json)
- [Hero desktop yang masih bertumpuk](/tmp/siaga-audit-nov06/public-beranda-1440.png)
- [Dashboard ponsel](/tmp/siaga-audit-nov06/dashboard-390.png)
- [Pengaturan klasifikasi](/tmp/siaga-audit-nov06/settings-tab1-1440.png)
- [Dialog profil](/tmp/siaga-audit-nov06/profile-modal.png)
- Script reproduksi lokal: `/tmp/siaga-audit-ui.cjs`, `/tmp/siaga-audit-targets.cjs`.

Artefak `/tmp` bersifat sementara. Screenshot menggambarkan kode lokal pada SHA di atas, bukan bukti bahwa domain publik menjalankan SHA yang sama.

## Temuan P1 — perbaiki lebih dulu

### UI-01 — Hero masih bertumpuk di desktop

- **Lokasi:** `public/app.css:513`, `public/app.css:535`; `public/app.js:100`.
- **Bukti:** 1440px, kotak catatan akses beririsan dengan caption gambar; screenshot memperlihatkan teks saling menimpa. Pada 390px tidak ditemukan irisan ini.
- **Sebab/dampak:** perbaikan sebelumnya hanya menambah ruang di breakpoint mobile; caption desktop masih absolut di bawah konten yang sama. Pesan publik tidak terbaca.
- **Perbaikan:** sediakan ruang caption dalam alur layout atau pisahkan caption ke area yang tidak dapat ditimpa konten, lalu cek desktop dan mobile bersama.
- **Kategori/arahan:** Responsive / `$impeccable layout`.

### UI-02 — Hapus master belum persisten pada PostgreSQL

- **Lokasi:** `app.mjs:296`, `app.mjs:327`, `lib/store.mjs:17`.
- **Bukti kode:** DELETE klasifikasi/kategori menggunakan `splice()` pada data memori. Penyimpanan PG melakukan insert/update untuk master, tetapi penghapusan baris yang hilang hanya diterapkan ke sesi. Saat load berikutnya, seluruh baris master dibaca kembali.
- **Dampak:** API dapat melaporkan sukses tetapi master muncul lagi pada request berikutnya dalam mode PostgreSQL. Ini berbeda dari JSON lokal; uji JSON sebelumnya tidak membuktikan perilaku PG.
- **Perbaikan:** sinkronkan penghapusan master dalam transaksi PG dan uji create/delete/reload/restart pada kedua penyimpanan. Pertahankan penolakan hapus master yang dipakai arsip.
- **Kategori/arahan:** Implementation integrity / `$impeccable harden`.

### UI-03 — Hapus akun sama dengan Nonaktifkan

- **Lokasi:** `app.mjs:258`, `public/app.js:395`.
- **Bukti browser/API dummy:** setelah DELETE, akun tetap ada dalam GET daftar akun, dengan `active:false`; tombol Aktifkan tetap tersedia.
- **Dampak:** dua tombol berbeda menghasilkan tindakan yang sama. Pesan “dihapus” menyesatkan admin.
- **Perbaikan:** tentukan pengarsipan akun dengan label dan daftar terpisah, atau gunakan satu tindakan Nonaktifkan. Jangan hapus referensi pelaku pada arsip/audit.
- **Kategori/arahan:** Implementation integrity / `$impeccable clarify`.

### UI-04 — Filter bulan tidak memfilter seluruh grafik

- **Lokasi:** `public/app.js:254`, `public/app.js:255`.
- **Bukti browser:** pilih Januari; angka berubah menjadi 0, tetapi path surat masuk/keluar masih memuat kenaikan pada September/Oktober; tabel rincian tetap berisi 12 bulan.
- **Dampak:** angka, titik/label, garis, tabel, dan catatan periode tidak memberi representasi filter yang sama.
- **Perbaikan:** satu himpunan data terfilter menjadi sumber seluruh elemen grafik; sebutkan bulan yang dipilih dalam judul/catatan.
- **Kategori/arahan:** Implementation integrity / `$impeccable harden`.

### UI-05 — Grafik mini tidak sesuai judul kartu

- **Lokasi:** `public/app.js:233`, `public/app.js:234`.
- **Bukti screenshot/kode:** kartu “Arsip administrasi” bernilai 0 tetapi memiliki batang biru karena memakai seri surat masuk. Kartu “Surat masuk & keluar” memakai seri surat keluar saja. Total juga memakai gabungan surat ketika aggregate monthly tersedia, sehingga arsip administrasi tidak tercakup di seri total.
- **Dampak:** visual tampak berisi data kategori yang sebenarnya tidak ada.
- **Perbaikan:** hitung seri per kategori yang sama dengan angka kartunya; jika seri belum tersedia, tampilkan angka tanpa grafik yang salah.
- **Kategori/arahan:** Implementation integrity / `$impeccable harden`.

### UI-06 — Master nonaktif masih ditawarkan saat tambah arsip

- **Lokasi:** `public/app.js:194`, formulir tambah arsip; `lib/classification-taxonomy.mjs:36`, `lib/archive-taxonomy.mjs:24`, `lib/security.mjs:23`.
- **Bukti browser:** klasifikasi dummy dinonaktifkan melalui API lalu halaman dimuat ulang; pilihan “Klasifikasi nonaktif dummy” tetap ada di select tambah arsip.
- **Dampak:** pengguna dapat memilih pilihan yang akan ditolak server, setelah mengisi formulir. Label status master tidak sesuai perilaku UI.
- **Perbaikan:** pisahkan daftar pilihan aktif untuk pencatatan baru dari seluruh referensi untuk filter/histori. Nilai historis tetap terbaca.
- **Kategori/arahan:** Implementation integrity / `$impeccable harden`.

### UI-07 — Dialog baru melewati pola keyboard yang sudah ada

- **Lokasi:** `public/app.js:217`, `public/app.js:382`, MutationObserver di akhir file.
- **Bukti browser:** Escape tidak menutup `#profileModalBack`; fokus masih pada `#editProfile` di belakang modal. Dialog ubah klasifikasi punya `role=dialog` tetapi tidak punya tabindex; fokus tetap pada tombol Ubah di belakangnya.
- **Sebab:** enhancer hanya mencari `#modalBack`; profil memakai ID berbeda. Untuk dialog master yang sudah punya role, pemasangan tabindex dilewati sehingga `dialog.focus()` gagal.
- **Dampak:** pengguna keyboard mulai di belakang modal; fokus/penutupan tidak konsisten. Relevan WCAG 2.1.1 dan 2.4.3; perlu validasi ulang keyboard setelah perbaikan.
- **Perbaikan:** satu pengelola dialog yang memindahkan dan mengembalikan fokus, membatasi Tab, menutup dengan Escape secara aman, dan melindungi proses simpan.
- **Kategori/arahan:** Accessibility / `$impeccable harden`.

### UI-08 — Hapus arsip tersedia, jalur pemulihan belum ada di UI

- **Lokasi:** `public/app.js:282`, `app.mjs:202`; seluruh navigasi workspace.
- **Bukti kode:** detail memiliki Hapus arsip; server menyediakan restore, tetapi frontend tidak menyediakan daftar arsip terhapus/tombol pulihkan. Daftar biasa mengecualikan arsip terhapus.
- **Dampak:** admin tidak dapat membatalkan kesalahan hapus melalui antarmuka biasa walaupun berkas masih tersimpan.
- **Perbaikan:** sediakan Arsip terhapus dengan detail terbatas dan Pulihkan untuk admin, alasan serta konfirmasi yang jelas; pertahankan audit dan izin server.
- **Kategori/arahan:** Implementation integrity / `$impeccable harden`.

## Temuan P2 — rapikan setelah P1

| ID | Temuan dan bukti | Dampak / perbaikan | Lokasi / kategori / arahan |
|---|---|---|---|
| UI-09 | Kategori berulang: fixture demo mengembalikan masing-masing dari 12 label bawaan dua kali. | Gabungan konstanta + data tersimpan tanpa deduplikasi membuat tabel/pilihan panjang. Dedup dengan identitas stabil; cek data impor juga. | `app.mjs:54`, `app.mjs:307`; Integrity; `$impeccable harden` |
| UI-10 | Label `legacy` dipakai sebagai “Bawaan sistem”. Semua string kategori ditandai legacy, termasuk kategori lama; kontrol ubah/nonaktif/hapus ditutup. | `legacy` menjelaskan format penyimpanan, bukan kebijakan penguncian. Pisahkan flag bawaan/protected dan migrasi format; beri alasan pembatasan yang benar. | `public/app.js:322`, `lib/archive-taxonomy.mjs:17`; Integrity; `$impeccable clarify` |
| UI-11 | Perbarui data dashboard ada di DOM tetapi seluruh `.ws-page-heading` dipotong menjadi 1px dengan `clip-path:inset(50%)`. | Tombol serta konteks cakupan tidak dapat ditemukan secara visual. Pindahkan aksi ke area terlihat; jangan menyembunyikan kontrol interaktif sebagai heading dekoratif. | `public/workspace.css:52`; Accessibility; `$impeccable layout` |
| UI-12 | Setelah menambah klasifikasi dari tab Klasifikasi, tab terpilih kembali ke Buat akun. | Admin kehilangan posisi setelah simpan/ubah/nonaktif/hapus. Simpan tab aktif dalam state/route dan pulihkan setelah refresh. | `public/app.js:331`, `public/app.js:374`; Integrity; `$impeccable harden` |
| UI-13 | Screenshot tab Klasifikasi: garis aktif di Klasifikasi, tetapi Buat akun juga berwarna aktif. Tab tidak punya relasi aria-controls/tabpanel atau navigasi panah. | Seleksi tidak tegas dan pola keyboard tab belum lengkap. Hilangkan gaya first-child aktif permanen, gunakan satu state dan relasi ARIA yang lengkap. | `public/app.js:331`, `public/workspace.css` aturan tab/first-child; Accessibility; `$impeccable polish` |
| UI-14 | Halaman arsip 2 menyatakan 11–20 tetapi sel No. pertama 1. Dashboard dan tabel master/akun tidak memiliki kolom nomor. | Penomoran membingungkan dan permintaan nomor tabel belum konsisten. Gunakan offset pagination; tambahkan nomor pada tabel yang diminta. | `public/app.js:260`, `public/app.js:262`, `public/app.js:311`; Integrity; `$impeccable polish` |
| UI-15 | Audit mengambil 100 catatan, lalu frontend memotong menjadi 10 tanpa tombol halaman/filter. | Pengguna tidak dapat menelusuri catatan ke-11 dst dari UI. Terapkan pagination server, filter waktu/aktor/aksi, dan jumlah hasil yang jujur. | `public/app.js:467`, `app.mjs:482`; Integrity; `$impeccable harden` |
| UI-16 | Menu avatar tetap terbuka setelah Escape maupun klik di luar; membuka dialog juga tidak mereset aria-expanded. | Popover menumpuk/tidak mencerminkan keadaan sebenarnya. Tambah penutupan klik luar/Escape serta sinkronisasi expanded dan fokus. | `public/app.js:208`; Accessibility; `$impeccable harden` |
| UI-17 | Buat akun tetap tab/form langsung tampil sebagai default; belum tombol Tambah akun yang membuka dialog seperti permintaan pemilik. | Halaman pengaturan berorientasi membuat akun, bukan meninjau akun. Jadikan Daftar akun tampilan awal dengan tombol Tambah akun dan dialog yang aksesibel. | `public/app.js:301`, `public/app.js:331`; Integrity; `$impeccable layout` |
| UI-18 | Copy/label masih mendominankan “Arsip surat”, “Cari arsip surat”, dan alur surat masuk/keluar. | Arsip administrasi/arsip terdahulu tampak seperti penggunaan sampingan, padahal cakupan seluruh arsip administrasi. Samakan istilah pada navigasi, pencarian, dashboard, landing; istilah surat tetap untuk jenis surat. | `public/app.js:100`, `public/app.js:197`, `public/archive-search.js:8`; Integrity; `$impeccable clarify` |
| UI-19 | Tahun Statistik publik ditulis tetap 2026/2025. | Arsip tahun lain tidak dapat dipilih secara khusus melalui UI walaupun API menerima filter tahun. Isi tahun dari data agregat yang diizinkan dan pertahankan Semua tahun. | `public/app.js:106`; Integrity; `$impeccable harden` |
| UI-20 | Target sentuh banyak tombol 30–38px: avatar mobile 30×30, lonceng 36×36, aksi tabel sekitar 32px; teks tombol tabel 10–11px. | Sulit ditekan/dibaca di ponsel. Naikkan target praktis ke 44px dan pisahkan aksi berdekatan. Nilai <44px adalah rekomendasi kenyamanan, bukan otomatis pelanggaran WCAG AA 2.5.8 (ambang 24px + pengecualian). | Bukti rect `evidence.json`, `public/workspace.css:22`, aturan `.archive-row-actions`; Responsive; `$impeccable adapt` |
| UI-21 | Tabel mobile memerlukan geser horizontal; kolom Aksi berada jauh di kanan. Grafik memiliki min-width 500px dan pada screenshot hanya Jan–Agu terlihat sebelum digeser. | Data/aksi tampak terpotong tanpa petunjuk geser. Beri petunjuk dan label periode terlihat; prioritaskan kolom/aksi atau tampilan ringkas mobile. Ini scroll internal, bukan overflow seluruh halaman. | `public/workspace.css:63`, `public/workspace.css:286`; Responsive; `$impeccable adapt` |
| UI-22 | Dua suite regresi belum mengikuti UI: accessible-forms berhenti mengisi klasifikasi pada tab tersembunyi; metadata-history berhenti mencari #logout yang sudah dihapus. | Bukti tes lama tidak menjamin bagian setelah timeout. Perbarui navigasi tes ke tab/avatar nyata tanpa melemahkan assertion; tambahkan regresi temuan audit. | `tests/browser/accessible-forms.cjs:322`, `tests/browser/metadata-history.cjs:24`; Integrity; `$impeccable harden` |
| UI-23 | `refresh()` memuat seluruh arsip melalui /api/archives tanpa pagination untuk shell/dashboard; safeUser membawa foto base64 sehingga daftar akun juga membawa foto. | Beban respons/render bertambah mengikuti jumlah arsip/akun dan foto. Belum diukur sebagai latensi VPS. Ambil ringkasan/arsip terbaru/tugas dari query terbatas, pisahkan foto dari daftar akun, ukur sebelum/sesudah. | `public/app.js:192`, `app.mjs:80`; Performance; `$impeccable optimize` |
| UI-24 | Banyak aksi audit belum diterjemahkan; fallback hanya mengganti underscore sehingga “update profile”, “delete user”, “review quality” tampil sebagai istilah teknis. | Pengguna kantor harus menebak maknanya. Lengkapi label Indonesia dan bedakan nonaktif/hapus/simpan sesuai perilaku aktual. | `public/app.js:460`; Integrity; `$impeccable clarify` |

## Inventaris tindakan yang diaudit

Status “lulus” di tabel ini berarti skenario yang disebut sudah berjalan; bukan jaminan semua kombinasi peran/data/browser.

| Kelompok tombol | Hasil pemeriksaan |
|---|---|
| Home / Tentang / Statistik / FAQ / Masuk staf | Halaman terbuka desktop/mobile; hero desktop bermasalah (UI-01), tahun statis (UI-19). |
| Login / Tampilkan kata sandi / error login | Login dan validasi dasar lulus; suite accessible-forms mencatat checkpoint login sukses. |
| Toggle navigasi / menu halaman / pencarian | Navigasi dan pencarian/filter diuji suite; tidak ada overflow dokumen pada 390px, dashboard 320/768px. |
| Perbarui dashboard / filter tahun-bulan / kartu | Refresh tersembunyi; filter bulan dan grafik mini salah (UI-04, UI-05, UI-11). |
| Tambah arsip / Simpan / retry unggah / Batal | create-retry lulus 10 checkpoint: partial success, respons terputus, submit ganda, retry, mobile. |
| Detail / Ubah metadata / Simpan / konflik dua tab | edit-metadata dan deep-link lulus; metadata-history punya 7 checkpoint sebelum timeout selector logout. |
| Hapus arsip / Pulihkan | Tindakan hapus dan API restore teridentifikasi dari kode; UI pemulihan hilang. Tidak mengklaim tombol restore pernah diklik. |
| Unggah / Ganti berkas / lampiran / versi lama / restore versi | file-versions lulus 11 checkpoint, termasuk unduh/konflik/retry dan pembaca tanpa kontrol tulis. |
| QC / verifikasi / reload / keputusan / duplikat | archive-quality 8 dan archive-inspection 6 checkpoint lulus. |
| Disposisi / penerima / status / kronologi / reopen / CSV | dispositions 10, worklist 10, retry 7 checkpoint lulus. |
| Lonceng / baca / tandai semua / pagination / retry | notifications lulus 11 checkpoint. |
| Klasifikasi-kategori tambah/ubah/nonaktif/hapus | Tambah/ubah/hapus klasifikasi dummy diuji pada pekerjaan sebelumnya; audit ini membuktikan reset tab, kategori duplikat, master nonaktif masih dipilih, dan menemukan cacat delete PG dari kode. Tidak mengklaim seluruh aksi master PG lulus. |
| Akun buat/ubah/aktif/nonaktif/hapus | Form tambah punya checkpoint validasi; DELETE akun dummy terbukti hanya nonaktif. Seluruh mutasi kantor tidak dilakukan. |
| Avatar / profil / foto / logout | Logout topbar berhasil; foto PNG dummy 3.609.317 byte berhasil dikompres menjadi request 165.398 byte, HTTP 200. Escape/fokus/menu masih bermasalah. |
| Audit / Perbarui | Halaman terbuka dan memiliki handler; 10 baris dibatasi tanpa pagination. |
| Tautan Maps/email/media sosial | Target/href diperiksa dari kode; kepemilikan akun eksternal dan keberhasilan tujuan eksternal tidak diverifikasi. |

## Ringkasan tes

| Suite | Checkpoint PASS | Hasil akhir |
|---|---:|---|
| accessible-forms | 5 | Gagal/timeout pada tab klasifikasi tersembunyi |
| archive-search | 14 | Lulus |
| file-versions | 11 | Lulus |
| archive-quality | 8 | Lulus |
| archive-inspection | 6 | Lulus |
| dispositions | 10 | Lulus |
| disposition-worklist | 10 | Lulus |
| notifications | 11 | Lulus |
| create-retry | 10 | Lulus |
| edit-metadata | 9 | Lulus |
| archive-index | 8 | Lulus |
| metadata-history | 7 | Gagal/timeout mencari #logout |
| detail-deeplink | 4 | Lulus |
| disposition-retry | 7 | Lulus |
| **Total** | **120** | **12 suite lulus; 2 gagal/berhenti** |

Log: `/tmp/siaga-audit-<nama-suite>.log`, kecuali accessible-forms memakai `/tmp/siaga-audit-forms.log`. Perintah memakai `SIAGA_PLAYWRIGHT_MODULE=/tmp/siaga-browser-tools/node_modules/playwright`, `SIAGA_CHROMIUM_PATH=/usr/bin/chromium`. Data masing-masing suite sementara.

## Penilaian teknis Impeccable

| Dimensi | Skor / 4 | Alasan |
|---|---:|---|
| Aksesibilitas | 2 | Label input utama tersedia, tetapi fokus dialog baru/keyboard menu belum konsisten. |
| Performa | 2 | Gambar dashboard sudah diperkecil, tetapi bootstrap seluruh arsip dan foto base64 daftar belum dibatasi. |
| Responsif | 2 | Breakpoint/drawer bekerja; target sentuh dan keterlihatan aksi/grafik masih perlu adaptasi. |
| Theming | 1 | Palet konsisten secara visual, tetapi mayoritas warna didefinisikan literal dan banyak override CSS. Tidak ada janji mode gelap yang dijadikan syarat audit. |
| Integritas implementasi | 2 | Alur inti lulus banyak tes; grafik, delete, opsi nonaktif dan suite lama belum selaras. |
| **Total** | **9/20** | **Perlu perbaikan utama sebelum menyebut UI final. Skor penilaian audit, bukan hasil sertifikasi.** |

Detector statis menghasilkan 5 peringatan (border aksen, Inter, side-tab). Peringatan font Inter tidak dijadikan bug: ini pilihan desain yang disepakati. Beberapa border logo merupakan CSS lama dan bukan bukti komponen aktif bermasalah. Detector juga salah meresolusikan `/assets/app.css` ke direktori fisik assets; aplikasi memiliki pemetaan route asset, jadi ini bukan bukti stylesheet gagal dimuat. Bukti browser digunakan untuk menyaring false positive. Hasil: `/tmp/siaga-audit-detector.json`.

## Hal yang sudah baik

- Palet Bawaslu dan identitas publik/internal konsisten.
- Form utama memiliki label, validasi dan error/draft retention pada skenario yang diuji.
- File versi/lampiran, pencarian, disposisi, retry, notifikasi dan QC memiliki regresi browser yang berjalan.
- Perbaikan foto terbaru berhasil pada foto dummy 3,6 MB; klaim error ukuran sudah berkurang didukung satu uji nyata, bukan hanya pemeriksaan sintaks.
- Scroll horizontal tabel berada dalam kontainer; pemeriksaan tidak menemukan overflow seluruh dokumen di viewport yang dicatat.

## Urutan perbaikan yang disarankan

1. `$impeccable harden`: UI-02/03/06/08 — arti tindakan, persistensi master dan pemulihan arsip.
2. `$impeccable harden`: UI-04/05 — samakan grafik, angka dan filter.
3. `$impeccable layout` dan `$impeccable harden`: UI-01/07/11/16 — hero, fokus dialog, menu dan refresh.
4. `$impeccable harden` dan `$impeccable clarify`: pengaturan/tab, kategori, pagination audit, istilah dan suite tes.
5. `$impeccable adapt` dan `$impeccable optimize`: ponsel, target sentuh, tabel serta payload.
6. `$impeccable polish`: konsistensi akhir setelah bug perilaku lulus regresi.

Pekerjaan dapat dilakukan satu per satu atau sekaligus sesuai urutan dependensi. Jalankan audit ulang setelah perbaikan. Backup offsite tetap ditunda; UAT kantor/pilot/keputusan operasional tidak dianggap terlaksana oleh audit browser ini.


## Tindak lanjut perbaikan

Seluruh UI-01–UI-24 ditangani pada paket perbaikan ini. Bagian temuan di atas merupakan baseline sebelum perbaikan, bukan kondisi yang diklaim masih aktif. Bukti baru: `tests/browser/uiux-regression.cjs`, `scripts/uiux-regression-tests.mjs`, dan suite regresi terkait.

| Temuan | Implementasi |
|---|---|
| UI-01 | Ruang caption desktop/mobile tidak beririsan dengan catatan akses. |
| UI-02 | Snapshot PG menyinkronkan penghapusan master; tes hapus/read/restart dijalankan untuk JSON dan PG di CI. |
| UI-03 | Arsipkan akun terpisah dari Nonaktifkan, daftar biasa menyembunyikan akun diarsipkan, Pulihkan mempertahankan ID. |
| UI-04–05 | Seri agregat per tipe; grafik/tabel/periode mengikuti bulan yang sama. |
| UI-06 | Opsi aktif pencatatan dipisahkan dari label historis, termasuk bagi pencatat non-admin. |
| UI-07 | Profil dan dialog master mengikuti pengelola fokus/Tab/Escape yang sama. |
| UI-08 | Daftar terhapus dan Pulihkan dengan alasan, hanya admin. |
| UI-09–10 | Katalog dedup; format legacy bukan pengunci; hanya tiga kategori inti dibatasi dengan alasan jelas. |
| UI-11 | Judul, cakupan dan Perbarui dashboard terlihat. |
| UI-12–13 | Tab bertahan setelah simpan, satu seleksi, ARIA tab/panel dan keyboard panah/Home/End. |
| UI-14 | Nomor berlanjut pada halaman arsip; tabel master/akun/dashboard diberi nomor. |
| UI-15 | Pagination/filter audit server dan UI. |
| UI-16–17 | Menu avatar ditutup Escape/klik luar; buat akun melalui tombol/modal. |
| UI-18–19 | Label seluruh arsip dan tahun publik dari agregat. |
| UI-20–21 | Target mobile diperbesar, grafik fluid, petunjuk geser tabel. Toast mobile maksimal satu agar tidak menutup banyak konten. |
| UI-22 | Tes mengikuti tab, modal buat akun, avatar logout, dan query dashboard terbaru. |
| UI-23 | Transfer arsip ke shell dibatasi 10 dan foto dikeluarkan dari daftar akun. Server tetap memakai snapshot/QC seluruh cakupan; penggantian arsitektur storage dan uji beban VPS bukan klaim paket ini. |
| UI-24 | Label Indonesia untuk aksi audit yang tersedia. |

Tidak ada klaim UAT kantor, penerimaan kebijakan, backup offsite, atau peluncuran data nyata.


### Validasi paket perbaikan

- Seluruh 14 suite browser lama lulus kembali: 130 checkpoint. Suite `uiux-regression.cjs` menambah 14 checkpoint lulus; total **15 suite / 144 checkpoint browser lokal**.
- `npm run test:uiux`: 12 checkpoint JSON lokal lulus; CI mengulangi 12 skenario tersebut pada PostgreSQL sehingga penghapusan/read/restart diuji pada penyimpanan sebenarnya.
- Regresi API/model terkait, security JSON, file versi/lampiran, metadata-history, QC/integritas, indeks, disposisi/notifikasi, ekspor, migration dan UAT teknis dummy lulus lokal. Hasil PostgreSQL lengkap dan status dua workflow dilaporkan melalui GitHub Actions pada commit perbaikan.
- Screenshot hasil: `/tmp/siaga-uiux-fixed/hero-desktop.png`, `hero-mobile.png`, `dashboard-desktop.png`, `dashboard-390.png`, `dashboard-320.png`.
- Pemeriksaan ini bukan UAT kantor dengan bukti penerimaan pegawai; tidak menyatakan uji beban VPS telah dilakukan.
