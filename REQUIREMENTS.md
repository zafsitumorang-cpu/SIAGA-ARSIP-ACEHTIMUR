# REQUIREMENTS — SIAGA ARSIP

Prioritas: **MUST** = wajib untuk pilot; **SHOULD** = penting jika layak; **LATER** = setelah pilot/keputusan lanjutan.

## Fungsional

| ID | Prioritas | Kebutuhan |
|---|---|---|
| FR-01 | MUST | Pengguna internal login dengan akun yang dibuat/dikelola admin; halaman statistik publik tidak memerlukan login. |
| FR-02 | MUST | Admin mengelola akun aktif/nonaktif, menetapkan satu subbagian per pegawai, dan menetapkan peran. |
| FR-03 | MUST | Sistem menyediakan peran admin/pengelola arsip, pencatat, pengunggah, pegawai/penerima disposisi, pimpinan, dan publik; kemampuan dapat dipisah sesuai penugasan. |
| FR-04 | MUST | Pencatat membuat dan membaca metadata seluruh arsip administrasi sesuai kewenangan; koreksi metadata tetap admin-only sampai keputusan baru. |
| FR-05 | MUST | Pengunggah menambahkan/mengganti berkas tanpa mengambil alih fungsi pencatatan; perubahan berkas tercatat. |
| FR-06 | MUST | Surat masuk menyimpan nomor, tanggal surat, tanggal diterima, asal, perihal, tujuan/disposisi, klasifikasi, subbagian penanggung jawab, serta satu/lebih berkas. |
| FR-07 | MUST | Surat keluar menyimpan nomor, tanggal, tujuan, perihal, penandatangan, klasifikasi, subbagian penanggung jawab, serta berkas final. |
| FR-08 | MUST | Pimpinan membuat disposisi kepada subbagian/pegawai dan instruksi dapat ditelusuri. |
| FR-09 | MUST | Penerima disposisi memperbarui status ke Belum ditindaklanjuti, Sedang diproses, atau Selesai. |
| FR-10 | MUST | Pegawai hanya dapat melihat/mengunduh arsip satu subbagian yang ditetapkan; pimpinan dan admin dapat melihat lintas subbagian. |
| FR-11 | MUST | Admin dapat mengelola daftar klasifikasi dan registri kategori arsip; kategori awal 00.3 memakai metadata umum, sedangkan alur substantif memerlukan skema dan keputusan lanjutan. |
| FR-12 | MUST | Pengguna berwenang mencari/filter berdasarkan nomor, tanggal, asal/tujuan, perihal, klasifikasi, tahun, dan status disposisi. |
| FR-13 | MUST | Pengguna berwenang mengekspor hasil pencarian metadata ke XLSX; ekspor mengikuti batas akses yang sama. |
| FR-14 | MUST | Halaman publik hanya memberikan angka agregat surat masuk/keluar dan filter tahun; tidak memberi akses ke metadata atau berkas individual. |
| FR-15 | MUST | Berkas disimpan di penyimpanan privat yang dikelola sistem; berkas Drive lama disalin, bukan hanya di-link. |
| FR-16 | MUST | Sistem menerima PDF, JPG, XLSX, DOCX. Batas ukuran dan pemindaian malware ditetapkan saat konfigurasi/deployment. |
| FR-17 | MUST | Sistem mencatat audit untuk tambah, ubah, lihat, unduh, hapus, perubahan akses, dan aktivitas disposisi. |
| FR-18 | MUST | Sistem menjalankan backup otomatis harian dengan salinan di lokasi terpisah dan prosedur pemulihan. |
| FR-19 | SHOULD | Notifikasi dalam sistem untuk disposisi baru dan perubahan status; email bila layanan email telah dikonfigurasi. |
| FR-20 | SHOULD | OCR untuk PDF berbasis gambar dan pencarian kata di isi PDF, bergantung pada uji kualitas, bahasa, kapasitas, dan persetujuan penyimpanan hasil OCR. |
| FR-21 | LATER | Mengaktifkan kategori arsip lain setelah form metadata, klasifikasi keamanan, dan matriks akses disetujui. |
| FR-22 | LATER | Analitik lanjutan, retensi/pemusnahan otomatis, integrasi tanda tangan elektronik, dan integrasi sistem eksternal. |

## Nonfungsional

- **Keamanan:** semua operasi internal memerlukan autentikasi; validasi izin di server untuk tiap rekaman dan berkas; TLS; kata sandi disimpan dengan hashing adaptif; sesi dapat dicabut.
- **Privasi:** tidak ada URL berkas publik permanen; API publik hanya mengembalikan angka agregat yang diizinkan.
- **Ketersediaan:** layanan dapat diakses via internet setelah login; target availability dan RTO/RPO perlu disetujui.
- **Kinerja:** pencarian metadata dan daftar berhalaman harus nyaman pada volume awal 1.300 arsip; angka target respons ditentukan sebelum UAT setelah pilihan hosting diketahui.
- **Keandalan:** metadata dan file memiliki relasi stabil; backup harian terpisah dan pemulihan diuji sebelum pilot.
- **Kemudahan pakai:** Bahasa Indonesia, tampilan responsif, validasi form jelas, ekspor mudah dipahami.
- **Auditabilitas:** audit log mencatat aktor, waktu, aksi, target, dan hasil tanpa menyalin isi dokumen sensitif ke log.
- **Portabilitas:** arsitektur tidak bergantung pada satu provider sebelum keputusan hosting; metadata dapat diekspor dan berkas dapat dipindahkan secara terkontrol.

## Kriteria penerimaan pilot

1. Peran dan subbagian membatasi daftar, detail, pencarian, ekspor, dan unduhan di server.
2. Alur disposisi berfungsi sesuai tiga status dan mencatat perubahan.
3. Pengunjung tanpa login hanya dapat melihat statistik agregat.
4. Jenis file lain dari daftar diizinkan ditolak; ukuran maksimum dapat diatur.
5. Ekspor hanya berisi rekaman yang boleh dilihat pengguna.
6. Backup berhasil dibuat dan pemulihan sampel dapat dilakukan.
7. Semua operasi sensitif tercatat di audit log.
8. Data dummy tidak mencerminkan surat nyata dan diberi label DEMO.
