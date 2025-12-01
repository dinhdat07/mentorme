# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# Install all dependencies (dev + prod) for build
FROM base AS build
COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.json
COPY prisma ./prisma
COPY src ./src

# Build TypeScript and remove devDependencies for a smaller runtime image
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Bring only what we need to run
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]
