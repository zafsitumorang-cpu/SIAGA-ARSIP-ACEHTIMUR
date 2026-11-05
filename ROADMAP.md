# ROADMAP — SIAGA ARSIP

**Arsip rencana awal.** Jadwal mingguan dan label selesai di bawah bukan status audit terkini atau komitmen waktu baru. Urutan yang berlaku setelah kajian dokumen asal pada 5 November 2026 ada di [TODO_MASTER.md](TODO_MASTER.md), dengan bukti pada [AUDIT_MASTER.md](AUDIT_MASTER.md).

**Target uji coba:** sekitar satu bulan lagi dari 4 November 2026 (perkiraan awal: awal Desember 2026). Jadwal perlu dikunci setelah musyawarah tentang hosting, persetujuan, dan tim.

## Minggu 1 — Validasi dan keputusan dasar
- Selesai: matriks peran/subbagian, field surat, status, dan klasifikasi demo dituangkan dalam spesifikasi.
- Selesai: template metadata dan prosedur uji dummy tersedia.
- Menunggu kantor: pemilik produk/PIC, hosting/domain, lokasi data, retensi, RPO/RTO, dan prosedur scan resmi.

## Minggu 2 — Fondasi aplikasi
- Selesai pada MVP: login, akun demo, role/subbagian, otorisasi server-side.
- Selesai pada MVP: admin dapat membuat/mengubah/mengaktifkan/menonaktifkan akun; alur `recorder` dan `uploader` dapat dipisahkan.
- Selesai pada MVP: form surat masuk/keluar dan unggah berkas privat.
- Selesai pada MVP: daftar/filter metadata, dashboard internal, dan halaman publik agregat.

## Minggu 3 — Proses dan kontrol
- Selesai pada MVP: disposisi, tiga status, histori, notifikasi in-app, ekspor CSV kompatibel Excel, dan audit.
- Selesai pada MVP: endpoint admin untuk klasifikasi/kategori serta batas unggah 15 MB.
- Selesai pada MVP: backup snapshot dan runbook pemulihan.
- Menunggu kantor: email provider, hardening deployment, OCR, antivirus, dan MFA.

## Minggu 4 — UAT dan pilot terbatas
- Selesai: 10 dummy surat masuk dan 10 dummy surat keluar dibuat otomatis.
- Selesai: UAT otomatis untuk statistik publik, pembatasan subbagian, login, disposisi, perubahan status, dan ekspor (`npm run uat`).
- Selesai: backup snapshot diverifikasi dapat dibuat.
- Menunggu kantor: UAT bersama pengguna nyata, sosialisasi formal, dan keputusan go/no-go.

## Setelah pilot
- Belum dapat dimulai: migrasi produksi 1.000 PDF dan pemindaian 300 surat membutuhkan akses data, operator, serta persetujuan.
- Siapkan pengukuran waktu temu kembali, pemakaian, tiket dukungan, dan disposisi lewat waktu saat pilot nyata.
- Kategori lanjutan sudah didaftar; pemilik data dan klasifikasi keamanan masih harus ditetapkan.
- Retensi arsip, integrasi, OCR, MFA, dan audit keamanan menjadi gate produksi.

## Risiko jadwal

Target satu bulan ketat bila persetujuan hosting, konfigurasi email, dan kebijakan keamanan terlambat. Mitigasi: demonstrasi lokal/staging dengan dummy, batasi pilot ke surat masuk/keluar, dan tandai fitur email/OCR sebagai bersyarat. Jangan memindahkan data nyata sebelum lokasi hosting serta akses disetujui.
