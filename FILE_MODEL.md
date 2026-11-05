# Model dokumen, versi dan lampiran

TODO 02.1, 5 November 2026, WIB. Dasar RA hlm. 9–11: penataan, penamaan, digitalisasi, penyimpanan/pengendalian arsip; fitur detail berasal dari FR-05/06/07 dan TODO 02. Dokumen ini menetapkan asumsi implementasi yang dapat diubah, bukan keputusan tata kelola kantor.

## Bentuk data

Satu arsip memiliki `documents[]`. Setiap dokumen memiliki `id` stabil dalam arsip, `kind` (`primary` atau `attachment`), `title`, `purpose` (`scan`, `final`, `attachment`), `currentVersionId` dan `versions[]`. Primary default `document_primary`; lampiran mendapat ID tersendiri. Identitas lampiran A berbeda dari B; penggantian A menambah versi pada A.

Setiap versi menyimpan `id`/`fileId` (ID binary acak), `number` (1,2,... dalam dokumen), `fileName`, `mime`, `size`, `checksum`, `uploadedBy`, `uploadedAt`, `reason` dan `legacy`. Binary bersifat immutable. Penggantian membuat ID/versi baru dan mengubah currentVersionId; tidak menulis ulang versi lama. Primary masuk bertujuan scan; primary keluar bertujuan berkas final. Label final bukan bukti pengesahan/QC manusia.

Asumsi awal: satu primary per surat dan nol/beberapa lampiran. Alasan penggantian ditawarkan/dicatat pada UI baru; klien lama dan data lama boleh memiliki reason null. Aktor/tanggal yang tidak pernah dicatat tetap null dengan penjelasan tidak diketahui; tidak diisi menggunakan pencatat/tanggal surat secara spekulatif. Nomor versi legacy mengikuti urutan referensi lama, bukan bukti tanggal unggah.

## Kompatibilitas tanpa migrasi massal

`archiveDocuments()` menghasilkan salinan read-only, tanpa mengubah input/database. `fileVersions[]` lama menjadi versi primary terdahulu, lalu fileId aktif menjadi versi terakhir; ID berulang tidak menggandakan versi. Data `documents[]` yang sudah baru tetap dipertahankan. Bila writer versi lama menambah fileId flat setelah rollback, reader menyatukannya ke primary dan mempertahankan lampiran.

Field flat fileId/fileName/fileMime/fileSize/fileChecksum tetap menjadi cermin primary aktif untuk klien lama. Writer baru akan menjaga cermin ini ketika 02.2 diimplementasikan; lampiran tidak mengambil alih cermin primary. Payload API arsip menambahkan view documents; izin arsip tetap berlaku. Tidak ada perubahan db/schema.sql: model bertahap memakai JSONB yang sudah ada.

`archiveFileIds()` menghimpun referensi flat, histori dan seluruh versi lampiran untuk pemeriksaan integritas yang sudah ada. Ini menjaga kompatibilitas job backup lokal setelah format berkembang; tidak memasang backup/offsite/restore baru. Referensi legacy tidak valid tidak dipromosikan menjadi URL download, tetapi tetap dipertahankan dalam daftar pemeriksaan agar tidak disembunyikan sebagai backup lengkap.

02.2 menambahkan writer/UI riwayat dan download lama berizin. 02.3 mengaktifkan lampiran independen. 02.4 menangani staging/commit binary dan rekonsiliasi. Masing-masing memiliki tes, commit dan gerbang CI/demo terpisah. Rilis memberikan header publik X-SIAGA-Revision berisi SHA checkout (unknown bila Git tidak tersedia), tanpa akun/data, untuk membuktikan pemasangan setiap langkah tanpa login demo.

## Batas aplikasi dan pekerjaan kantor

Fitur tidak membuktikan scan telah benar, surat sudah sah, SOP disahkan, operator dilatih atau inventaris fisik selesai. Status QC dan template akan disediakan pada paket terkait; bukti pelaksanaan tetap dari kantor. Pengembangan/rilis publik hanya menggunakan dummy sampai keamanan/operasional diperkuat. 01.2, 01.3, 06.x dan 11 tetap ditunda: keamanan; izin dasar untuk arsip/versi/lampiran tetap diperiksa.

## Bukti

`npm run test:files` menguji 11 skenario: metadata tanpa file, legacy/histori, ID/nomor stabil, provenance unknown, nonmutasi sumber, scan/final, deduplikasi referensi, provenance tercatat, lampiran independen, enumerasi referensi campuran, rollback writer, serta referensi invalid untuk integrity check. Tes regresi dasar dan pemeriksaan JSON/PostgreSQL tetap dijalankan di Application checks sebelum demo diperbarui.
