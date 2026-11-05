# Rencana pengembangan menuju produksi — SIAGA ARSIP

Diperbarui 5 November 2026, Asia/Jakarta. Operator telah melaporkan inventaris Ubuntu 24.04, Node 22, RAM sekitar 2 GiB/disk 40 GiB dan migrasi PostgreSQL melalui skrip commit 82a9327. Domain siaga-arsipbawasluacehtimur.web.id mengarah ke 43.173.51.195; HTTPS, health/config produksi, statistik 20 arsip, aset baru dan pembatasan anonim sudah diperiksa dari luar. Bukti dan batas verifikasi ada di [deploy/STATUS.md](deploy/STATUS.md). Audit awal berbasis a12e258; hardening dan migrasi awal kini terpasang sesuai laporan operator, sedangkan backup offsite, pemulihan menyeluruh, fitur dan gate penerimaan tetap terbuka. Agen tidak memiliki koneksi SSH langsung.

## Sasaran rilis pertama

Pencatatan dan pemeliharaan surat masuk/keluar; berkas privat; disposisi; akses satu subbagian; pencarian dan ekspor; audit; backup teruji. Pertahankan tampilan yang sudah dipilih. OCR, email otomatis, integrasi eksternal, kategori lanjutan dan analitik tambahan dapat dikerjakan setelah pilot stabil.

## Tahap 1 — fondasi keamanan dan aturan bisnis

- Tutup L-01/L-02: scope baca/tulis/unduh/ekspor/update di server. Sampai aturan berbagi arsip disepakati, penugasan lintas subbagian tidak otomatis membuka arsip lain.
- Hash adaptif, akun awal produksi melalui provisioning terkontrol; data/demo credentials hanya di mode demo eksplisit.
- Rate limit login, sesi dengan expiry/revokasi, Secure cookie lewat HTTPS, proteksi Origin/CSRF dan header keamanan.
- Validasi schema dan field wajib per jenis surat, penerima aktif yang valid, serta disposisi khusus surat masuk.
- Batas request sebelum buffering, cek tipe berkas dari isi dan ekstensi, nama aman, checksum; kebijakan scan/karantina ditetapkan sebelum dokumen nyata.
- Pengujian negatif harus membuktikan semua temuan audit tidak dapat direproduksi lagi.

## Tahap 2 — database dan penyimpanan yang dapat dipulihkan

- Pertahankan backend Node.js; migrasi framework bukan prasyarat produksi. Versi Node.js LTS yang didukung dipilih saat deployment.
- Pindahkan metadata, akun, sesi, disposisi dan audit dari JSON ke PostgreSQL dengan migrasi schema dan transaksi.
- Buat alat impor JSON ke database tanpa mengubah/menghapus sumber; validasi jumlah, relasi, status dan checksum. Lakukan pada salinan uji terlebih dahulu.
- Berkas privat dapat disimpan di direktori data server untuk pilot kecil jika kapasitas dan kebijakan mengizinkan. Object storage privat menjadi opsi untuk pertumbuhan, bukan biaya tambahan yang diasumsikan telah dibeli.
- Simpan versi berkas dan indikator keberadaan fisik file. Jangan menawarkan unduh untuk file dummy yang belum ada.
- Backup database dan file otomatis harian, terenkripsi, ke lokasi terpisah; alert gagal dan restore sampel. Disk/backup di VPS yang sama bukan satu-satunya cadangan.

## Tahap 3 — lengkapi pekerjaan pengguna

Paket edit metadata admin tersedia pada kode terbaru, termasuk validasi, konflik versi dan audit nama field; PostgreSQL schema tetap v1. Pengguna melaporkan UAT validasi, simpan/audit dan konflik dua tab lulus pada arsip dummy, lalu mengembalikan perihal semula. Paket selanjutnya menambahkan filter lengkap, pagination respons dan CSV seluruh hasil. Store serta cache dashboard/disposisi masih memuat dataset penuh, sehingga belum membuktikan kinerja SQL atau beban VPS. Izin edit recorder, penghapusan, histori nilai dan XLSX tetap terpisah. Gunakan skenario di MVP_TESTING.md untuk penerimaan pengguna.

