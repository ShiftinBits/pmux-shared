import { describe, it, expect } from 'vitest';
import { encode as msgEncode } from '@msgpack/msgpack';
import { encode, decode, isHostRequest, isHostEvent } from '../codec';
import type {
  HostRequest,
  HostEvent,
  TmuxSession,
  TmuxWindow,
  TmuxPane,
} from '../protocol';

// --- Helpers ---

function roundTrip<T extends HostRequest | HostEvent>(msg: T): T {
  const encoded = encode(msg);
  expect(encoded).toBeInstanceOf(Uint8Array);
  const decoded = decode(encoded);
  return decoded as T;
}

function makeSamplePane(overrides?: Partial<TmuxPane>): TmuxPane {
  return {
    id: '%1',
    index: 0,
    active: true,
    size: { cols: 80, rows: 24 },
    title: 'bash',
    currentCommand: 'zsh',
    ...overrides,
  };
}

function makeSampleWindow(overrides?: Partial<TmuxWindow>): TmuxWindow {
  return {
    id: '@1',
    name: 'main',
    index: 0,
    active: true,
    panes: [makeSamplePane()],
    ...overrides,
  };
}

function makeSampleSession(overrides?: Partial<TmuxSession>): TmuxSession {
  return {
    id: '$1',
    name: 'dev',
    created: 1708700000,
    windows: [makeSampleWindow()],
    lastActivity: 1708700100,
    attached: false,
    ...overrides,
  };
}

// --- Round-trip tests for every HostRequest type ---

