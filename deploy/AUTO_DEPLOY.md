# Deployment otomatis setelah CI

VPS mengambil commit terbaru `main` dari repositori publik tetap SIAGA ARSIP. GitHub Actions menjalankan Application checks; VPS membaca hasilnya melalui API publik GitHub. Tidak memerlukan GitHub Secrets, personal access token atau akses SSH dari runner. Integrasi percakapan memiliki akses kode/status CI, tetapi API Actions Secrets/Variables mengembalikan 403, sehingga pemasang ini tidak bergantung pada izin tersebut.

## Pemasangan satu kali

Prasyarat: migrasi PostgreSQL selesai, `siaga.service` dan `siaga-backup.timer` aktif. Tinjau scripts/install-auto-deploy.sh dan scripts/auto-deploy.sh. Unduh pemasang dari commit penuh yang ditinjau dan jalankan sebagai root dengan SHA yang sama:

```bash
sudo bash /tmp/siaga-auto-install.sh FULL_COMMIT_SHA
```

Pemasang mengambil controller dari commit yang diminta, memvalidasi unit, menjalankan satu pemeriksaan awal lalu mengaktifkan siaga-auto-deploy.timer. Timer memeriksa sekitar setiap lima menit (tambahan delay acak hingga 30 detik), mulai dua menit setelah boot. Jadwal backup 02:00 WIB tetap terpisah. Unit yang sudah ada tidak ditimpa. Kehadiran skrip di GitHub bukan bukti pemasangan sudah dilakukan pada VPS.

## Batas dan perlindungan

- Hanya SHA `main` milik repo tetap; CI harus berasal dari push pada main/repo yang sama, workflow `.github/workflows/checks.yml`, status completed dan conclusion success. PR, tes berjalan, kegagalan, kuota API habis atau respons tak dikenali tidak membuka deployment. Root hanya membaca API publik melalui HTTPS yang diverifikasi.
- Commit yang sudah diperiksa dilewati; perubahan dokumentasi/installer saja tidak merestart aplikasi. Perubahan app.mjs, public, lib, package/lockfile, db atau backup.mjs dapat memicu update. Tanggal default formulir surat kini mengikuti tanggal berjalan di Asia/Jakarta; tidak lagi tanggal tetap 4 November.
- Kode baru masuk direktori release terpisah; npm memakai lockfile dengan lifecycle scripts dinonaktifkan. Pemasang tidak mengubah environment/database/akun. Schema SQL harus identik dengan release aktif; perubahan schema memerlukan migrasi terencana, bukan DDL otomatis.
- Sebelum update, job backup yang telah dipasang harus berhasil. Kandidat memakai database yang sama dan diuji hanya dengan health/config serta penolakan anonymous di port loopback 3100. Tidak memasukkan credential admin atau membuat arsip uji di produksi. Proses lama berjalan selama pengujian kandidat.
- Setelah kandidat lulus dan main masih menunjuk SHA yang sama, drop-in WorkingDirectory/ExecStart mengganti release aplikasi dan memperbarui rujukan job backup. Data dan EnvironmentFile tetap. Aplikasi mengalami restart singkat. Health/config localhost dan HTTPS publik harus lulus, serta direktori service harus cocok dengan target.
- Jika pergantian gagal, drop-in lama dipulihkan, kandidat dibersihkan dan layanan lama direstart serta dicek kesehatannya. **Rollback mengembalikan kode, bukan memutar balik database atau file pengguna.** Perubahan harus kompatibel dengan data/schema sebelumnya. Jangan menganggap rollback selalu berhasil tanpa melihat hasil; SIGKILL/power loss memerlukan pemeriksaan operator.
- Salinan metadata/binary tetap di lokasi backup privat. Log update di `/var/backups/siaga-deploy/<run-id>`. Cache/marker root di `/var/lib/siaga-auto-deploy`. Tidak ada penghapusan release/backup otomatis. Enkripsi/offsite/retensi/alert tetap pekerjaan terpisah.
- Controller root dipasang dari commit yang ditinjau, tidak memperbarui dirinya sendiri dari main. Perubahan controller/unit perlu pemasangan terencana; bukan memakai skrip migrasi JSON sekali pakai berulang kali.

## Operasional

```bash
systemctl list-timers siaga-auto-deploy.timer --no-pager
sudo journalctl -u siaga-auto-deploy.service -n 30 --no-pager
# Menjeda update otomatis; layanan web tetap berjalan:
sudo systemctl disable --now siaga-auto-deploy.timer
```

GitHub API publik mempunyai rate limit. Saat dibatasi, update menunggu pemeriksaan berikutnya; aplikasi lama dipertahankan. Pemasangan dan pengujian awal pada VPS diperlukan untuk mengonfirmasi konektivitas/izin systemd sebenarnya.
