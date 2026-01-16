/**
 * Devices API - Unified Device Management
 * API client for the unified /api/devices/* endpoints
 */

import { api } from './api';
import type {
  DeviceCommand,
  DeviceResponse,
  DevicesListResponse,
  AvailableDevicesResponse,
  DeviceCountResponse,
  CommandResponse,
  RegisterDeviceData,
  UpdateDeviceData
} from '@/types/device';

// ============================================
// DEVICES API
// ============================================

export const devicesApi = {
  /**
   * Get all registered devices for an impianto
   */
  getDevices: async (impiantoId: number): Promise<DevicesListResponse> => {
    const { data } = await api.get<DevicesListResponse>(
      `/api/impianti/${impiantoId}/devices`
    );
    return data;
  },

  /**
   * Get available (not registered) devices
   */
  getAvailableDevices: async (impiantoId: number): Promise<AvailableDevicesResponse> => {
    const { data } = await api.get<AvailableDevicesResponse>(
      `/api/impianti/${impiantoId}/devices/available`
    );
    return data;
  },

  /**
   * Get device count statistics
   */
  getDeviceCount: async (impiantoId: number): Promise<DeviceCountResponse> => {
    const { data } = await api.get<DeviceCountResponse>(
      `/api/impianti/${impiantoId}/devices/count`
    );
    return data;
  },

  /**
   * Get single device by ID
   */
  getDevice: async (id: number): Promise<DeviceResponse> => {
    const { data } = await api.get<DeviceResponse>(`/api/devices/${id}`);
    return data;
  },

  /**
   * Get single device by MAC address
   */
  getDeviceByMac: async (mac: string): Promise<DeviceResponse> => {
    const { data } = await api.get<DeviceResponse>(`/api/devices/mac/${mac}`);
    return data;
  },

  /**
   * Get devices by room
   */
  getDevicesByRoom: async (stanzaId: number): Promise<DevicesListResponse> => {
    const { data } = await api.get<DevicesListResponse>(
      `/api/stanze/${stanzaId}/devices`
    );
    return data;
  },

  /**
   * Register a new device
   */
  registerDevice: async (
    impiantoId: number,
    deviceData: RegisterDeviceData
  ): Promise<DeviceResponse> => {
    const { data } = await api.post<DeviceResponse>(
      `/api/impianti/${impiantoId}/devices`,
      deviceData
    );
    return data;
  },

  /**
   * Update a device
   */
  updateDevice: async (id: number, updateData: UpdateDeviceData): Promise<DeviceResponse> => {
    const { data } = await api.put<DeviceResponse>(`/api/devices/${id}`, updateData);
    return data;
  },

  /**
   * Delete (unregister) a device
   */
  deleteDevice: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const { data } = await api.delete<{ success: boolean; message?: string }>(
      `/api/devices/${id}`
    );
    return data;
  },

  /**
   * Send command to device by ID
   */
  sendCommand: async (id: number, command: DeviceCommand): Promise<CommandResponse> => {
    const { data } = await api.post<CommandResponse>(
      `/api/devices/${id}/command`,
      command
    );
    return data;
  },

  /**
   * Send command to device by MAC address
   */
  sendCommandByMac: async (mac: string, command: DeviceCommand): Promise<CommandResponse> => {
    const { data } = await api.post<CommandResponse>(
      `/api/devices/mac/${mac}/command`,
      command
    );
    return data;
  },

  /**
   * Test device (blink/toggle to identify)
   */
  testDevice: async (id: number): Promise<CommandResponse> => {
    const { data } = await api.post<CommandResponse>(`/api/devices/${id}/test`);
    return data;
  },

  /**
   * Test device by MAC
   */
  testDeviceByMac: async (mac: string): Promise<CommandResponse> => {
    const { data } = await api.post<CommandResponse>(`/api/devices/mac/${mac}/test`);
    return data;
  },

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Turn on a relay channel
   */
  relayOn: async (id: number, channel: number = 1): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, {
      action: 'on',
      params: { channel }
    });
  },

  /**
   * Turn off a relay channel
   */
  relayOff: async (id: number, channel: number = 1): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, {
      action: 'off',
      params: { channel }
    });
  },

  /**
   * Toggle a relay channel
   */
  relayToggle: async (id: number, channel: number = 1): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, {
      action: 'toggle',
      params: { channel }
    });
  },

  /**
   * Turn LED on
   */
  ledOn: async (id: number): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, { action: 'on' });
  },

  /**
   * Turn LED off
   */
  ledOff: async (id: number): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, { action: 'off' });
  },

  /**
   * Set LED color
   */
  ledSetColor: async (id: number, r: number, g: number, b: number): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, {
      action: 'set_color',
      params: { r, g, b }
    });
  },

  /**
   * Set LED brightness
   */
  ledSetBrightness: async (id: number, brightness: number): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, {
      action: 'set_brightness',
      params: { brightness }
    });
  },

  /**
   * Set LED effect
   */
  ledSetEffect: async (id: number, effect: number): Promise<CommandResponse> => {
    return devicesApi.sendCommand(id, {
      action: 'set_effect',
      params: { effect }
    });
  }
};

export default devicesApi;
