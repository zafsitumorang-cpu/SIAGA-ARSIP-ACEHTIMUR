#!/usr/bin/env bash
# One-time migration for the inspected Ubuntu VPS. Requires a reviewed full Git SHA.
set +x
set -Eeuo pipefail
umask 077

release_sha="${1:-}"
[[ "$release_sha" =~ ^[a-f0-9]{40}$ ]] || { echo 'Isi argumen commit SHA lengkap yang telah ditinjau.' >&2; exit 1; }
[[ "$(id -u)" = 0 ]] || { echo 'Jalankan melalui sudo/root.' >&2; exit 1; }
old_service=siaga-arsip.service
old_code=/opt/siaga-arsip
old_data=/var/lib/siaga-arsip
domain=siaga-arsipbawasluacehtimur.web.id
node_bin="$(readlink -f "$(command -v node)")"
"$node_bin" -e 'if(+process.versions.node.split(".")[0]<22)process.exit(1)'
for required in git curl ss flock systemctl runuser tar sha256sum install; do command -v "$required" >/dev/null; done
exec 9>/run/lock/siaga-arsip-upgrade.lock
flock -n 9 || { echo 'Upgrade lain sedang berjalan.' >&2; exit 1; }
[[ -r /etc/os-release ]] && . /etc/os-release
[[ "${ID:-}" = ubuntu && "${VERSION_ID:-}" = 24.04 ]] || { echo 'Skrip khusus Ubuntu 24.04 yang telah diperiksa.' >&2; exit 1; }
systemctl is-active --quiet "$old_service"
if systemctl cat siaga.service >/dev/null 2>&1; then echo 'Unit siaga.service sudah ada; hentikan untuk peninjauan, tidak ditimpa.' >&2; exit 1; fi
[[ ! -L "$old_code" && ! -L "$old_data" && -f "$old_data/data.json" && -d "$old_data/files" ]]
[[ "$(git -C "$old_code" rev-parse HEAD)" = a12e25843d59787bfafeec36594d4dec47f3aece ]] || { echo 'Release lama berubah; inventarisasi ulang sebelum migrasi.' >&2; exit 1; }
git -C "$old_code" diff --quiet
git -C "$old_code" diff --cached --quiet
old_pid="$(systemctl show "$old_service" -p MainPID --value)"
[[ "$old_pid" =~ ^[1-9][0-9]*$ && "$(readlink -f "/proc/$old_pid/cwd")" = "$old_code" ]]
"$node_bin" -e 'const fs=require("fs"),path=require("path");const entries=fs.readFileSync(`/proc/${process.argv[1]}/environ`,"utf8").split("\0");const value=entries.find(item=>item.startsWith("DATA_DIR="))?.slice(9);if(!value||path.resolve("/opt/siaga-arsip",value)!=="/var/lib/siaga-arsip")process.exit(1)' "$old_pid"
ss -ltnp '( sport = :3000 )' | grep -q "pid=$old_pid,"
[[ "$(ss -ltnH '( sport = :3100 )' | wc -l)" = 0 ]] || { echo 'Port uji 3100 sudah terpakai.' >&2; exit 1; }
if ! command -v psql >/dev/null && [[ -n "$(ss -ltnH '( sport = :5432 )')" ]]; then echo 'Port database sudah digunakan oleh layanan lain.' >&2; exit 1; fi

