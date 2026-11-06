# Deployment SIAGA ARSIP

## Pilot

Jalankan demo langsung dengan Node.js 22+ (disarankan 24 LTS):

```bash
npm ci
npm start
```

Atau gunakan Docker:

```bash
docker build -t siaga-arsip .
docker run --rm -p 3000:3000 -v siaga-arsip-data:/app/data siaga-arsip
```

Gunakan volume persisten untuk `data/`. Jangan menjalankan pilot dengan data produksi sebelum TLS, secret management, backup terenkripsi, dan kontrol akses disetujui.

## Produksi

Ikuti [runbook VPS](deploy/README.md) untuk PostgreSQL, bootstrap admin, environment produksi, systemd dan Caddy. Domain pengguna: `siaga-arsipbawasluacehtimur.web.id`; pengguna melaporkan Caddy dan timer backup lokal sudah berjalan di VPS, sehingga gunakan konfigurasi aktif dan verifikasi hasilnya. [Contoh blok Caddy](deploy/Caddyfile.example) adalah referensi untuk digabungkan secara hati-hati dengan konfigurasi aktif, bukan instruksi menimpa seluruh Caddyfile. Contoh Nginx tetap tersedia sebagai alternatif instalasi. Set DEMO_MODE=false secara eksplisit; Dockerfile default masih menyalakan demo Railway. Produksi menolak startup tanpa DATABASE_URL dan APP_ORIGIN HTTPS. Simpan berkas privat di direktori data persisten; port aplikasi/database hanya lokal. Backup offsite, enkripsi, monitoring, dan akses admin terkontrol tetap harus diselesaikan sebelum arsip nyata. Contoh konfigurasi belum dipasang di VPS pengguna oleh agent.

## Health check

`GET /api/health` mengembalikan `{ "ok": true }` setelah akses database berhasil. Ini bukan pemeriksaan kapasitas disk, integritas file atau backup. `GET /api/config` hanya menunjukkan mode demo; statistik publik tetap agregat.
