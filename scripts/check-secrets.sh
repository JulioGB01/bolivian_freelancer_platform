#!/usr/bin/env bash
# Blocks commits that contain Stellar secret keys or .env files.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FILES="$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)"
[ -z "$FILES" ] && exit 0

FAIL=0
while IFS= read -r f; do
  case "$f" in
    .env|*/.env|.env.*|*/.env.*)
      case "$f" in *.env.example) ;; *) echo "Blocked: $f is an env file"; FAIL=1 ;; esac ;;
  esac
  if [ -f "$f" ] && grep -Eq '\bS[A-Z2-7]{55}\b' "$f"; then
    echo "Blocked: $f contains what looks like a Stellar secret key"
    FAIL=1
  fi
done <<< "$FILES"

[ "$FAIL" -eq 0 ] || { echo "Remove the secrets and try again."; exit 1; }
