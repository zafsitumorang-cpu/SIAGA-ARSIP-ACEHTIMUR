#!/usr/bin/env bash
# One-time enrollment; deploys only successful main pushes from the fixed public repo.
set +x
set -Eeuo pipefail
umask 077
sha="${1:-}"
[[ "$(id -u)" = 0 && "$sha" =~ ^[a-f0-9]{40}$ ]]
systemctl is-active --quiet siaga.service
systemctl is-active --quiet siaga-backup.timer
for unit in siaga-auto-deploy.service siaga-auto-deploy.timer;do
  if systemctl cat "$unit" >/dev/null 2>&1;then echo "Unit $unit sudah ada; tidak ditimpa.";exit 1;fi
done
[[ ! -e /usr/local/sbin/siaga-auto-deploy ]]
for file in /etc/systemd/system/siaga.service.d/50-auto-deploy.conf /etc/systemd/system/siaga-backup.service.d/50-auto-deploy.conf;do [[ ! -e "$file" ]];done
install -d -m 700 /var/lib/siaga-auto-deploy
staging="$(mktemp -d /var/tmp/siaga-auto-install-XXXXXX)"
created=0;success=0
cleanup(){
  local status="$?";trap - EXIT INT TERM HUP
  if [[ "$created" = 1 && "$success" != 1 ]];then
    systemctl disable --now siaga-auto-deploy.timer >/dev/null 2>&1 || true
    systemctl stop siaga-auto-deploy.service >/dev/null 2>&1 || true
    rm -f /etc/systemd/system/siaga-auto-deploy.service /etc/systemd/system/siaga-auto-deploy.timer /usr/local/sbin/siaga-auto-deploy
    systemctl daemon-reload >/dev/null 2>&1 || true
    echo 'Pemasangan otomatisasi belum selesai; data aplikasi dipertahankan.'
  fi
  rm -rf "$staging";exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
curl -fsSL --max-time 30 "https://raw.githubusercontent.com/zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR/$sha/scripts/auto-deploy.sh" -o "$staging/auto-deploy.sh"
bash -n "$staging/auto-deploy.sh"
cat >"$staging/siaga-auto-deploy.service" <<'EOF'
[Unit]
Description=CI-gated SIAGA ARSIP application update
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
User=root
ExecStart=/usr/local/sbin/siaga-auto-deploy
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=read-only
TimeoutStartSec=900
EOF
cat >"$staging/siaga-auto-deploy.timer" <<'EOF'
[Unit]
Description=Check tested SIAGA ARSIP commits every five minutes
[Timer]
OnBootSec=2min
OnUnitInactiveSec=5min
RandomizedDelaySec=30
Unit=siaga-auto-deploy.service
[Install]
WantedBy=timers.target
EOF
created=1
install -m 755 "$staging/auto-deploy.sh" /usr/local/sbin/siaga-auto-deploy
systemd-analyze verify "$staging/siaga-auto-deploy.service" "$staging/siaga-auto-deploy.timer"
install -m 644 "$staging/siaga-auto-deploy.service" /etc/systemd/system/siaga-auto-deploy.service
install -m 644 "$staging/siaga-auto-deploy.timer" /etc/systemd/system/siaga-auto-deploy.timer
systemctl daemon-reload
systemctl start siaga-auto-deploy.service
systemctl enable --now siaga-auto-deploy.timer
systemctl is-active --quiet siaga-auto-deploy.timer
success=1
echo 'Deployment otomatis aktif: push main → Application checks lulus → VPS backup dan update.'
echo 'Pemeriksaan setiap sekitar lima menit. Perubahan schema memerlukan migrasi terencana.'
systemctl list-timers siaga-auto-deploy.timer --no-pager
