#!/usr/bin/env bash
# Runs every automated check. Exit code 0 = all passed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Contracts =="
cd "$ROOT/contracts"
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test

if [ -f "$ROOT/frontend/package.json" ]; then
  echo "== Frontend =="
  cd "$ROOT/frontend"
  npm run lint
  npm run build
else
  echo "== Frontend == skipped (frontend/package.json not created yet, task T3.1)"
fi

echo "All checks passed."
