/**
 * Signaling Message Types — Cloudflare Durable Object WebSocket Protocol
 *
 * These messages flow between clients (host/mobile) and the signaling
 * Durable Object over WebSocket. Used for auth, presence, and WebRTC
 * session establishment (SDP/ICE relay).
 */

// === Client → Server Messages ===

export interface AuthMessage {
  type: 'auth';
  token: string;
}

export interface PresenceMessage {
  type: 'presence';
}

export interface ConnectRequestMessage {
  type: 'connect_request';
  targetDeviceId: string;
}

export interface SdpOfferMessage {
  type: 'sdp_offer';
  sdp: string;
  targetDeviceId: string;
}

export interface SdpAnswerMessage {
  type: 'sdp_answer';
  sdp: string;
  targetDeviceId: string;
}

export interface IceCandidateMessage {
  type: 'ice_candidate';
  candidate: string;
  targetDeviceId: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export type SignalingClientMessage =
  | AuthMessage
  | PresenceMessage
  | ConnectRequestMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage;

// === Server → Client Messages ===

export interface HostOnlineMessage {
  type: 'host_online';
  deviceId: string;
  name?: string;
}

export interface HostOfflineMessage {
  type: 'host_offline';
  deviceId: string;
}

export interface DeviceUnpairedMessage {
  type: 'device_unpaired';
  reason: 'replaced_by_new_pairing' | 'host_unpaired';
  hostDeviceId: string;
  hostName?: string;
}

export interface ConnectionRejectedMessage {
  type: 'connection_rejected';
  reason: 'not_paired' | 'already_connected';
}

export type SignalingServerMessage =
  | ConnectRequestMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage
  | HostOnlineMessage
  | HostOfflineMessage
  | DeviceUnpairedMessage
  | ConnectionRejectedMessage;
