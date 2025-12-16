#!/bin/bash
# 系统工具链检查脚本
# 用法: ./check-toolchain.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

MISSING=()

check_cmd() {
  local name=$1
  local cmd=$2
  local install_hint=$3
  
  if command -v $cmd &> /dev/null; then
    version=$($cmd 2>&1 | head -n 1)
    echo -e "${GREEN}✅${NC} $name: $version"
  else
    echo -e "${RED}❌${NC} $name: 未安装"
    echo -e "   ${YELLOW}安装命令:${NC} $install_hint"
    MISSING+=("$name")
  fi
}

echo ""
echo "========================================"
echo "  开发工具链检查"
echo "========================================"
echo ""

echo "=== 运行时环境 ==="
check_cmd "Go" "go version" "https://go.dev/dl/"
check_cmd "Node.js" "node -v" "https://nodejs.org/"
check_cmd "npm" "npm -v" "(随 Node.js 安装)"
check_cmd "Python" "python3 --version" "https://python.org/"
check_cmd "uv" "uv --version" "curl -LsSf https://astral.sh/uv/install.sh | sh"
check_cmd "Docker" "docker --version" "https://docker.com/"
echo ""

echo "=== SSoT 工具链 ==="
check_cmd "Atlas" "atlas version" "curl -sSf https://atlasgo.sh | sh"
check_cmd "TypeSpec" "tsp --version" "npm install -g @typespec/compiler"
check_cmd "OpenSpec" "openspec --version" "npm install -g @fission-ai/openspec@latest"
echo ""

echo "=== 代码生成工具 ==="
check_cmd "oapi-codegen" "oapi-codegen --version" "go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest"
check_cmd "orval" "orval --version" "npm install -g orval"
check_cmd "datamodel-codegen" "datamodel-codegen --version" "uv tool install datamodel-code-generator"
echo ""

echo "=== Go 工具 ==="
check_cmd "gopls" "gopls version" "go install golang.org/x/tools/gopls@latest"
check_cmd "swag" "swag --version" "go install github.com/swaggo/swag/cmd/swag@latest"
echo ""

echo "========================================"
if [ ${#MISSING[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ 所有工具已安装完成！${NC}"
else
  echo -e "${YELLOW}⚠️  缺失 ${#MISSING[@]} 个工具:${NC}"
  for tool in "${MISSING[@]}"; do
    echo "   - $tool"
  done
  echo ""
  echo "请按照上述安装命令安装缺失的工具。"
fi
echo "========================================"
echo ""
