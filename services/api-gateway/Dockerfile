# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm install
COPY services/api-gateway/ .
EXPOSE 3000
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/api-gateway/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=appuser:appgroup services/api-gateway/ .

USER appuser
EXPOSE 3000
CMD ["node", "src/index.js"]
