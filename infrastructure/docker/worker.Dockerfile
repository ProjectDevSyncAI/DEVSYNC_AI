FROM node:22-alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY prisma ./prisma
COPY apps/worker/package.json ./apps/worker/package.json

RUN pnpm install --frozen-lockfile

COPY apps/worker ./apps/worker

CMD ["pnpm", "--filter", "@devsync/worker", "dev"]
