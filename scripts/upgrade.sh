#!/bin/bash
# injoys-agent-sdk Upgrade Script

set -e

# Resolve script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔄 Upgrading injoys-agent-sdk..."

# 1. Pull latest changes
echo "  - Pulling latest changes from git..."
if [ -d "$ROOT_DIR/.git" ]; then
    git -C "$ROOT_DIR" pull
else
    echo "  ! Warning: Not a git repository, skipping pull."
    echo "  ! If you installed via curl, please run the install script again to upgrade."
    exit 0
fi

# 2. Re-run install script to update local project files
echo "  - Re-applying installation..."
"$SCRIPT_DIR/install.sh" "$PWD"

echo "✅ Upgrade complete!"
