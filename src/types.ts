/**
 * Common Types — Shared across all PocketMux packages
 */

export type DeviceType = 'host' | 'mobile';

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
  hostX25519PublicKey: string;
  hostDeviceId: string;
  serverUrl: string;
}

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
}
