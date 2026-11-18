---
name: task-execution
description: Use at the start of every work session and after finishing any task. Picks the next task from docs/06_ACTION_PLAN.md, executes it, verifies it, and records it in PROGRESS.md.
---

# Task execution loop

1. Read `PROGRESS.md`. Find the first task in `docs/06_ACTION_PLAN.md` whose status is not Done and whose `Depends on` tasks are all Done.
2. Check `docs/07_DECISIONS.md` for every decision the task needs.
   - Open: stop. Ask Cesar (format in AGENTS.md section 8). Do not start the task.
   - Proposed: continue, and list it in the PROGRESS entry.
3. If the owner is Cesar: write him the exact steps, then wait.
4. Mark the task `In progress` in the PROGRESS status table.
5. Read the spec section for the task. For contract tasks also load skill `soroban-contract`; for frontend tasks `stellar-frontend`; for deployment `testnet-deploy`. For any external fact load `verify-facts`.
6. Implement the smallest change that meets the acceptance criteria. No extra features.
7. Verify:
   - Run the acceptance check in the task row.
   - Run `bash scripts/check.sh`.
   - Read your own diff once, looking for anything not required by the task.
8. Write the PROGRESS entry using the template at the top of `PROGRESS.md`. Mark Done or Blocked.
9. At Checkpoint A and Checkpoint B, stop and send Cesar a short report: what works, how to see it, what is next, open decisions.

Never mark a task Done with failing or skipped checks. If a check cannot run (missing tool), mark Blocked and say which tool.
