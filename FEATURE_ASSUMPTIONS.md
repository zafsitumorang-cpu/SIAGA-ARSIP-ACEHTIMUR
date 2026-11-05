# Asumsi fitur sementara — menunggu pengesahan kantor

Ini default implementasi yang dapat diubah; bukan bukti keputusan paket 00 telah disahkan atau SOP/pelatihan/pilot telah terlaksana. Deployment publik hanya dummy. Paket keamanan dan offsite tetap ditunda sesuai TODO_MASTER.

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
