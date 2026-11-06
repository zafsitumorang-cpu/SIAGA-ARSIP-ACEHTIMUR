# Pemeriksaan browser lokal

`uiux-regression.cjs` menjalankan regresi audit UI pada loopback 3578 dengan data sementara: hero desktop/mobile, refresh terlihat, filter bulan, menu/avatar/dialog keyboard, modal tambah akun, tab setelah simpan, pilihan master aktif, nomor halaman, pemulihan arsip, pagination audit, grafik 320/390px dan tahun publik arsip lama. `SIAGA_UIUX_SCREENSHOTS=/tmp/siaga-uiux-fixed` opsional untuk screenshot. `npm run test:uiux` menguji kontrak API terkait pada JSON serta PostgreSQL lokal jika PG_TEST_URL tersedia; CI menjalankan keduanya. Akun/data kantor tidak digunakan.

`edit-metadata.cjs` menjalankan server demo dengan DATA_DIR sementara dan binding loopback 3505, menunggu proses itu sendiri siap, lalu menguji edit admin, teks HTML yang di-escape, pencegahan submit ganda, detail, konflik dua tab/reload, validasi field tipe surat, kegagalan simpan, pembatasan disposisi, mobile dan role pegawai. Server/data sementara dibersihkan setelah tes. Tidak mengakses domain atau credential produksi.

Gunakan Playwright yang sudah tersedia pada lingkungan pengembangan atau pasang pada direktori alat terpisah; bukan dependensi produksi. Contoh:

```bash
npm install --prefix /tmp/siaga-browser-tools playwright
/tmp/siaga-browser-tools/node_modules/.bin/playwright install chromium
SIAGA_PLAYWRIGHT_MODULE=/tmp/siaga-browser-tools/node_modules/playwright node tests/browser/edit-metadata.cjs
```

`SIAGA_CHROMIUM_PATH` opsional untuk executable browser yang sudah terpasang. `SIAGA_SCREENSHOT` opsional untuk output screenshot mobile. Gunakan proxy dan CA lingkungan sesuai kebijakan runtime bila pemasangan browser memerlukan jaringan; jangan menonaktifkan TLS. Tes menggunakan data dummy dan HTTP loopback, bukan probe/mutasi produksi.

`archive-search.cjs` memakai konfigurasi Playwright yang sama dan server sementara pada loopback 3506. Jalankan dengan mengganti nama skrip pada contoh di atas. Tes meliputi pagination, kombinasi filter/CSV, unduh XLSX seluruh halaman maupun hasil filter (dibaca dengan library terpisah), disposisi Selesai, metadata di hasil filter, dashboard tetap utuh, tanggal tidak valid, hasil kosong, retry, navigasi saat request lambat, mobile dan scope pegawai. Tes membutuhkan devDependencies (`npm ci`). `npm run test:query` menguji batas/urutan halaman pada 1.300 rekaman sintetis; `npm run test:export` menguji serializer dan round trip 1.300 arsip melalui reader XLSX independen. Ini bukan uji beban VPS atau bukti kinerja SQL.

`create-retry.cjs` memakai konfigurasi Playwright yang sama pada loopback 3507 dan DATA_DIR sementara. Jalankan dengan mengganti nama skrip pada contoh di atas. Sepuluh pemeriksaan mencakup sukses metadata/gagal unggah lalu retry, respons sukses create/upload yang sengaja diputus, submit ganda, validasi/koreksi, penggantian file invalid, tutup sukses parsial/Escape, HP, kegagalan refresh setelah simpan dan peran pencatat. Request yang diputus hanya menuju server fixture lokal. Tes tidak memakai credential atau data produksi; proses dan fixture dibersihkan saat selesai. Screenshot mobile opsional melalui SIAGA_SCREENSHOT.

`file-versions.cjs` memakai loopback 3508 dengan fixture sementara: 8 skenario upload/provenance, ganti dan unduh versi lama, restore sebagai revisi baru, respons terputus/retry, konflik tab dengan draft, HP/keyboard, pembaca tanpa kontrol tulis dan error JavaScript. Gunakan variabel Playwright yang sama. `npm run test:versions` menguji endpoint/binary/izin/restart pada JSON dan PostgreSQL lokal; tidak mengakses atau memutasi domain publik.

Pembaruan 02.3 memperluas file-versions menjadi 11 skenario browser termasuk lampiran A/B, pembuatan terputus/retry dan penggantian independen. Suite API menjadi 52 pemeriksaan JSON/PostgreSQL, termasuk lampiran-sebelum-primary, restore independen dan isolasi idempotensi per dokumen. Model mendapat regresi provenance rollback (total 12).

