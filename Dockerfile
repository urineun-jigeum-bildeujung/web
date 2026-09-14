# standalone 산출물은 Jenkinsfile의 Build 스테이지에서 node 컨테이너가 미리 만들어둠 —
# kaniko 안에서 npm ci + npm run build를 통째로 돌리면 852개 패키지 설치 + 빌드 스냅샷
# 오버헤드로 ephemeral-storage 3Gi를 초과해 파드가 Evicted됨(2026-09-14 실제로 겪음,
# sever 서비스들에서 gradle bootJar를 kaniko 밖으로 뺀 것과 동일한 문제/해법). 여기서는
# 이미 만들어진 산출물만 담는다.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S --ingroup appgroup -H appuser

COPY --chown=appuser:appgroup .next/standalone ./
COPY --chown=appuser:appgroup .next/static ./.next/static
COPY --chown=appuser:appgroup public ./public

USER appuser
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["node", "server.js"]
