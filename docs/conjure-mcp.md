# Conjure Studio local MCP

The image bridge reuses `lib/openai-image-client.ts`, the service behind Conjure's
existing image route. It does not call the anonymous browser route or change
personal studio sign-in. Phil authorized reuse of Conjure's existing key on
11 September 2026. The key stays in Conjure's ignored environment file.

## Tools and scope

- `quote_media`: one explicit image, model/options, prompt and optional reference;
  stores an expiring quote without calling a provider.
- `generate_images`: requires the exact quote and a separate operator approval.
  Repeated idempotency keys retrieve the original operation. An approval cannot
  buy multiple operations under different keys.
- `get_operation`: status and recovery of already saved bytes, never generation.
- `get_assets`: one known asset's metadata and `conjure://assets/<id>` resource.
- `register_reference`: one owned/licensed PNG, at most 8 MB, with a verified hash;
  no URL fetching. The original bytes are retained.

This is a local stdio MCP server using the official SDK. The local OS process and
private operator configuration establish identity; callers cannot specify owners.
Only configured brands are accessible. There is no HTTP listener, remote OAuth
claim, public asset endpoint or global library enumeration. Hosted/multi-operator
access requires a separate authenticated transactional implementation.

`register_reference` is a programmatic byte-transfer interface. Popcorn invokes it
directly from its local Node SDK client; it does not serialize the PNG into a
model-authored tool call or print it in its textual run output. Conjure returns
metadata and never logs that input. MCP hosts can independently retain payload
traces, which this server cannot control. Do not expose this byte-input operation
as a model-authored tool in another host; use an operator-side programmatic transfer
and its returned reference ID. The local process/caller is part of the trust boundary.

## Startup and configuration

Run `npm ci` in the Conjure checkout. Review
`docs/conjure-mcp-config.example.json` and save a private config separately.
The example is disabled and its numbers are illustrative, not approved pricing.
Choose one absolute dataRoot for the operator, permitted brands, a policy expiry,
daily and total USD reservation limits, and a reviewed price schedule with expiry.
Do not copy the existing OpenAI key into that JSON or into Popcorn.

Launch from the Conjure checkout (adjust checkout/env/config paths):

```powershell
node --env-file="C:/Projects/Conjure Studio/.env.local" --import tsx scripts/conjure-mcp.ts serve "C:/Projects/Conjure Studio/conjure-agent.local.json"
```

The MCP host must spawn this command as a stdio process. stdout carries protocol
messages only. The official SDK supports this local transport:
https://ts.sdk.modelcontextprotocol.io/server#stdio

The provider currently remains Conjure's existing `gpt-image-2`, explicit
low/medium/high quality, one 1K image and at most one PNG reference. Conjure's
shared sizing function determines exact dimensions for all ten supported ratios.
No model migration is implicit. The underlying service may retry an explicitly
rejected unsupported moderation parameter, but not timeouts/ambiguous submissions.

## Human quote approval

MCP has no approval tool. After reviewing the image request and price reservation:

```powershell
node --import tsx scripts/conjure-mcp.ts inspect-quote <config.json> <quote-id>
node --import tsx scripts/conjure-mcp.ts approve <config.json> <quote-id> <approval-digest> "Phil"
```

The digest is the exact `approvalDigest` returned by inspect-quote, not a prompt
hash or an agent-supplied yes/no. Generation also requires `allowPaid: true` in the
operator policy. Turning it on is a separate spending decision. Expired policy,
expired pricing, changed pricing, wrong inputs, exhausted limits and revoked
approval stop new work. Quotes expire after at most 30 minutes.

Revoke an unused quote with `revoke <config.json> <quote-id>`. Reads and recovery
of existing paid work remain available when paid generation is disabled.

## Cost meaning and remaining live gate

Conjure credits are not treated as dollars. The private price schedule holds
operator-reviewed USD reserves for the bounded request, with a reference allowance.
They are not a provider-guaranteed maximum. Actual input/output usage and invoices
must be reconciled. Review current provider estimates for the requested sizes and
reference inputs before approving a live schedule; the example does not establish
that review: https://developers.openai.com/api/docs/guides/image-generation

`record-cost <config.json> <operation-id> <actual-usd-micros> <evidence-file> <reviewer>`
records an immutable evidence digest. Budget counts the larger of reserve or actual
cost, including all ambiguous/failed operations. An unexpected overage blocks
further work when limits are exhausted. The single operator's daily window is UTC;
this local ledger cannot constrain direct studio use or other checkouts/accounts.
Combined campaign exposure and account controls must be agreed before live use.

The reservation cap deliberately includes HTTP authentication/validation failures
and remains at least the original reservation even when an operator records actual
cost zero. It is a conservative authorization cap, not a claim that the provider
billed that amount. There is no automatic release or paid retry after an HTTP
response; a new allowance requires separate operator policy review, preserving
the full ledger. Missing local credentials are caught before reservation instead.

## Recovery, backups and storage

Back up the complete dataRoot plus private operator policy. Quote, approval,
reservation, submission, cost and asset records belong together. Asset IDs and
SHA-256 digests remain stable; Popcorn's PNG is an export copy. Agent assets currently
live in this local store, not the hosted Conjure browser library.

A writer lock spans provider work. Never remove a lock owned by a live writer.
After a crash, inspect writer.lock. `unlock <config.json> <inspected-token>` checks
the host, PID and process birth identity before removing the lock. A reused PID
does not block recovery of the previous writer's lock. Legacy locks without birth
identity require the PID to be absent; identity/permission errors leave the lock
intact. There is no timeout-based lock stealing. Unknown provider outcomes retain their reservation
and do not resubmit. Compare provider history/billing manually; do not invent a new
idempotency key to bypass the record. Already saved PNG bytes recover a missing
asset record without another purchase. Restore missing/corrupt PNGs from backup.

Records use fsynced file contents followed by directory-entry flushes on POSIX.
Windows uses the bundled PowerShell helper and native MoveFileExW WRITE_THROUGH
for same-volume, non-replacing file/directory publication. If a required durable
operation fails, submission stops; it never falls back to a best-effort write.
Use local storage whose filesystem/hardware honors these durability operations.
See [Microsoft's move contract](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexw).
The image provider allows 240 seconds for slow text/reference requests. A timeout
still remains an ambiguous outcome and does not authorize another purchase.

An empty operation folder or reservation-only temporary file can be left before
submission; ledger scans skip these incomplete starts. A missing reservation with
submission/result/cost evidence blocks the ledger until its backup is restored.
Bounded provider bytes are retained first as provider-response.bin. Unexpected or
invalid image output remains quarantined there with retainedResponse=true and
needs_reconciliation; it is never served as an approved image or repurchased.
Inspect the original locally without changing the quoted operation or its approval.
If a retained response is a valid PNG matching the quote, operation recovery
promotes those exact bytes after a restart; invalid/mismatched originals remain
quarantined. The actual provider checks credential presence before any reservation,
so missing local configuration consumes no quote or budget. Spending gates use the
fresh policy snapshot loaded after local reference validation.

The tool surface does not delete originals, overwrite revisions, send messages or
publish ads. Editing handoffs and hosted library synchronization remain later work.

**Still to do:** Verify an approved real quote/generation and billing, then complete release review and any authorized hosted integration.
