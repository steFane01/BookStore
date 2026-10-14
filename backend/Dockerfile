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

# Uploads dir — writable by the non-root `app` user so admin image uploads work.
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app

ENV NODE_ENV=production
ENV PORT=4000
ENV UPLOAD_DIR=/app/uploads

EXPOSE 4000

CMD ["node", "src/server.js"]
