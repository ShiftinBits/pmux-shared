/**
 * MessagePack codec for PocketMux wire protocol.
 *
 * Encodes/decodes AgentRequest and AgentEvent messages for transmission
 * over the WebRTC DataChannel. Uint8Array fields (terminal I/O) pass
 * through as raw binary — no base64 encoding.
 */

import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
import type { AgentRequest, AgentEvent } from './protocol';

const AGENT_REQUEST_TYPES: ReadonlySet<string> = new Set([
  'list_sessions',
  'attach',
  'detach',
  'input',
  'resize',
  'create_session',
  'kill_session',
  'ping',
]);

const AGENT_EVENT_TYPES: ReadonlySet<string> = new Set([
  'sessions',
  'output',
  'attached',
  'detached',
  'session_created',
  'session_ended',
  'error',
  'pong',
]);

/**
 * Encode a protocol message to MessagePack binary.
 */
export function encode(msg: AgentRequest | AgentEvent): Uint8Array {
  return msgpackEncode(msg);
}

/**
 * Decode MessagePack binary to a protocol message.
 * Validates that the decoded value has a recognized `type` field.
 */
export function decode(data: Uint8Array): AgentRequest | AgentEvent {
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

  if (!AGENT_REQUEST_TYPES.has(type) && !AGENT_EVENT_TYPES.has(type)) {
    throw new Error(`Unknown message type: "${type}"`);
  }

  return decoded as AgentRequest | AgentEvent;
}

/**
 * Type guard: returns true if the message is a Mobile → Agent request.
 */
export function isAgentRequest(msg: AgentRequest | AgentEvent): msg is AgentRequest {
  return AGENT_REQUEST_TYPES.has(msg.type);
}

/**
 * Type guard: returns true if the message is an Agent → Mobile event.
 */
export function isAgentEvent(msg: AgentRequest | AgentEvent): msg is AgentEvent {
  return AGENT_EVENT_TYPES.has(msg.type);
}
