# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app
COPY services/notification-service/package*.json ./
RUN npm install
COPY services/notification-service/ .
EXPOSE 4005
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/notification-service/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=appuser:appgroup services/notification-service/ .

USER appuser
EXPOSE 4005
CMD ["node", "src/index.js"]
