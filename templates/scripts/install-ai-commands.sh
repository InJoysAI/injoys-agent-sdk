#!/bin/bash
set -euo pipefail

# Install the full `/context-*` command set to selected AI tool directories.
#
# This script uses the tool-agnostic command sources under:
#   design/context-dev/commands/*.md
#
# Usage:
#   bash design/context-dev/scripts/install-ai-commands.sh --tools antigravity,cursor,claude,devin,qoder,grok
#
# Notes:
# - Codex prompts are global (~/.codex/prompts). Use install-codex-prompts.sh.
# - Grok loads flat *.md from .grok/commands/ and .claude/commands/ (compat).
#   It does NOT read .agent/workflows/ — use --tools grok (or claude) for slash commands.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMMANDS_DIR="$SCRIPT_DIR/../commands"

TOOLS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tools)
      TOOLS="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 --tools antigravity,claude,cursor,devin,qoder,grok"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      echo "Usage: $0 --tools antigravity,claude,cursor,devin,qoder,grok"
      exit 1
      ;;
  esac
done

if [[ -z "$TOOLS" ]]; then
  echo "❌ Missing --tools"
  exit 1
fi

# Expand "all" to full list
if [[ "$TOOLS" == "all" ]]; then
  TOOLS="antigravity,claude,cursor,devin,qoder,grok"
fi

IFS=',' read -r -a tool_list <<< "$TOOLS"

copy_dir() {
  local src_dir="$1"
  local dest_dir="$2"
  mkdir -p "$dest_dir"
  shopt -s nullglob
  local files=("$src_dir"/*.md)
  shopt -u nullglob
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "⚠️  No *.md in $src_dir (skipped)"
    return 0
  fi
  for f in "${files[@]}"; do
    cp "$f" "$dest_dir/"
  done
  echo "✅ Installed $((${#files[@]})) files -> $dest_dir"
}

for tool in "${tool_list[@]}"; do
  case "$tool" in
    antigravity)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.agent/workflows"
      ;;
    claude)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.claude/commands"
      ;;
    cursor)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.cursor/commands"
      ;;
    devin)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.devin/workflows"
      ;;
    qoder)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.qoder/commands"
      ;;
    grok)
      # Native Grok project commands (slash autocomplete)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.grok/commands"
      # Claude-compat path (also discovered by Grok)
      copy_dir "$COMMANDS_DIR" "$ROOT_DIR/.claude/commands"
      ;;
    codex)
      echo "ℹ️  Codex uses ~/.codex/prompts; run: bash design/context-dev/scripts/install-codex-prompts.sh"
      ;;
    "")
      ;;
    *)
      echo "⚠️  Unsupported tool: $tool (skipped)"
      ;;
  esac
done

echo "Done."
