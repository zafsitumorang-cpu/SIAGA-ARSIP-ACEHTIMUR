FROM node:20-alpine

WORKDIR /app
COPY package.json app.mjs .env.example ./
COPY public ./public
COPY scripts ./scripts
COPY data/files/.gitkeep ./data/files/.gitkeep

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "app.mjs"]
