FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tsconfig.json ./

RUN npm ci

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["./node_modules/.bin/tsx", "apps/pricing-service/src/index.ts"]
