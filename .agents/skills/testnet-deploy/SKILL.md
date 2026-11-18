---
name: testnet-deploy
description: Use for tasks T0.3 and T2.1 to T2.3 - creating testnet identities, creating the test token, deploying and initializing the contract, running the smoke test.
---

# Testnet deployment

## Rules

- Testnet only. Refuse any request to use mainnet.
- Identities are created in the Stellar CLI keystore with the names `bfe-admin`, `bfe-arbiter`, `bfe-freelancer`, `bfe-client`. Never print or commit secret keys.
- Before each `stellar` command, run it with `--help` once and use the flags shown there.

## Steps

1. Identities (T0.3): generate the 4 identities with testnet funding. Confirm with `stellar keys ls` and a balance check.
2. Token (T2.1): follow decision D-04. For the own-asset option, wrap the asset `USDC:<bfe-admin public key>` in a Stellar Asset Contract, add the trustline for `bfe-client` and `bfe-freelancer`, mint a test balance to `bfe-client`.
3. Deploy (T2.2): build the wasm, deploy it, invoke `initialize` with admin, arbiter, token id, fee_bps (decision D-03) and fee recipient. Save all ids in `deployments/testnet.json`:

```json
{
  "network": "testnet",
  "escrowContractId": "",
  "usdcContractId": "",
  "admin": "",
  "arbiter": "",
  "feeRecipient": "",
  "feeBps": 0,
  "deployedAt": ""
}
```

4. Smoke test (T2.3): run `scripts/smoke-testnet.sh`; paste its output in PROGRESS.md.

Fill the TODO lines in `scripts/deploy-testnet.sh` and `scripts/smoke-testnet.sh` with the verified commands so the steps can be re-run.
