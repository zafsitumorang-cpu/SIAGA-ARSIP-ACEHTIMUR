#!/usr/bin/env bash
# One-time local backup scheduling for the migrated VPS. No application restart.
set +x
set -Eeuo pipefail
umask 077
[[ "$(id -u)" = 0 ]] || { echo 'Jalankan sebagai root/sudo.' >&2; exit 1; }
exec 9>/run/lock/siaga-backup-install.lock
flock -n 9 || { echo 'Pemasangan backup lain sedang berjalan.' >&2; exit 1; }
systemctl is-active --quiet siaga.service
for unit in siaga-backup.service siaga-backup.timer; do
  if systemctl cat "$unit" >/dev/null 2>&1; then
    echo "Unit $unit sudah ada. Tidak ditimpa; periksa pengaturan yang ada."
    exit 1
  fi
done
work_dir="$(systemctl show siaga.service -p WorkingDirectory --value)"
env_descriptor="$(systemctl show siaga.service -p EnvironmentFiles --value)"
[[ "$work_dir" =~ ^/opt/siaga-arsip-releases/[0-9]{14}_[a-f0-9]{6}$ ]]
[[ "$env_descriptor" =~ ^(/etc/siaga-migrations/[0-9]{14}_[a-f0-9]{6}/runtime.env)\ \(ignore_errors=no\)$ ]]
env_file="${BASH_REMATCH[1]}"
node_bin="$(readlink -f "$(command -v node)")"
[[ "$node_bin" =~ ^/(usr|opt)/[a-zA-Z0-9_./-]+$ && -x "$node_bin" && -f "$work_dir/scripts/backup.mjs" ]]
"$node_bin" -e 'if(+process.versions.node.split(".")[0]<22)process.exit(1)'
config_dir="$(dirname "$env_file")"
backup_dir="$("$node_bin" -e '
const fs=require("fs"),path=require("path");
try {
  const config=JSON.parse(fs.readFileSync(path.join(process.argv[1],"settings.json"),"utf8"));
  if(config.env.DEMO_MODE!=="false"||!config.env.DATABASE_URL||!/^\/var\/backups\/siaga-arsip\/[0-9]{14}_[a-f0-9]{6}\/postgres-backups$/.test(config.env.BACKUP_DIR))process.exit(1);
  process.stdout.write(config.env.BACKUP_DIR);
} catch {process.exit(1)}' "$config_dir")"
[[ -d "$backup_dir" && ! -L "$backup_dir" && -f "$env_file" ]]
staging="$(mktemp -d /var/tmp/siaga-backup-install-XXXXXX)"
created=0
success=0
cleanup(){
  local status="$?"
  trap - EXIT INT TERM HUP
  if [[ "$created" = 1 && "$success" != 1 ]]; then
    systemctl disable --now siaga-backup.timer >/dev/null 2>&1 || true
    systemctl stop siaga-backup.service >/dev/null 2>&1 || true
    rm -f /etc/systemd/system/siaga-backup.service /etc/systemd/system/siaga-backup.timer
    systemctl daemon-reload >/dev/null 2>&1 || true
    echo 'Pemasangan timer belum berhasil; aplikasi dan backup yang telah dibuat dipertahankan.'
  fi
  rm -rf "$staging"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
cat >"$staging/siaga-backup.service" <<EOF
[Unit]
Description=SIAGA ARSIP local database and file backup
After=postgresql.service

[Service]
Type=oneshot
User=root
WorkingDirectory=$work_dir
EnvironmentFile=$env_file
ExecStart=$node_bin $work_dir/scripts/backup.mjs
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$backup_dir
Nice=10
IOSchedulingClass=idle
TimeoutStartSec=300
EOF
cat >"$staging/siaga-backup.timer" <<'EOF'
[Unit]
Description=Daily SIAGA ARSIP backup at 02:00 WIB

[Timer]
OnCalendar=*-*-* 02:00:00 Asia/Jakarta
Persistent=true
Unit=siaga-backup.service

[Install]
WantedBy=timers.target
EOF
systemd-analyze verify "$staging/siaga-backup.service" "$staging/siaga-backup.timer"
created=1
install -m 644 "$staging/siaga-backup.service" /etc/systemd/system/siaga-backup.service
install -m 644 "$staging/siaga-backup.timer" /etc/systemd/system/siaga-backup.timer
systemctl daemon-reload
echo '[1/2] Menjalankan backup awal untuk menguji konfigurasi.'
systemctl start siaga-backup.service
echo '[2/2] Mengaktifkan jadwal harian pukul 02:00 WIB.'
systemctl enable --now siaga-backup.timer
systemctl is-active --quiet siaga-backup.timer
success=1
echo 'Backup lokal otomatis aktif. Website tidak direstart.'
echo "Lokasi backup privat: $backup_dir"
systemctl list-timers siaga-backup.timer --no-pager
echo 'Jadwal menggunakan Asia/Jakarta; tampilan kolom NEXT mengikuti timezone server.'
echo 'Belum termasuk salinan offsite, enkripsi, penghapusan berdasarkan retensi, atau notifikasi gagal.'
