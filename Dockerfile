FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
RUN mkdir -p /data
EXPOSE 3001
CMD ["node", "server.js"]
