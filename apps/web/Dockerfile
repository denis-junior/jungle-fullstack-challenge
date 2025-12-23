FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL=http://localhost:3001/api
ARG VITE_WS_URL=ws://localhost:3004
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
