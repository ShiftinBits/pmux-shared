/**
 * MessagePack codec for Pocketmux wire protocol.
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
/** Validation limits — aligned with Go agent constants. */
export const MAX_MESSAGE_SIZE = 1024 * 1024; // 1 MiB — matches Go agent MaxMessageSize
export const MAX_STRING_ID_LENGTH = 255;
export const MAX_ERROR_CODE_LENGTH = 255;
export const MAX_ERROR_MESSAGE_LENGTH = 4096;
export const MAX_INPUT_SIZE = 16 * 1024;
export const MAX_OUTPUT_SIZE = 1024 * 1024;
export const MIN_DIMENSION = 1;
export const MAX_DIMENSION = 500;
/**
 * Encode a protocol message to MessagePack binary.
 */
export function encode(msg) {
    return msgpackEncode(msg);
}
function assertString(msg, type, field, maxLength = MAX_STRING_ID_LENGTH) {
    if (typeof msg[field] !== 'string') {
        throw new Error(`${type}: "${field}" must be a string`);
    }
    if (msg[field].length > maxLength) {
        throw new Error(`${type}: "${field}" exceeds maximum length of ${maxLength}`);
    }
}
function assertNumber(msg, type, field, min, max) {
    if (typeof msg[field] !== 'number' || !Number.isFinite(msg[field])) {
        throw new Error(`${type}: "${field}" must be a finite number`);
    }
    const val = msg[field];
    if (min !== undefined && val < min) {
        throw new Error(`${type}: "${field}" must be between ${min} and ${max ?? 'Infinity'}`);
    }
    if (max !== undefined && val > max) {
        throw new Error(`${type}: "${field}" must be between ${min ?? '-Infinity'} and ${max}`);
    }
}
function assertUint8Array(msg, type, field, maxSize) {
    if (!(msg[field] instanceof Uint8Array)) {
        throw new Error(`${type}: "${field}" must be a Uint8Array`);
    }
    if (maxSize !== undefined && msg[field].length > maxSize) {
        throw new Error(`${type}: "${field}" exceeds maximum size of ${maxSize} bytes`);
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
            assertNumber(msg, 'attach', 'cols', MIN_DIMENSION, MAX_DIMENSION);
            assertNumber(msg, 'attach', 'rows', MIN_DIMENSION, MAX_DIMENSION);
            if ('reattach' in msg && typeof msg['reattach'] !== 'boolean') {
                throw new Error('attach: "reattach" must be a boolean');
            }
            if ('compression' in msg && typeof msg['compression'] !== 'string') {
                throw new Error('attach: "compression" must be a string');
            }
            break;
        case 'input':
            assertUint8Array(msg, 'input', 'data', MAX_INPUT_SIZE);
            break;
        case 'resize':
            assertNumber(msg, 'resize', 'cols', MIN_DIMENSION, MAX_DIMENSION);
            assertNumber(msg, 'resize', 'rows', MIN_DIMENSION, MAX_DIMENSION);
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
            assertUint8Array(msg, 'output', 'data', MAX_OUTPUT_SIZE);
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
            assertString(msg, 'error', 'code', MAX_ERROR_CODE_LENGTH);
            assertString(msg, 'error', 'message', MAX_ERROR_MESSAGE_LENGTH);
            break;
        case 'pong':
            assertNumber(msg, 'pong', 'latency', 0);
            break;
    }
}
/**
 * Decode MessagePack binary to a protocol message.
 * Validates that the decoded value has a recognized `type` field
 * and that all required structural fields are present with correct types.
 */
export function decode(data) {
    if (data.length > MAX_MESSAGE_SIZE) {
        throw new Error(`Message size ${data.length} exceeds maximum ${MAX_MESSAGE_SIZE}`);
    }
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