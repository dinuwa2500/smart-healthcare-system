# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app
COPY services/telemedicine-service/package*.json ./
RUN npm install
COPY shared/ /shared/
COPY services/telemedicine-service/ .
EXPOSE 4006
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/telemedicine-service/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ /shared/
COPY --chown=appuser:appgroup services/telemedicine-service/ .

USER appuser
EXPOSE 4006
CMD ["node", "src/index.js"]
