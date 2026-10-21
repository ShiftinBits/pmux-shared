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
  name?: string;
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

/**
 * The host verified the pairMac of the pair_complete for this mobile, so the
 * server may commit the pairing.
 */
export interface PairAcceptMessage {
  type: 'pair_accept';
  mobileDeviceId: string;
}

/**
 * The host rejected the pair_complete for this mobile (for example, the
 * pairMac did not verify), so the server must not commit the pairing.
 */
export interface PairRejectMessage {
  type: 'pair_reject';
  mobileDeviceId: string;
}

export type SignalingClientMessage =
  | AuthMessage
  | PresenceMessage
  | ConnectRequestMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage
  | PairAcceptMessage
  | PairRejectMessage;

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
  /**
   * 'secret_unavailable': the host is paired with this device but cannot load
   * the pairing shared secret, so reconnect or re-pair.
   */
  reason: 'not_paired' | 'already_connected' | 'secret_unavailable';
}

export interface PeerUnavailableMessage {
  type: 'peer_unavailable';
  /** The relay target that is not connected to the signaling server. */
  deviceId: string;
}

export interface MobileNameUpdatedMessage {
  type: 'mobile_name_updated';
  deviceId: string;
  name: string;
}

export interface PresenceAckMessage {
  type: 'presence_ack';
}

/**
 * Relays a mobile's POST /auth/pair/complete to the host. pairMac is opaque
 * to the server; the host verifies it before answering with pair_accept or
 * pair_reject.
 */
export interface PairCompleteMessage {
  type: 'pair_complete';
  mobileDeviceId: string;
  mobileX25519PublicKey: string;
  mobileName?: string;
  pairMac?: string;
}

/**
 * Answers the host's pair_accept. ok is true only when the server committed
 * the pairing; the host stores the shared secret only then.
 */
export interface PairResultMessage {
  type: 'pair_result';
  mobileDeviceId: string;
  ok: boolean;
}

export type SignalingServerMessage =
  | ConnectRequestMessage
  | SdpOfferMessage
  | SdpAnswerMessage
  | IceCandidateMessage
  | HostOnlineMessage
  | HostOfflineMessage
  | DeviceUnpairedMessage
  | ConnectionRejectedMessage
  | PeerUnavailableMessage
  | MobileNameUpdatedMessage
  | PresenceAckMessage
  | PairCompleteMessage
  | PairResultMessage;
