# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy dependencies
COPY bun.lock package.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN bun install

# Copy app source
COPY . .

# Build with Bun
RUN bun run build

# Production stage
FROM oven/bun:latest AS runner

WORKDIR /app

# Copy dependencies
COPY bun.lock package.json ./

# Install only production dependencies
RUN bun install --production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose app port
EXPOSE 3000

# Start with Bun
CMD ["bun", "run", "start"]
