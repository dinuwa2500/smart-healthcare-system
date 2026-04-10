# ── Stage 1: development ────────────────────────────────────
FROM node:18-alpine AS development
WORKDIR /app
# Install dependencies
COPY services/auth-service/package*.json ./
RUN npm install

ENV NODE_PATH=/app/node_modules

COPY shared/ /shared/
COPY services/auth-service/ ./

EXPOSE 4000
CMD ["node", "src/index.js"]

# ── Stage 2: production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app


COPY services/auth-service/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

ENV NODE_PATH=/app/node_modules

COPY shared/ /shared/
COPY --chown=appuser:appgroup services/auth-service/ ./

USER appuser
EXPOSE 4000
CMD ["node", "src/index.js"]