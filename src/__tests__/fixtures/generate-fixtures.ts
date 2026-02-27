/**
 * Generate msgpack fixture files for cross-language testing.
 *
 * Each fixture is a .msgpack binary file containing the encoded message,
 * paired with a .json file describing the expected decoded value.
 * The Go codec tests load these fixtures to verify compatibility.
 *
 * Run: npx tsx src/__tests__/fixtures/generate-fixtures.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { encode } from '../../codec';
import type { HostRequest, HostEvent } from '../../protocol';

const fixturesDir = dirname(new URL(import.meta.url).pathname);

interface Fixture {
  name: string;
  message: HostRequest | HostEvent;
  jsonRepr: Record<string, unknown>;
}

const fixtures: Fixture[] = [
  // --- HostRequest fixtures ---
  {
    name: 'req_list_sessions',
    message: { type: 'list_sessions' },
    jsonRepr: { type: 'list_sessions' },
  },
  {
    name: 'req_attach',
    message: { type: 'attach', paneId: '%3', cols: 120, rows: 40 },
    jsonRepr: { type: 'attach', paneId: '%3', cols: 120, rows: 40 },
  },
  {
    name: 'req_detach',
    message: { type: 'detach' },
    jsonRepr: { type: 'detach' },
  },
  {
    name: 'req_input',
    message: { type: 'input', data: new Uint8Array([0x1b, 0x5b, 0x41, 0x0a, 0xff, 0x00]) },
    jsonRepr: { type: 'input', data: [0x1b, 0x5b, 0x41, 0x0a, 0xff, 0x00] },
  },
  {
    name: 'req_resize',
    message: { type: 'resize', cols: 200, rows: 50 },
    jsonRepr: { type: 'resize', cols: 200, rows: 50 },
  },
  {
    name: 'req_kill_session',
    message: { type: 'kill_session', session: '$2' },
    jsonRepr: { type: 'kill_session', session: '$2' },
  },
  {
    name: 'req_ping',
    message: { type: 'ping' },
    jsonRepr: { type: 'ping' },
  },

  // --- HostEvent fixtures ---
  {
    name: 'evt_sessions',
    message: {
      type: 'sessions',
      sessions: [
        {
          id: '$1',
          name: 'dev',
          created: 1708700000,
          windows: [
            {
              id: '@1',
              name: 'main',
              index: 0,
              active: true,
              panes: [
                {
                  id: '%1',
                  index: 0,
                  active: true,
                  size: { cols: 80, rows: 24 },
                  title: 'bash',
                  currentCommand: 'zsh',
                },
              ],
            },
          ],
          lastActivity: 1708700100,
          attached: false,
        },
      ],
    },
    jsonRepr: {
      type: 'sessions',
      sessions: [
        {
          id: '$1',
          name: 'dev',
          created: 1708700000,
          windows: [
            {
              id: '@1',
              name: 'main',
              index: 0,
              active: true,
              panes: [
                {
                  id: '%1',
                  index: 0,
                  active: true,
                  size: { cols: 80, rows: 24 },
                  title: 'bash',
                  currentCommand: 'zsh',
                },
              ],
            },
          ],
          lastActivity: 1708700100,
          attached: false,
        },
      ],
    },
  },
  {
    name: 'evt_sessions_empty',
    message: { type: 'sessions', sessions: [] },
    jsonRepr: { type: 'sessions', sessions: [] },
  },
  {
    name: 'evt_output',
    message: {
      type: 'output',
      data: new Uint8Array([0x1b, 0x5b, 0x33, 0x32, 0x6d, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x1b, 0x5b, 0x30, 0x6d]),
    },
    jsonRepr: {
      type: 'output',
      data: [0x1b, 0x5b, 0x33, 0x32, 0x6d, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x1b, 0x5b, 0x30, 0x6d],
    },
  },
  {
    name: 'evt_attached',
    message: { type: 'attached', paneId: '%5' },
    jsonRepr: { type: 'attached', paneId: '%5' },
  },
  {
    name: 'evt_detached',
    message: { type: 'detached' },
    jsonRepr: { type: 'detached' },
  },
  {
    name: 'evt_session_ended',
    message: { type: 'session_ended', session: '$3' },
    jsonRepr: { type: 'session_ended', session: '$3' },
  },
  {
    name: 'evt_error',
    message: { type: 'error', code: 'PANE_NOT_FOUND', message: 'Pane %99 does not exist' },
    jsonRepr: { type: 'error', code: 'PANE_NOT_FOUND', message: 'Pane %99 does not exist' },
  },
  {
    name: 'evt_pong',
    message: { type: 'pong', latency: 42 },
    jsonRepr: { type: 'pong', latency: 42 },
  },
];

mkdirSync(fixturesDir, { recursive: true });

for (const fixture of fixtures) {
  const msgpackPath = join(fixturesDir, `${fixture.name}.msgpack`);
  const jsonPath = join(fixturesDir, `${fixture.name}.json`);

  const encoded = encode(fixture.message);
  writeFileSync(msgpackPath, encoded);
  writeFileSync(jsonPath, JSON.stringify(fixture.jsonRepr, null, 2) + '\n');

  console.log(`Generated: ${fixture.name} (${encoded.length} bytes)`);
}

console.log(`\nGenerated ${fixtures.length} fixtures in ${fixturesDir}`);
