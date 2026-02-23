# CLAUDE.md — @pocketmux/shared

This is the **shared types package** for PocketMux. It contains TypeScript type definitions only — no runtime code (codec implementation comes in T1.1).

## Key Rules

- All types MUST match the spec in `docs/SPEC.md` Section 6 (Wire Protocol) and Section 5.1 (Signaling)
- Changes here affect both the server and mobile packages — both consume these types via workspace link
- The Go agent mirrors these types manually — any change here requires a corresponding change in `packages/agent/internal/protocol/messages.go`
- TypeScript strict mode, no `any`, use `interface` for object shapes
- Named exports only, no default exports
- No runtime dependencies — this is a types-only package (until codec is added in T1.1)

## Build

```bash
pnpm build    # tsc → dist/
pnpm clean    # rm -rf dist/
```
