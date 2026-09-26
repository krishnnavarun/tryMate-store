# tryMate web app: the React build, served by nginx, which also forwards /api to the server.
# Usually started with docker compose from the repo root (README → "Docker").

# ---- Stage 1: build the React app (Node is only needed here) ------------------------------
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The browser calls the API on its own origin (/api) and nginx forwards it to the server,
# so the login cookie is first-party (README → "Deployment", cookies)
ENV VITE_API_URL=/api
# "prebuild" first copies MediaPipe's wasm into public/, so it ends up in dist/mediapipe/
RUN npm run build

# ---- Stage 2: only the built files + nginx (no Node, no node_modules) ----------------------
FROM nginx:stable-alpine

# The nginx image fills in ${API_UPSTREAM} in files from /etc/nginx/templates/ when it starts
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Where /api goes: the "server" service of docker-compose.yml (override for other setups)
ENV API_UPSTREAM=http://server:5000
EXPOSE 80
