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

02.2 menyediakan writer/UI riwayat dan download lama berizin. Writer mencatat pengunggah/waktu/alasan, menjaga cermin flat, dan memakai expectedVersionId untuk mencegah penimpaan tab usang. Penggunaan versi lama membuat binary/versi baru dengan sourceVersionId. 02.3 mengaktifkan lampiran independen. 02.4 menangani staging/commit binary dan rekonsiliasi. Masing-masing memiliki tes, commit dan gerbang CI/demo terpisah. Rilis memberikan header publik X-SIAGA-Revision berisi SHA checkout (unknown bila HEAD tidak tersedia), tanpa akun/data, untuk membuktikan pemasangan setiap langkah tanpa login demo.

Pada 02.3, form Tambah lampiran dan version writer memakai documentId independen; primary/lampiran lain tetap utuh. Placeholder primary tetap tersedia bila lampiran masuk terlebih dahulu. Normalisasi rollback tidak mewariskan fileUploadedBy/At lama kepada file flat baru yang belum dikenal canonical model; provenance file itu tetap unknown. Ini mencegah penebakan aktor/waktu ketika writer rilis lama tidak mengenal metadata versi baru.

## Batas aplikasi dan pekerjaan kantor

Fitur tidak membuktikan scan telah benar, surat sudah sah, SOP disahkan, operator dilatih atau inventaris fisik selesai. Status QC dan template akan disediakan pada paket terkait; bukti pelaksanaan tetap dari kantor. Pengembangan/rilis publik hanya menggunakan dummy sampai keamanan/operasional diperkuat. 01.2, 01.3, 06.x dan 11 tetap ditunda: keamanan; izin dasar untuk arsip/versi/lampiran tetap diperiksa.

## Bukti

`npm run test:files` menguji 11 skenario: metadata tanpa file, legacy/histori, ID/nomor stabil, provenance unknown, nonmutasi sumber, scan/final, deduplikasi referensi, provenance tercatat, lampiran independen, enumerasi referensi campuran, rollback writer, serta referensi invalid untuk integrity check. Tes regresi dasar dan pemeriksaan JSON/PostgreSQL tetap dijalankan di Application checks sebelum demo diperbarui.

## 02.4 — publikasi binary dan kegagalan transaksi

Upload menulis berkas staging mode 0600 pada direktori yang sama, melakukan fsync, lalu hard-link ke ID final dengan jaminan tidak menimpa ID lain. Direktori disinkronkan sebelum metadata dipublikasikan. Transaksi yang pasti gagal sebelum publikasi metadata membersihkan hanya inode binary baru miliknya; versi lama tidak disentuh. Snapshot/backup yang sudah ada mengabaikan nama staging internal. Tidak ada layanan backup/offsite baru.

Jika respons COMMIT PostgreSQL atau rename JSON hilang, hasil transaksi dapat ambigu. Binary dipertahankan: menghapusnya dapat merusak metadata yang ternyata telah committed. Retry menggunakan receipt 01.1; kegagalan tidak mengembalikan respons sukses sebelum transaksi selesai. Proses mati dapat menyisakan staging/binary tak direferensikan, bukan versi aktif yang dipalsukan.

`DATA_DIR=... DATABASE_URL=... npm run files:check` adalah laporan read-only di bawah lock transaksi: referensi hilang/tidak valid, kandidat yatim/staging berumur minimal 24 jam, binary baru dan entri tak lazim. Symlink tidak diikuti. Umur hanya kandidat peninjauan, bukan bukti aman dihapus. Tidak ada opsi delete, timer cleanup, atau perubahan data demo/produksi. Rekonsiliasi operasional memerlukan pemeriksaan snapshot/aktivitas oleh PIC; jangan menjalankan penghapusan berdasarkan laporan ini saja.

Bukti: `npm run test:file-io` menguji gagal tulis, collision, callback/save failure JSON/PG, respons publikasi hilang setelah commit nyata, konkurensi, dan laporan tanpa mutasi.

## 04.1 — verifikasi dan versi berkas

`qualityReviews[]` menyimpan keputusan append-only, token snapshot, metadataVersion dan pasangan documentId/fileId yang diperiksa. Token berubah saat versi metadata atau currentVersionId dokumen berubah, termasuk lampiran baru. Review version mencegah dua reviewer saling menimpa. Data legacy tanpa review tidak mendapat persetujuan buatan. Approval lama tidak mengalahkan file fisik yang hilang. Tidak ada pemindahan/penulisan ulang binary atau perluasan format. Hash snapshot bukan pemeriksaan isi binary berkelanjutan; QC/checksum rinci tetap 04.3.
