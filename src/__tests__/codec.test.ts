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
    createdAt: 1708700000,
    windows: [makeSampleWindow()],
    lastActivityAt: 1708700100,
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

  it('encodes/decodes attach with reattach flag', () => {
    const msg: HostRequest = { type: 'attach', paneId: '%3', cols: 120, rows: 40, reattach: true };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
  });

  it('encodes/decodes attach with compression', () => {
    const msg: HostRequest = { type: 'attach', paneId: '%1', cols: 80, rows: 24, compression: 'deflate' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
    if (result.type === 'attach') {
      expect(result.compression).toBe('deflate');
    }
  });

  it('encodes/decodes attach without compression (field absent)', () => {
    const msg: HostRequest = { type: 'attach', paneId: '%1', cols: 80, rows: 24 };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
    if (result.type === 'attach') {
      expect(result.compression).toBeUndefined();
    }
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

  it('encodes/decodes attached with compression', () => {
    const msg: HostEvent = { type: 'attached', paneId: '%1', compression: 'deflate' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
    if (result.type === 'attached') {
      expect(result.compression).toBe('deflate');
    }
  });

  it('encodes/decodes attached without compression (field absent)', () => {
    const msg: HostEvent = { type: 'attached', paneId: '%1' };
    const result = roundTrip(msg);
    expect(result).toEqual(msg);
    if (result.type === 'attached') {
      expect(result.compression).toBeUndefined();
    }
  });

  it('encodes/decodes detached', () => {
    const msg: HostEvent = { type: 'detached' };
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

  it('encodes/decodes pane_closed', () => {
    const msg: HostEvent = { type: 'pane_closed', paneId: '%7' };
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
      { type: 'session_ended', session: '$1' },
      { type: 'error', code: 'ERR', message: 'fail' },
      { type: 'pong', latency: 10 },
      { type: 'pane_closed', paneId: '%7' },
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

// --- Structural field validation ---

describe('decode structural validation', () => {
  // Helper: encode a raw object and decode it, bypassing TS types
  function decodeMalformed(obj: Record<string, unknown>): void {
    decode(msgEncode(obj));
  }

  // -- HostRequest types --

  describe('attach', () => {
    it('rejects missing paneId', () => {
      expect(() => decodeMalformed({ type: 'attach', cols: 80, rows: 24 }))
        .toThrow('attach: "paneId" must be a string');
    });

    it('rejects non-string paneId', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: 123, cols: 80, rows: 24 }))
        .toThrow('attach: "paneId" must be a string');
    });

    it('rejects missing cols', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', rows: 24 }))
        .toThrow('attach: "cols" must be a finite number');
    });

    it('rejects non-number cols', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: '80', rows: 24 }))
        .toThrow('attach: "cols" must be a finite number');
    });

    it('rejects missing rows', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: 80 }))
        .toThrow('attach: "rows" must be a finite number');
    });

    it('rejects non-boolean reattach', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: 80, rows: 24, reattach: 'yes' }))
        .toThrow('attach: "reattach" must be a boolean');
    });

    it('accepts valid reattach boolean', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: 80, rows: 24, reattach: true }))
        .not.toThrow();
    });

    it('rejects NaN cols', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: NaN, rows: 24 }))
        .toThrow('attach: "cols" must be a finite number');
    });

    it('rejects Infinity rows', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: 80, rows: Infinity }))
        .toThrow('attach: "rows" must be a finite number');
    });

    it('accepts valid compression string', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: 80, rows: 24, compression: 'deflate' }))
        .not.toThrow();
    });

    it('rejects non-string compression', () => {
      expect(() => decodeMalformed({ type: 'attach', paneId: '%1', cols: 80, rows: 24, compression: 123 }))
        .toThrow('attach: "compression" must be a string');
    });
  });

  describe('input', () => {
    it('rejects missing data', () => {
      expect(() => decodeMalformed({ type: 'input' }))
        .toThrow('input: "data" must be a Uint8Array');
    });

    it('rejects non-Uint8Array data', () => {
      expect(() => decodeMalformed({ type: 'input', data: 'not-binary' }))
        .toThrow('input: "data" must be a Uint8Array');
    });

    it('rejects array data (not Uint8Array)', () => {
      expect(() => decodeMalformed({ type: 'input', data: [1, 2, 3] }))
        .toThrow('input: "data" must be a Uint8Array');
    });
  });

  describe('resize', () => {
    it('rejects missing cols', () => {
      expect(() => decodeMalformed({ type: 'resize', rows: 24 }))
        .toThrow('resize: "cols" must be a finite number');
    });

    it('rejects missing rows', () => {
      expect(() => decodeMalformed({ type: 'resize', cols: 80 }))
        .toThrow('resize: "rows" must be a finite number');
    });
  });

  describe('kill_session', () => {
    it('rejects missing session', () => {
      expect(() => decodeMalformed({ type: 'kill_session' }))
        .toThrow('kill_session: "session" must be a string');
    });

    it('rejects non-string session', () => {
      expect(() => decodeMalformed({ type: 'kill_session', session: 42 }))
        .toThrow('kill_session: "session" must be a string');
    });
  });

  // -- HostEvent types --

  describe('sessions', () => {
    it('rejects missing sessions field', () => {
      expect(() => decodeMalformed({ type: 'sessions' }))
        .toThrow('sessions: "sessions" must be an array');
    });

    it('rejects non-array sessions field', () => {
      expect(() => decodeMalformed({ type: 'sessions', sessions: 'not-array' }))
        .toThrow('sessions: "sessions" must be an array');
    });
  });

  describe('output', () => {
    it('rejects missing data', () => {
      expect(() => decodeMalformed({ type: 'output' }))
        .toThrow('output: "data" must be a Uint8Array');
    });

    it('rejects non-Uint8Array data', () => {
      expect(() => decodeMalformed({ type: 'output', data: 'text' }))
        .toThrow('output: "data" must be a Uint8Array');
    });
  });

  describe('attached', () => {
    it('rejects missing paneId', () => {
      expect(() => decodeMalformed({ type: 'attached' }))
        .toThrow('attached: "paneId" must be a string');
    });

    it('accepts valid compression string', () => {
      expect(() => decodeMalformed({ type: 'attached', paneId: '%1', compression: 'deflate' }))
        .not.toThrow();
    });

    it('rejects non-string compression', () => {
      expect(() => decodeMalformed({ type: 'attached', paneId: '%1', compression: 123 }))
        .toThrow('attached: "compression" must be a string');
    });
  });

  describe('session_ended', () => {
    it('rejects missing session', () => {
      expect(() => decodeMalformed({ type: 'session_ended' }))
        .toThrow('session_ended: "session" must be a string');
    });
  });

  describe('pane_closed', () => {
    it('rejects missing paneId', () => {
      expect(() => decodeMalformed({ type: 'pane_closed' }))
        .toThrow('pane_closed: "paneId" must be a string');
    });
  });

  describe('error', () => {
    it('rejects missing code', () => {
      expect(() => decodeMalformed({ type: 'error', message: 'fail' }))
        .toThrow('error: "code" must be a string');
    });

    it('rejects missing message', () => {
      expect(() => decodeMalformed({ type: 'error', code: 'ERR' }))
        .toThrow('error: "message" must be a string');
    });
  });

  describe('pong', () => {
    it('rejects missing latency', () => {
      expect(() => decodeMalformed({ type: 'pong' }))
        .toThrow('pong: "latency" must be a finite number');
    });

    it('rejects non-number latency', () => {
      expect(() => decodeMalformed({ type: 'pong', latency: '42' }))
        .toThrow('pong: "latency" must be a finite number');
    });
  });

  // -- Types with no extra fields (should still pass) --

  describe('type-only messages pass validation', () => {
    it('list_sessions passes', () => {
      expect(() => decodeMalformed({ type: 'list_sessions' })).not.toThrow();
    });

    it('detach passes', () => {
      expect(() => decodeMalformed({ type: 'detach' })).not.toThrow();
    });

    it('ping passes', () => {
      expect(() => decodeMalformed({ type: 'ping' })).not.toThrow();
    });

    it('detached passes', () => {
      expect(() => decodeMalformed({ type: 'detached' })).not.toThrow();
    });
  });
});
