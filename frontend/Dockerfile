# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install lightweight HTTP server
RUN npm install -g http-server

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy .env.production if needed
COPY .env.production* ./

EXPOSE 3000

# Serve the built application
CMD ["http-server", "dist", "-p", "3000", "--gzip", "-c-1"]
