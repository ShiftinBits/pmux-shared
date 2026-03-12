# @pocketmux/shared

[![Test Results](https://img.shields.io/github/actions/workflow/status/shiftinbits/pmux-shared/test.yml?branch=main&logo=go&logoColor=white&label=tests)](https://github.com/shiftinbits/pmux-shared/actions/workflows/test.yml?query=branch%3Amain) [![Code Coverage](https://img.shields.io/codecov/c/github/shiftinbits/pmux-shared?logo=codecov&logoColor=white)](https://app.codecov.io/gh/shiftinbits/pmux-shared/) [![Snyk Security Monitored](https://img.shields.io/badge/security-monitored-8A2BE2?logo=snyk)](https://snyk.io/test/github/shiftinbits/pmux-shared) [![License](https://img.shields.io/badge/license-MIT-3DA639?logo=opensourceinitiative&logoColor=white)](LICENSE)

Shared TypeScript library for the pmux wire protocol and signaling messages.

## What's in here

- **`protocol.ts`** — Wire protocol message types (`AgentRequest`, `AgentEvent`, `TmuxSession`, `TmuxWindow`, `TmuxPane`) for DataChannel communication
- **`signaling.ts`** — Signaling WebSocket message types for the Cloudflare Durable Object relay
- **`types.ts`** — Common types (`DeviceType`, `DeviceInfo`, `PairingData`, `TurnCredentials`)

## Build

```bash
npm run build    # compiles TypeScript to dist/
npm run clean    # removes dist/
```

## License

MIT — see [LICENSE](./LICENSE)
