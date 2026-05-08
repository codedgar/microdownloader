#!/usr/bin/env bash
# Fetches the yt-dlp and ffmpeg binaries that Microdownloader bundles.
# These are not committed to the repo (see .gitignore). Run this once after
# cloning, or any time you want to update to the latest versions.
#
# Usage: ./scripts/fetch-binaries.sh
#
# By default this fetches binaries for the current host architecture.
# To build a universal DMG you will need both arm64 and x86_64 ffmpeg
# binaries combined with `lipo` — see the README for details.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$REPO_ROOT/resources/bin"
mkdir -p "$BIN_DIR"

PLATFORM="$(uname -s)"
if [[ "$PLATFORM" != "Darwin" ]]; then
  echo "Error: this script currently only supports macOS." >&2
  echo "(Microdownloader builds for macOS only at the moment.)" >&2
  exit 1
fi

# Allow override via env var (used by build:arm64 / build:x64 scripts to
# fetch a binary for a target arch other than the host).
if [[ -n "${FFMPEG_ARCH:-}" ]]; then
  case "$FFMPEG_ARCH" in
    arm64|x86_64) ;;
    *)
      echo "Error: FFMPEG_ARCH must be 'arm64' or 'x86_64', got: $FFMPEG_ARCH" >&2
      exit 1
      ;;
  esac
else
  ARCH="$(uname -m)"
  case "$ARCH" in
    arm64)  FFMPEG_ARCH="arm64" ;;
    x86_64) FFMPEG_ARCH="x86_64" ;;
    *)
      echo "Error: unsupported architecture: $ARCH" >&2
      exit 1
      ;;
  esac
fi

# ---------- yt-dlp ----------
# yt-dlp ships a universal macOS binary in their GitHub releases.
echo "==> Fetching yt-dlp (universal macOS)..."
curl -fL --progress-bar \
  -o "$BIN_DIR/yt-dlp" \
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
chmod +x "$BIN_DIR/yt-dlp"

# ---------- ffmpeg ----------
# evermeet.cx provides static, signed macOS builds for both architectures.
echo "==> Fetching ffmpeg ($FFMPEG_ARCH)..."
TMP_ZIP="$(mktemp -t ffmpeg-XXXXXX).zip"
trap 'rm -f "$TMP_ZIP"' EXIT

if [[ "$FFMPEG_ARCH" == "arm64" ]]; then
  FFMPEG_URL="https://www.osxexperts.net/ffmpeg71arm.zip"
else
  FFMPEG_URL="https://evermeet.cx/ffmpeg/getrelease/zip"
fi

curl -fL --progress-bar -o "$TMP_ZIP" "$FFMPEG_URL"
unzip -o -q "$TMP_ZIP" -d "$BIN_DIR"
chmod +x "$BIN_DIR/ffmpeg"

# ---------- summary ----------
echo
echo "Done. Bundled binaries:"
"$BIN_DIR/yt-dlp" --version 2>/dev/null | sed 's/^/  yt-dlp:  /'
"$BIN_DIR/ffmpeg" -version 2>/dev/null | head -1 | sed 's/^/  ffmpeg:  /'
echo
echo "Binaries written to: $BIN_DIR"
