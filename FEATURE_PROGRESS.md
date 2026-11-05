# Progres fitur — urutan pemilik terbaru

Publik hanya demo dummy. Keamanan 01.2/01.3/06.x dan paket 11 ditunda: keamanan. Cek izin dasar fitur tetap berlaku. SOP, pelatihan, inventaris fisik, KPI/pilot dan penetapan PIC hanya dapat ditandai terlaksana dengan bukti kantor; pengembangan menyiapkan template/alat bantu saja.

| TODO | Implementasi/tes | Commit dan bukti pengiriman | Risiko/asumsi |
|---|---|---|---|
| 01.1 | Selesai; keamanan 187, database 8, browser retry 10, regresi/CI lulus | 1716aa1; CI 42000447214; aset demo terverifikasi | Draft/kunci per dialog, bukan lintas reload |
| 02.1 | Model read-only dan kontrak FILE_MODEL; 11 tes model | 3477ffc + 7497e68; CI 42004681809/42005660638 success; SHA demo cocok, health 200 | Aktor/tanggal legacy null; JSONB kompatibel tanpa migrasi massal |
| 02.2 | Writer/UI riwayat, download lama dan restore baru; API 26, browser 8, keamanan 187 | 1b1ca44; CI 42007461751 success; SHA demo cocok, health 200 | Versi legacy dapat belum tersedia fisik; staging binary/DB tetap 02.4 |
| 02.3 | Lampiran A/B terpisah, replacement/restore/retry; model 12, API 52, browser 11 | 718b585; CI 42009860684 success; SHA demo cocok, health 200 | Primary tetap terpisah; quality scan bukan otomatis terverifikasi |
| 02.4 | Staging/fsync/no-overwrite, rollback terarah, rekonsiliasi read-only; I/O 17 | 039a722; CI 42011155524 success; SHA demo cocok, health 200 | Hasil commit ambigu mempertahankan binary; kandidat yatim perlu tinjauan PIC, tidak auto-delete |
| 03.1 | Penerima aktif orang/tim, prioritas individu, scope/notifikasi; API 24, browser 6 | 9ccb714; CI 42012507727 success; SHA demo cocok, health 200 | Aturan konservatif sementara FEATURE_ASSUMPTIONS; pengesahan kantor belum dilakukan |
| 03.2 | Kronologi di detail/daftar, catatan dan reopen; API 38, browser 10, regresi 187 keamanan/44 browser | 47daa3d; CI 42013213602 success; SHA demo cocok, health 200 | Default transisi tercatat; nama akun label saat dibaca, ID/waktu event tidak diubah |
| 03.3 | Receipt create/update, CAS/event ID, draft/reload dan respons lambat; API 54, browser retry 7 + disposisi 10 | Menunggu commit/CI/demo | PATCH status wajib expectedVersion; tab lama perlu reload. Key/draft per dialog |
