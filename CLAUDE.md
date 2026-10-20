# CLAUDE.md — @pocketmux/shared

This is the **shared types package** for Pocketmux. It contains the wire-protocol/signaling type definitions plus the MessagePack codec (`src/codec.ts`).

## Key Rules

- All types MUST match the spec in `docs/SPEC.md` Section 6 (Wire Protocol) and Section 5.1 (Signaling)
- Changes here affect both the server and mobile packages — both consume this package as a git dependency (`github:ShiftinBits/pmux-shared#main`), pinned to a SHA in each lockfile — bump each consumer after merging
- The Go agent mirrors these types manually — any change here requires a corresponding change in `packages/agent/internal/protocol/messages.go`
- TypeScript strict mode, no `any`, use `interface` for object shapes
- Named exports only, no default exports
- Sole runtime dependency is `@msgpack/msgpack`
- `dist/` is committed (CI rebuilds and auto-commits it on push to main)
- DataChannel message changes: regenerate cross-language fixtures with `npm run fixtures` (consumed by Go `TestCrossLanguageFixtures`)

## Build

```bash
npm run build    # tsc → dist/
npm run clean    # rm -rf dist/
```
