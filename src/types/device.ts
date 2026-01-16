/**
 * Device Types - Unified Type Definitions (Frontend)
 * Mirror of backend types for type-safe device handling
 */

import type { DeviceType, DeviceCategory } from '@/config/deviceTypes';

// ============================================
// STATE INTERFACES
// ============================================

/**
 * Base device state (shared by all devices)
 */
export interface BaseDeviceState {
  online: boolean;
  lastSeen: string;
  rssi?: number;
  firmwareVersion?: string;
}

/**
 * Relay device state
 */
export interface RelayState extends BaseDeviceState {
  channels: boolean[]; // [ch1, ch2, ...] true=ON
}

/**
 * LED Strip device state
 */
export interface LedState extends BaseDeviceState {
  power: boolean;
  r: number;
  g: number;
  b: number;
  w?: number; // For RGBW
  brightness: number; // 0-255
  effect: number; // 0-5
  speed?: number; // 0-255
}

/**
 * Sensor device state
 */
export interface SensorState extends BaseDeviceState {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  motion?: boolean;
}

/**
 * Dimmer device state
 */
export interface DimmerState extends BaseDeviceState {
  power: boolean;
  brightness: number; // 0-100
}

/**
 * Tasmota device state
 */
export interface TasmotaState extends BaseDeviceState {
  power: boolean;
  powerMeter?: {
    voltage?: number;
    current?: number;
    power?: number;
    energy?: number;
  };
}

/**
 * Union type for all device states
 */
export type DeviceState = RelayState | LedState | SensorState | DimmerState | TasmotaState;

// ============================================
// DEVICE INTERFACES
// ============================================

/**
 * Unified Device - main interface for any device
 */
export interface Device {
  // Identification
  id?: number; // DB ID (if registered)
  mac: string; // MAC address (always present)

  // Type
  deviceType: DeviceType | string;
  firmwareId: number | null;
  category: DeviceCategory | string;

  // Info
  name: string;
  icon: string;

  // Relations
  impiantoId?: number;
  stanzaId?: number | null;
  stanzaNome?: string | null;

  // Status
  registered: boolean; // true = in DB, false = in-memory only
  blocked: boolean;
  online: boolean; // Convenience accessor (mirrors state.online)
  state: DeviceState;

  // Additional info
  room?: string; // Room name for display
  rssi?: number; // Signal strength (convenience accessor)
  lastSeen?: string; // Last seen timestamp (convenience accessor)
  channelLabels?: string[]; // Custom labels for relay channels

  // Capabilities (from registry)
  capabilities: string[];
  commands: string[];

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// COMMAND INTERFACES
// ============================================

/**
 * Command to send to a device
 */
export interface DeviceCommand {
  action: string;
  params?: CommandParams;
}

/**
 * Command parameters
 */
export interface CommandParams {
  channel?: number;
  value?: number;
  r?: number;
  g?: number;
  b?: number;
  w?: number;
  brightness?: number;
  effect?: number;
  speed?: number;
}

// ============================================
// API RESPONSE INTERFACES
// ============================================

/**
 * Standard device response
 */
export interface DeviceResponse {
  success: boolean;
  device?: Device;
  message?: string;
  error?: string;
}

/**
 * Device list response
 */
export interface DevicesListResponse {
  success: boolean;
  devices: Device[];
  count: number;
}

/**
 * Available devices response
 */
export interface AvailableDevicesResponse {
  success: boolean;
  devices: Device[];
  count: number;
}

/**
 * Device count response
 */
export interface DeviceCountResponse {
  success: boolean;
  total: number;
  byCategory: Record<string, number>;
}

/**
 * Command response
 */
export interface CommandResponse {
  success: boolean;
  message: string;
}

// ============================================
// REGISTRATION INTERFACES
// ============================================

/**
 * Device registration data
 */
export interface RegisterDeviceData {
  mac: string;
  nome: string;
  stanza_id?: number | null;
  device_type?: string;
}

/**
 * Device update data
 */
export interface UpdateDeviceData {
  nome?: string;
  stanza_id?: number | null;
  blocked?: boolean;
}

// ============================================
// WEBSOCKET PAYLOAD
// ============================================

/**
 * Device update payload from WebSocket
 */
export interface DeviceUpdatePayload {
  id?: number;
  mac: string;
  deviceType: string;
  category: 'relay' | 'led' | 'sensor' | 'dimmer' | 'tasmota' | 'unknown';
  name?: string;
  stato: 'online' | 'offline' | 'unknown';
  state: DeviceState;
  timestamp: number;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard for RelayState
 */
export function isRelayState(state: DeviceState): state is RelayState {
  return 'channels' in state && Array.isArray((state as RelayState).channels);
}

/**
 * Type guard for LedState
 */
export function isLedState(state: DeviceState): state is LedState {
  return 'r' in state && 'g' in state && 'b' in state && 'brightness' in state;
}

/**
 * Type guard for SensorState
 */
export function isSensorState(state: DeviceState): state is SensorState {
  return 'temperature' in state || 'humidity' in state || 'motion' in state;
}

/**
 * Type guard for DimmerState
 */
export function isDimmerState(state: DeviceState): state is DimmerState {
  return 'power' in state && 'brightness' in state && !('r' in state);
}

/**
 * Type guard for TasmotaState
 */
export function isTasmotaState(state: DeviceState): state is TasmotaState {
  return 'power' in state && !('channels' in state) && !('r' in state) && !('brightness' in state);
}
