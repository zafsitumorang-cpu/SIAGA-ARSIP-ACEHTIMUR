#!/usr/bin/env bash
# Root-owned CI-gated updater for this public repository. No incoming SSH access.
set +x
set -Eeuo pipefail
umask 077
[[ "$(id -u)" = 0 ]]
exec 9>/run/lock/siaga-auto-deploy.lock
flock -n 9 || exit 0
state=/var/lib/siaga-auto-deploy
repo=https://github.com/zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR.git
api=https://api.github.com/repos/zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR/actions/runs
node_bin="$(readlink -f "$(command -v node)")"
[[ "$node_bin" =~ ^/(usr|opt)/[a-zA-Z0-9_./-]+$ ]]
systemctl is-active --quiet siaga.service
sha="$(git ls-remote "$repo" refs/heads/main | awk '{print $1}')"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]]
if [[ -f "$state/last-seen" && "$(cat "$state/last-seen")" = "$sha" ]]; then exit 0; fi
ci_file="$(mktemp "$state/ci-XXXXXX")"
trap 'rm -f "$ci_file"' EXIT
curl -fsS --max-time 30 -H 'Accept: application/vnd.github+json' "$api?head_sha=$sha&event=push&branch=main&per_page=20" -o "$ci_file"
if ! "$node_bin" -e '
try {
  const data=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  const run=data.workflow_runs.find(r=>r.path===".github/workflows/checks.yml"&&r.head_sha===process.argv[2]&&r.event==="push"&&r.head_branch==="main"&&r.head_repository?.full_name==="zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR");
  process.exit(run?.status==="completed"&&run.conclusion==="success"?0:1);
} catch {process.exit(1)}' "$ci_file" "$sha"; then
  echo 'Commit terbaru belum lulus Application checks; layanan dipertahankan.';exit 0
fi
old_dir="$(systemctl show siaga.service -p WorkingDirectory --value)"
env_descriptor="$(systemctl show siaga.service -p EnvironmentFiles --value)"
[[ "$old_dir" =~ ^/opt/siaga-arsip-releases/([0-9]{14}_[a-f0-9]{6}|auto-[a-f0-9]{40})$ ]]
[[ "$env_descriptor" =~ ^(/etc/siaga-migrations/[0-9]{14}_[a-f0-9]{6}/runtime.env)\ \(ignore_errors=no\)$ ]]
env_file="${BASH_REMATCH[1]}"
data_dir="$("$node_bin" -e 'const c=JSON.parse(require("fs").readFileSync(require("path").join(process.argv[1],"settings.json")));if(c.env.DEMO_MODE!=="false"||!/^\/var\/lib\/siaga-arsip-pg-[0-9]{14}_[a-f0-9]{6}$/.test(c.env.DATA_DIR))process.exit(1);process.stdout.write(c.env.DATA_DIR)' "$(dirname "$env_file")")"
old_sha="$(git -C "$old_dir" rev-parse HEAD)"
[[ "$old_sha" =~ ^[a-f0-9]{40}$ ]]
if [[ "$old_sha" = "$sha" ]]; then printf '%s\n' "$sha" >"$state/last-seen";exit 0;fi
run_id="$(date -u +%Y%m%d%H%M%S)_${sha:0:12}"
backup="/var/backups/siaga-deploy/$run_id"
new_dir="/opt/siaga-arsip-releases/auto-$sha"
install -d -m 700 "$backup"
log_file="$backup/operations.log"
trap 'status=$?;rm -f "$ci_file";if [[ "$status" != 0 ]];then echo "Update belum selesai; log privat: $backup";fi;exit "$status"' EXIT
run(){ "$@" >>"$log_file" 2>&1; }
echo "[1/5] CI lulus; menyiapkan commit $sha."
if [[ ! -e "$new_dir" ]]; then
  install -d -m 755 "$new_dir"
  run git -C "$new_dir" init -q
  run git -C "$new_dir" remote add origin "$repo"
fi
[[ ! -L "$new_dir" && "$(git -C "$new_dir" config --get remote.origin.url)" = "$repo" ]]
run git -C "$new_dir" fetch --depth 1 origin "$sha" "$old_sha"
run git -C "$new_dir" checkout --detach "$sha"
[[ "$(git -C "$new_dir" rev-parse HEAD)" = "$sha" ]]
if ! git -C "$new_dir" diff --name-only "$old_sha" "$sha" | grep -Eq '^(app\.mjs|public/|lib/|package\.json$|package-lock\.json$|db/|scripts/backup\.mjs$)'; then
  printf '%s\n' "$sha" >"$state/last-seen";echo 'Tidak ada perubahan aplikasi; layanan dipertahankan.';exit 0
