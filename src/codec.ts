/**
 * MessagePack codec for Pocketmux wire protocol.
 *
 * Encodes/decodes HostRequest and HostEvent messages for transmission
 * over the WebRTC DataChannel. Uint8Array fields (terminal I/O) pass
 * through as raw binary — no base64 encoding.
 */

import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
import type { HostRequest, HostEvent } from './protocol';

// Derive type-string literals from the discriminated unions so that adding
// a new message type to HostRequest/HostEvent without updating these tuples
// causes a compile-time error instead of a silent runtime mismatch.
type HostRequestType = HostRequest['type'];
type HostEventType = HostEvent['type'];

// Compile-time check: ensures every member of union T appears in tuple U.
// Resolves to `true` when exhaustive; becomes `never` (causing a TS error
// on the type alias assignment) when a union member is missing.
type AssertExhaustive<T extends string, U extends readonly T[]> =
  Exclude<T, U[number]> extends never ? true : never;

const HOST_REQUEST_TYPE_TUPLE = [
  'list_sessions', 'attach', 'detach', 'input', 'resize', 'kill_session', 'ping',
] as const satisfies readonly HostRequestType[];

const HOST_EVENT_TYPE_TUPLE = [
  'sessions', 'output', 'attached', 'detached', 'session_ended', 'pane_closed', 'error', 'pong',
] as const satisfies readonly HostEventType[];

// These type aliases exist solely to trigger compile errors when a union
// member is added to protocol.ts but not included in the tuples above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckRequests = AssertExhaustive<HostRequestType, typeof HOST_REQUEST_TYPE_TUPLE>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckEvents = AssertExhaustive<HostEventType, typeof HOST_EVENT_TYPE_TUPLE>;

const HOST_REQUEST_TYPES: ReadonlySet<string> = new Set(HOST_REQUEST_TYPE_TUPLE);
const HOST_EVENT_TYPES: ReadonlySet<string> = new Set(HOST_EVENT_TYPE_TUPLE);

/**
 * Encode a protocol message to MessagePack binary.
 */
export function encode(msg: HostRequest | HostEvent): Uint8Array {
  return msgpackEncode(msg);
}

function assertString(msg: Record<string, unknown>, type: string, field: string): void {
  if (typeof msg[field] !== 'string') {
    throw new Error(`${type}: "${field}" must be a string`);
  }
}

function assertNumber(msg: Record<string, unknown>, type: string, field: string): void {
  if (typeof msg[field] !== 'number' || !Number.isFinite(msg[field] as number)) {
    throw new Error(`${type}: "${field}" must be a finite number`);
  }
}

function assertUint8Array(msg: Record<string, unknown>, type: string, field: string): void {
  if (!(msg[field] instanceof Uint8Array)) {
    throw new Error(`${type}: "${field}" must be a Uint8Array`);
  }
}

function assertArray(msg: Record<string, unknown>, type: string, field: string): void {
  if (!Array.isArray(msg[field])) {
    throw new Error(`${type}: "${field}" must be an array`);
  }
}

/**
 * Validate structural fields beyond `type` for each message kind.
 * Throws if any required field is missing or has the wrong type.
 */
function validateFields(msg: Record<string, unknown>): void {
  switch (msg['type']) {
    // Requests with no extra required fields
    case 'list_sessions':
    case 'detach':
    case 'ping':
      break;

    case 'attach':
      assertString(msg, 'attach', 'paneId');
      assertNumber(msg, 'attach', 'cols');
      assertNumber(msg, 'attach', 'rows');
      if ('reattach' in msg && typeof msg['reattach'] !== 'boolean') {
        throw new Error('attach: "reattach" must be a boolean');
      }
      if ('compression' in msg && typeof msg['compression'] !== 'string') {
        throw new Error('attach: "compression" must be a string');
      }
      break;

    case 'input':
      assertUint8Array(msg, 'input', 'data');
      break;

    case 'resize':
      assertNumber(msg, 'resize', 'cols');
      assertNumber(msg, 'resize', 'rows');
      break;

    case 'kill_session':
      assertString(msg, 'kill_session', 'session');
      break;

    // Events with no extra required fields
    case 'detached':
      break;

    case 'sessions':
      assertArray(msg, 'sessions', 'sessions');
      break;

    case 'output':
      assertUint8Array(msg, 'output', 'data');
      break;

    case 'attached':
      assertString(msg, 'attached', 'paneId');
      if ('compression' in msg && typeof msg['compression'] !== 'string') {
        throw new Error('attached: "compression" must be a string');
      }
      break;

    case 'session_ended':
      assertString(msg, 'session_ended', 'session');
      break;

    case 'pane_closed':
      assertString(msg, 'pane_closed', 'paneId');
      break;

    case 'error':
      assertString(msg, 'error', 'code');
      assertString(msg, 'error', 'message');
      break;

    case 'pong':
      assertNumber(msg, 'pong', 'latency');
      break;
  }
}

/**
 * Decode MessagePack binary to a protocol message.
 * Validates that the decoded value has a recognized `type` field
 * and that all required structural fields are present with correct types.
 */
export function decode(data: Uint8Array): HostRequest | HostEvent {
  const decoded = msgpackDecode(data);

  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid message: expected an object');
  }

  if (!('type' in decoded)) {
    throw new Error('Invalid message: missing "type" field');
  }

  const msg = decoded as Record<string, unknown>;
  const type = msg['type'];

  if (typeof type !== 'string') {
    throw new Error(`Invalid message: "type" must be a string, got ${typeof type}`);
  }

  if (!HOST_REQUEST_TYPES.has(type) && !HOST_EVENT_TYPES.has(type)) {
    throw new Error(`Unknown message type: "${type}"`);
  }

  validateFields(msg);

  return decoded as HostRequest | HostEvent;
}

/**
 * Type guard: returns true if the message is a Mobile → Host request.
 */
export function isHostRequest(msg: HostRequest | HostEvent): msg is HostRequest {
  return HOST_REQUEST_TYPES.has(msg.type);
}

/**
 * Type guard: returns true if the message is a Host → Mobile event.
 */
export function isHostEvent(msg: HostRequest | HostEvent): msg is HostEvent {
  return HOST_EVENT_TYPES.has(msg.type);
}
