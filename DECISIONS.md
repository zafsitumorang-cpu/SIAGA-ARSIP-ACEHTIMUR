# DECISIONS — SIAGA ARSIP

## Pembaruan faktual dan keputusan yang masih diperlukan — 5 November 2026

- Stack aktif: Node.js 22+ (24 LTS untuk pengembangan/CI), PostgreSQL, frontend JavaScript/CSS; Caddy dan systemd pada VPS sesuai laporan operator. D-23 di bawah merekam arah awal dan tidak menjadi instruksi migrasi Laravel/Livewire atau deskripsi dependensi rilis kini.
- Pengguna meminta backup/offsite/restore dilewati untuk sementara. Dicatat sebagai **ditunda**, bukan selesai atau dihapus dari syarat sebelum data nyata.
- Nama inovasi di RA adalah ARSIP TERPADU; hubungan dengan SIAGA ARSIP dan nomenklatur subbagian perlu validasi kantor. Belum ada keputusan mengganti nama aplikasi atau akses.
- Izin edit recorder vs admin, semantik penerima individual/tim, lintas subbagian dan cakupan kategori FR-11 perlu keputusan tertulis. Tidak ada izin baru yang diberikan oleh audit.
- Rencana kerja terkini: [TODO_MASTER.md](TODO_MASTER.md), paket 00; perbandingan sumber: [AUDIT_MASTER.md](AUDIT_MASTER.md). Keputusan organisasi di tabel awal tetap perlu dibedakan dari keberadaan fitur pada kode.

## Keputusan yang telah disepakati

| ID | Keputusan | Status |
|---|---|---|
| D-01 | Nama kerja sistem: SIAGA ARSIP, Bawaslu Kabupaten Aceh Timur | Terpakai pada konteks proyek sebelumnya; konfirmasi final organisasi tetap disarankan |
| D-02 | Tahap pertama berfokus pada surat masuk dan surat keluar | Disepakati |
| D-03 | Halaman publik hanya menampilkan angka agregat masuk/keluar, dapat difilter per tahun | Disepakati |
| D-04 | Kelompok pengguna: admin/pengelola arsip, pencatat, pengunggah, pegawai, pimpinan, publik | Disepakati secara konseptual |
| D-05 | Pencatatan surat dan unggah berkas adalah peran berbeda | Disepakati; pemetaan orang belum tersedia |
| D-06 | Pegawai dibatasi satu subbagian; daftar: Administrasi, Hukum, Pengawasan, PPPS | Disepakati |
| D-07 | Setiap arsip ditetapkan ke satu subbagian penanggung jawab; pimpinan dapat melihat lintas subbagian | Disepakati |
| D-08 | Admin sistem juga pengelola arsip dan mengelola akun | Disepakati |
| D-09 | Status disposisi: Belum ditindaklanjuti, Sedang diproses, Selesai | Disepakati |
| D-10 | Metadata surat masuk dan keluar seperti dalam PRD; tidak ada klasifikasi resmi saat ini | Disepakati |
| D-11 | Admin mengelola daftar klasifikasi dan dapat menambah kategori | Disepakati |
| D-12 | Sistem diakses dari luar kantor via internet setelah login; halaman statistik tetap publik | Disepakati |
| D-13 | File Drive disalin ke penyimpanan sistem; surat fisik dipindai ke PDF beserta metadata | Disepakati |
| D-14 | Format unggah: PDF, JPG, XLSX, DOCX | Disepakati |
| D-15 | Metadata pencarian wajib; pencarian isi PDF via OCR diupayakan jika memungkinkan | Disepakati secara bersyarat |
| D-16 | Notifikasi in-app wajib; email lebih baik jika memungkinkan | Disepakati secara bersyarat |
| D-17 | Ekspor hasil pencarian ke Excel diperlukan | Disepakati |
| D-18 | Pengguna berwenang dapat melihat dan mengunduh file sesuai akses; pegawai hanya memperbarui status disposisi; admin memperbaiki metadata dan menghapus | Disepakati |
| D-19 | Audit aktivitas dan backup harian dengan salinan terpisah diperlukan | Disepakati |
| D-20 | Migrasi awal diperkirakan 1.000 PDF + 300 surat fisik = 1.300 arsip | Estimasi pengguna |
| D-21 | Gunakan 10 dummy surat masuk + 10 dummy surat keluar untuk demo | Disepakati |
| D-22 | Target pilot sekitar satu bulan lagi | Disepakati sebagai perkiraan |
| D-23 | MVP uji coba dikirim sebagai aplikasi Node.js 20 tanpa dependensi eksternal agar dapat dijalankan langsung di environment yang tersedia; rancangan produksi tetap mengarah pada Laravel 13 + Livewire 4, PostgreSQL, dan object storage privat | Keputusan implementasi pilot |

## Keputusan terbuka

- Penyedia, lokasi/region data, biaya hosting, domain, dan persetujuan TI.
- Apakah kebijakan instansi mengharuskan hosting tertentu/on-premise.
- Daftar klasifikasi awal dan aturan penomoran surat; nomor unik belum dipaksakan.
- Pemetaan akun nyata ke peran dan subbagian; penerima disposisi yang berwenang.
- Retensi arsip, pemusnahan permanen, masa retensi audit dan backup.
- MFA, batas unggah, antivirus, RPO/RTO, target ketersediaan.
- Email provider dan template notifikasi.
- Teknologi OCR, bahasa, kualitas minimum, dan anggaran.
- Skema detail kategori lanjutan dan klasifikasi keamanannya.
- Metrik dashboard tambahan, jika ada.
