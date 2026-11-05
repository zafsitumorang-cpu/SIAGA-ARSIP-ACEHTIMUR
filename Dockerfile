# syntax=docker/dockerfile:1
FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json app.mjs .env.example ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --omit=dev; else npm ci --omit=dev; fi
COPY lib ./lib
COPY db ./db
COPY public ./public
COPY scripts ./scripts
COPY data/files/.gitkeep ./data/files/.gitkeep

ENV NODE_ENV=production
# This image preserves the existing public demo. Override DEMO_MODE=false on the VPS.
ENV DEMO_MODE=true
ENV PORT=3000
EXPOSE 3000

CMD ["node", "app.mjs"]
