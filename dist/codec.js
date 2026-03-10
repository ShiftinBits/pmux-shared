/**
 * MessagePack codec for PocketMux wire protocol.
 *
 * Encodes/decodes HostRequest and HostEvent messages for transmission
 * over the WebRTC DataChannel. Uint8Array fields (terminal I/O) pass
 * through as raw binary — no base64 encoding.
 */
import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
const HOST_REQUEST_TYPE_TUPLE = [
    'list_sessions', 'attach', 'detach', 'input', 'resize', 'kill_session', 'ping',
];
const HOST_EVENT_TYPE_TUPLE = [
    'sessions', 'output', 'attached', 'detached', 'session_ended', 'pane_closed', 'error', 'pong',
];
const HOST_REQUEST_TYPES = new Set(HOST_REQUEST_TYPE_TUPLE);
const HOST_EVENT_TYPES = new Set(HOST_EVENT_TYPE_TUPLE);
/**
 * Encode a protocol message to MessagePack binary.
 */
export function encode(msg) {
    return msgpackEncode(msg);
}
function assertString(msg, type, field) {
    if (typeof msg[field] !== 'string') {
        throw new Error(`${type}: "${field}" must be a string`);
    }
}
function assertNumber(msg, type, field) {
    if (typeof msg[field] !== 'number' || !Number.isFinite(msg[field])) {
        throw new Error(`${type}: "${field}" must be a finite number`);
    }
}
function assertUint8Array(msg, type, field) {
    if (!(msg[field] instanceof Uint8Array)) {
        throw new Error(`${type}: "${field}" must be a Uint8Array`);
    }
}
function assertArray(msg, type, field) {
    if (!Array.isArray(msg[field])) {
        throw new Error(`${type}: "${field}" must be an array`);
    }
}
/**
 * Validate structural fields beyond `type` for each message kind.
 * Throws if any required field is missing or has the wrong type.
 */
function validateFields(msg) {
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
export function decode(data) {
    const decoded = msgpackDecode(data);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid message: expected an object');
    }
    if (!('type' in decoded)) {
        throw new Error('Invalid message: missing "type" field');
    }
    const msg = decoded;
    const type = msg['type'];
    if (typeof type !== 'string') {
        throw new Error(`Invalid message: "type" must be a string, got ${typeof type}`);
    }
    if (!HOST_REQUEST_TYPES.has(type) && !HOST_EVENT_TYPES.has(type)) {
        throw new Error(`Unknown message type: "${type}"`);
    }
    validateFields(msg);
    return decoded;
}
/**
 * Type guard: returns true if the message is a Mobile → Host request.
 */
export function isHostRequest(msg) {
    return HOST_REQUEST_TYPES.has(msg.type);
}
/**
 * Type guard: returns true if the message is a Host → Mobile event.
 */
export function isHostEvent(msg) {
    return HOST_EVENT_TYPES.has(msg.type);
}
//# sourceMappingURL=codec.js.map