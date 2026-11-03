# ARCHITECTURE — SIAGA ARSIP

## Rekomendasi awal

Gunakan aplikasi web modular (awal: modular monolith) dengan API backend, basis data relasional, object storage privat untuk dokumen, dan worker terpisah untuk OCR/email. Pendekatan ini cukup sederhana untuk pilot sekitar 1.300 rekaman, namun menjaga batas modul untuk perluasan. Vendor dan bahasa/framework belum dipilih.

## Komponen

- **Web UI:** halaman publik statistik dan area internal terautentikasi.
- **API aplikasi:** auth, RBAC, scope subbagian, arsip, disposisi, ekspor, admin, audit.
- **Database relasional:** metadata, akun, klasifikasi, kategori, disposisi, notifikasi, audit.
- **Object storage privat:** dokumen asli dan hasil pindai, checksum dan metadata file.
- **Background worker:** antivirus/karantina bila tersedia, OCR dan indexing, email, tugas backup/rekonsiliasi.
- **Email provider:** SMTP/layanan email untuk notifikasi (belum diputuskan).
- **Observability:** log teknis terpisah dari audit bisnis, metrik kesehatan, alarm backup.

## Aliran

1. Browser mengirim request melalui HTTPS.
2. API memverifikasi identitas, peran, dan subbagian sebelum query atau akses file.
3. Metadata disimpan di database; binary file masuk ke object storage privat.
4. API memberi download melalui stream atau URL bertanda tangan berdurasi pendek setelah pemeriksaan izin.
5. Worker mengambil job dari antrean untuk OCR/email tanpa menahan request pengguna.
6. Endpoint publik membaca view/query agregat yang tidak mengandung detail arsip.

## Deploy yang disarankan

Untuk akses luar kantor dan data arsip, pilih hosting terkelola yang disetujui organisasi, dengan TLS, database terkelola atau backup teruji, object storage privat, audit log, dan backup terenkripsi di lokasi terpisah. Lokasi data, provider, domain, biaya, dan izin penggunaan cloud harus diputuskan melalui musyawarah/pejabat TI. Jangan menaruh arsip nyata di hosting statis atau bucket publik. Selama hosting belum disepakati, spesifikasi tetap provider-neutral dan demo memakai data dummy.

## Lingkungan

- **Development:** data sintetis, akses terbatas.
- **Staging/UAT:** dataset dummy, konfigurasi mendekati produksi; tidak gunakan arsip nyata tanpa persetujuan.
- **Production:** domain HTTPS, secrets terpisah, backup dan monitoring aktif, akses admin terbatas.

## Skalabilitas dan keandalan

Volume awal kecil untuk database relasional tunggal dan penyimpanan objek. Gunakan pagination, indeks pencarian metadata, upload bertahap/resumable jika file besar, dan job asynchronous untuk OCR. Menambah kategori arsip sebaiknya melalui metadata schema yang terkontrol; jangan membuat tabel atau field bebas tanpa validasi dan kontrol akses.

## Pemulihan

Backup harian database dan object storage ke lokasi terpisah; checksum manifest untuk berkas; prosedur restore terdokumentasi; RPO/RTO dan lama retensi backup menunggu keputusan. Pastikan backup mencakup database, file, konfigurasi non-secret, dan mapping objek.

## Keputusan teknologi terbuka

Provider/region; framework; database; object storage; OCR engine; email provider; antivirus; MFA; domain; batas ukuran; RPO/RTO; logging/monitoring. Pilihan harus mempertimbangkan kebijakan SPBE, privasi, anggaran, dukungan operasional, dan kemudahan ekspor.
