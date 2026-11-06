# Asumsi fitur sementara — disetujui pemilik, menunggu pengesahan kantor

Pada 6 November 2026 pemilik menyetujui default penyelarasan: nama SIAGA ARSIP, subbagian mengikuti dokumen RA, target seluruh arsip administrasi, hak minimum, disposisi dalam unit yang sesuai dan metadata umum dengan kategori awal dari RA. Ini default implementasi yang dapat diubah; bukan bukti keputusan formal kantor, SOP/pelatihan/pilot telah terlaksana. Deployment publik hanya dummy. Paket keamanan dan offsite tetap ditunda sesuai TODO_MASTER.

## 03.1 — orang dan tim

- Pemberi disposisi: admin/pimpinan. Hanya surat masuk; tujuan harus subbagian pemilik arsip.
- Penerima individu dipilih dari staf aktif pada subbagian tersebut, mencakup peran pegawai/pencatat/pengunggah. Admin/pimpinan mengawasi tanpa dijadikan penerima tugas individu.
- `assignedUserId` yang terisi mengalahkan kelompok: hanya orang tersebut dan admin/pimpinan dapat memperbarui tugas. Jika ID kosong, staf pada subbagian tujuan dapat memperbarui tugas tim.
- Akses baca arsip tetap menurut scope lama; penugasan tidak memperluas akses lintas bagian. Pemilik proses perlu meninjau apakah instruksi individual membutuhkan kebijakan baca yang lebih sempit di masa depan.
- Pengguna nonaktif atau pindah subbagian tidak memperoleh akses dari penugasan lama. Pengalihan tugas membutuhkan tindakan supervisor pada fitur yang disahkan; tidak ada fallback diam-diam dari individu menjadi tugas tim.

## 03.2 — kronologi dan transisi

Tindak lanjut dapat berjalan dari belum ditindaklanjuti ke sedang diproses atau langsung selesai (kompatibel alur surat sederhana). Kembali dari sedang diproses ke belum ditindaklanjuti memerlukan alasan. Tugas selesai hanya dibuka kembali oleh admin/pimpinan, menuju sedang diproses dengan alasan wajib. Penerima tetap dapat menambah catatan perkembangan pada status yang sama; catatan kosong tanpa perubahan tidak membuat event. Catatan maksimal 2.000 karakter; instruksi maksimal 4.000. Riwayat lama yang belum menyimpan previousStatus/kind tetap ditampilkan berdasarkan informasi yang tersedia, tanpa merekayasa data.

## 03.3 — kompatibilitas status dan retry

PATCH status mewajibkan versi hasil baca agar semua penulis ikut pemeriksaan konflik. Tab/klien lama harus memuat ulang setelah rilis ini. Key retry berlaku untuk satu tindakan/payload per aktor; mengubah input membuat operasi baru. Draft catatan dan kunci disimpan selama dialog terbuka, bukan penyimpanan lintas reload. Data lama tanpa field version memakai jumlah event historis sebagai versi awal dan tidak ditulis ulang saat sekadar dibaca.

## 03.4 — makna daftar kerja dan ringkasan

Staf pertama-tama melihat tugas individu sendiri + tugas tim subbagian; admin/pimpinan melihat semua penugasan dalam pengawasan. Filter semua dalam cakupan baca boleh menampilkan tugas individu rekan sebagai baca-saja, sesuai akses baca arsip yang sudah berlaku. Ringkasan tugas aktif/selesai tidak mengikuti pencarian dan diberi label tanpa filter; active adalah yang dapat ditindaklanjuti/diawasi dan belum selesai. Tahun filter memakai tahun surat, bukan tahun disposisi dibuat. CSV status tidak menyertakan instruksi/catatan. Keputusan membaca instruksi individual yang lebih sempit tetap memerlukan kebijakan kantor; fitur ini tidak memperluas scope.

## 03.5 — event dan baca per pengguna

