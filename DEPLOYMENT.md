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

Ikuti [runbook VPS](deploy/README.md) untuk PostgreSQL, bootstrap admin, environment produksi, systemd dan contoh Nginx. Set DEMO_MODE=false secara eksplisit; Dockerfile default masih menyalakan demo Railway. Produksi menolak startup tanpa DATABASE_URL dan APP_ORIGIN HTTPS. Simpan berkas privat di direktori data persisten; port aplikasi/database hanya lokal. Konfigurasikan HTTPS, backup terenkripsi di lokasi terpisah, monitoring dan akses admin sebelum arsip nyata. Contoh konfigurasi belum dipasang di VPS pengguna.

## Health check

`GET /api/health` mengembalikan `{ "ok": true }` setelah akses database berhasil. Ini bukan pemeriksaan kapasitas disk, integritas file atau backup. `GET /api/config` hanya menunjukkan mode demo; statistik publik tetap agregat.
