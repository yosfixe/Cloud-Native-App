FROM node:18-alpine
WORKDIR /app
# Copy dependency files first (layer caching optimization)
COPY package*.json ./
RUN npm install --omit=dev
# Copy source after dependencies
COPY . .
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "server.js"]
