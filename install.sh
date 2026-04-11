#!/usr/bin/env bash
# install.sh — Install gsd into ~/.claude/
#
# Creates symlinks by default so changes in this repo reflect immediately in Claude Code.
# Use --copy to make standalone copies instead.
#
# Usage:
#   ./install.sh              # symlink (default, recommended for development)
#   ./install.sh --copy       # copy files (standalone install)
#   ./install.sh --uninstall  # remove installed files

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
CLI_TARGET="$CLAUDE_DIR/gsd"
GSD_SKILL_TARGET="$CLAUDE_DIR/skills/gsd"
VERIFY_SKILL_TARGET="$CLAUDE_DIR/skills/verify"

MODE="symlink"
if [[ "${1:-}" == "--copy" ]]; then
  MODE="copy"
elif [[ "${1:-}" == "--uninstall" ]]; then
  MODE="uninstall"
fi

# Check that Claude directories exist
if [[ ! -d "$CLAUDE_DIR" ]]; then
  echo "Error: $CLAUDE_DIR does not exist. Is Claude Code installed?"
  exit 1
fi

mkdir -p "$CLAUDE_DIR/skills"

remove_existing() {
  local target="$1"
  if [[ -L "$target" ]]; then
    echo "  Removing existing symlink: $target"
    rm "$target"
  elif [[ -e "$target" ]]; then
    echo "  Found existing directory at $target"
    read -p "  Overwrite? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "  Skipped. Please remove or rename $target manually, then re-run."
      exit 1
    fi
    rm -rf "$target"
  fi
}

install_symlink() {
  local src="$1"
  local target="$2"
  remove_existing "$target"
  ln -s "$src" "$target"
  echo "  Symlinked: $target → $src"
}

install_copy() {
  local src="$1"
  local target="$2"
  remove_existing "$target"
  cp -R "$src" "$target"
  echo "  Copied: $src → $target"
}

case "$MODE" in
  symlink)
    echo "Installing gsd (symlink mode)..."
    install_symlink "$REPO_ROOT/cli" "$CLI_TARGET"
    install_symlink "$REPO_ROOT/skills/gsd" "$GSD_SKILL_TARGET"
    install_symlink "$REPO_ROOT/skills/verify" "$VERIFY_SKILL_TARGET"
    echo
    echo "Installed. Test with:"
    echo "  node $CLI_TARGET/gsd-tools.js help"
    ;;
  copy)
    echo "Installing gsd (copy mode)..."
    install_copy "$REPO_ROOT/cli" "$CLI_TARGET"
    install_copy "$REPO_ROOT/skills/gsd" "$GSD_SKILL_TARGET"
    install_copy "$REPO_ROOT/skills/verify" "$VERIFY_SKILL_TARGET"
    echo
    echo "Installed. To update, re-run ./install.sh --copy or use symlink mode."
    ;;
  uninstall)
    echo "Uninstalling gsd..."
    for target in "$CLI_TARGET" "$GSD_SKILL_TARGET" "$VERIFY_SKILL_TARGET"; do
      if [[ -L "$target" ]]; then
        rm "$target"
        echo "  Removed symlink: $target"
      elif [[ -d "$target" ]]; then
        rm -rf "$target"
        echo "  Removed directory: $target"
      else
        echo "  Not found: $target (skipping)"
      fi
    done
    echo "Uninstalled."
    ;;
esac
