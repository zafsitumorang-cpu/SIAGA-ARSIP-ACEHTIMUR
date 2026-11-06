# Laporan UAT teknis SIAGA ARSIP

Tanggal pelaksanaan: **6 November 2026**  
Commit aplikasi: **168bbdb**  
Lingkungan: fixture lokal dengan `DEMO_MODE=true` dan `DATA_DIR` sementara. Tidak ada akun, arsip, atau berkas produksi yang diubah.

## Keputusan

UAT teknis dengan data dummy **LULUS**. Aplikasi siap dipakai untuk sesi UAT kantor terbatas pada staging/demo. Laporan ini bukan pengganti penerimaan kantor: peserta, PIC, SOP, retensi, monitoring, dan persetujuan go/no-go tetap harus dicatat oleh kantor.

Pilot arsip nyata tetap **NO-GO** sampai gerbang operasional dan keamanan yang ditunda ditutup.

## Alur lintas peran

`npm run uat` lulus **15/15 pemeriksaan**:

- statistik publik dan pembatasan scope pegawai;
- pimpinan membuat disposisi;
- pegawai tujuan menerima notifikasi dan menyelesaikan tugas;
- notifikasi tidak bocor ke subbagian lain;
- ekspor CSV memuat status disposisi;
- admin membuat dan menonaktifkan akun;
- pencatat membuat metadata tanpa berkas;
- pengunggah menambahkan dan mengunduh berkas privat;
- pengguna subbagian lain ditolak saat mengunduh.

Reviewer QC saat ini menggunakan role **admin**, sesuai matriks hak yang berlaku. Belum ada role `reviewer` terpisah.

## UAT UI browser

Chromium lokal menjalankan **114 pemeriksaan** tanpa error JavaScript:

- form aksesibilitas dan validasi: 13;
- retry pencatatan/unggah: 10;
- pencarian, filter, pagination, CSV/XLSX, status selesai: 14;
- versi dan lampiran: 11;
- disposisi dan kronologi: 10;
- notifikasi: 11;
- kelengkapan/QC: 8;
- indeks dan sumber arsip: 8;
- inspeksi checksum/duplikasi: 6;
- histori koreksi metadata: 9;
- worklist disposisi: 10;
- deep-link detail: 4.

Skenario mobile, keyboard, retry, konflik dua tab, pembatasan scope, ekspor, dan respons terlambat ikut diuji pada fixture lokal.

## Regresi API pendukung

Selain UAT lintas peran, **244 pemeriksaan JSON fixture** lulus:

- versi/lampiran 26;
- disposisi 38;
- notifikasi 16;
- kualitas 20;
- indeks 15;
- inspeksi 13;
- histori metadata 14;
- ekspor 8;
- keamanan dan scope 94.

Suite PostgreSQL tidak dijalankan pada sesi ini karena `PG_TEST_URL` lokal tidak tersedia. Tidak ada mutasi database produksi.

## Temuan dan tindak lanjut

1. **Tidak ada kegagalan teknis pada fixture dummy.** Tidak ada perubahan kode fungsional yang diperlukan dari sesi UAT ini.
2. **Reviewer QC belum menjadi role terpisah.** Untuk UAT kantor, tunjuk admin sebagai reviewer QC atau buka keputusan kebijakan untuk menambah role baru.
3. **UAT kantor belum memiliki bukti peserta.** Nama peserta, peran, tanggal, skenario, hasil, tanda tangan, dan temuan harus diisi oleh kantor.
4. **Operasional belum ditutup.** PIC cadangan, SOP/Juknis, pelatihan, prosedur insiden, monitoring, retensi, RPO/RTO, dan backup offsite belum menjadi bukti penerimaan.
5. **Data nyata tetap dilarang untuk pilot saat ini.** Deployment publik masih demo/dummy.

## Form konfirmasi kantor

| Peran | Nama peserta | Tanggal | Hasil | Temuan/ID | Paraf |
|---|---|---|---|---|---|
| Pencatat |  |  | Lulus / Gagal |  |  |
| Pengunggah |  |  | Lulus / Gagal |  |  |
| Reviewer QC/admin |  |  | Lulus / Gagal |  |  |
| Pimpinan |  |  | Lulus / Gagal |  |  |
| Pegawai penerima |  |  | Lulus / Gagal |  |  |
| Pengelola/OPS |  |  | Lulus / Gagal |  |  |

Checklist penerimaan kantor: seluruh alur MUST lulus, tidak ada temuan kritis/tinggi yang terbuka, akun dan scope disetujui, dan keputusan go/no-go ditandatangani pemilik produk serta OPS.