describe('HostRequest round-trip', () => {
  it('encodes/decodes list_sessions', () => {
    const msg: HostRequest = { type: 'list_sessions' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes attach', () => {
    const msg: HostRequest = { type: 'attach', paneId: '%3', cols: 120, rows: 40 };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes detach', () => {
    const msg: HostRequest = { type: 'detach' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes input with binary data', () => {
    const data = new Uint8Array([0x1b, 0x5b, 0x41, 0x0a, 0xff, 0x00]);
    const msg: HostRequest = { type: 'input', data };
    const result = roundTrip(msg);
    expect(result.type).toBe('input');
    if (result.type === 'input') {
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data).toEqual(data);
    }
  });

  it('encodes/decodes resize', () => {
    const msg: HostRequest = { type: 'resize', cols: 200, rows: 50 };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes create_session with name and command', () => {
    const msg: HostRequest = { type: 'create_session', name: 'work', command: 'bash' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes create_session without optional fields', () => {
    const msg: HostRequest = { type: 'create_session' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes kill_session', () => {
    const msg: HostRequest = { type: 'kill_session', session: '$2' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes ping', () => {
    const msg: HostRequest = { type: 'ping' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });
});

// --- Round-trip tests for every HostEvent type ---

describe('HostEvent round-trip', () => {
  it('encodes/decodes sessions', () => {
    const msg: HostEvent = {
      type: 'sessions',
      sessions: [
        makeSampleSession(),
        makeSampleSession({
          id: '$2',
          name: 'build',
          attached: true,
          windows: [
            makeSampleWindow({
              id: '@2',
              name: 'editor',
              panes: [
                makeSamplePane({ id: '%3', currentCommand: 'vim' }),
                makeSamplePane({ id: '%4', index: 1, active: false, currentCommand: 'node' }),
              ],
            }),
          ],
        }),
      ],
    };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes sessions with empty list', () => {
    const msg: HostEvent = { type: 'sessions', sessions: [] };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes output with binary data', () => {
    const data = new Uint8Array([
      0x1b, 0x5b, 0x33, 0x32, 0x6d, // ESC[32m (green)
      0x48, 0x65, 0x6c, 0x6c, 0x6f, // "Hello"
      0x1b, 0x5b, 0x30, 0x6d,       // ESC[0m (reset)
    ]);
    const msg: HostEvent = { type: 'output', data };
    const result = roundTrip(msg);
    expect(result.type).toBe('output');
    if (result.type === 'output') {
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data).toEqual(data);
    }
  });

  it('encodes/decodes attached', () => {
    const msg: HostEvent = { type: 'attached', paneId: '%5' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes detached', () => {
    const msg: HostEvent = { type: 'detached' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes session_created', () => {
    const msg: HostEvent = { type: 'session_created', session: '$3', name: 'deploy' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes session_ended', () => {
    const msg: HostEvent = { type: 'session_ended', session: '$3' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes error', () => {
    const msg: HostEvent = {
      type: 'error',
      code: 'PANE_NOT_FOUND',
      message: 'Pane %99 does not exist',
    };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes pong', () => {
    const msg: HostEvent = { type: 'pong', latency: 42 };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });
});

// --- Binary data integrity ---

describe('binary data integrity', () => {
  it('preserves arbitrary byte sequences in input', () => {
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      data[i] = i;
    }
    const msg: HostRequest = { type: 'input', data };
    const result = roundTrip(msg);
    if (result.type === 'input') {
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data.length).toBe(256);
      expect(result.data).toEqual(data);
    }
  });

  it('preserves arbitrary byte sequences in output', () => {
    const data = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) {
      data[i] = i % 256;
    }
    const msg: HostEvent = { type: 'output', data };
    const result = roundTrip(msg);
    if (result.type === 'output') {
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data.length).toBe(1024);
      expect(result.data).toEqual(data);
    }
  });

  it('handles empty binary data', () => {
    const msg: HostRequest = { type: 'input', data: new Uint8Array(0) };
    const result = roundTrip(msg);
    if (result.type === 'input') {
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data.length).toBe(0);
    }
  });
});

// --- Type guards ---

describe('type guards', () => {
  it('isHostRequest returns true for all request types', () => {
    const requests: HostRequest[] = [
      { type: 'list_sessions' },
      { type: 'attach', paneId: '%1', cols: 80, rows: 24 },
      { type: 'detach' },
      { type: 'input', data: new Uint8Array([1]) },
      { type: 'resize', cols: 80, rows: 24 },
      { type: 'create_session' },
      { type: 'kill_session', session: '$1' },
      { type: 'ping' },
    ];
    for (const req of requests) {
      expect(isHostRequest(req)).toBe(true);
      expect(isHostEvent(req)).toBe(false);
    }
  });

  it('isHostEvent returns true for all event types', () => {
    const events: HostEvent[] = [
      { type: 'sessions', sessions: [] },
      { type: 'output', data: new Uint8Array([1]) },
      { type: 'attached', paneId: '%1' },
      { type: 'detached' },
      { type: 'session_created', session: '$1', name: 'test' },
      { type: 'session_ended', session: '$1' },
      { type: 'error', code: 'ERR', message: 'fail' },
      { type: 'pong', latency: 10 },
    ];
    for (const evt of events) {
      expect(isHostEvent(evt)).toBe(true);
      expect(isHostRequest(evt)).toBe(false);
    }
  });
});

// --- Error handling ---

describe('decode error handling', () => {
  it('rejects non-object data', () => {
    expect(() => decode(msgEncode('hello'))).toThrow('expected an object');
    expect(() => decode(msgEncode(42))).toThrow('expected an object');
    expect(() => decode(msgEncode(null))).toThrow('expected an object');
    expect(() => decode(msgEncode(true))).toThrow('expected an object');
  });

  it('rejects object without type field', () => {
    expect(() => decode(msgEncode({ foo: 'bar' }))).toThrow('missing "type" field');
  });

  it('rejects non-string type field', () => {
    expect(() => decode(msgEncode({ type: 123 }))).toThrow('"type" must be a string');
  });

  it('rejects unknown type', () => {
    expect(() => decode(msgEncode({ type: 'unknown_msg' }))).toThrow(
      'Unknown message type: "unknown_msg"'
    );
  });

  it('rejects empty Uint8Array', () => {
    expect(() => decode(new Uint8Array(0))).toThrow();
  });

  it('rejects malformed msgpack data', () => {
    expect(() => decode(new Uint8Array([0xff, 0xfe, 0xfd]))).toThrow();
  });
});
