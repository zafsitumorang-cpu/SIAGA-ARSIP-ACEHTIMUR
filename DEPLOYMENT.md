# Deployment SIAGA ARSIP

## Pilot

Jalankan langsung dengan Node.js 20+:

```bash
npm start
```

Atau gunakan Docker:

```bash
docker build -t siaga-arsip .
docker run --rm -p 3000:3000 -v siaga-arsip-data:/app/data siaga-arsip
```

Gunakan volume persisten untuk `data/`. Jangan menjalankan pilot dengan data produksi sebelum TLS, secret management, backup terenkripsi, dan kontrol akses disetujui.

## Produksi

Pilih layanan terkelola yang disetujui Bawaslu/pejabat TI. Konfigurasikan domain HTTPS, volume data privat, backup di lokasi terpisah, monitoring, rotasi kredensial, dan pembatasan akses admin. Untuk skala dan tata kelola produksi, migrasikan penyimpanan JSON MVP ke PostgreSQL dan object storage privat sesuai `ARCHITECTURE.md`.

## Health check

`GET /api/public/stats` dapat digunakan sebagai pemeriksaan dasar bahwa aplikasi merespons. Endpoint ini hanya mengembalikan angka agregat.
