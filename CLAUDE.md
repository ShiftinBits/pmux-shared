# CLAUDE.md — @pocketmux/shared

Wire-protocol (DataChannel) and signaling (WebSocket) type definitions, plus the MessagePack codec. The contract between server, mobile, and the Go agent. Types must match `docs/SPEC.md` §6 (Wire Protocol) and §5.1 (Signaling).

## Quick Reference

| Task | Command |
|------|---------|
| Build | `npm run build` (tsc → `dist/`; `prepare` also cleans + builds on `npm ci` / git install) |
| Test | `npm test` (vitest, `src/__tests__/*.test.ts`) |
| Type-check | `npx tsc --noEmit` (no script; CI `build.yml` runs it) |
| Fixtures | `npm run fixtures` (regenerates `src/__tests__/fixtures/*.msgpack` + `.json`) |

## Layout

| File | Contents |
|------|----------|
| `src/protocol.ts` | `HostRequest` (mobile→host) / `HostEvent` (host→mobile) unions, `TmuxSession`/`TmuxWindow`/`TmuxPane` |
| `src/signaling.ts` | `SignalingClientMessage` / `SignalingServerMessage` unions |
| `src/types.ts` | `DeviceInfo`, `PairingData`, `TurnCredentials`, `DeviceType` |
| `src/codec.ts` | `encode`, `decode` (size + per-type field validation), `isHostRequest`, `isHostEvent`, `MAX_*` limits |
| `src/__tests__/fixtures/generate-fixtures.ts` | Hand-maintained `Fixture[]` list → cross-language fixtures |

Sole runtime dependency: `@msgpack/msgpack`. Named exports only. Code style follows the workspace CLAUDE.md; `tsconfig.json` adds `noUncheckedIndexedAccess` (hence the `msg['field']` access in `codec.ts`).

## Consumers

- **server**: `import type` only (`DeviceType`, `SignalingClientMessage`, `TurnCredentials`, …). Codec changes can't break it at runtime.
- **mobile**: the only runtime codec user (`src/connection/webrtc.ts` — `encode`/`decode`/`isHostEvent`). Mobile Jest maps `@pocketmux/shared` to the sibling `../shared/dist/index.js`, so run `npm run build` here before mobile tests.
- **agent (Go)**: mirrors everything by hand (below).

Both TS consumers depend on `github:ShiftinBits/pmux-shared#main`, pinned to a SHA in each lockfile. After merging, bump each lock (`chore(deps): bump @pocketmux/shared lock to <sha>`).

## Adding / Changing a DataChannel Message

1. `src/protocol.ts`: add the interface and the union member.
2. `src/codec.ts`: add the type string to `HOST_REQUEST_TYPE_TUPLE` or `HOST_EVENT_TYPE_TUPLE` (compile error via `AssertExhaustive` if missed).
3. `src/codec.ts`: add a `validateFields()` case. **Not enforced**: a missing case decodes with no field validation.
4. `src/__tests__/codec.test.ts`: round-trip + `decode structural validation` cases.
5. `generate-fixtures.ts`: add a `Fixture` entry, then `npm run fixtures`.
6. Go: `packages/agent/internal/protocol/messages.go` + `validation.go`. `MAX_*` constants in `codec.ts` mirror `validation.go` / `MaxMessageSize` in `codec.go`; change both sides.
7. Update SPEC §6, `npm run build`, commit `dist/` in the same PR.

## Signaling Messages

Go mirror is a single flat `SignalingMessage` struct in `packages/agent/internal/webrtc/signaling.go` (union of all fields); type dispatch is in `peer.go`. Server→mobile-only messages (`host_online`, `host_offline`, `device_unpaired`, `peer_unavailable`) have no Go handling by design. No fixtures exist for signaling, so parity is unchecked. Update SPEC §5.1.

## Gotchas

- **`dist/` is committed.** Rebuild and commit it in the PR (CI `build.yml` also rebuilds and auto-commits on push to main). Consumers pin a main SHA, so that SHA must contain the rebuilt `dist/`.
- **Tests aren't type-checked.** `tsconfig.json` excludes `src/__tests__`, and vitest doesn't type-check, so a type error in a test file passes CI.
- **`auth_response` asymmetry is intentional.** `isHostRequest()` returns true for it (decode completeness); Go `IsRequest()` excludes it so a post-auth replay is dropped. Don't "fix" either side.
- **Fixture parity is silent outside the workspace.** Go `TestCrossLanguageFixtures` (`agent/internal/protocol/codec_test.go`) reads fixtures via a relative path and skips if it isn't found.
