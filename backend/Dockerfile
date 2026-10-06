# ---------------------------------------------------------------------------
# Librăria backend — template image
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

# Run as non-root for security
RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/server.js"]
