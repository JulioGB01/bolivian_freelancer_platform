# 10 - Setup

## 1. Work outside Google Drive

Keep the working copy of this repository in a local folder that is not synced by Google Drive (git metadata, `target/` and `node_modules/` break or slow down under sync). Google Drive keeps only the planning copy.

## 2. Tools to install (Windows)

Install each from its official site and record the version in `PROGRESS.md` (task T0.1):

| Tool | Check command |
|---|---|
| Git | `git --version` |
| Rust (rustup) | `rustc --version`, `cargo --version` |
| Wasm target | `rustup target add wasm32v1-none` |
| Stellar CLI | `stellar --version` |
| Node.js (20 or newer, required by Pollar) | `node --version`, `npm --version` |
| A Stellar browser wallet supported by Stellar Wallets Kit | Installed in the browser, switched to testnet |

The `contracts/rust-toolchain.toml` file makes rustup use the stable channel with the wasm target and clippy.

## 3. Enable git hooks

From the repo root:

```
git config core.hooksPath .githooks
```

The pre-commit hook runs `scripts/check-secrets.sh` and `scripts/check.sh`.

## 4. Running DeepSeek Harness on this repo

Start the harness with this repository as the workspace. It reads `AGENTS.md`. Project skills are in `.agents/skills/`. Role briefs for delegated work are in `.agents/agents/`. First instruction to give it:

> Read AGENTS.md and follow its read order. Then run skill task-execution and start with the first task in docs/06_ACTION_PLAN.md that is not Done in PROGRESS.md.
