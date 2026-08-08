#!/usr/bin/env bash
set -e

# -----------------------------------------------------------------------------
# 一键自动化部署脚本：danke-core / danke-web / danke-admin 到 124.220.195.160
# -----------------------------------------------------------------------------

SERVER_IP="124.220.195.160"
SERVER_USER="root"
BASE_DIR="/Users/hbt/my-project"

echo "🚀 [1/4] 开始本地三端项目增量构建 (Build)..."

# 1. 构建 danke-core
echo "📦 构建 danke-core (NestJS)..."
cd "$BASE_DIR/apps/danke-core"
npm run build

# 2. 构建 danke-web
echo "📦 构建 danke-web (Next.js)..."
cd "$BASE_DIR/apps/danke-web"
npm run build

# 3. 构建 danke-admin
echo "📦 构建 danke-admin (Next.js)..."
cd "$BASE_DIR/apps/danke-admin"
NEXT_PUBLIC_CORE_API_URL="https://dankecore.guaguahub.cn" npm run build

echo "✅ [1/4] 本地三端构建完成！"

echo "📤 [2/4] 开始将轻量构建产物传输至云服务器 ($SERVER_IP)..."

# 传输 danke-core
echo "🚚 传输 danke-core 产物..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'src' \
  "$BASE_DIR/apps/danke-core/dist" \
  "$BASE_DIR/apps/danke-core/generated" \
  "$BASE_DIR/apps/danke-core/prisma" \
  "$BASE_DIR/apps/danke-core/data" \
  "$BASE_DIR/apps/danke-core/package.json" \
  "$BASE_DIR/apps/danke-core/.env" \
  "$SERVER_USER@$SERVER_IP:/var/www/danke-core/"

# 传输 danke-web
echo "🚚 传输 danke-web 产物..."
mkdir -p "$BASE_DIR/apps/danke-web/public"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  "$BASE_DIR/apps/danke-web/.next" \
  "$BASE_DIR/apps/danke-web/public" \
  "$BASE_DIR/apps/danke-web/package.json" \
  "$SERVER_USER@$SERVER_IP:/var/www/danke-web/"

# 传输 danke-admin
echo "🚚 传输 danke-admin 产物..."
mkdir -p "$BASE_DIR/apps/danke-admin/public"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  "$BASE_DIR/apps/danke-admin/.next" \
  "$BASE_DIR/apps/danke-admin/public" \
  "$BASE_DIR/apps/danke-admin/package.json" \
  "$SERVER_USER@$SERVER_IP:/var/www/danke-admin/"

echo "✅ [2/4] 产物文件同步完成！"

echo "🔧 [3/4] 远程服务器安装生产依赖与环境准备..."

ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
  set -e
  echo '⚙️ 安装 danke-core 依赖...'
  cd /var/www/danke-core && npm install --omit=dev

  echo '⚙️ 安装 danke-web 依赖...'
  cd /var/www/danke-web && npm install --omit=dev

  echo '⚙️ 安装 danke-admin 依赖...'
  cd /var/www/danke-admin && npm install --omit=dev
"

echo "✅ [3/4] 远程依赖安装完成！"

echo "🔄 [4/4] 重载 PM2 进程与 Nginx 服务..."

ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
  pm2 startOrReload /var/www/ecosystem.config.js
  pm2 save
  systemctl reload nginx
  echo '=== PM2 进程运行状态 ==='
  pm2 list
"

echo "🎉 [部署成功] 三端服务已成功部署并在服务器 124.220.195.160 上启动！"
echo "🌐 API 接口端: https://dankecore.guaguahub.cn (端口: 3003)"
echo "🌐 前台 Web 端: https://dankeweb.guaguahub.cn (端口: 8002)"
echo "🌐 后台 Admin 端: https://dankeadmin.guaguahub.cn (端口: 8003)"
