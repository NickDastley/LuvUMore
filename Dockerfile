FROM node:22-alpine

ENV NODE_ENV=production \
    TZ=Europe/Berlin \
    DB_PATH=/data/app.db

WORKDIR /app

# Dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --omit=dev || npm install --omit=dev

# App source
COPY server ./server

EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "server/src/index.js"]
