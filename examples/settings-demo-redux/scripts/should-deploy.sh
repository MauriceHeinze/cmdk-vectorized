#!/usr/bin/env bash
set -euo pipefail

# Exit 0: skip the Vercel build.
# Exit 1: run the Vercel build.
#
# Rebuild when the demo or its linked cmdk-vectorized dependency changes.
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WATCH_PATHS=(
  examples/settings-demo-redux
  docs/videos
  src
  package.json
  pnpm-lock.yaml
  tsup.config.ts
)

if ! git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  exit 1
fi

if git diff --quiet HEAD^ HEAD -- "${WATCH_PATHS[@]}"; then
  echo "No relevant changes for settings-demo-redux. Skipping deploy."
  exit 0
fi

echo "Relevant changes detected for settings-demo-redux. Proceeding with deploy."
exit 1