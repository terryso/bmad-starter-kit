#!/bin/bash

# 前端部署脚本 - 部署到 surge.sh

set -e

echo "🚀 开始部署前端到 surge.sh..."

# 检查是否安装了 surge
if ! command -v surge &> /dev/null; then
    echo "❌ surge 未安装，正在安装..."
    npm install -g surge
fi

# 进入 web 目录
cd "$(dirname "$0")"

# 加载生产环境变量
export $(cat .env.production | grep -v '^#' | xargs)

# 构建
echo "📦 构建前端..."
pnpm run build

# 部署到 surge
echo "📤 部署到 surge.sh..."
# 如果没有提供域名，surge 会提示输入
surge dist --domain bmad-starter-kit.surge.sh

echo "✅ 部署完成！"
echo "🌐 访问: https://bmad-starter-kit.surge.sh"
