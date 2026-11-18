---
name: verify-facts
description: Use before writing any external fact into code or docs - package names, versions, CLI commands and flags, SDK functions, network URLs, passphrases, addresses, fees, statistics.
---

# Verify before you write

Cesar's rule: never invent information. If you are not sure, ask.

## Order of sources

1. **Local reference repos** at `G:\My Drive\20 PROJECTS\NATIONAL STARTUP 2026\STELLAR\_repos\` (list in AGENTS.md section 7). Read the actual file; quote the path in your PROGRESS entry.
2. **The tool itself**: `stellar <command> --help`, `cargo <command> --help`, `npm view <package> version`, generated bindings, compiler errors.
3. **Official documentation online**: Stellar developer docs, docs.pollar.xyz, stellarwalletskit.dev, Circle docs. Record the URL.

## Never

- Type a contract id, address, issuer, RPC URL or passphrase from memory.
- Pin a package version you did not see in the registry or a lock file.
- Write a business figure (fees, market size, exchange rate) into the README or UI without a source Cesar approved.

## If you cannot verify

Stop. Add the question to `docs/08_OPEN_QUESTIONS.md` and ask Cesar.
