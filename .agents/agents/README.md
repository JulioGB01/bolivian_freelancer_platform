# Role briefs

Each file is a brief for one role. When delegating to a subagent, pass the brief's content as its instructions. Roles never edit files outside their scope.

| Brief | Scope | Used in |
|---|---|---|
| `contract-engineer.md` | `contracts/`, `docs/03_CONTRACT_SPEC.md` | Phase 1 |
| `frontend-engineer.md` | `frontend/` | Phase 3, 4 |
| `deployer.md` | `scripts/`, `deployments/` | Phase 0, 2, 5 |
| `reviewer.md` | read-only, writes findings to PROGRESS.md | T1.10, before each checkpoint |
