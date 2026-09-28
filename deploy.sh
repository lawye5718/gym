#!/usr/bin/env bash
# 在 Synology NAS 上运行（需先把本目录传到 NAS，例如 ~/gym-tracker）
# 用法： bash deploy.sh
# 前置：NAS 已安装 Docker（ContainerManager，docker 路径 /usr/local/bin/docker）
#
# 注意：cloudflared 隧道在本机 Mac 上运行（launchd: com.cloudflare.cloudflared.user），
#       处理 *.damingxing.vip，与 drive/file/audio/photo 等规则一致。
#       应用容器本身在 NAS 上 --restart always 实现 24h 常驻。
set -e

IMAGE=gym-tracker
HOST_PORT=8787   # 宿主机映射端口，避开 DSM 5000 / 已有服务，避免冲突
CONTAINER_PORT=80

echo "==> 构建镜像"
docker build -t "$IMAGE" .

echo "==> 停止并删除旧容器（如有）"
docker rm -f "$IMAGE" 2>/dev/null || true

echo "==> 启动容器（--restart always 实现 24h 常驻）"
docker run -d --name "$IMAGE" --restart always -p "${HOST_PORT}:${CONTAINER_PORT}" "$IMAGE"

echo "==> 容器状态"
docker ps --filter "name=$IMAGE" --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'

echo
echo "==> 隧道（已在本机 Mac 的 ~/.cloudflared/config.yml 配置，无需在 NAS 操作）"
echo "ingress 已加入："
echo "  - hostname: gym.damingxing.vip"
echo "    service: http://192.168.0.107:${HOST_PORT}"
echo "改完配置后重载本机隧道： launchctl kickstart -k gui/\$(id -u)/com.cloudflare.cloudflared.user"
echo
echo "完成访问： https://gym.damingxing.vip"