run_id="$(date -u +%Y%m%d%H%M%S)_$("$node_bin" -e 'process.stdout.write(require("crypto").randomBytes(3).toString("hex"))')"
backup="/var/backups/siaga-arsip/$run_id"
config="/etc/siaga-migrations/$run_id"
new_data="/var/lib/siaga-arsip-pg-$run_id"
release_dir="/opt/siaga-arsip-releases/$run_id"
db_name="siaga_$run_id"
db_role="siaga_$run_id"
install -d -m 700 "$backup" "$config" "$new_data"
install -d -m 755 /opt/siaga-arsip-releases
log_file="$backup/operations.log"
touch "$log_file"
maintenance=0
source_valid=0
unit_created=0
complete=0
old_enabled="$(systemctl is-enabled "$old_service" 2>/dev/null || true)"
log(){ printf '%s\n' "$*"; }
run(){ "$@" >>"$log_file" 2>&1; }
rollback(){
  local status="$?"
  trap - EXIT INT TERM
  if [[ "$complete" != 1 ]]; then
    log 'Upgrade belum selesai; menjalankan pemulihan yang aman.'
    if [[ "$unit_created" = 1 ]]; then
      systemctl stop siaga.service >>"$log_file" 2>&1 || true
      systemctl disable siaga.service >>"$log_file" 2>&1 || true
      rm -f /etc/systemd/system/siaga.service
      systemctl daemon-reload >>"$log_file" 2>&1 || true
    fi
    if [[ "$maintenance" = 1 && "$source_valid" = 1 ]]; then
      if [[ "$old_enabled" = enabled ]]; then systemctl enable "$old_service" >>"$log_file" 2>&1 || true; fi
      if systemctl start "$old_service" >>"$log_file" 2>&1; then log 'Layanan lama dinyalakan kembali; kode dan data aslinya dipertahankan.'; else log 'Layanan lama gagal start; periksa log melalui Console.'; fi
    elif [[ "$maintenance" = 1 ]]; then
      log 'JSON sumber tidak dapat diverifikasi setelah stop. Layanan dibiarkan berhenti agar kode lama tidak melakukan autoseed; gunakan snapshot privat untuk pemulihan.'
    fi
    log "Checkpoint/log privat: $backup"
  fi
  exit "$status"
}
trap rollback EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

log '[1/7] Mengambil release terpisah; layanan lama masih aktif.'
install -d -m 755 "$release_dir"
run git -C "$release_dir" init -q
run git -C "$release_dir" remote add origin https://github.com/zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR.git
run git -C "$release_dir" fetch --depth 1 origin "$release_sha"
run git -C "$release_dir" checkout --detach FETCH_HEAD
[[ "$(git -C "$release_dir" rev-parse HEAD)" = "$release_sha" ]]
cd "$release_dir"
run npm ci --omit=dev --ignore-scripts --no-audit --no-fund
chmod -R u=rwX,go=rX "$release_dir"
helper="$release_dir/scripts/vps-migrate.mjs"
run "$node_bin" "$helper" validate-json "$old_data/data.json"
cp -a "$old_data/data.json" "$backup/pre-maintenance-data.json"
run systemctl cat "$old_service"
systemctl cat "$old_service" >"$backup/legacy-service.txt"
git -C "$old_code" rev-parse HEAD >"$backup/legacy-revision.txt"
if [[ -f /etc/caddy/Caddyfile ]]; then cp -a /etc/caddy/Caddyfile "$backup/Caddyfile"; fi

log '[2/7] Menyiapkan PostgreSQL lokal dan pengguna aplikasi.'
if ! command -v psql >/dev/null || ! command -v pg_isready >/dev/null; then
  run env DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=l apt-get update
  run env DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=l apt-get install -y postgresql postgresql-client
fi
run systemctl enable --now postgresql
run pg_isready -q -h 127.0.0.1 -p 5432
listen_addresses="$(runuser -u postgres -- psql -h /var/run/postgresql -p 5432 -d postgres -X -Atqc 'SHOW listen_addresses')"
[[ "$listen_addresses" = localhost || "$listen_addresses" = 127.0.0.1 ]] || { log 'PostgreSQL tidak terbatas ke loopback; periksa konfigurasi sebelum melanjutkan.'; exit 1; }
if ! id siaga >/dev/null 2>&1; then run useradd --system --user-group --home-dir "$new_data" --shell /usr/sbin/nologin siaga; fi
[[ "$(id -u siaga)" != 0 ]]
run runuser -u siaga -- "$node_bin" -e 'process.exit(0)'
run "$node_bin" "$helper" init "$config" "$new_data" "$backup/postgres-backups" "$db_name" "$db_role" "$domain"
"$node_bin" "$helper" role-sql "$config" | run runuser -u postgres -- psql -h /var/run/postgresql -p 5432 -d postgres -X -q -v ON_ERROR_STOP=1
run "$node_bin" "$helper" migrate "$config"

