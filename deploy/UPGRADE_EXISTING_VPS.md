# Migrasi VPS yang telah diinventarisasi

Target: Ubuntu 24.04, Node 22+, domain `siaga-arsipbawasluacehtimur.web.id`, layanan lama `siaga-arsip.service`, checkout `/opt/siaga-arsip` pada commit `a12e258`, DATA_DIR `/var/lib/siaga-arsip`. Inventaris pengguna: 20 arsip, 6 akun, 0 file fisik. Caddy sudah aktif. Skrip menolak precondition yang tidak sesuai; jangan digunakan sebagai installer umum.

## Menjalankan

Tinjau [vps-upgrade.sh](../scripts/vps-upgrade.sh) dan [helper migrasi](../scripts/vps-migrate.mjs). Jalankan sebagai root melalui Console/Run commands dengan timeout sekurangnya 900 detik jika pengaturan tersedia. Gunakan SHA commit lengkap dari rilis yang ditinjau:

```bash
bash /tmp/siaga-upgrade.sh FULL_COMMIT_SHA
```

Unduh skrip dari commit yang sama sebelum menjalankannya. Skrip memverifikasi SHA hasil fetch, tidak menjalankan git pull pada kode lama, dan tidak mengubah Caddy/DNS/firewall. Dependensi npm terpasang dengan lockfile dan lifecycle scripts dinonaktifkan. PostgreSQL dipasang dari repositori Ubuntu jika belum ada, lalu database/role baru dibuat dengan nama unik. Password acak tidak dimasukkan ke argumen proses atau output.

## Dampak dan urutan

1. Checkout baru di `/opt/siaga-arsip-releases/<run-id>` dan pemasangan dependensi/database dilakukan saat layanan lama masih aktif. Node harus bisa dieksekusi pengguna Linux `siaga`; binary khusus di direktori home root memerlukan perbaikan instalasi sebelum maintenance.
2. Layanan lama dihentikan sementara untuk snapshot final yang konsisten. Kode, JSON, file, unit service dan Caddyfile dicadangkan di `/var/backups/siaga-arsip/<run-id>` dengan akses root. JSON diperiksa sebelum dan setelah stop; kode/data asli tetap di tempatnya.
3. Berkas disalin ke DATA_DIR baru, checksum disimpan. Referensi demo yang identik dengan pola seed `file_in_N`/`file_out_N` dan nama PDF seed, tetapi tanpa binary, dipindahkan ke `unavailableLegacyFiles` pada salinan metadata; arsip tetap ada. Berkas hilang lain menggagalkan migrasi, bukan diabaikan. Sumber/snapshot asli tidak dinormalisasi atau ditimpa.
4. Semua password lama diganti dan akun lama dinonaktifkan; hanya admin bootstrap `admin` yang aktif dengan password acak baru. Akun yang username-nya sudah `admin` mempertahankan ID. Ini mencegah kredensial demo ikut aktif pada produksi. Akses awal disimpan di `/etc/siaga-migrations/<run-id>/admin-access.json` (root, mode 0600); ambil lewat Console pribadi, jangan kirim ke chat/log publik. Atur password sendiri dan aktifkan akun riil secara terkendali.
5. Unit baru `siaga.service` diuji sebagai pengguna non-root pada `127.0.0.1:3100`: schema/data, jumlah arsip/akun, struktur arsip/disposisi, checksum file, endpoint, login dan logout. Snapshot logis dan pg_dump dibuat sebelum pergantian port.
6. Setelah tes kandidat lulus, unit baru beralih ke `127.0.0.1:3000`. Caddy tetap memakai upstream yang sama. Tes lokal diulang dan health/config HTTPS publik diperiksa. Unit lama dinonaktifkan dari autostart; unit baru diaktifkan untuk boot.

Website akan mengalami maintenance sejak snapshot final hingga verifikasi selesai. Kode/data lama tidak dihapus. Berkas kredensial dan checkpoint disimpan privat dan tidak dicetak. Snapshot PostgreSQL mengandung hash password/arsip dan harus diperlakukan sebagai data rahasia.

## Jika gagal

Trap kegagalan/INT/TERM/HUP mencoba menghentikan dan menghapus unit baru yang dibuat skrip, memulihkan status autostart lama bila perlu, lalu menjalankan layanan lama. Role/database baru, release dan checkpoint dipertahankan untuk inspeksi; paket PostgreSQL tidak dihapus otomatis. Jika JSON sumber tidak valid setelah stop, skrip sengaja tidak menyalakan kode lama yang dapat melakukan autoseed; pemulihan manual dari snapshot diperlukan. SIGKILL/power loss tidak dapat ditangani trap; periksa status layanan dan checkpoint melalui Console. Jangan menganggap rollback selalu berhasil tanpa memeriksa hasilnya.

Setelah upgrade berhasil dan pengguna mulai menulis ke PostgreSQL, kembali ke JSON lama dapat kehilangan perubahan baru. Rollback sesudah titik itu memerlukan maintenance dan rencana rekonsiliasi, bukan sekadar menyalakan unit lama.

## Setelah berhasil

`systemctl is-active siaga`, health `{"ok":true}` dan config `{"demoMode":false}` adalah pemeriksaan awal. Ambil akses admin lewat Console privat. Pertahankan backup lama sampai pemulihan penuh diuji. Backup masih lokal; jadwal, salinan terenkripsi offsite, retensi, alert dan uji restore menyeluruh belum dipasang oleh skrip. Arsip dummy tidak dihapus otomatis. Lengkapi UAT/fitur dan gate LAUNCH_READINESS.md sebelum memakai arsip nyata.
