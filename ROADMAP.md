# ROADMAP — SIAGA ARSIP

**Target uji coba:** sekitar satu bulan lagi dari 4 November 2026 (perkiraan awal: awal Desember 2026). Jadwal perlu dikunci setelah musyawarah tentang hosting, persetujuan, dan tim.

## Minggu 1 — Validasi dan keputusan dasar
- Tetapkan pemilik produk, admin, pencatat, pengunggah, pimpinan reviewer.
- Validasi matriks peran/subbagian, field surat, status, klasifikasi awal.
- Putuskan hosting/domain, kebijakan data, lokasi penyimpanan, batas file, backup, RPO/RTO.
- Buat daftar migrasi dan template metadata; sepakati prosedur scan.

## Minggu 2 — Fondasi aplikasi
- Bangun login, akun, role/subbagian dan otorisasi server-side.
- Bangun form surat masuk/keluar dan penyimpanan berkas privat.
- Bangun daftar, filter metadata dan detail arsip.
- Siapkan dashboard internal dan halaman publik agregat.

## Minggu 3 — Proses dan kontrol
- Bangun disposisi, status, histori, notifikasi aplikasi.
- Tambahkan ekspor Excel, audit, klasifikasi admin.
- Konfigurasi email bila kredensial/layanan tersedia.
- Terapkan backup, restore runbook, dan hardening dasar.
- Evaluasi OCR untuk PDF; jangan menjadikannya blocker bila kualitas/biaya belum diputuskan.

## Minggu 4 — UAT dan pilot terbatas
- Masukkan 10 dummy surat masuk dan 10 dummy surat keluar.
- Jalankan UAT akses lintas subbagian, pencarian, unduh, ekspor, disposisi, dan statistik publik.
- Perbaiki temuan kritis; verifikasi backup dan pemulihan sampel.
- Sosialisasi pengguna, dokumentasi singkat, keputusan go/no-go.

## Setelah pilot
- Siapkan migrasi produksi 1.000 PDF dan pemindaian 300 surat dengan pemeriksaan metadata/file.
- Pantau kualitas, waktu temu kembali, pemakaian, tiket dukungan, dan disposisi lewat waktu.
- Prioritaskan kategori lanjutan setelah pemilik data dan akses keamanan disetujui.
- Tinjau retensi arsip, integrasi, OCR, MFA, dan audit keamanan.

## Risiko jadwal

Target satu bulan ketat bila persetujuan hosting, konfigurasi email, dan kebijakan keamanan terlambat. Mitigasi: demonstrasi lokal/staging dengan dummy, batasi pilot ke surat masuk/keluar, dan tandai fitur email/OCR sebagai bersyarat. Jangan memindahkan data nyata sebelum lokasi hosting serta akses disetujui.
