/**
 * Signaling Message Types — Cloudflare Durable Object WebSocket Protocol
 *
 * These messages flow between clients (agent/mobile) and the signaling
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
}

export type SignalingClientMessage =
  | AuthMessage
  | PresenceMessage
  | ConnectRequestMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage;

// === Server → Client Messages ===

export interface AgentOnlineMessage {
  type: 'agent_online';
  deviceId: string;
}

export interface AgentOfflineMessage {
  type: 'agent_offline';
  deviceId: string;
}

export type SignalingServerMessage =
  | ConnectRequestMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage
  | AgentOnlineMessage
  | AgentOfflineMessage;
