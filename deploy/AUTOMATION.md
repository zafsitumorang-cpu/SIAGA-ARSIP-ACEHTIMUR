# Otomatisasi operasional

Status operator terbaru dan pemeriksaan publik setelah pemasangan tersedia di [STATUS.md](STATUS.md). Operator telah mengirim keluaran sukses pemasangan timer deployment; frontend terbaru juga terverifikasi dari luar.

## Backup lokal harian

`scripts/install-backup-timer.sh` dipasang sekali oleh operator melalui Run commands/root pada VPS hasil migrasi. Skrip membaca path unit `siaga.service` yang aktif, tidak membaca/menampilkan password, memvalidasi format path khusus migrasi, membuat unit backup dan menjalankan satu backup awal sebelum mengaktifkan timer. Unit yang sudah ada tidak ditimpa. Aplikasi tidak direstart. Jika pemasangan gagal, hanya unit baru yang dibuat skrip dibersihkan; salinan backup dan layanan aplikasi dipertahankan.

Jadwal adalah pukul **02:00 Asia/Jakarta (WIB)** setiap hari, independen dari timezone host. `Persistent=true` menjalankan jadwal yang terlewat setelah timer/server aktif kembali. Job berjalan sebagai root dengan konfigurasi privat yang sama, menggunakan backup transaksional PostgreSQL, file dan manifest SHA-256. Sandbox filesystem hanya memberi akses tulis ke direktori backup yang ditentukan. Timeout satu job 300 detik; ukur ulang jika volume file bertambah karena snapshot memegang lock transaksi aplikasi.

Pemasangan:

```bash
sudo bash /tmp/siaga-backup-install.sh
```

Unduh skrip dari commit yang telah ditinjau terlebih dahulu. Keluaran sukses installer merupakan bukti timer terpasang; adanya file installer di GitHub saja bukan bukti jadwal sudah aktif di VPS.

Pemeriksaan setelah pemasangan (tidak perlu dilakukan rutin secara manual):

```bash
systemctl list-timers siaga-backup.timer --no-pager
systemctl show siaga-backup.service -p Result -p ExecMainStatus
sudo journalctl -u siaga-backup.service -n 20 --no-pager
```

Backup bersifat **lokal**, tidak otomatis terenkripsi atau dikirim ke lokasi terpisah. Tidak ada penghapusan otomatis: tetapkan retensi dan pantau kapasitas disk sebelum menambahnya. Kegagalan tercatat di status unit/journal, belum dikirim sebagai alert. Uji restore database dan file di lingkungan bersih tetap wajib. Unit menunjuk release yang aktif saat pemasangan; bila release/path konfigurasi berubah, pipeline deployment harus memperbarui unit backup secara terkendali.

Pengujian container tersedia di [tests/vps/README.md](../tests/vps/README.md): backup dan manifest nyata memakai PostgreSQL 16, kalender/unit divalidasi, kegagalan backup awal melakukan cleanup, aplikasi tidak direstart, unit yang ada tidak ditimpa dan password tidak dicetak. Pengelola systemd dimodelkan; hasil pemasangan dari operator diperlukan untuk mengonfirmasi timer VPS nyata.

## Deployment dari GitHub

GitHub Actions menjalankan pemeriksaan otomatis. Controller VPS yang memeriksa hasil CI publik dan mengambil commit main tersedia di [AUTO_DEPLOY.md](AUTO_DEPLOY.md). Jalur ini tidak membutuhkan SSH dari runner atau GitHub Secrets; API Secrets/Variables tidak diizinkan oleh integrasi saat implementasi. Controller membuat backup sebelum update, memeriksa kandidat dan kesehatan setelah pergantian, serta mencoba rollback kode bila gagal. Perubahan schema ditolak untuk migrasi terencana. Pemasangan pada VPS baru dikonfirmasi setelah operator menjalankan pemasang dan mengirim hasilnya. Jangan menggunakan ulang skrip migrasi JSON satu kali untuk setiap push.
