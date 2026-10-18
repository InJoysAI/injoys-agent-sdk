#!/usr/bin/env bash
set -euo pipefail

# 校验已安装的 AI 命令副本与命令源保持逐字节同步。
#
# 为什么需要这一步：`.agents/workflows/` 下的文件是 `design/context-dev/commands/*.md`
# 的同步产物（见 tools/ai-config/AGENTS.md）。只修改命令源而忘记重新安装时，
# 其他检查都看不出来 —— 但用户实际调用的路径上仍是旧措辞。
#
# 用法：
#   bash design/context-dev/scripts/check-ai-commands.sh [project_root]

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
default_root=$(cd "$script_dir/../../.." && pwd)
project_root=${1:-$default_root}
commands_dir="$script_dir/../commands"
target_dir="$project_root/.agents/workflows"

if [[ ! -d "$commands_dir" ]]; then
  echo "ERROR: command source directory not found: $commands_dir" >&2
  exit 1
fi

if [[ ! -d "$target_dir" ]]; then
  echo "ERROR: installed command directory not found: $target_dir" >&2
  echo "       install with: bash design/context-dev/scripts/install-ai-commands.sh" >&2
  exit 1
fi

status=0
checked=0

if [[ -d "$project_root/.agents/workflows" ]]; then
  echo "DRIFT: 发现遗留目录 .agents/workflows/；命令已迁至 .agents/workflows/，请迁移或删除旧目录以避免两份副本" >&2
  status=1
fi

for src in "$commands_dir"/*.md; do
  [[ -e "$src" ]] || continue
  name=$(basename "$src")
  dest="$target_dir/$name"
  checked=$((checked + 1))

  if [[ ! -f "$dest" ]]; then
    echo "DRIFT: $name 缺失于 .agents/workflows/" >&2
    status=1
  elif ! cmp -s "$src" "$dest"; then
    echo "DRIFT: $name 与 design/context-dev/commands/$name 不一致" >&2
    status=1
  fi
done

# 目标目录残留、但命令源已删除（例如命令改名或下线后未清理）。
for dest in "$target_dir"/context-*.md; do
  [[ -e "$dest" ]] || continue
  name=$(basename "$dest")
  if [[ ! -f "$commands_dir/$name" ]]; then
    echo "DRIFT: $name 存在于 .agents/workflows/，但已无对应命令源" >&2
    status=1
  fi
done

if (( status != 0 )); then
  echo "ERROR: .agents/workflows/ 与命令源不同步，请重新安装：" >&2
  echo "       bash design/context-dev/scripts/install-ai-commands.sh" >&2
  exit 1
fi

echo "Context AI commands OK ($checked files in sync with commands/)"
