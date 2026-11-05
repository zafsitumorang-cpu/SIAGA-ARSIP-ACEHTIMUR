# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS node
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends postgresql postgresql-client git ca-certificates curl iproute2 python3 util-linux systemd && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
COPY repo.bundle /fixture/repo.bundle
RUN git clone --bare /fixture/repo.bundle /fixture/remote.git && git clone /fixture/remote.git /fixture/current && git config --global url.file:///fixture/remote.git.insteadOf https://github.com/zafsitumorang-cpu/SIAGA-ARSIP-ACEHTIMUR.git
RUN --mount=type=secret,id=proxy_ca cd /fixture/current && if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --omit=dev --ignore-scripts --no-audit --no-fund; else npm ci --omit=dev --ignore-scripts --no-audit --no-fund; fi
COPY systemctl.py /usr/local/bin/systemctl
COPY curl.py /usr/local/bin/curl
COPY run-test.py /fixture/run-test.py
RUN chmod +x /usr/local/bin/systemctl /usr/local/bin/curl
ENTRYPOINT ["python3","/fixture/run-test.py"]
