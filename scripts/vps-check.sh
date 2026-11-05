#!/usr/bin/env bash
# Read-only inventory. Does not install packages, read secrets, or change services.
set -u

printf 'SIAGA ARSIP — pemeriksaan VPS\n'
printf 'Waktu: %s\n' "$(date -u +%FT%TZ)"
if [ -r /etc/os-release ]; then
  awk -F= '/^PRETTY_NAME=/{print "OS: " $2}' /etc/os-release
fi
printf '\nKapasitas\n'
command -v free >/dev/null 2>&1 && free -h
df -h /

printf '\nVersi perangkat lunak\n'
for program in node npm psql caddy; do
  if command -v "$program" >/dev/null 2>&1; then
    if [ "$program" = caddy ]; then caddy version; else "$program" --version; fi
  else
    printf '%s: tidak ditemukan di PATH\n' "$program"
  fi
done

printf '\nStatus layanan\n'
if command -v systemctl >/dev/null 2>&1; then
  for service in caddy postgresql siaga; do
    printf '%s: ' "$service"
    systemctl is-active "$service" || true
  done
fi
printf 'Nama service aplikasi dapat berbeda dari siaga.\n'

printf '\nPort aplikasi yang listen\n'
if command -v ss >/dev/null 2>&1; then
  ss -ltn '( sport = :3000 )'
fi

printf '\nEndpoint aplikasi lokal\n'
if command -v curl >/dev/null 2>&1; then
  for endpoint in health config; do
    printf '/api/%s: ' "$endpoint"
    response="$(curl --noproxy 127.0.0.1 --max-time 5 --max-filesize 65536 \
      --silent --show-error --write-out '\n%{http_code}' \
      "http://127.0.0.1:3000/api/$endpoint")" || true
    printf 'HTTP %s\n' "${response##*$'\n'}"
    if command -v node >/dev/null 2>&1; then
      printf '%s' "${response%$'\n'*}" | node -e '
        let input=""; process.stdin.setEncoding("utf8");
        process.stdin.on("data",chunk=>input+=chunk);
        process.stdin.on("end",()=>{
          try {
            const data=JSON.parse(input), safe={};
            for(const key of ["ok","demoMode"])
              if(typeof data[key]==="boolean")safe[key]=data[key];
            console.log(Object.keys(safe).length?JSON.stringify(safe):"Tidak ada status health/config yang dikenali.");
          } catch { console.log("Respons bukan JSON status aplikasi."); }
        });'
    fi
  done
else
  printf 'curl tidak ditemukan.\n'
fi

printf '\nTarget: health HTTP 200 {"ok":true}; config HTTP 200 {"demoMode":false}.\n'
printf 'Pemeriksaan ini belum membuktikan backup, restore, atau seluruh izin pengguna.\n'