Penugasan/status/catatan/reopen oleh orang lain menghasilkan notifikasi masuk untuk penerima individu/tim dan admin/pimpinan dalam scope yang sudah ada. Tindakan sendiri menjadi feedback di layar, tidak menambah unread. Instruksi/catatan privat tidak disalin ke payload daftar notifikasi. Membaca tidak mengubah status tugas. Tim berbagi tugas tetapi status baca tetap per akun. Inbox di-refresh saat dibuka/Perbarui dan setelah tindakan terkait, bukan jaminan pengiriman real-time. Belum ada provider email/push. Default ini menunggu tinjauan pemilik proses dan tidak mengesahkan SOP/ketentuan akses baru.

## 04.1 — kelengkapan dan reviewer

Admin menjadi reviewer sementara sampai kantor menetapkan peran QC. Lampiran opsional untuk ditambahkan, tetapi semua lampiran terdaftar harus tersedia agar lengkap. Lengkap adalah keputusan eksplisit reviewer pada metadata/versi tertentu, bukan keberadaan file atau selesainya disposisi. Perubahan metadata/utama/lampiran perlu verifikasi ulang. UI meminta konfirmasi manual; checklist rinci, keterbacaan/halaman/orientasi dan checksum mengikuti 04.3. Binary ber-ID immutable diasumsikan tidak ditimpa manual di filesystem; keberadaan bukan jaminan integritas kontinu/bebas malware. Data nyata tetap dilarang sebelum penguatan keamanan. Pengesahan reviewer/SOP dan QC kantor belum dianggap terlaksana.

## 04.2 — indeks, penamaan dan sumber

Indeks sistem = ID arsip immutable; tahun/unit/kode/nomor merupakan konteks terpisah agar koreksi metadata tidak mengganti identitas. Agenda/kode resmi diisi operator dari aturan kantor, tidak dibuat otomatis atau dipaksa unik global. Sumber yang belum diketahui tetap unknown. Memilih sumber tertentu membutuhkan locator yang dapat ditelusuri, tetapi aplikasi tidak mengambil isi sumber/URL atau memberikan izin Drive. Nama unduhan default tetap asli; nama terstruktur opsional dan tidak mengubah object key internal. Sumber/kode belum menjadi pengesahan inventaris, klasifikasi atau nomenklatur kantor. Master kode/klasifikasi penuh mengikuti paket 05.

## 04.3 — QC manusia dan duplikat sah

Checklist metadata/kelengkapan halaman/keterbacaan/orientasi adalah pernyataan petugas, bukan analisis otomatis scan. Jumlah halaman opsional dan dicatat dari pengamatan. Checksum baru untuk legacy adalah baseline, bukan bukti file tidak pernah berubah sebelum hash dicatat. Pemeriksaan dilakukan saat dibuka/on-demand dan diulang ketika approval, bukan daemon pemantau. Nomor/agenda serupa dan hash sama merupakan kandidat; operator dapat menyatakan duplikat sah dengan alasan. Tidak ada deduplikasi/penghapusan otomatis atau pemaksaan nomor unik global. Deteksi hash bergantung checksum tercatat dan baseline QC; belum semua file legacy dapat dibandingkan sebelum diperiksa. Sumber/kewenangan reviewer tetap perlu pengesahan kantor; pelaksanaan QC kantor belum diklaim.

## 04.4 — batas koreksi dan histori

Sesuai instruksi pemilik, 00.2 tetap belum disahkan dan edit metadata hanya admin. Jenis/subbagian tidak dapat berubah bila ada disposisi apa pun, termasuk selesai; tidak ada pengalihan tugas implisit. Pemindahan tanpa disposisi membawa seluruh arsip/file/histori ke scope unit baru dan mencabut akses unit lama. Histori umum hanya mencatat kolom, versi, pelaku dan waktu; nilai sebelum/sesudah tidak disalin. Ini sengaja bukan riwayat isi atau fitur undo metadata. Histori sebelum fitur tersedia tidak direkonstruksi. Pelaksanaan SOP/pengesahan kantor tidak ikut dianggap selesai.
