# PR 49 incomplete-write and original-retention corrections

## Work item type

bug

## Evidence

### Cause

Review of 320bff3 found that a process interrupted before reservation publication
left a directory that ledger scans treated as a completed operation. A second
finding showed image validation discarded the only received provider bytes when
dimensions differed from the quote. Each finding was duplicated by the reviewer;
there are two distinct bugs, both reproduced before the changes below.

### Changed files

- lib/agent-media/store.ts: ignore only empty or reservation-temp-only starts; reject missing reservations with later operation evidence.
- lib/agent-media/images.ts: retain bounded original bytes before decoding/dimension validation, without replacing previous bytes or approving mismatched output.
- lib/agent-media/service.ts: report whether a provider-response.bin is retained for operator inspection.
- lib/agent-media/service.test.ts: reproduce incomplete-start recovery, corrupt-ledger blocking, original retention, restart and no-repurchase behavior.
- docs/conjure-mcp.md: document incomplete-start rules and quarantined originals.
- docs/conjure-mcp-recovery-evidence.md: retain this evidence.

### Test evidence

#### Failing before

Command: `node --import tsx --test --test-name-pattern='pre-reservation|unexpected provider dimensions' lib/agent-media/service.test.ts`

Result: FAIL, both tests failed with ENOENT: nonexistent reserved.json during budget calculation and nonexistent provider-response.bin after a mismatched result. No provider network call occurred.

#### Passing after

Command: `node --import tsx --test --test-name-pattern='pre-reservation|unexpected provider dimensions' lib/agent-media/service.test.ts`

Result: PASS, both tests passed on the real Windows store. An incomplete start can proceed once, suspicious missing reservations fail closed, mismatched bytes survive restart and the provider is invoked only once.

#### Reproduction after

Command: `node --import tsx --test --test-name-pattern='pre-reservation|unexpected provider dimensions' lib/agent-media/service.test.ts`

Result: PASS, original reproductions are clean. TypeScript, scoped lint and conventions passed. The full 18-test MCP suite is running; fresh remote CI/review will validate the published correction.

### Live verification

Real local filesystem and service/restart execution using fresh synthetic stores.
No paid generation or production data was used. These modules expose the local
stdio/CLI workflow; its full protocol test is included in the running suite.

### Publishing state

Local corrections prepared for publication to the explicitly authorized Conjure
#49 branch. The PR is unmerged while review findings are addressed. Popcorn/Ask
pilot additions remain separate and unpublished.

### Unverified

Full suite, fresh remote CI/review and production deployment remain pending.
Actual power loss, provider charges and corrupted hardware are not simulated.
Quarantined bytes are not approved image assets; responses above the 8 MB retention
bound are rejected rather than stored without a bound. No new purchase is allowed
to replace an ambiguous or mismatched output.

**Still to do:** Finish full checks and review, merge #49, then verify production.
