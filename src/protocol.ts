/**
 * Wire Protocol Types — PocketMux DataChannel Messages
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

export interface PingRequest {
  type: 'ping';
}

export type HostRequest =
  | ListSessionsRequest
  | AttachRequest
  | DetachRequest
  | InputRequest
  | ResizeRequest
  | KillSessionRequest
  | PingRequest;

// === Host → Mobile (Events) ===

export interface SessionsEvent {
  type: 'sessions';
  sessions: TmuxSession[];
}

export interface OutputEvent {
  type: 'output';
  data: Uint8Array;
}

export interface AttachedEvent {
  type: 'attached';
  paneId: string;
}

export interface DetachedEvent {
  type: 'detached';
}

export interface SessionEndedEvent {
  type: 'session_ended';
  session: string;
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

export type HostEvent =
  | SessionsEvent
  | OutputEvent
  | AttachedEvent
  | DetachedEvent
  | SessionEndedEvent
  | ErrorEvent
  | PongEvent;

// === tmux Data Types ===

export interface TmuxSession {
  id: string;
  name: string;
  created: number;
  windows: TmuxWindow[];
  lastActivity: number;
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
