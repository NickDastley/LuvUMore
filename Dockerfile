FROM node:22-alpine

# Build arguments for versioning
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=0.2.0

# OCI Labels for better container metadata
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.authors="NickDastley"
LABEL org.opencontainers.image.url="https://github.com/NickDastley/LuvUMore"
LABEL org.opencontainers.image.documentation="https://github.com/NickDastley/LuvUMore/blob/main/README.md"
LABEL org.opencontainers.image.source="https://github.com/NickDastley/LuvUMore"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.vendor="NickDastley"
LABEL org.opencontainers.image.title="LuvUMore"
LABEL org.opencontainers.image.description="Minimal web app to track daily relationship wins between two partners"
LABEL maintainer="NickDastley"

# Environment defaults
ENV NODE_ENV=production \
    TZ=Europe/Berlin \
    DB_PATH=/data/app.db \
    PORT=3000

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# Copy application source
COPY server ./server

# Expose port (configurable via ENV)
EXPOSE ${PORT}

# Volume for persistent data
VOLUME ["/data"]

# Healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Run as non-root user for security (use existing node user with UID/GID 1000)
RUN mkdir -p /data && \
    chown -R node:node /app /data

USER node

# Start application
CMD ["node", "server/src/index.js"]
