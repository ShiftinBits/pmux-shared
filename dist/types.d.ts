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
    /**
     * One-time pairing secret: 16 chars from the pairing alphabet
     * (ABCDEFGHJKLMNPQRSTUVWXYZ23456789). Travels only in the QR code and the
     * manual pairing code; never sent to the server and never persisted.
     */
    pairingSecret: string;
}
export interface TurnCredentials {
    urls: string[];
    username: string;
    credential: string;
}
