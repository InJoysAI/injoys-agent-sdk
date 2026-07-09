#!/bin/bash
# MCP 配置检查脚本
# 用法: 
#   ./check-mcp.sh                    # 检查所有 AI 工具（默认）
#   ./check-mcp.sh --tool devin    # 仅检查 Devin MCP 配置
#   ./check-mcp.sh --tool cursor      # 仅检查 Cursor MCP 配置
#   ./check-mcp.sh --tool claude      # 仅检查 Claude Desktop MCP 配置
#   ./check-mcp.sh --tool antigravity # 仅检查 Antigravity 工作流配置

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TARGET_TOOL="all"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --tool|-t)
      TARGET_TOOL="$2"
      shift 2
      ;;
    --help|-h)
      echo "用法: $0 [--tool <tool_name>]"
      echo ""
      echo "选项:"
      echo "  --tool, -t <name>  指定要检查的 AI 工具"
      echo "                     可选值: all, devin, cursor, claude, antigravity"
      echo "  --help, -h         显示帮助信息"
      echo ""
      echo "示例:"
      echo "  $0                      # 检查所有"
      echo "  $0 --tool devin      # 仅检查 Devin"
      echo "  $0 -t antigravity       # 仅检查 Antigravity"
      exit 0
      ;;
    *)
      echo "未知参数: $1"
      echo "使用 --help 查看帮助"
      exit 1
      ;;
  esac
done

echo ""
echo "========================================"
echo "MCP 配置检查"
echo "========================================"
echo ""

echo "=== MCP 服务器可用性 ==="

# MCP 服务器检查 (验证 npm 包是否存在)
check_npm_package() {
  local name=$1
  local package=$2
  
  if npm view $package version &> /dev/null 2>&1; then
    version=$(npm view $package version 2>/dev/null)
    echo -e "${GREEN}✅${NC} $name: v$version (npm)"
  else
    echo -e "${YELLOW}⚠️${NC} $name: 无法验证 (检查网络或包名)"
  fi
}

# Python MCP 服务器检查 (使用 pip/uv)
check_python_package() {
  local name=$1
  local package=$2
  
  if uv tool list | grep -q "$package" &> /dev/null || uv pip show $package &> /dev/null 2>&1 || pip3 show $package &> /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name: 已安装 (Python)"
  else
    echo -e "${YELLOW}⚠️${NC} $name: 未安装"
    echo -e "   ${YELLOW}安装:${NC} uv tool install $package 或 pipx install $package"
  fi
}

# npm MCP 服务器
check_npm_package "filesystem-mcp" "@modelcontextprotocol/server-filesystem"
check_npm_package "sequential-thinking" "@modelcontextprotocol/server-sequential-thinking"
check_npm_package "memory-mcp" "@modelcontextprotocol/server-memory"

# Python MCP 服务器 (postgres-mcp 是 Python 包)
check_python_package "postgres-mcp" "postgres-mcp"

# Go Binary 检查
check_go_binary() {
  local name=$1
  local binary=$2
  local package=$3

  if command -v $binary &> /dev/null || [ -f "$HOME/go/bin/$binary" ]; then
    echo -e "${GREEN}✅${NC} $name: 已安装"
  else
    echo -e "${YELLOW}⚠️${NC} $name: 未安装"
    echo -e "   ${YELLOW}安装:${NC} go install $package"
  fi
}

# GitHub MCP
check_npm_package "github-mcp" "@modelcontextprotocol/server-github"

# Context7 - 实时文档知识注入
check_npm_package "context7" "@upstash/context7-mcp"

# Tailwind CSS MCP - CSS 转换与文档检索
check_npm_package "tailwindcss-mcp" "tailwindcss-mcp-server"

# Playwright MCP - 浏览器自动化测试
check_npm_package "playwright-mcp" "@playwright/mcp"

# mcp-gopls - Go 语义分析 (LSP MCP wrapper)
check_go_binary "mcp-gopls" "mcp-gopls" "github.com/hloiseaufcms/mcp-gopls/cmd/mcp-gopls@latest"

# 注意: basedpyright/ruff 是 LSP 工具，应通过 IDE 扩展使用，不作为 MCP

echo ""

echo "=== MCP 配置文件 ==="

check_mcp_config() {
  local name=$1
  local path=$2
  local key=$3
  
  if [ -f "$path" ]; then
    echo -e "${GREEN}✅${NC} $name: 已存在"
    # 检查是否包含 mcpServers 或 servers
    if grep -q "$key" "$path" 2>/dev/null; then
      echo -e "   ${GREEN}✓${NC} MCP 服务器已配置"
    else
      echo -e "   ${YELLOW}⚠️${NC} MCP 服务器未配置"
    fi
  else
    echo -e "${YELLOW}⚠️${NC} $name: 未找到"
    echo -e "   ${YELLOW}配置路径:${NC} $path"
  fi
}

# Antigravity 工作流检查
check_antigravity() {
  local project_root="${1:-.}"
  local workflow_dir="$project_root/.agent/workflows"
  
  if [ -d "$workflow_dir" ]; then
    echo -e "${GREEN}✅${NC} Antigravity: 已配置"
    workflow_count=$(ls -1 "$workflow_dir"/*.md 2>/dev/null | wc -l)
    echo -e "   ${GREEN}✓${NC} 工作流文件: $workflow_count 个"
  else
    echo -e "${YELLOW}⚠️${NC} Antigravity: 未找到"
    echo -e "   ${YELLOW}配置路径:${NC} $workflow_dir"
  fi
}

# 根据 TARGET_TOOL 动态检查
case "$TARGET_TOOL" in
  "all")
    check_mcp_config "Claude Desktop" "$HOME/.config/claude/claude_desktop_config.json" "mcpServers"
    check_mcp_config "Cursor" "$HOME/.cursor/mcp.json" "mcpServers"
    check_mcp_config "Devin" "$HOME/.codeium/devin/mcp_config.json" "mcpServers"
    check_antigravity
    ;;
  "claude")
    check_mcp_config "Claude Desktop" "$HOME/.config/claude/claude_desktop_config.json" "mcpServers"
    ;;
  "cursor")
    check_mcp_config "Cursor" "$HOME/.cursor/mcp.json" "mcpServers"
    ;;
  "devin")
    check_mcp_config "Devin" "$HOME/.codeium/devin/mcp_config.json" "mcpServers"
    ;;
  "antigravity")
    check_antigravity
    ;;
  *)
    echo -e "${RED}❌${NC} 未知工具: $TARGET_TOOL"
    echo "可选值: all, devin, cursor, claude, antigravity"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}📋 MCP 配置模板:${NC} design/context-dev/devenv/mcp-config.json"
echo "========================================"
echo ""
