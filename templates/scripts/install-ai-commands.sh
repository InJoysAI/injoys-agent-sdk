#!/bin/bash
set -euo pipefail

# Sync the full `/context-*` command set into the project's `.agents/workflows/`.
#
# Command sources (tool-agnostic): design/context-dev/commands/*.md
# Only `.agents/workflows/` is managed. Other AI tools' command directories and
# global prompt directories are not touched; copy the commands there yourself
# if your tool needs them.
#
# Usage:
#   bash design/context-dev/scripts/install-ai-commands.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMMANDS_DIR="$SCRIPT_DIR/../commands"
DEST_DIR="$ROOT_DIR/.agents/workflows"

case "${1:-}" in
  "")
    ;;
  -h|--help)
    echo "Usage: $0"
    exit 0
    ;;
  *)
    echo "Unknown arg: $1 (this script takes no arguments; --tools was removed)"
    echo "Usage: $0"
    exit 1
    ;;
esac

mkdir -p "$DEST_DIR"
shopt -s nullglob
files=("$COMMANDS_DIR"/*.md)
shopt -u nullglob
if [[ ${#files[@]} -eq 0 ]]; then
  echo "❌ No *.md in $COMMANDS_DIR"
  exit 1
fi
for f in "${files[@]}"; do
  cp "$f" "$DEST_DIR/"
done
echo "✅ Installed ${#files[@]} files -> $DEST_DIR"

if [[ -d "$ROOT_DIR/.agent/workflows" ]]; then
  echo "⚠️  Legacy .agent/workflows/ exists. Commands now live in .agents/workflows/."
  echo "    Move or remove the old directory yourself to avoid two copies (nothing was deleted)."
fi

echo "Done."
