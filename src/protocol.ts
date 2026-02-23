/**
 * Wire Protocol Types — PocketMux DataChannel Messages
 *
 * All messages between mobile app and agent flow over the WebRTC DataChannel,
 * serialized with MessagePack. These types are the contract between the
 * TypeScript packages (server, mobile) and the Go agent (which mirrors them).
 */

// === Mobile → Agent (Requests) ===

export interface ListSessionsRequest {
  type: 'list_sessions';
}

export interface AttachRequest {
  type: 'attach';
  paneId: string;
  cols: number;
  rows: number;
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

export interface CreateSessionRequest {
  type: 'create_session';
  name?: string;
  command?: string;
}

export interface KillSessionRequest {
  type: 'kill_session';
  session: string;
}

export interface PingRequest {
  type: 'ping';
}

export type AgentRequest =
  | ListSessionsRequest
  | AttachRequest
  | DetachRequest
  | InputRequest
  | ResizeRequest
  | CreateSessionRequest
  | KillSessionRequest
  | PingRequest;

// === Agent → Mobile (Events) ===

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

export interface SessionCreatedEvent {
  type: 'session_created';
  session: string;
  name: string;
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

export type AgentEvent =
  | SessionsEvent
  | OutputEvent
  | AttachedEvent
  | DetachedEvent
  | SessionCreatedEvent
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
