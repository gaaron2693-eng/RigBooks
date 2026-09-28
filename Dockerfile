FROM oven/bun:1.3.10-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY deployment/package.json deployment/bun.lock ./
RUN bun install --frozen-lockfile

COPY deployment/src ./src
COPY deployment/postgres ./postgres
COPY deployment/client-dist ./client-dist
COPY deployment/tsconfig.json ./tsconfig.json
RUN bun run build

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-3000}/health || exit 1
CMD ["bun", "run", "start"]
