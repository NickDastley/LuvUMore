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

CMD ["node", "server/src/index.js"]
