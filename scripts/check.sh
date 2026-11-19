#!/usr/bin/env bash
# Runs every automated check. Exit code 0 = all passed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Contracts =="
cd "$ROOT/contracts"
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test

echo "== Web app =="
cd "$ROOT"
npm run lint
npm run build

echo "All checks passed."
