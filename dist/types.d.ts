/**
 * Common Types — Shared across all Pocketmux packages
 */
export type DeviceType = 'host' | 'mobile';
export interface DeviceInfo {
    id: string;
    /** Ed25519 public key, base64-encoded. Used for device identity verification. */
    ed25519PublicKey: string;
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
