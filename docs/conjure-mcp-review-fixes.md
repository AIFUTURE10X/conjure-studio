# PR 49 review corrections

## Work item type

bug

## Evidence

### Cause

Review of 9a96b65 identified three reproducible failures: filesystem writes flushed
file contents but not publication metadata; unlock treated a reused live PID as
the original writer; the image adapter timed out at 100 seconds even though the
existing slow-image route allows 240 seconds. The exact regression run reproduced
all three before production code changes. No real provider was called.

### Changed files

- lib/agent-media/durable-files.ts: durable directory creation/publication/removal, failing closed on OS errors.
- scripts/media-durable-move.ps1: native Windows same-volume WRITE_THROUGH moves without replacement.
- lib/agent-media/store.ts: publish records and writer locks through the durable primitives and record process birth.
- lib/agent-media/process-identity.ts: retrieve process birth identity, distinguishing absent processes from permission/inspection errors.
- scripts/conjure-mcp.ts: validate host/token/PID/birth before unlocking; legacy unknown identities remain blocked while their PID exists.
- lib/agent-media/provider.ts: restore the 240-second allowance for slow text/reference jobs.
- lib/agent-media/store-durability.test.ts: model directory flush boundaries and verify parent/final-entry persistence before return.
- lib/agent-media/process-recovery.test.ts: reproduce reused PID recovery while retaining real live-writer denial and killed-writer no-repurchase checks.
- lib/agent-media/provider.test.ts: reproduce a simulated 150-second text/reference request using the real image adapter.
- docs/conjure-mcp.md: document OS persistence requirements, process identity and timeout behavior.
- docs/conjure-mcp-review-fixes.md: preserve this evidence and release limitations.

### Test evidence

#### Failing before

Command: `node --import tsx --test lib/agent-media/provider.test.ts lib/agent-media/process-recovery.test.ts lib/agent-media/store-durability.test.ts`

Result: FAIL, one passed and three failed for the reported bugs.

Output: one passed, three failed: `OpenAI request timed out`, `PID reuse must not strand a
dead writer lock` (exit 1 instead of 0), and `New store entry must be durable in its
parent`. Captured in the local Popcorn release log conjure49-regression-before.log.

#### Passing after

Command: `node --import tsx --test lib/agent-media/provider.test.ts lib/agent-media/process-recovery.test.ts lib/agent-media/store-durability.test.ts`

Result: PASS, four tests passed.

Output: four passed on Windows, including the actual native durable-write helper and real
child-process kill/unlock CLI. The directory barrier model runs the POSIX contract
on either host; it is not a physical power-loss test.

#### Reproduction after

Command: `node --import tsx --test lib/agent-media/provider.test.ts lib/agent-media/process-recovery.test.ts lib/agent-media/store-durability.test.ts`

Result: PASS, all three reproductions now succeed without provider calls.

Output: the same three reproductions now pass in the focused regression command above.
`npm run check:openai-migration` passed all 14 static checks and 16 runtime tests.
`CONJURE_CHECKOUT=C:/Projects/worktrees/conjure-popcorn-mcp npm run test:conjure`
passed the actual Popcorn-to-Conjure stdio generation/recovery/paused-pack fixture.
TypeScript, production build and conventions passed; scoped application lint passed. The initial
script lint invocation was ignored by repository configuration; an explicit
--no-ignore check passed without warnings.

### Live verification

Actual local stdio/CLI and filesystem operations with fresh synthetic stores only.
No live model request, hosted account operation or production data mutation.
Production deployment verification follows the explicitly authorized merge.

### Publishing state

Local review corrections, not yet committed/pushed. Phil explicitly requested
merging Conjure #49 after it was previously reported ready; that specific latest
instruction overrides the earlier general no-merge instruction for this PR only.
Fresh review findings are being corrected before that authorized merge.

### Unverified

Fresh remote CI/review and merged production deployment are pending.
Physical power loss and hardware cache guarantees are not directly tested;
the filesystem/storage must honor its documented durability primitives. Legacy
lock records cannot prove process birth and remain conservative. No new paid image
or real invoice reconciliation is claimed.

**Still to do:** Finish checks, publish/review these corrections, then merge #49 and verify its deployment.
