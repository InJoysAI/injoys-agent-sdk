#!/bin/bash
set -euo pipefail

# Install Codex CLI prompt files to the user's home directory.
#
# Codex CLI loads prompts from: ~/.codex/prompts/
# This installer copies the repository's `commands/codex/*.md` files into that directory.
#
# Usage (run from your project root where `design/context-dev/` exists):
#   bash design/context-dev/scripts/install-codex-prompts.sh
#   # or with a custom source dir:
#   CODEX_PROMPTS_SRC=design/context-dev/commands/codex bash design/context-dev/scripts/install-codex-prompts.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default source: the installed injoys-agent-sdk repo layout under design/context-dev is:
# design/context-dev/commands/codex/*.md
DEFAULT_SRC="$SCRIPT_DIR/../commands/codex"
SRC_DIR="${CODEX_PROMPTS_SRC:-$DEFAULT_SRC}"

DEST_DIR="$HOME/.codex/prompts"

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ Codex prompts source dir not found: $SRC_DIR"
  echo "   Set CODEX_PROMPTS_SRC to point at a directory containing *.md prompt files."
  exit 1
fi

mkdir -p "$DEST_DIR"

shopt -s nullglob
files=("$SRC_DIR"/*.md)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "❌ No *.md prompt files found in: $SRC_DIR"
  exit 1
fi

for f in "${files[@]}"; do
  cp "$f" "$DEST_DIR/"
done

echo "✅ Installed ${#files[@]} Codex prompt files to: $DEST_DIR"
echo "   Restart Codex if prompts are not visible."

