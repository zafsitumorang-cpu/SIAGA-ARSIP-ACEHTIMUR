# Progres fitur — urutan pemilik terbaru

Publik hanya demo dummy. Keamanan 01.2/01.3/06.x dan paket 11 ditunda: keamanan. Cek izin dasar fitur tetap berlaku. SOP, pelatihan, inventaris fisik, KPI/pilot dan penetapan PIC hanya dapat ditandai terlaksana dengan bukti kantor; pengembangan menyiapkan template/alat bantu saja.

| TODO | Implementasi/tes | Commit dan bukti pengiriman | Risiko/asumsi |
|---|---|---|---|
| 01.1 | Selesai; keamanan 187, database 8, browser retry 10, regresi/CI lulus | 1716aa1; CI 42000447214; aset demo terverifikasi | Draft/kunci per dialog, bukan lintas reload |
| 02.1 | Model read-only dan kontrak FILE_MODEL; 11 tes model | Diisi setelah commit/CI/demo terverifikasi | Aktor/tanggal legacy null; JSONB kompatibel tanpa migrasi massal |