log '[3/7] Menghentikan layanan lama sementara dan membuat snapshot final.'
maintenance=1
run systemctl stop "$old_service"
run "$node_bin" "$helper" validate-json "$old_data/data.json"
source_valid=1
run cp -a "$old_data" "$backup/legacy-data"
run tar -C "$old_code" --exclude=./node_modules -cpf "$backup/legacy-code.tar" .
run "$node_bin" "$helper" prepare "$backup/legacy-data" "$new_data" "$backup/import.json" "$backup/migration-summary.json"
run chown -R siaga:siaga "$new_data"
run chmod -R u=rwX,go= "$new_data"
sha256sum "$backup/legacy-data/data.json" "$old_data/data.json" >"$backup/source-sha256.txt"
cmp -s "$backup/legacy-data/data.json" "$old_data/data.json"

log '[4/7] Mengimpor arsip dan mereset kredensial lama.'
run "$node_bin" "$helper" import "$config" "$backup/import.json"
unit_created=1
cat > /etc/systemd/system/siaga.service <<EOF
[Unit]
Description=SIAGA ARSIP PostgreSQL
After=network.target postgresql.service
Conflicts=siaga-arsip.service

[Service]
Type=simple
User=siaga
Group=siaga
WorkingDirectory=$release_dir
EnvironmentFile=$config/runtime.env
ExecStart=$node_bin $release_dir/app.mjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$new_data

[Install]
WantedBy=multi-user.target
EOF
chmod 644 /etc/systemd/system/siaga.service
run systemctl daemon-reload
run systemctl start siaga.service
wait_ready(){
  local port="$1"
  for attempt in {1..45}; do
    if curl --noproxy 127.0.0.1 -fsS --max-time 2 "http://127.0.0.1:$port/api/health" 2>/dev/null | "$node_bin" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{process.exit(JSON.parse(s).ok===true?0:1)}catch{process.exit(1)}})'; then return 0; fi
    sleep 1
  done
  return 1
}

log '[5/7] Menguji kandidat pada loopback 3100 dan membuat backup PostgreSQL.'
wait_ready 3100
run "$node_bin" "$helper" verify "$config" "$backup/import.json" "$backup/migration-summary.json" 3100
run "$node_bin" "$helper" backup "$config"
runuser -u postgres -- pg_dump -h /var/run/postgresql -p 5432 "$db_name" >"$backup/postgres-before-cutover.sql"
sha256sum "$backup/legacy-code.tar" "$backup/import.json" "$backup/postgres-before-cutover.sql" >"$backup/SHA256SUMS"

log '[6/7] Mengaktifkan layanan baru pada loopback 3000; Caddy dipertahankan.'
run systemctl stop siaga.service
install -m 600 "$config/production.env" "$config/runtime.env"
run systemctl start siaga.service
wait_ready 3000
run "$node_bin" "$helper" verify "$config" "$backup/import.json" "$backup/migration-summary.json" 3000
public_status(){
  curl -fsS --max-time 15 "https://$domain/api/$1" | "$node_bin" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{const d=JSON.parse(s);process.exit(process.argv[1]==="health"?d.ok===true?0:1:d.demoMode===false?0:1)}catch{process.exit(1)}})' "$1"
}
public_status health
public_status config
run systemctl disable "$old_service"
run systemctl enable siaga.service
complete=1
log '[7/7] Upgrade selesai; health dan mode produksi lulus.'
log "Website: https://$domain"
log "Backup privat: $backup"
log "Akses admin BARU tersimpan privat di: $config/admin-access.json"
log 'Akun lama selain admin dinonaktifkan. Ambil kredensial melalui Console pribadi; jangan kirim isinya ke chat.'
log 'Backup ini masih lokal. Scheduler/offsite, uji pemulihan menyeluruh dan penerimaan fitur tetap perlu diselesaikan.'