- Edit metadata dengan izin admin/pencatat sesuai aturan dan audit per perubahan.
- Detail arsip beserta kronologi disposisi/berkas; unggah dan kegagalan unggah tidak menghasilkan tautan rusak.
- Filter tahun/tanggal, jenis, klasifikasi, subbagian sesuai role, status dan pagination.
- Ekspor XLSX mengikuti filter dan scope yang sama; lindungi dari formula injection.
- Penghapusan logis hanya jika disetujui, pemulihan dan audit; tidak ada hard delete umum.
- Audit baca/detail/unduh/tambah/ubah/akses/disposisi tanpa menyalin instruksi sensitif; tetapkan retensi dan perlindungan log.
- Kelola klasifikasi/kategori sesuai ruang lingkup yang disepakati; kategori baru tidak otomatis membuka akses.

## Tahap 4 — siapkan server dan domain untuk staging

Informasi awal: domain, provider/paket, CPU/RAM/disk, OS, IPv4 publik atau NAT, jenis dukungan, backup bawaan. Gunakan mekanisme akses SSH yang aman ketika pemasangan benar-benar dimulai; kata sandi tidak perlu ditaruh di dokumen/repo.

- Konfigurasi user deploy non-root, SSH key dan firewall; jangan mengekspos database ke internet.
- VPS ini sudah menggunakan Caddy untuk HTTPS/reverse proxy; pertahankan instalasi tersebut, dengan Node.js dikelola systemd dan PostgreSQL lokal/privat. Verifikasi restart dan perpanjangan sertifikat melalui operasi rutin.
- Bila NAT, pastikan terlebih dahulu forwarding/reverse proxy untuk domain dan HTTPS; jangan mengasumsikan A record saja cukup.
- Pisahkan direktori release dari data persisten; secrets di environment terproteksi; batas unggah di proxy dan aplikasi selaras.
- Deploy staging dengan dummy dan akses terbatas; periksa domain, HTTPS, restart, logs, penggunaan resource dan endpoint health yang sesuai.
- Siapkan rollback release yang cocok dengan migrasi database. Backup/snapshot dan verifikasi sebelum perubahan DNS atau migrasi data.
- Putuskan saat cutover domain setelah tes; Railway dapat tetap menjadi demo terpisah tanpa data produksi.

## Tahap 5 — pilot dan gate peluncuran

- Petakan akun riil, peran/subbagian, PIC admin/backup/insiden dan daftar klasifikasi.
- UAT oleh admin, pencatat, pengunggah, pimpinan dan pegawai; gunakan alur dari surat masuk sampai status selesai serta ekspor dan unduh.
- Uji data sintetis sekitar 1.300 rekaman, beberapa request bersamaan, ukuran unggah representatif, resource server dan recovery setelah restart/redeploy.
- Uji restore database DAN file ke lingkungan bersih; verifikasi integritas dan waktu pemulihan. Tetapkan RPO/RTO dan retensi bersama pengelola.
- Semua L-01 sampai L-08 ditutup dengan bukti, fitur MUST selesai atau pengurangan scope disetujui, dan monitoring/backup/PIC aktif.
- Persetujuan pengguna kantor dan pengelola TI atas hosting/lokasi data, akses dan go/no-go; baru migrasi arsip nyata bertahap.

## Urutan pelaksanaan

Mulai dari Tahap 1, lanjut database Tahap 2 dan fitur Tahap 3. Persiapan staging dapat berlangsung ketika spesifikasi server sudah diverifikasi; peluncuran data nyata menunggu gate Tahap 5. Setiap paket perubahan: implementasi → tes → review hasil → commit/push sesuai instruksi; akses server, deployment dan cutover dilakukan saat lingkungan serta aksesnya tersedia. Jadwal kalender ditentukan setelah ruang lingkup dan spesifikasi dikonfirmasi.
