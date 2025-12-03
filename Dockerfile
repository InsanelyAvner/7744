# Stage 1: Install production dependencies
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2: Copy source & build
FROM node:24-alpine AS builder
WORKDIR /app

# Copy everything (including your pages, components, etc.)
COPY . .

# Bring in installed deps
COPY --from=deps /app/node_modules ./node_modules

# Ensure public/ exists so later COPY won't error
RUN mkdir -p public

# Run the Next.js build
RUN npm run build

# Stage 3: Assemble production image
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/public       ./public
COPY --from=builder /app/package.json ./package.json

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]
