# SIAGA ARSIP — Dokumen Kebutuhan Sistem

**Mulai dari rencana terbaru:** [AUDIT_MASTER.md](AUDIT_MASTER.md) membandingkan dokumen asal 25 halaman, seluruh Markdown, kode dan bukti pengujian per 5 November 2026. [TODO_MASTER.md](TODO_MASTER.md) adalah daftar pekerjaan berurutan sampai pilot operasional; [TASKS.md](TASKS.md) menjadi indeks ringkas. Bagian rancangan awal di bawah dibaca bersama status terbaru tersebut.

Kumpulan ini berisi rancangan awal sistem tata kelola arsip digital untuk Bawaslu Kabupaten Aceh Timur. Rancangan disusun dari laporan aksi perubahan dan hasil wawancara kebutuhan awal.

## Menjalankan MVP uji coba

Implementasi tersedia di `app.mjs` dengan Node.js 22+ (disarankan 24 LTS), frontend JavaScript/CSS, serta dependensi produksi `pg`, `file-type` dan `write-excel-file`. Ini bukan aplikasi Laravel. Mode demo menyimpan data lokal di `data/data.json` dan membuat data dummy saat database belum ada; mode produksi memerlukan PostgreSQL dan tidak membuat akun demo.

```bash
npm ci
npm start
```

Buka `http://localhost:3000`. Akun demo: `admin` / `admin123`, `pimpinan` / `pimpinan123`, atau `pegawai.administrasi` / `pegawai123`. Seed demo berisi 10 surat masuk dan 10 surat keluar; form juga menyediakan tipe arsip administrasi umum dan registri kategori 00.3. Jangan memakai akun atau data demo untuk arsip nyata. Mode produksi, migrasi PostgreSQL dan bootstrap admin dijelaskan di [deploy/README.md](deploy/README.md).

Skenario uji dan daftar akun lengkap tersedia di [MVP_TESTING.md](MVP_TESTING.md). Admin dapat membuat akun `recorder`, `uploader`, atau pegawai dari menu Pengaturan dan menetapkan satu subbagian.

Backup lokal tersedia melalui `npm run backup`, UAT otomatis melalui `npm run uat`, dan panduan deployment ada di [DEPLOYMENT.md](DEPLOYMENT.md).

## Status pengembangan menuju produksi

Paket 5 November 2026 memperkuat scope subbagian, autentikasi/sesi, validasi unggah, transaksi PostgreSQL, impor terkendali dan backup dengan manifest. GitHub Actions menjalankan UAT serta regresi keamanan/database/migrasi. Operator kini melaporkan migrasi VPS selesai; HTTPS, health/config produksi dan aset baru telah diperiksa dari luar, lihat [status deployment](deploy/STATUS.md). Ini belum menyatakan siap peluncuran arsip nyata: backup offsite, uji pemulihan menyeluruh, UAT dan penerimaan fitur masih perlu diselesaikan. Lihat [LAUNCH_READINESS.md](LAUNCH_READINESS.md) dan [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md).

## Mulai membaca

1. [PRD.md](PRD.md) — tujuan, cakupan, pengguna, ukuran keberhasilan.
2. [REQUIREMENTS.md](REQUIREMENTS.md) — kebutuhan fungsional/nonfungsional dan penerimaan.
3. [USER_FLOW.md](USER_FLOW.md) — alur pengguna.
4. [DESIGN.md](DESIGN.md) — struktur layar dan interaksi.
5. [BUSINESS_RULES.md](BUSINESS_RULES.md) — aturan akses dan proses.
6. [DATABASE.md](DATABASE.md) dan [API.md](API.md) — kontrak data dan layanan.
7. [SECURITY.md](SECURITY.md) dan [ARCHITECTURE.md](ARCHITECTURE.md) — kontrol dan rancangan teknis.
8. [FEATURES.md](FEATURES.md), [ROADMAP.md](ROADMAP.md), [DECISIONS.md](DECISIONS.md), [TASKS.md](TASKS.md) — prioritas, keputusan, dan pekerjaan.

## Tahap pertama

- Seluruh arsip administrasi dengan alur surat masuk/keluar yang paling lengkap dan metadata umum untuk arsip administrasi lainnya.
- Disposisi dan status: Belum ditindaklanjuti, Sedang diproses, Selesai.
- Alur terpisah: pencatat menyimpan metadata, pengunggah menambahkan berkas privat.
- Pegawai melihat satu subbagian; pimpinan dan admin lintas subbagian.
- Publik hanya melihat angka agregat masuk/keluar per tahun.
- Estimasi migrasi: 1.000 PDF Drive + 300 surat fisik dipindai = sekitar 1.300 arsip.
- Demo: 10 contoh dummy tiap jenis; jangan gunakan data nyata untuk demo.

## Keputusan penting yang belum final

Hosting/domain/lokasi data, biaya, klasifikasi awal, retensi/pemusnahan, MFA, batas file, RPO/RTO, email, dan OCR. Jangan memasukkan arsip produksi sebelum lokasi penyimpanan dan pengendalian akses disetujui.

## Cara menggunakan dokumen

Ini adalah draf spesifikasi, bukan keputusan kebijakan final. Pemilik produk perlu memvalidasi setiap keputusan terbuka pada [DECISIONS.md](DECISIONS.md), lalu memperbarui dokumen terkait. Perubahan kategori arsip perlu meninjau ulang metadata, akses, alur, API, dan retensi bersama-sama.
