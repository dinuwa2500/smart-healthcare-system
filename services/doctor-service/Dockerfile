# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app

COPY services/doctor-service/package*.json ./
RUN npm install

ENV NODE_PATH=/app/node_modules

COPY shared/ /shared/
COPY services/doctor-service/ ./

EXPOSE 4002
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/doctor-service/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

ENV NODE_PATH=/app/node_modules

COPY shared/ /shared/
COPY --chown=appuser:appgroup services/doctor-service/ ./

USER appuser
EXPOSE 4002
CMD ["node", "src/index.js"]