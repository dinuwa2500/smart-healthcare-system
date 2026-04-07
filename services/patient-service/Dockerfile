# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app

RUN mkdir -p /app/uploads

COPY services/patient-service/package*.json ./
RUN npm install

ENV NODE_PATH=/app/node_modules

COPY shared/ /shared/
COPY services/patient-service/ ./

EXPOSE 4001
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

COPY services/patient-service/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

ENV NODE_PATH=/app/node_modules

COPY shared/ /shared/
COPY --chown=appuser:appgroup services/patient-service/ ./

USER appuser
EXPOSE 4001
CMD ["node", "src/index.js"]