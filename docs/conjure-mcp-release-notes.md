# Local MCP release candidate — 11 September 2026

Conjure owns generation and durable original assets; Popcorn owns briefs,
approvals, experiments, QA and learning. This is a local single-operator stdio
adapter. Hosted library/editing integration and remote multi-user service are
separate phases. No new paid generation is part of this release preparation.

The candidate includes the scoped MCP implementation, restart and actual-process
recovery tests, native/PDF dependency compatibility checks, zero audited dependency
vulnerabilities after clean installation, and upstream base dfa0972. That commit
fixes the old checker's inability to see the existing conventions.yml PR guard.
The real check:ci-coverage now passes with all 32 check aliases wired. Our redundant
ci.yml addition is removed; no workflow changes remain. check:conventions also
passes locally. Remote CI remains unverified until publication.

All 19 existing mocked browser tests pass locally, including annotation, logo/3D,
mockup and thumbnail flows. Two helper test mocks now distinguish availability
GETs from inference POSTs; their original assertions and production behavior are
unchanged. Full lint passes with zero errors and 402 warnings. No provider key or
paid inference was used by the browser run.

## Rule-scope correction

An earlier assistant-generated handoff incorrectly imposed Popcorn's workflow
edit prohibition on this separate Conjure repository. Popcorn CLAUDE.md:19 applies
within Popcorn. Conjure CLAUDE.md:141-145 requires CI steps for checks; its note
about GitHub token scope concerns publication/merging, not authorized local editing.
Conjure's AGENTS.md contains no local workflow-edit prohibition. The existing local
build authorization covers ordinary local integration. Fresh remote/source checks
showed master was one commit ahead and already fixed this exact coverage issue.
The branch base advanced from 41834ed to dfa0972 without a merge or publication;
19 intended changed files matched their pre-integration hashes before these notes
were updated. Only our redundant ci.yml addition was removed.

Do not promote assistant summaries into extra user approval requirements or carry
repository-local rules across repository boundaries. Check the applicable source
instructions and current upstream. Inspect all PR workflows before concluding a
guard is unwired; an old checker's failure is not proof that the guard is absent.
Popcorn's own workflows remain untouched. Commit/push/PR/deployment
and paid operations still require their existing explicit approvals; Codex never merges.

**Still to do:** Obtain scoped publication authorization and verify remote CI and the relevant deployed operator path.
