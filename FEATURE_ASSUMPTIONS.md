# Asumsi fitur sementara — menunggu pengesahan kantor

Ini default implementasi yang dapat diubah; bukan bukti keputusan paket 00 telah disahkan atau SOP/pelatihan/pilot telah terlaksana. Deployment publik hanya dummy. Paket keamanan dan offsite tetap ditunda sesuai TODO_MASTER.

## 03.1 — orang dan tim

- Pemberi disposisi: admin/pimpinan. Hanya surat masuk; tujuan harus subbagian pemilik arsip.
- Penerima individu dipilih dari staf aktif pada subbagian tersebut, mencakup peran pegawai/pencatat/pengunggah. Admin/pimpinan mengawasi tanpa dijadikan penerima tugas individu.
- `assignedUserId` yang terisi mengalahkan kelompok: hanya orang tersebut dan admin/pimpinan dapat memperbarui tugas. Jika ID kosong, staf pada subbagian tujuan dapat memperbarui tugas tim.
- Akses baca arsip tetap menurut scope lama; penugasan tidak memperluas akses lintas bagian. Pemilik proses perlu meninjau apakah instruksi individual membutuhkan kebijakan baca yang lebih sempit di masa depan.
- Pengguna nonaktif atau pindah subbagian tidak memperoleh akses dari penugasan lama. Pengalihan tugas membutuhkan tindakan supervisor pada fitur yang disahkan; tidak ada fallback diam-diam dari individu menjadi tugas tim.
