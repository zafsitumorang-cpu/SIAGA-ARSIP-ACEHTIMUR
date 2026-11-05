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
