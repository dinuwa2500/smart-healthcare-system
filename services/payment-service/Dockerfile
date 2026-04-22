# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app
COPY services/payment-service/package*.json ./
RUN npm install
COPY shared/ ./shared/
COPY services/payment-service/ .
EXPOSE 4004
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/payment-service/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ ./shared/
COPY --chown=appuser:appgroup services/payment-service/ .

USER appuser
EXPOSE 4004
CMD ["node", "src/index.js"]
