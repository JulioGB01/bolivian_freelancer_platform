#!/usr/bin/env bash
# Task T2.1 / T2.2. Deploys bfe-escrow to TESTNET and writes deployments/testnet.json.
# Each TODO must be replaced with a command verified with `stellar <command> --help`
# (skill: testnet-deploy). Do not run until decisions D-03 and D-04 are Confirmed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NETWORK="testnet"

echo "Building wasm"
(cd "$ROOT/contracts/escrow" && stellar contract build)

# TODO T2.1: create or reference the USDC token (decision D-04) -> USDC_ID
# TODO T2.2: deploy the wasm with identity bfe-admin -> ESCROW_ID
# TODO T2.2: invoke initialize(admin, arbiter, token, fee_bps, fee_recipient)
# TODO T2.2: write ids to "$ROOT/deployments/testnet.json" (format in skill testnet-deploy)

echo "Not implemented yet: complete the TODO lines (tasks T2.1, T2.2)." >&2
exit 1