fi
cmp -s "$old_dir/db/schema.sql" "$new_dir/db/schema.sql" || { echo 'Schema berubah; diperlukan migrasi terencana. Update otomatis dihentikan.';exit 1; }
run npm --prefix "$new_dir" ci --cache "$state/npm-cache" --omit=dev --ignore-scripts --no-audit --no-fund
chmod -R u=rwX,go=rX "$new_dir"
systemctl cat siaga-backup.service >/dev/null
echo '[2/5] Membuat snapshot database dan berkas sebelum update.'
run systemctl start siaga-backup.service
systemctl cat siaga-candidate.service >/dev/null 2>&1 && { echo 'Unit kandidat sudah ada; periksa sebelum melanjutkan.';exit 1; }
[[ -z "$(ss -ltnH '( sport = :3100 )')" ]]
cp "$env_file" "$backup/candidate.env"
printf '\nHOST=127.0.0.1\nPORT=3100\n' >>"$backup/candidate.env"
main_override=/etc/systemd/system/siaga.service.d/50-auto-deploy.conf
backup_override=/etc/systemd/system/siaga-backup.service.d/50-auto-deploy.conf
had_main=0;had_backup=0;switched=0;candidate=0;complete=0
if [[ -f "$main_override" ]]; then cp "$main_override" "$backup/main-override";had_main=1;fi
if [[ -f "$backup_override" ]]; then cp "$backup_override" "$backup/backup-override";had_backup=1;fi
cleanup(){
  local status="$?"
  trap - EXIT INT TERM HUP
  if [[ "$candidate" = 1 ]]; then systemctl stop siaga-candidate.service >>"$log_file" 2>&1 || true;rm -f /etc/systemd/system/siaga-candidate.service;fi
  if [[ "$switched" = 1 && "$complete" != 1 ]]; then
    if [[ "$had_main" = 1 ]]; then cp "$backup/main-override" "$main_override";else rm -f "$main_override";fi
    if [[ "$had_backup" = 1 ]]; then cp "$backup/backup-override" "$backup_override";else rm -f "$backup_override";fi
    systemctl daemon-reload >>"$log_file" 2>&1 || true
    recovered=0
    if systemctl restart siaga.service >>"$log_file" 2>&1;then
      for retry in {1..15};do if check http://127.0.0.1:3000 >>"$log_file" 2>&1;then recovered=1;break;fi;sleep 1;done
    fi
    if [[ "$recovered" = 1 ]];then echo 'Kode layanan sebelumnya sehat kembali; database tidak diputar balik.';else echo 'Pemulihan layanan belum sehat; periksa log privat melalui Console.';fi
  fi
  systemctl daemon-reload >>"$log_file" 2>&1 || true
  rm -f "$ci_file" "$backup/candidate.env"
  if [[ "$status" != 0 ]]; then echo "Update belum selesai; log privat: $backup";fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
candidate=1
cat >/etc/systemd/system/siaga-candidate.service <<EOF
[Unit]
Description=SIAGA ARSIP update candidate
After=postgresql.service
[Service]
Type=simple
User=siaga
Group=siaga
WorkingDirectory=$new_dir
EnvironmentFile=$backup/candidate.env
ExecStart=$node_bin $new_dir/app.mjs
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$data_dir
UMask=0077
EOF
chmod 644 /etc/systemd/system/siaga-candidate.service
run systemctl daemon-reload
run systemctl start siaga-candidate.service
check(){
  local base="$1"
  curl -fsS --max-time 10 "$base/api/health" | "$node_bin" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{process.exit(JSON.parse(s).ok===true?0:1)}catch{process.exit(1)}})'
  curl -fsS --max-time 10 "$base/api/config" | "$node_bin" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{process.exit(JSON.parse(s).demoMode===false?0:1)}catch{process.exit(1)}})'
}
echo '[3/5] Memeriksa kandidat pada loopback 3100.'
ready=0
for attempt in {1..30};do if check http://127.0.0.1:3100 >>"$log_file" 2>&1;then ready=1;break;fi;sleep 1;done
[[ "$ready" = 1 ]]
[[ "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:3100/api/archives)" = 401 ]]
[[ "$(git ls-remote "$repo" refs/heads/main | awk '{print $1}')" = "$sha" ]] || { echo 'Main berubah saat pengujian; commit terbaru akan diperiksa pada jadwal berikutnya.';exit 0; }
run systemctl stop siaga-candidate.service
echo '[4/5] Mengganti kode layanan; data dan akun tetap dipertahankan.'
install -d -m 755 "$(dirname "$main_override")" "$(dirname "$backup_override")"
switched=1
for kind in app backup;do
  if [[ "$kind" = app ]];then target="$main_override";entry=app.mjs;else target="$backup_override";entry=scripts/backup.mjs;fi
  printf '[Service]\nWorkingDirectory=%s\nExecStart=\nExecStart=%s %s/%s\n' "$new_dir" "$node_bin" "$new_dir" "$entry" >"$target"
  chmod 644 "$target"
done
run systemctl daemon-reload
run systemctl restart siaga.service
ready=0
for attempt in {1..30};do if check http://127.0.0.1:3000 >>"$log_file" 2>&1;then ready=1;break;fi;sleep 1;done
[[ "$ready" = 1 && "$(systemctl show siaga.service -p WorkingDirectory --value)" = "$new_dir" ]]
check https://siaga-arsipbawasluacehtimur.web.id >>"$log_file" 2>&1
printf '%s\n' "$sha" >"$state/last-seen"
complete=1
echo "[5/5] Commit $sha aktif; health dan mode produksi lulus."
