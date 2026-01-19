FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketuser

USER socketuser

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server.js"]
