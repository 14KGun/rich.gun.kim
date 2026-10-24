# api 이미지. 빌드 컨텍스트는 저장소 루트다.
#   docker build -f apps/api/Dockerfile .
FROM node:22.22.3-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:packages && pnpm --filter @rich/api build
# 프로덕션 의존성만 담은 api 디렉터리를 만든다. 내부 패키지는 dist 가 복사된다.
RUN pnpm --filter @rich/api deploy --prod --legacy /out

FROM node:22.22.3-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
