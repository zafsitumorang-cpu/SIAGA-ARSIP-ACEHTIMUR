# Pemeriksaan browser lokal

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
