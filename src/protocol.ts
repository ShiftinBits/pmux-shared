/**
 * Wire Protocol Types — Pocketmux DataChannel Messages
 *
 * All messages between mobile app and host flow over the WebRTC DataChannel,
 * serialized with MessagePack. These types are the contract between the
 * TypeScript packages (server, mobile) and the Go host agent (which mirrors them).
 */

// === Mobile → Host (Requests) ===

export interface ListSessionsRequest {
  type: 'list_sessions';
}

export interface AttachRequest {
  type: 'attach';
  paneId: string;
  cols: number;
  rows: number;
  reattach?: boolean;
  compression?: 'deflate';
}

export interface DetachRequest {
  type: 'detach';
}

export interface InputRequest {
  type: 'input';
  data: Uint8Array;
}

export interface ResizeRequest {
  type: 'resize';
  cols: number;
  rows: number;
}

export interface KillSessionRequest {
  type: 'kill_session';
  session: string;
}

export interface CreateSessionRequest {
  type: 'create_session';
}

export interface PingRequest {
  type: 'ping';
}

/**
 * Proof that the connecting peer possesses the X25519 shared secret derived at
 * pairing. Sent in response to an AuthChallengeEvent as the first DataChannel
 * message. `mac` is HMAC-SHA256(sharedSecret, challenge.nonce). The host rejects
 * the connection if this is missing, malformed, or fails verification. This
 * authenticates the peer independently of the (untrusted) signaling server.
 */
export interface AuthResponseRequest {
  type: 'auth_response';
  mac: Uint8Array;
}

export type HostRequest =
  | ListSessionsRequest
  | AttachRequest
  | DetachRequest
  | InputRequest
  | ResizeRequest
  | KillSessionRequest
  | CreateSessionRequest
  | PingRequest
  | AuthResponseRequest;

// === Host → Mobile (Events) ===

export interface SessionsEvent {
  type: 'sessions';
  sessions: TmuxSession[];
  /** Agent version string (e.g., "1.2.3"). Present when agent supports update checking. */
  agentVersion?: string;
  /** Latest available version string if an update is available, undefined otherwise. */
  updateAvailable?: string;
}

export interface OutputEvent {
  type: 'output';
  data: Uint8Array;
}

export interface AttachedEvent {
  type: 'attached';
  paneId: string;
  compression?: 'deflate';
}

export interface DetachedEvent {
  type: 'detached';
}

export interface SessionEndedEvent {
  type: 'session_ended';
  session: string;
}

export interface PaneClosedEvent {
  type: 'pane_closed';
  paneId: string;
}

export interface SessionCreatedEvent {
  type: 'session_created';
  session: TmuxSession;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface PongEvent {
  type: 'pong';
  latency: number;
}

/**
 * Per-connection challenge the host sends as the first DataChannel message.
 * The mobile must reply with an AuthResponseRequest carrying
 * HMAC-SHA256(sharedSecret, nonce). The random nonce binds the proof to this
 * connection, preventing replay of a captured response across sessions.
 */
export interface AuthChallengeEvent {
  type: 'auth_challenge';
  nonce: Uint8Array;
}

export type HostEvent =
  | SessionsEvent
  | OutputEvent
  | AttachedEvent
  | DetachedEvent
  | SessionEndedEvent
  | PaneClosedEvent
  | SessionCreatedEvent
  | ErrorEvent
  | PongEvent
  | AuthChallengeEvent;

// === tmux Data Types ===

export interface TmuxSession {
  id: string;
  name: string;
  /** Unix timestamp in seconds */
  createdAt: number;
  windows: TmuxWindow[];
  /** Unix timestamp in seconds */
  lastActivityAt: number;
  attached: boolean;
}

export interface TmuxWindow {
  id: string;
  name: string;
  index: number;
  active: boolean;
  panes: TmuxPane[];
}

export interface TmuxPane {
  id: string;
  index: number;
  active: boolean;
  size: { cols: number; rows: number };
  title: string;
  currentCommand: string;
}
