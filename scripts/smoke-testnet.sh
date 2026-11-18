#!/usr/bin/env bash
# Task T2.3. End-to-end check on TESTNET using deployments/testnet.json:
# create agreement (bfe-freelancer) -> fund (bfe-client) -> submit (bfe-freelancer)
# -> approve (bfe-client), printing balances before and after.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# TODO T2.3: read ids from "$ROOT/deployments/testnet.json"
# TODO T2.3: print USDC balances of client, freelancer, fee recipient, contract
# TODO T2.3: invoke create_agreement, fund_milestone, submit_milestone, approve_milestone
# TODO T2.3: print balances again and compare with docs/03_CONTRACT_SPEC.md section 4

echo "Not implemented yet: complete the TODO lines (task T2.3)." >&2
exit 1
