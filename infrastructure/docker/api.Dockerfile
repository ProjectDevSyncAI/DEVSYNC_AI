FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY prisma ./prisma
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
RUN pnpm --filter @devsync/api build

EXPOSE 3000
CMD ["pnpm", "--filter", "@devsync/api", "start:prod"]
