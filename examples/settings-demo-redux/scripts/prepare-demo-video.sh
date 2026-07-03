#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_VIDEO="$DEMO_ROOT/../../docs/videos/demo-video-cmdk-vectorized.mov"
OUTPUT_VIDEO="$DEMO_ROOT/public/demo.mp4"

if [[ ! -f "$SOURCE_VIDEO" ]]; then
  echo "Demo video source not found: $SOURCE_VIDEO" >&2
  exit 1
fi

ensure_bundled_ffmpeg() {
  local bundled_ffmpeg
  bundled_ffmpeg="$(cd "$DEMO_ROOT" && node -e "process.stdout.write(require('ffmpeg-static') || '')" 2>/dev/null || true)"
  if [[ -n "$bundled_ffmpeg" && -x "$bundled_ffmpeg" ]]; then
    return 0
  fi

  local install_script
  install_script="$(cd "$DEMO_ROOT" && node -e "const path=require('path'); const pkg=require('ffmpeg-static/package.json'); process.stdout.write(path.join(path.dirname(require.resolve('ffmpeg-static/package.json')), 'install.js'));")"
  if [[ -f "$install_script" ]]; then
    node "$install_script"
  fi
}

resolve_ffmpeg() {
  if command -v ffmpeg >/dev/null 2>&1; then
    command -v ffmpeg
    return 0
  fi

  ensure_bundled_ffmpeg

  local bundled_ffmpeg
  bundled_ffmpeg="$(cd "$DEMO_ROOT" && node -e "process.stdout.write(require('ffmpeg-static') || '')" 2>/dev/null || true)"
  if [[ -n "$bundled_ffmpeg" && -x "$bundled_ffmpeg" ]]; then
    printf '%s\n' "$bundled_ffmpeg"
    return 0
  fi

  return 1
}

if ! FFMPEG="$(resolve_ffmpeg)"; then
  echo "ffmpeg is required to convert the demo video to demo.mp4." >&2
  echo "Install it locally with: brew install ffmpeg" >&2
  echo "Or ensure ffmpeg-static is installed in this package." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_VIDEO")"

"$FFMPEG" -y -i "$SOURCE_VIDEO" \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  "$OUTPUT_VIDEO" \
  -loglevel error

echo "Prepared demo video at public/demo.mp4"
