# ---------------------------------------------------------------------------
# Librăria frontend — multi-stage build
#   Stage 1: build the Vite/React app with Node
#   Stage 2: serve the static dist/ with nginx (SPA fallback + /api proxy)
#
# Build context is the REPO ROOT (the app source lives there); compose sets
# `context: ..` relative to the frontend/ dir.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime ----
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
