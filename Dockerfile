# 纯静态托管：本地已构建好 dist，直接由 nginx 提供
FROM nginx:alpine

# SPA 配置：所有路径回落到 index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
