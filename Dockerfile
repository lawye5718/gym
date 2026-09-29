# 多阶段构建：在镜像内完成依赖安装与打包，杜绝把旧 dist 产物部署到线上
# 阶段一：Node 构建 dist
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段二：Nginx 纯静态托管（SPA 回落由 nginx.conf 处理）
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
