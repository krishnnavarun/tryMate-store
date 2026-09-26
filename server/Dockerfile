# tryMate store API (Express).
# Usually started with docker compose from the repo root (README → "Docker"). On its own:
#   docker build -t trymate-server ./server
#   docker run --rm -p 5000:5000 -e MONGO_URI=... -e JWT_SECRET=... (see server/.env.example) trymate-server

# Debian "slim", not Alpine: bcrypt ships a ready-made binary for glibc Linux only. On Alpine
# (musl) npm would have to compile it, which needs python, make and g++ in the image.
FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /srv

# Dependencies first: Docker reuses this layer as long as package*.json don't change,
# so editing code doesn't reinstall everything
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Run as the unprivileged "node" user that the official image provides, not root
USER node

ENV PORT=5000
EXPOSE 5000

# 200 while the database is connected (the AI being down only makes it "degraded")
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

# node itself is the main process, so it gets Docker's stop signal (SIGTERM) and index.js
# closes the server and the database connection cleanly
CMD ["node", "index.js"]
