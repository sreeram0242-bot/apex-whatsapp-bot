FROM node:22-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm install --omit=dev

# Copy source code and assets
COPY src/ ./src/
COPY assets/ ./assets/

# Create directories for persistent volumes
RUN mkdir -p sessions uploads

# Expose server port
EXPOSE 3000

# Environment defaults
ENV PORT=3000
ENV NODE_ENV=production

# Start WhatsApp bot server
CMD ["node", "src/server.js"]
