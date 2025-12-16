#!/bin/bash
# Context 生成引导脚本
# 用法: 
#   ./context-gen.sh -i                          # 交互模式
#   ./context-gen.sh <文件1> <文件2> ...          # 批量计算 hash
#   ./context-gen.sh -p <项目路径> <文件1> ...    # 指定项目路径

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT=""
INTERACTIVE=false
FILES=()

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    -i|--interactive)
      INTERACTIVE=true
      shift
      ;;
    -p|--project)
      PROJECT_ROOT="$2"
      shift 2
      ;;
    -h|--help)
      echo "用法:"
      echo "  ./context-gen.sh -i                          # 交互模式"
      echo "  ./context-gen.sh <文件1> <文件2> ...          # 批量计算 hash"
      echo "  ./context-gen.sh -p <项目路径> <文件1> ...    # 指定项目路径"
      exit 0
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

calculate_hash() {
  local file=$1
  if [ -f "$file" ]; then
    local hash=$(shasum -a 256 "$file" | cut -d ' ' -f 1)
    echo "$hash"
  else
    echo ""
  fi
}

detect_doc_type() {
  local filename=$(basename "$1" | tr '[:upper:]' '[:lower:]')
  
  if [[ "$filename" =~ (prd|product|requirement|overview) ]]; then
    echo "PRD"
  elif [[ "$filename" =~ (arch|architecture|system|design) ]]; then
    echo "Architecture"
  elif [[ "$filename" =~ (db|database|schema|postgres|mysql) ]]; then
    echo "DB Schema"
  elif [[ "$filename" =~ (ui|design|figma|component|style) ]]; then
    echo "UI Design"
  elif [[ "$filename" =~ (legacy|old|migration) ]]; then
    echo "Legacy"
  else
    echo "Supplement"
  fi
}

echo ""
echo "========================================"
echo "  Context 生成引导脚本"
echo "========================================"
echo ""

if [ "$INTERACTIVE" = true ]; then
  # 交互模式
  echo -e "${BLUE}交互模式${NC}"
  echo ""
  
  # 输入项目路径
  read -p "请输入目标项目路径: " PROJECT_ROOT
  
  if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌${NC} 目录不存在: $PROJECT_ROOT"
    exit 1
  fi
  
  echo ""
  echo "请输入源文档路径 (每行一个，输入空行结束):"
  
  while true; do
    read -p "> " file_path
    [ -z "$file_path" ] && break
    FILES+=("$file_path")
  done
fi

if [ ${#FILES[@]} -eq 0 ]; then
  echo -e "${YELLOW}⚠️${NC} 未提供任何文件"
  echo "用法: ./context-gen.sh -i 或 ./context-gen.sh <文件1> <文件2> ..."
  exit 1
fi

echo ""
echo "=== 文件分析结果 ==="
echo ""

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}❌${NC} 文件不存在: $file"
    continue
  fi
  
  doc_type=$(detect_doc_type "$file")
  hash=$(calculate_hash "$file")
  
  echo -e "${GREEN}✅${NC} $file"
  echo "   类型: $doc_type"
  echo "   SHA256: $hash"
  echo ""
done

if [ -n "$PROJECT_ROOT" ]; then
  echo "=== 项目路径 ==="
  echo "目标目录: $PROJECT_ROOT"
  echo ""
  
  if [ -f "$PROJECT_ROOT/.context/context-manifest.json" ]; then
    echo -e "${YELLOW}⚠️${NC} 检测到已存在的 context-manifest.json"
    echo "   将执行增量更新模式"
  else
    echo -e "${BLUE}ℹ️${NC} 将执行全量生成模式"
  fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅${NC} 分析完成"
echo ""
echo "下一步: 使用 /context-init 命令并提供上述信息"
echo "========================================"
echo ""
