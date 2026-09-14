# Next.js standalone 빌드 기반 멀티스테이지 이미지.
# sever 레포 서비스들과 동일하게 "빌드 따로, 실행 이미지는 결과물만" 원칙을 따른다.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S --ingroup appgroup -H appuser

# standalone 출력물은 실행에 필요한 node_modules 서브셋을 이미 포함한다.
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

USER appuser
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["node", "server.js"]
