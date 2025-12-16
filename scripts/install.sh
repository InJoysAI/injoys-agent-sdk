#!/bin/bash
# injoys-agent-sdk Installation Script
# Supports both local and remote installation modes

set -e

# Configuration
REPO="injoysai/injoys-agent-sdk"
BRANCH="main"
TARGET_DIR="${1:-.}"

# Detect installation mode
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." 2>/dev/null && pwd)" || SCRIPT_DIR=""

# Check if we're running from a local clone or via curl
if [ -d "$SCRIPT_DIR/templates" ] && [ -d "$SCRIPT_DIR/standards" ]; then
    INSTALL_MODE="local"
    echo "📦 Installing InJoys Agent SDK (local mode) to: $TARGET_DIR"
else
    INSTALL_MODE="remote"
    echo "📦 Installing InJoys Agent SDK (remote mode) to: $TARGET_DIR"
    
    # Create temp directory for downloads
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # Download and extract the repository
    echo "  - Downloading repository archive..."
    ARCHIVE_URL="https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz"
    curl -fsSL "$ARCHIVE_URL" | tar -xz -C "$TEMP_DIR"
    
    # Set SCRIPT_DIR to the extracted directory
    SCRIPT_DIR="$TEMP_DIR/injoys-agent-sdk-$BRANCH"
    
    if [ ! -d "$SCRIPT_DIR/templates" ]; then
        echo "❌ Error: Failed to download repository"
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# 1. Install Templates (Context Generation Framework)
# -----------------------------------------------------------------------------
echo "  - Installing templates to design/context-dev..."
mkdir -p "$TARGET_DIR/design/context-dev"
cp -r "$SCRIPT_DIR/templates/"* "$TARGET_DIR/design/context-dev/"

# -----------------------------------------------------------------------------
# 1.1 Install command sources (for post-init script installs)
# -----------------------------------------------------------------------------
# Command sources are already installed via templates copy above (lines 44-46)

# -----------------------------------------------------------------------------
# 2. Install Standards (Optional - commented out)
# -----------------------------------------------------------------------------
# Standards are available in the repo but not installed by default.
# Uncomment below if needed:
# echo "  - Installing standards to design/ai-dev..."
# mkdir -p "$TARGET_DIR/design/ai-dev"
# cp -r "$SCRIPT_DIR/standards/"* "$TARGET_DIR/design/ai-dev/"


# -----------------------------------------------------------------------------
# 3. Install AI Workflows (CI/CD & Commands)
# -----------------------------------------------------------------------------
echo "  - Installing AI workflows..."

copy_workflows() {
  local tool_dir="$1"
  local target_dir="$2"

  mkdir -p "$target_dir"

  # Minimal bootstrap: only install init + env check by default.
  # The full command set is generated/installed after `/context-init`.
  cp "$tool_dir/context-init.md" "$target_dir/" 2>/dev/null || true
  cp "$tool_dir/context-check.md" "$target_dir/" 2>/dev/null || true
}

# Antigravity
copy_workflows "$SCRIPT_DIR/templates/commands/antigravity" "$TARGET_DIR/.agent/workflows"

# Claude Code
copy_workflows "$SCRIPT_DIR/templates/commands/claude" "$TARGET_DIR/.claude/commands"

# Cursor
copy_workflows "$SCRIPT_DIR/templates/commands/cursor" "$TARGET_DIR/.cursor/commands"

# Windsurf
copy_workflows "$SCRIPT_DIR/templates/commands/windsurf" "$TARGET_DIR/.windsurf/workflows"

# Qoder
copy_workflows "$SCRIPT_DIR/templates/commands/qoder" "$TARGET_DIR/.qoder/commands"

# Codex (global prompts directory)
copy_codex_bootstrap() {
  local tool_dir="$1"
  local dest_dir="$HOME/.codex/prompts"

  mkdir -p "$dest_dir" 2>/dev/null || true

  # Minimal bootstrap: only install init + env check by default.
  cp "$tool_dir/context-init.md" "$dest_dir/" 2>/dev/null || true
  cp "$tool_dir/context-check.md" "$dest_dir/" 2>/dev/null || true

  if [ -f "$dest_dir/context-init.md" ] || [ -f "$dest_dir/context-check.md" ]; then
    echo "  - Codex prompts installed to: $dest_dir (restart Codex to load prompts)"
  else
    echo "  - ⚠️  Codex prompts not installed (cannot write to $dest_dir)."
    echo "    Run later: bash $TARGET_DIR/design/context-dev/scripts/install-codex-prompts.sh"
  fi
}

copy_codex_bootstrap "$SCRIPT_DIR/templates/commands/codex"

# -----------------------------------------------------------------------------
# 4. Agent Configuration Templates (NOT installed by default)
# -----------------------------------------------------------------------------
# Agent-specific config files (.cursorrules, .windsurfrules, CLAUDE.md) are 
# NOT installed by default. Users should copy them manually if needed:
#   - Cursor:     design/context-dev/templates/cursorrules.template -> .cursorrules
#   - Windsurf:   design/context-dev/templates/windsurfrules.template -> .windsurfrules
#   - Claude:     design/context-dev/templates/CLAUDE.md.template -> CLAUDE.md

# -----------------------------------------------------------------------------
# 5. Helper Script
# -----------------------------------------------------------------------------
chmod +x "$TARGET_DIR/design/context-dev/scripts/context-gen.sh" 2>/dev/null || true
chmod +x "$TARGET_DIR/design/context-dev/scripts/install-ai-commands.sh" 2>/dev/null || true
chmod +x "$TARGET_DIR/design/context-dev/scripts/install-codex-prompts.sh" 2>/dev/null || true

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Review 'design/context-dev/README.md' for context framework usage."
echo "  2. Run '/context-init' in your AI tool to generate initial context assets."
echo "  3. (Codex) Restart Codex to load prompts from ~/.codex/prompts/"
echo ""
echo "Optional: Install agent-specific config files:"
echo "  - Cursor:   cp design/context-dev/templates/cursorrules.template .cursorrules"
echo "  - Windsurf: cp design/context-dev/templates/windsurfrules.template .windsurfrules"
echo "  - Claude:   cp design/context-dev/templates/CLAUDE.md.template CLAUDE.md"
