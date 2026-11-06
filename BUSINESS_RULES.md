# BUSINESS RULES — SIAGA ARSIP

> **Penyelarasan pemilik, 6 November 2026:** target subbagian mengikuti dokumen RA dan cakupan target mencakup seluruh arsip administrasi. Aturan di bawah yang masih menyebut label runtime lama atau hanya surat masuk/keluar adalah kondisi implementasi sementara sampai TODO 00 dan registri arsip umum selesai. Tidak ada arsip nyata yang boleh dimasukkan selama tahap ini.

## Pengguna dan ruang lingkup

1. Admin sistem dan pengelola arsip adalah satu peran untuk tahap pertama.
2. Akun dibuat dan dikelola admin; akun nonaktif tidak dapat login.
3. Pegawai ditetapkan ke tepat satu subbagian: Administrasi, Hukum, Pengawasan, atau PPPS.
4. Pegawai hanya melihat dan mengunduh arsip subbagiannya. Pimpinan dan admin dapat melihat seluruh subbagian.
5. Setiap arsip memiliki tepat satu subbagian penanggung jawab. Perubahan pemilik subbagian dilakukan admin dan dicatat.
6. Pengunjung tanpa akun hanya dapat melihat agregat surat masuk/keluar per tahun.

## Matriks kemampuan kerja 00.2

Matriks ini adalah default pemilik yang konservatif sampai kantor mengesahkan kombinasi peran lain. Cakupan `unit` berarti subbagian pengguna; admin/pimpinan memiliki cakupan lintas unit sesuai peran.

| Kemampuan | Admin/pengelola | Pimpinan | Pencatat | Pengunggah | Pegawai | Publik |
|---|---:|---:|---:|---:|---:|---:|
| Login dan baca metadata/berkas sesuai scope | semua | semua | unit | unit | unit | agregat saja |
| Buat metadata arsip | ya | tidak | unit | tidak | tidak | tidak |
| Ubah metadata | ya | tidak | tidak | tidak | tidak | tidak |
| Unggah/ganti/restore berkas | ya | tidak | tidak | unit | tidak | tidak |
| Buat disposisi | ya | ya | tidak | tidak | tidak | tidak |
| Perbarui status disposisi | pengawasan | pengawasan | tugas yang ditugaskan | tugas yang ditugaskan | tugas yang ditugaskan | tidak |
| Ekspor hasil berizin | ya | ya | unit | unit | unit | tidak |
| Kelola akun, klasifikasi, QC dan audit | ya | baca audit | tidak | tidak | tidak | tidak |
| Soft-delete/pulihkan arsip | mengikuti kebijakan 04.5 | tidak | tidak | tidak | tidak | tidak |

Penugasan individual hanya dapat menunjuk pegawai aktif pada subbagian arsip. Penugasan tidak memperluas akses baca dan tidak menjadikan rekan satu subbagian sebagai pengubah tugas individual. Peran yang tidak tercantum pada kemampuan ditolak server; perubahan metadata tetap admin-only sampai keputusan baru.

## Pengelolaan arsip

7. Tahap pertama memiliki kategori Surat Masuk dan Surat Keluar.
8. Admin mengelola opsi klasifikasi; belum ada daftar resmi. Kategori tambahan dapat dibuat admin, tetapi penggunaan kategori baru mensyaratkan form, akses, dan retensi yang disetujui.
9. Pencatatan metadata dan unggah berkas dilakukan oleh peran berbeda. Pengguna hanya menjalankan tugas yang ditugaskan; pemetaan pengguna aktual masih perlu dikonfirmasi.
10. Surat masuk wajib memiliki nomor dan tanggal surat, tanggal diterima, asal, perihal, tujuan/disposisi, klasifikasi, subbagian penanggung jawab, serta berkas pindai/lampiran sesuai tahapan kelengkapan.
11. Surat keluar wajib memiliki nomor dan tanggal, tujuan, perihal, penandatangan, klasifikasi, subbagian penanggung jawab, dan berkas final.
12. Format unggah yang diizinkan: PDF, JPG, XLSX, DOCX; batas ukuran ditetapkan administrator saat implementasi.
13. Sistem tidak menerbitkan tautan publik ke berkas arsip.
14. Nomor surat tidak ditetapkan unik global sampai pola nomor resmi kantor dikonfirmasi.

## Disposisi

15. Pimpinan dapat membuat disposisi surat masuk kepada subbagian atau pegawai.
16. Penerima dapat memperbarui status hanya atas disposisi yang ditugaskan.
17. Status yang tersedia: Belum ditindaklanjuti, Sedang diproses, Selesai.
18. Setiap disposisi dan pembaruan status mempertahankan riwayat aktor dan waktu.
19. Notifikasi dalam aplikasi wajib; email diupayakan jika layanan email tersedia.

## Hak perubahan

20. Pegawai biasa memperbarui status disposisi saja; tidak dapat mengubah metadata atau menghapus arsip.
21. Admin/pengelola arsip dapat memperbaiki metadata dan melakukan penghapusan sesuai kebijakan.
22. Hapus dilakukan secara logis/soft delete pada pilot hingga retensi dan pemusnahan disetujui; penghapusan permanen harus menjadi prosedur terkontrol.
23. Melihat, mengunduh, menambah, mengubah, menghapus, mengubah akses, dan mengelola disposisi dicatat dalam audit.

## Publik dan laporan

24. Statistik publik hanya berisi angka agregat surat masuk/keluar, dengan filter tahun.
25. Dashboard pimpinan menampilkan jumlah masuk, keluar, dan disposisi belum selesai; filter tahun. Metrik tambahan perlu persetujuan.
26. Ekspor Excel mengikuti izin akses, filter, dan minimisasi field.

## Migrasi

27. Dokumen awal diperkirakan sekitar 1.000 PDF dari Drive dan 300 surat kertas; keseluruhan sekitar 1.300.
28. PDF Drive disalin ke penyimpanan privat sistem; surat kertas dipindai menjadi PDF dan metadatanya dicatat.
29. Metadata migrasi belum tersedia. Dummy 10 masuk dan 10 keluar hanya untuk demonstrasi; bukan pengganti data nyata.
30. Migrasi produksi harus merekonsiliasi jumlah file dan metadata, serta merekam kesalahan/duplikasi untuk ditinjau manusia.


## Implementasi perbaikan metadata tahap ini

Admin memperbaiki metadata melalui Arsip surat → Ubah metadata atau Detail → Ubah metadata. Recorder masih mencatat metadata; kewenangan perbaikan recorder pada FR-04 belum diperluas dalam paket ini. Admin tidak dapat mengganti jenis/subbagian bila surat memiliki disposisi hingga alur penugasan ulang tersedia. Konflik dua pengguna harus dimuat ulang, bukan menimpa data yang lebih baru. Audit mencatat nama field, aktor dan waktu; nilai metadata sensitif tidak disalin ke log umum.
