/**
 * Common Types — Shared across all PocketMux packages
 */

export type DeviceType = 'agent' | 'mobile';

export interface DeviceInfo {
  id: string;
  userId: string;
  publicKey: string;
  deviceType: DeviceType;
  name: string;
  createdAt: number;
}

export interface PairingData {
  pairingCode: string;
  agentX25519PublicKey: string;
  agentDeviceId: string;
  serverUrl: string;
}

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
}
