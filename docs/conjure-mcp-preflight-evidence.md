# PR 49 provider preflight, policy snapshot and retained-response recovery

## Work item type

bug

## Evidence

### Cause

Review of 5f625dc found that valid retained bytes were not promoted after a failed
image publication; absent local credentials consumed a reservation before any
network call; and fresh policy validation discarded its returned snapshot while
spending checks used the earlier snapshot. All three failed in focused reproductions.

### Changed files

- lib/agent-media/contracts.ts: optional synchronous provider readiness contract for pre-reservation validation.
- lib/agent-media/provider.ts: check credential presence without exposing it or calling the provider.
- lib/agent-media/service.ts: use the fresh policy after reference validation, preflight before reservation, and recover valid retained bytes while quarantining invalid output.
- lib/agent-media/service.test.ts: reproduce all three cases, configured retry, exact recovered bytes and one provider invocation.
- docs/conjure-mcp.md: explain the recovery and submission preflight behavior.
- docs/conjure-mcp-preflight-evidence.md: retain this evidence.

### Test evidence

#### Failing before

Command: `node --import tsx --test --test-name-pattern='valid retained|missing provider credentials|freshly read' lib/agent-media/service.test.ts`

Result: FAIL, all three failed. Restart returned needs_reconciliation instead of completed; missing credentials and freshly disabled policy were not rejected before reservation.

#### Passing after

Command: `node --import tsx --test --test-name-pattern='valid retained|missing provider credentials|freshly read' lib/agent-media/service.test.ts`

Result: PASS, three tests passed. Valid original bytes recover exactly once, missing credentials consume no budget and permit a configured retry, and the newly disabled policy prevents provider invocation.

#### Reproduction after

Command: `node --import tsx --test --test-name-pattern='valid retained|missing provider credentials|freshly read' lib/agent-media/service.test.ts`

Result: PASS, original reproductions are clean. TypeScript, scoped lint and conventions passed. The expanded full suite and remote CI/review follow publication of this correction.

### Live verification

Real Windows store, service restart and shared image adapter with an intercepted
synthetic fetch. No live request or credential provisioning occurred. Prior runtime
handshake and the original stored smoke image passed on the preceding correction.

### Publishing state

Prepared for the explicitly authorized Conjure #49 correction/merge. No merge yet;
new review findings are addressed before executing it. Popcorn/Ask local work is
preserved separately.

### Unverified

Full expanded suite, fresh remote CI/review and merged production deployment are
pending. Invalid or dimension-mismatched retained output still needs operator
reconciliation; only valid quote-matching bytes are promoted. Remote provider
failure remains conservative and never automatically purchases again.

**Still to do:** Verify the expanded suite and fresh review, merge #49, then verify production.
