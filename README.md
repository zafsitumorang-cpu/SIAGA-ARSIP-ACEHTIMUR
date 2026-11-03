# SIAGA ARSIP — Dokumen Kebutuhan Sistem

Kumpulan ini berisi rancangan awal sistem tata kelola arsip digital untuk Bawaslu Kabupaten Aceh Timur. Rancangan disusun dari laporan aksi perubahan dan hasil wawancara kebutuhan awal.

## Menjalankan MVP uji coba

MVP runnable tersedia di `app.mjs` dan memakai Node.js 20+ tanpa dependensi eksternal. Data uji disimpan lokal di `data/data.json` dan dibuat otomatis saat pertama dijalankan.

```bash
npm start
```

Buka `http://localhost:3000`. Akun demo: `admin` / `admin123`, `pimpinan` / `pimpinan123`, atau `pegawai.administrasi` / `pegawai123`. Data demo berisi 10 surat masuk dan 10 surat keluar. Untuk produksi, pindahkan penyimpanan ke database relasional dan object storage privat sesuai `ARCHITECTURE.md`.

Skenario uji dan daftar akun lengkap tersedia di [MVP_TESTING.md](MVP_TESTING.md).

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

- Surat masuk dan surat keluar.
- Disposisi dan status: Belum ditindaklanjuti, Sedang diproses, Selesai.
- Pegawai melihat satu subbagian; pimpinan dan admin lintas subbagian.
- Publik hanya melihat angka agregat masuk/keluar per tahun.
- Estimasi migrasi: 1.000 PDF Drive + 300 surat fisik dipindai = sekitar 1.300 arsip.
- Demo: 10 contoh dummy tiap jenis; jangan gunakan data nyata untuk demo.

## Keputusan penting yang belum final

Hosting/domain/lokasi data, biaya, klasifikasi awal, retensi/pemusnahan, MFA, batas file, RPO/RTO, email, dan OCR. Jangan memasukkan arsip produksi sebelum lokasi penyimpanan dan pengendalian akses disetujui.

## Cara menggunakan dokumen

Ini adalah draf spesifikasi, bukan keputusan kebijakan final. Pemilik produk perlu memvalidasi setiap keputusan terbuka pada [DECISIONS.md](DECISIONS.md), lalu memperbarui dokumen terkait. Perubahan kategori arsip perlu meninjau ulang metadata, akses, alur, API, dan retensi bersama-sama.
