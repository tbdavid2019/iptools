# 第一阶段：构建
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 設置構建時的環境變量
ENV VITE_DEFAULT_IP_GEO_SOURCE=1

RUN npm run build

# 第二阶段：运行
FROM node:20-alpine as production-stage
WORKDIR /app
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/package.json ./
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/backend-server.js ./
COPY --from=build-stage /app/frontend-server.js ./
COPY --from=build-stage /app/api ./api
COPY --from=build-stage /app/common ./common

EXPOSE 6001

# 启动应用
CMD ["npm", "start"]
