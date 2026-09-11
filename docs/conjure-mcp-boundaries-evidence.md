# PR 49 operator validation and trust boundaries

## Work item type

feature

## Evidence

### Cause

Acceptance: cost recording must apply the same nonblank, at-most-100-character
reviewer bound as quote approval before writing an immutable record. Clarify the
existing conservative budget policy and programmatic reference-transfer boundary.
The reported single-argument payload above 1 MB is not a reproduced Windows/Linux
CLI failure; this is bounded validation hardening, not a claimed large-argument
crash reproduction.

Two other review suggestions propose changes to established policy, not violations
of this feature's current acceptance:

- `budget()` intentionally counts max(reservation, actual), including failed
  operations. An HTTP rejection does not authorize releasing the reservation or
  repurchasing. This cap is explicitly distinct from actual invoice cost. The
  existing cost policy and regression preserve this invariant; no automatic refund
  or retry semantics are added. Local missing-credential preflight is different:
  no request or reservation has occurred.
- Popcorn calls `register_reference` through a local Node SDK/stdio client. It
  passes PNG bytes programmatically and logs only metadata/digests. Those arguments
  are not model-authored tool calls in this integration. An arbitrary external MCP
  host may retain its own payload traces; server instructions cannot enforce that
  host's logging policy. The interface is documented for programmatic transfers.

### Changed files

- scripts/conjure-mcp.ts: reject cost reviewers longer than 100 characters before immutable persistence.
- lib/agent-media/process-recovery.test.ts: exercise oversized-reviewer rejection followed by successful valid cost recording.
- lib/agent-media/mcp-server.ts: describe reference transfer as programmatic and caller trace retention explicitly.
- docs/conjure-mcp.md: clarify failed-request cap accounting and reference payload/host logging boundaries.
- docs/conjure-mcp-boundaries-evidence.md: record acceptance, evidence and review dispositions.

### Test evidence

`node --import tsx --test lib/agent-media/process-recovery.test.ts` passed on
Windows: 101-character reviewer rejected, then valid immutable cost recording
succeeded. Before the validation change the new acceptance assertion failed because
the 101-character value was accepted. TypeScript, explicit script/application lint
and conventions passed. Remote checks follow publication of this narrow change.

### Live verification

Local operator CLI using a fresh synthetic media store and synthetic invoice only.
No paid model call or provider charge is involved. The existing real Popcorn stdio
integration excludes PNG payloads from its textual output.

### Publishing state

Prepared for the authorized Conjure #49 branch and merge. Prior correction head
05968bf passed 21 runtime tests and GitHub CI; its review is complete. No merge yet.

### Unverified

Fresh remote checks/review and merged production verification are pending.
Automatic release of failed-request reservations and logging controls in arbitrary
external MCP hosts are outside the approved implementation. Neither is claimed.

**Still to do:** Verify the bounded validation, complete review, merge #49 and verify production.
