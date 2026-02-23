# @pocketmux/shared

Shared TypeScript types for the PocketMux wire protocol and signaling messages.

## What's in here

- **`protocol.ts`** — Wire protocol message types (`AgentRequest`, `AgentEvent`, `TmuxSession`, `TmuxWindow`, `TmuxPane`) for DataChannel communication
- **`signaling.ts`** — Signaling WebSocket message types for the Cloudflare Durable Object relay
- **`types.ts`** — Common types (`DeviceType`, `DeviceInfo`, `PairingData`, `TurnCredentials`)

## Usage

This package is consumed via pnpm workspace link by:

- **`@pocketmux/server`** — Cloudflare Worker signaling server
- **`packages/mobile`** — React Native mobile app

The Go agent (`pmux-agent`) mirrors these types manually in Go structs.

## Build

```bash
pnpm build    # compiles TypeScript to dist/
pnpm clean    # removes dist/
```

## License

MIT — see [LICENSE](./LICENSE)
