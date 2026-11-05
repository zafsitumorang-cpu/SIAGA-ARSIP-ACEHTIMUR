# Pengujian migrasi terisolasi

Image ini menggunakan Ubuntu 24.04, Node 22, PostgreSQL 16 nyata, data seed dari checkout a12e258, import produksi dan verifikasi API yang sama dengan installer. Tidak ada bind mount data host atau akses VPS. Jalankan hanya sebagai container uji; fake `systemctl`/`curl` di image tidak boleh dipasang pada server.

Pengelola unit dimodelkan oleh wrapper yang menjalankan proses Node sebagai user nyata dan memvalidasi unit dengan `systemd-analyze verify`; PID1 systemd, sandbox service dan HTTPS/Caddy publik **tidak** dijalankan secara penuh. Proxy HTTPS pengujian dialihkan ke loopback dalam container. Tes ini bukan bukti konfigurasi domain/VPS produksi sudah benar.

Siapkan konteks dari checkout yang seluruh perubahan relevannya telah di-commit:

```bash
mkdir -p /tmp/siaga-upgrade-tests
git bundle create /tmp/siaga-upgrade-tests/repo.bundle --all
cp tests/vps/Dockerfile tests/vps/systemctl.py tests/vps/curl.py tests/vps/run-test.py /tmp/siaga-upgrade-tests/
docker build -t siaga-upgrade-integration /tmp/siaga-upgrade-tests
docker run --rm --network none siaga-upgrade-integration success
docker run --rm --network none siaga-upgrade-integration rollback
docker run --rm --network none siaga-upgrade-integration missing-file
```

Pada managed cloud, gunakan socket Docker lokal dan proxy/CA sesuai skill runtime; tambahkan `--secret id=proxy_ca,src="$CODEX_PROXY_CERT"` saat build bila diperlukan. Jangan menyalin CA sesi ke image.

Skenario: migrasi sukses dengan sumber lama tetap utuh, hash/file kredensial privat, PostgreSQL backup dan restore 20 rekaman sintetis; kegagalan start final mengembalikan layanan lama; file hilang non-demo menggagalkan migrasi dan mengembalikan layanan lama. Tes helper yang lebih cepat tersedia melalui `npm run test:migration` dan GitHub Actions.

## Pemasang timer backup

Setelah image di atas tersedia, uji installer dari working tree melalui mount read-only (tidak memasang unit pada host):

```bash
docker run --rm --network none \
  --mount "type=bind,src=$(pwd)/scripts/install-backup-timer.sh,dst=/fixture/install-backup-timer.sh,readonly" \
  --mount "type=bind,src=$(pwd)/tests/vps/backup-test.py,dst=/fixture/backup-test.py,readonly" \
  --entrypoint python3 siaga-upgrade-integration /fixture/backup-test.py
```

Tes memeriksa backup PostgreSQL/manifest nyata, validasi unit dan kalender Asia/Jakarta, pemasangan yang tidak mengganti PID aplikasi, cleanup saat backup awal gagal, penolakan overwrite unit dan tidak tercetaknya credential. Pengelola systemd/timer tetap dimodelkan; tes kalender bukan bukti timer server nyata sudah dipasang atau telah berjalan pada jam terjadwal.