`dispositions.cjs` memakai loopback 3509, 6 skenario pilihan penerima orang/tim aktif/scoped, save, gagal muat/retry, HP/keyboard, rekan bukan penerima tanpa editor dan error JavaScript. Fixture dan akun hanya lokal/sementara. Konfigurasi Playwright sama dengan contoh di atas.

03.2 memperluas dispositions menjadi 10 skenario, termasuk kronologi/catatan aman, alasan reopen, histori selesai yang dipertahankan dan detail arsip. API `test:dispositions` kini 38 pemeriksaan JSON/PostgreSQL. Perubahan status cepat yang maju tetap tersedia; reset/reopen memakai form catatan kronologi.

`disposition-retry.cjs` memakai loopback 3510: 7 skenario double-submit, respons sukses create/update yang diputus, konflik dua tab, reload mempertahankan draft, dropdown pulih setelah 503, respons status terlambat setelah navigasi dan error JavaScript. Fault hanya disuntikkan ke server fixture sendiri. API disposisi menjadi 54 pemeriksaan JSON/PostgreSQL, termasuk versi wajib dan replay setelah restart. Kunci/draft tetap per dialog, bukan lintas reload.

`disposition-worklist.cjs` memakai loopback 3511: 10 skenario ringkasan, pagination, CSV lintas halaman, detail dengan posisi daftar dipertahankan, filter gabungan, kosong/reset, gagal/retry, lebar 360px, scope pegawai dan error JS. API `test:dispositions` kini 76 pemeriksaan. Skenario pegawai baca-saja pada dispositions.cjs kini memilih filter semua dalam cakupan baca; default daftar pegawai menampilkan tugas sendiri/tim.

`notifications.cjs` memakai loopback 3512: 11 skenario counter unread/tugas aktif, baca/unread per pengguna, read-all/reload, klik kronologi scoped, event status, error/retry baca dan daftar, 360px/Escape, pagination/read-all dan error JS. Semua akun/data fixture lokal. `npm run test:notifications` menguji 29 kasus model/JSON/PostgreSQL, termasuk persistensi restart dan akses setelah pindah subbagian. Pengujian browser lain tetap memakai API dan versi data aktual.

`archive-quality.cjs` memakai loopback 3513: 8 skenario antrean/status terpisah dari disposisi, konfirmasi/provenance/filter, retry, konflik metadata/draft/reload, koreksi, uploader baca-saja di 360px dan error JS. `test:quality` memuat 37 model/JSON/PG termasuk file/lampiran hilang dan restart. Akun/data fixture lokal sementara.

`archive-index.cjs` memakai loopback 3534: 8 skenario sumber/agenda/kode tambah/edit, validasi locator, indeks tetap/pencarian/detail aman, referensi Drive tanpa network fetch, CSV/XLSX, nama unduh terstruktur, 360px/keyboard dan error JS. `test:index` memakai port 3526/3527 dan menguji 28 model/JSON/PG termasuk fingerprint create legacy. Fixture sementara, tanpa akses sumber/arsip produksi.

`detail-deeplink.cjs` memakai loopback 3542: URL hash detail menyimpan halaman dan ukuran halaman, penutupan detail mengembalikan konteks daftar, dan deep-link terautentikasi membuka detail yang sama tanpa endpoint publik. Fixture sementara dan sesi login demo dibersihkan setelah tes.

`archive-inspection.cjs` memakai loopback 3535: 6 skenario checklist/hash/kandidat, acceptance/alasan duplikat, bukti QC, binary rusak yang menolak approval, mobile/keyboard dan arsip tidak dihapus/error JS. `test:inspection` memakai 3528/3529 dan mencakup 26 JSON/PG. Port archive-index dipindah ke 3534 agar tidak bertabrakan dengan test:versions 3514/3515 saat suite paralel. Fixture API approval lama mengirim checklist baru tanpa melemahkan assertion; replay receipt lama diuji tersendiri.

`metadata-history.cjs` memakai loopback 3536 dan DATA_DIR sementara: ringkasan koreksi tanpa nilai lama/baru, no-op, pembaca scoped tanpa edit, dua tab/draft, pembatasan disposisi, mobile/keyboard, histori legacy tidak direkayasa dan respons setelah logout. Screenshot bukti desktop/mobile disimpan di /tmp/siaga-044-{desktop,mobile}.png. `test:metadata-history` memakai 3530/3531, 28 pemeriksaan JSON/PostgreSQL. Tidak ada login, mutasi atau pengambilan arsip dari demo publik.
