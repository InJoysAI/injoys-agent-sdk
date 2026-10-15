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
if [ -d "$SCRIPT_DIR/templates" ] && [ -f "$SCRIPT_DIR/scripts/install.sh" ]; then
    INSTALL_MODE="local"
    echo "📦 Installing InJoys Agent SDK (local mode) to: $TARGET_DIR"
else
    INSTALL_MODE="remote"
    echo "📦 Installing InJoys Agent SDK (remote mode) to: $TARGET_DIR"
    
    # Create temp directory for downloads
    TEMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TEMP_DIR"' EXIT
    
    # Download and extract the repository
    echo "  - Downloading repository archive..."
    ARCHIVE_URL="https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz"
    curl -fsSL "$ARCHIVE_URL" | tar -xz -C "$TEMP_DIR"
    
    # Set SCRIPT_DIR to the extracted directory
    SCRIPT_DIR="$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
    
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
# 2. Install AI Workflows (.agent/workflows only)
# -----------------------------------------------------------------------------
# Only the project-level `.agent/workflows/` is installed. No other tool directories
# (.claude/.cursor/.devin/.qoder) and nothing outside the project (e.g. ~/.codex).
# Command sources live in design/context-dev/commands/ (copied above); install
# commands for other AI tools on demand:
#   bash design/context-dev/scripts/install-ai-commands.sh --tools <list>
#   bash design/context-dev/scripts/install-codex-prompts.sh   # Codex (global)
echo "  - Installing AI workflows to .agent/workflows ..."
mkdir -p "$TARGET_DIR/.agent/workflows"

# Minimal bootstrap: only install init + env check here.
# The full command set is synced to .agent/workflows by `/context-init`.
cp "$SCRIPT_DIR/templates/commands/context-init.md" "$TARGET_DIR/.agent/workflows/" 2>/dev/null || true
cp "$SCRIPT_DIR/templates/commands/context-check.md" "$TARGET_DIR/.agent/workflows/" 2>/dev/null || true

# -----------------------------------------------------------------------------
# 3. Helper Script
# -----------------------------------------------------------------------------
chmod +x "$TARGET_DIR/design/context-dev/scripts/context-gen.sh" 2>/dev/null || true
chmod +x "$TARGET_DIR/design/context-dev/scripts/install-ai-commands.sh" 2>/dev/null || true
chmod +x "$TARGET_DIR/design/context-dev/scripts/install-codex-prompts.sh" 2>/dev/null || true

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Review 'design/context-dev/README.md' for context framework usage."
echo "  2. Run '.agent/workflows/context-init.md' in your AI tool to generate initial context assets."
echo "     (/context-init also creates a root AGENTS.md (plus a one-line CLAUDE.md that imports it) pointing the AI to .context/, .agent/ and openspec/.)"
echo ""
echo "Optional: install commands for other AI tools:"
echo "  - bash design/context-dev/scripts/install-ai-commands.sh --tools claude,cursor,devin,qoder"
echo "  - bash design/context-dev/scripts/install-codex-prompts.sh   # Codex (global prompts)"
