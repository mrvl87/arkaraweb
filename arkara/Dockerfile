FROM node:23-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:23-bookworm-slim AS builder
WORKDIR /app

ARG PUBLIC_ASSISTANT_API_URL
ENV PUBLIC_ASSISTANT_API_URL=${PUBLIC_ASSISTANT_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:23-bookworm-slim AS runner
WORKDIR /app

ARG PUBLIC_ASSISTANT_API_URL
ENV PUBLIC_ASSISTANT_API_URL=${PUBLIC_ASSISTANT_API_URL}
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "./dist/server/entry.mjs"]
