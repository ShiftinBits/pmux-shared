/**
 * MessagePack codec for PocketMux wire protocol.
 *
 * Encodes/decodes HostRequest and HostEvent messages for transmission
 * over the WebRTC DataChannel. Uint8Array fields (terminal I/O) pass
 * through as raw binary — no base64 encoding.
 */
import type { HostRequest, HostEvent } from './protocol';
/**
 * Encode a protocol message to MessagePack binary.
 */
export declare function encode(msg: HostRequest | HostEvent): Uint8Array;
/**
 * Decode MessagePack binary to a protocol message.
 * Validates that the decoded value has a recognized `type` field
 * and that all required structural fields are present with correct types.
 */
export declare function decode(data: Uint8Array): HostRequest | HostEvent;
/**
 * Type guard: returns true if the message is a Mobile → Host request.
 */
export declare function isHostRequest(msg: HostRequest | HostEvent): msg is HostRequest;
/**
 * Type guard: returns true if the message is a Host → Mobile event.
 */
export declare function isHostEvent(msg: HostRequest | HostEvent): msg is HostEvent;
