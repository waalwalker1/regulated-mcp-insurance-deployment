FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/mcp-server/ ./apps/mcp-server/
COPY tsconfig.json ./

RUN npm install --legacy-peer-deps

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npx", "tsx", "apps/mcp-server/src/index.ts"]
