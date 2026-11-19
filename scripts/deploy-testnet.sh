#!/usr/bin/env bash
# Deploys bfe-escrow to Stellar TESTNET and writes deployments/testnet.json.
# Every command below was checked with `stellar <command> --help` (Stellar CLI 30.0.1).
#
# Decisions used: D-03 fee 5% (500 bps), D-04 own test asset USDC issued by bfe-admin,
# D-13 arbiter = bfe-arbiter. Fee recipient = bfe-treasury (NOT bfe-admin: the admin issues the
# test USDC, and tokens sent back to a classic asset issuer are burned).
#
# Requires: identities bfe-admin, bfe-arbiter, bfe-treasury, bfe-freelancer, bfe-client in the Stellar CLI
# keystore (create with: stellar keys generate <name> --fund --network testnet).
# Secret keys stay in the CLI keystore; nothing secret is written to the repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NET="testnet"
STELLAR="${STELLAR:-stellar}"
FEE_BPS=500

ADMIN="$($STELLAR keys address bfe-admin)"
ARBITER="$($STELLAR keys address bfe-arbiter)"
TREASURY="$($STELLAR keys address bfe-treasury)"

echo "== Build wasm"
(cd "$ROOT/contracts/escrow" && $STELLAR contract build)
WASM="$ROOT/contracts/target/wasm32v1-none/release/bfe_escrow.wasm"

echo "== Test USDC (classic asset USDC:<bfe-admin> wrapped in a Stellar Asset Contract)"
USDC_ID="$($STELLAR contract asset deploy --asset "USDC:$ADMIN" --source-account bfe-admin --network $NET --alias bfe-usdc 2>/dev/null || $STELLAR contract id asset --asset "USDC:$ADMIN" --network $NET)"

echo "== Deploy escrow"
ESCROW_ID="$($STELLAR contract deploy --wasm "$WASM" --source-account bfe-admin --network $NET --alias bfe-escrow)"

echo "== Initialize (fee ${FEE_BPS} bps)"
$STELLAR contract invoke --id "$ESCROW_ID" --source-account bfe-admin --network $NET -- \
  initialize --admin bfe-admin --arbiter bfe-arbiter --token "$USDC_ID" --fee_bps $FEE_BPS --fee_recipient bfe-treasury

echo "== Trustlines for the test identities"
for n in bfe-client bfe-freelancer bfe-arbiter bfe-treasury; do
  $STELLAR tx new change-trust --source-account $n --line "USDC:$ADMIN" --network $NET || true
done

echo "== Mint 1,000 test USDC to bfe-client"
$STELLAR contract invoke --id "$USDC_ID" --source-account bfe-admin --network $NET -- \
  mint --to bfe-client --amount 10000000000

mkdir -p "$ROOT/deployments"
cat > "$ROOT/deployments/testnet.json" <<EOF
{
  "network": "testnet",
  "rpcUrl": "https://soroban-testnet.stellar.org/",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "escrowContractId": "$ESCROW_ID",
  "usdcContractId": "$USDC_ID",
  "usdcAsset": "USDC:$ADMIN",
  "admin": "$ADMIN",
  "arbiter": "$ARBITER",
  "feeRecipient": "$TREASURY",
  "feeBps": $FEE_BPS,
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
echo "Wrote deployments/testnet.json"
