# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max_old_space_size=4096

ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51TELjBDO2IzKL0HDjfAMs3k0LlRJWCRdVD220d0UUXFY8mxBDl06t8pZ6GAbyGUX3rwKsXAOWwR8TO3DPHKxMnyD00jaaCJ3qN
ARG NEXT_PUBLIC_AGORA_APP_ID=ba69b6c1dff645af975610d607c25851
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=$NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ENV NEXT_PUBLIC_AGORA_APP_ID=$NEXT_PUBLIC_AGORA_APP_ID

RUN npx next build --no-lint

# ── Stage 3: production runner ───────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

USER appuser
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
