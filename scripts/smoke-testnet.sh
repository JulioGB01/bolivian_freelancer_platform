#!/usr/bin/env bash
# End-to-end check of the deployed escrow on Stellar TESTNET:
# create agreement -> client locks funds -> freelancer submits -> client approves.
# Prints balances before and after so the fee math can be checked by eye.
set -euo pipefail
NET="testnet"
STELLAR="${STELLAR:-stellar}"
ESCROW="${ESCROW:-bfe-escrow}"
USDC="${USDC:-bfe-usdc}"

bal() { $STELLAR contract invoke --id "$USDC" --source-account bfe-admin --network $NET -- balance --id "$1" 2>/dev/null; }

echo "Client before:     $(bal bfe-client)"
echo "Freelancer before: $(bal bfe-freelancer)"

ID="$($STELLAR contract invoke --id "$ESCROW" --source-account bfe-freelancer --network $NET -- \
  create_agreement --freelancer bfe-freelancer --client bfe-client --title '"Smoke test"' \
  --milestones '[{"title":"Milestone 1","amount":"1000000000"}]' --review_window_secs 3600)"
echo "Agreement id: $ID"

$STELLAR contract invoke --id "$ESCROW" --source-account bfe-client --network $NET -- fund_milestone --agreement_id "$ID" --index 0
echo "Locked in escrow:  $(bal "$ESCROW")"

$STELLAR contract invoke --id "$ESCROW" --source-account bfe-freelancer --network $NET -- \
  submit_milestone --agreement_id "$ID" --index 0 --evidence '"https://example.com/work"'
$STELLAR contract invoke --id "$ESCROW" --source-account bfe-client --network $NET -- approve_milestone --agreement_id "$ID" --index 0

echo "Client after:      $(bal bfe-client)"
echo "Freelancer after:  $(bal bfe-freelancer)   (expected +98.5 USDC = 985000000 with a 1.5% fee)"
$STELLAR contract invoke --id "$ESCROW" --source-account bfe-admin --network $NET -- get_agreement --agreement_id "$ID"
