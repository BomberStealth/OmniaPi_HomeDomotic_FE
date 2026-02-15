/**
 * OmniaPi BLE WiFi Provisioning
 *
 * Implements ESP-IDF wifi_provisioning protocol over Web Bluetooth.
 * Security 0 (no encryption) — protobuf encoded messages.
 *
 * Protocol flow:
 *   1. Connect to BLE device "OmniaPi-XXXX"
 *   2. Establish sec0 session on prov-session characteristic
 *   3. Send WiFi credentials on prov-config characteristic
 *   4. Apply config → device reboots and connects to WiFi
 */

// ============================================================================
// BLE GATT UUIDs (from firmware ble_prov.c + ESP-IDF manager.c)
// ============================================================================

const SERVICE_UUID = '021a9004-0382-4aea-bff4-6b3f1c5adfb4';
const CHAR_SCAN_UUID = '021aff50-0382-4aea-bff4-6b3f1c5adfb4';
const CHAR_SESSION_UUID = '021aff51-0382-4aea-bff4-6b3f1c5adfb4';
const CHAR_CONFIG_UUID = '021aff52-0382-4aea-bff4-6b3f1c5adfb4';
const CHAR_MQTT_UUID = '021aff54-0382-4aea-bff4-6b3f1c5adfb4';

// ============================================================================
// Minimal Protobuf Encoder (proto3 wire format)
// ============================================================================

function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  let v = value >>> 0; // unsigned
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v & 0x7f);
  return bytes;
}

function encodeTag(fieldNum: number, wireType: number): number[] {
  return encodeVarint((fieldNum << 3) | wireType);
}

/** Field with varint value (wire type 0) */
function encodeVarintField(fieldNum: number, value: number): number[] {
  return [...encodeTag(fieldNum, 0), ...encodeVarint(value)];
}

/** Field with length-delimited value (wire type 2) */
function encodeBytesField(fieldNum: number, data: number[] | Uint8Array): number[] {
  const bytes = data instanceof Uint8Array ? Array.from(data) : data;
  return [...encodeTag(fieldNum, 2), ...encodeVarint(bytes.length), ...bytes];
}

// ============================================================================
// Protobuf Message Builders
// ============================================================================

/**
 * SessionData { sec_ver=0, sec0=Sec0Payload { msg=0, sc=S0SessionCmd{} } }
 *
 * Proto fields:
 *   SessionData.sec_ver  = field 2 (varint)
 *   SessionData.sec0     = field 10 (LEN, Sec0Payload)
 *   Sec0Payload.msg      = field 1 (varint, S0_Session_Command=0)
 *   Sec0Payload.sc       = field 20 (LEN, S0SessionCmd empty)
 */
function buildSec0SessionCmd(): Uint8Array {
  // Sec0Payload: msg=0 (field 1), sc=empty (field 20)
  const sec0Payload = [
    ...encodeVarintField(1, 0),    // msg = S0_Session_Command
    ...encodeBytesField(20, []),   // sc = S0SessionCmd{}
  ];

  // SessionData: sec_ver=0 (field 2), sec0=payload (field 10)
  const sessionData = [
    ...encodeVarintField(2, 0),            // sec_ver = SecScheme0
    ...encodeBytesField(10, sec0Payload),  // sec0 = Sec0Payload
  ];

  return new Uint8Array(sessionData);
}

/**
 * WiFiConfigPayload { msg=TypeCmdSetConfig(2), cmd_set_config=CmdSetConfig{ssid, passphrase} }
 *
 * Proto fields:
 *   WiFiConfigPayload.msg            = field 1 (varint)
 *   WiFiConfigPayload.cmd_set_config = field 12 (LEN, CmdSetConfig)
 *   CmdSetConfig.ssid                = field 1 (bytes)
 *   CmdSetConfig.passphrase          = field 2 (bytes)
 */
function buildSetConfigCmd(ssid: string, password: string): Uint8Array {
  const encoder = new TextEncoder();
  const ssidBytes = encoder.encode(ssid);
  const passBytes = encoder.encode(password);

  const cmdSetConfig = [
    ...encodeBytesField(1, ssidBytes),  // ssid
    ...encodeBytesField(2, passBytes),  // passphrase
  ];

  const payload = [
    ...encodeVarintField(1, 2),                // msg = TypeCmdSetConfig
    ...encodeBytesField(12, cmdSetConfig),      // cmd_set_config
  ];

  return new Uint8Array(payload);
}

/**
 * WiFiConfigPayload { msg=TypeCmdApplyConfig(4), cmd_apply_config=CmdApplyConfig{} }
 */
function buildApplyConfigCmd(): Uint8Array {
  const payload = [
    ...encodeVarintField(1, 4),          // msg = TypeCmdApplyConfig
    ...encodeBytesField(14, []),          // cmd_apply_config = empty
  ];
  return new Uint8Array(payload);
}

// ============================================================================
// WiFi Scan Message Builders (prov-scan endpoint)
// ============================================================================

/** WiFiScanPayload { msg=TypeCmdScanStart(0), cmd_scan_start=CmdScanStart{} } */
function buildScanStartCmd(): Uint8Array {
  // Non-blocking scan with defaults (passive=false, group_channels=0, period_ms=0)
  const payload = [
    ...encodeVarintField(1, 0),    // msg = TypeCmdScanStart
    ...encodeBytesField(10, []),   // cmd_scan_start = empty (all defaults)
  ];
  return new Uint8Array(payload);
}

/** WiFiScanPayload { msg=TypeCmdScanStatus(2), cmd_scan_status=CmdScanStatus{} } */
function buildScanStatusCmd(): Uint8Array {
  const payload = [
    ...encodeVarintField(1, 2),    // msg = TypeCmdScanStatus
    ...encodeBytesField(12, []),   // cmd_scan_status = empty
  ];
  return new Uint8Array(payload);
}

/** WiFiScanPayload { msg=TypeCmdScanResult(4), cmd_scan_result=CmdScanResult{start_index, count} } */
function buildScanResultCmd(startIndex: number, count: number): Uint8Array {
  const cmdScanResult = [
    ...(startIndex > 0 ? encodeVarintField(1, startIndex) : []),
    ...encodeVarintField(2, count),
  ];
  const payload = [
    ...encodeVarintField(1, 4),              // msg = TypeCmdScanResult
    ...encodeBytesField(14, cmdScanResult),  // cmd_scan_result
  ];
  return new Uint8Array(payload);
}

// ============================================================================
// Minimal Protobuf Decoder
// ============================================================================

interface ProtoField {
  fieldNum: number;
  wireType: number;
  value: number | Uint8Array;
}

function decodeProtoFields(data: Uint8Array): ProtoField[] {
  const fields: ProtoField[] = [];
  let offset = 0;

  while (offset < data.length) {
    // Decode tag
    let tag = 0;
    let shift = 0;
    while (offset < data.length) {
      const b = data[offset++];
      tag |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }

    const fieldNum = tag >>> 3;
    const wireType = tag & 0x07;

    if (wireType === 0) {
      // Varint (limit accumulation to 32 bits for int32/negative values)
      let value = 0;
      let s = 0;
      while (offset < data.length) {
        const b = data[offset++];
        if (s < 32) value |= (b & 0x7f) << s;
        if ((b & 0x80) === 0) break;
        s += 7;
      }
      fields.push({ fieldNum, wireType, value });
    } else if (wireType === 2) {
      // Length-delimited
      let length = 0;
      let s = 0;
      while (offset < data.length) {
        const b = data[offset++];
        length |= (b & 0x7f) << s;
        if ((b & 0x80) === 0) break;
        s += 7;
      }
      const value = data.slice(offset, offset + length);
      offset += length;
      fields.push({ fieldNum, wireType, value });
    } else {
      // Unknown wire type — skip
      break;
    }
  }

  return fields;
}

/** Get varint field value, returns -1 if not found */
function getVarintField(fields: ProtoField[], fieldNum: number): number {
  const f = fields.find(f => f.fieldNum === fieldNum && f.wireType === 0);
  return f ? (f.value as number) : -1;
}

/** Get nested message field */
function getMessageField(fields: ProtoField[], fieldNum: number): ProtoField[] | null {
  const f = fields.find(f => f.fieldNum === fieldNum && f.wireType === 2);
  return f ? decodeProtoFields(f.value as Uint8Array) : null;
}

/** Get raw bytes field */
function getBytesField(fields: ProtoField[], fieldNum: number): Uint8Array | null {
  const f = fields.find(f => f.fieldNum === fieldNum && f.wireType === 2);
  return f ? (f.value as Uint8Array) : null;
}

/** Get all occurrences of a repeated message field */
function getAllMessageFields(fields: ProtoField[], fieldNum: number): ProtoField[][] {
  return fields
    .filter(f => f.fieldNum === fieldNum && f.wireType === 2)
    .map(f => decodeProtoFields(f.value as Uint8Array));
}

// ============================================================================
// Response Parsers
// ============================================================================

/** Parse RespSetConfig or RespApplyConfig: { status: number } */
function parseConfigResponse(data: DataView): { status: number } {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const outer = decodeProtoFields(bytes);

  // WiFiConfigPayload.msg = field 1
  const msg = getVarintField(outer, 1);

  // Response is in field 13 (RespSetConfig) or field 15 (RespApplyConfig)
  const respField = msg === 3 ? 13 : msg === 5 ? 15 : 13;
  const inner = getMessageField(outer, respField);
  // proto3: Status 0 (Success) is default, not encoded on wire → getVarintField returns -1
  const status = inner ? getVarintField(inner, 1) : -1;

  return { status: status === -1 ? 0 : status };
}

/** Parse session response */
function parseSessionResponse(data: DataView): { status: number } {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const outer = decodeProtoFields(bytes);

  // SessionData.sec0 = field 10
  const sec0 = getMessageField(outer, 10);
  if (!sec0) return { status: -1 };

  // Sec0Payload.sr = field 21 (S0SessionResp)
  const sr = getMessageField(sec0, 21);
  if (!sr) return { status: -1 };

  // S0SessionResp.status = field 1 (proto3: 0=Success is default, not encoded)
  const status = getVarintField(sr, 1);
  return { status: status === -1 ? 0 : status };
}

/** Parse RespScanStart or generic scan response: check status */
function parseScanResponse(data: DataView): { status: number } {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const outer = decodeProtoFields(bytes);
  const status = getVarintField(outer, 2); // WiFiScanPayload.status
  return { status: status === -1 ? 0 : status };
}

/** Parse RespScanStatus: { scanFinished, resultCount } */
function parseScanStatusResponse(data: DataView): { scanFinished: boolean; resultCount: number } {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const outer = decodeProtoFields(bytes);

  const status = getVarintField(outer, 2);
  if (status > 0) return { scanFinished: false, resultCount: 0 };

  // resp_scan_status = field 13
  const inner = getMessageField(outer, 13);
  if (!inner) return { scanFinished: false, resultCount: 0 };

  return {
    scanFinished: getVarintField(inner, 1) === 1,
    resultCount: Math.max(0, getVarintField(inner, 2)),
  };
}

/** Parse RespScanResult: WiFiNetwork[] */
function parseScanResultResponse(data: DataView): WiFiNetwork[] {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const outer = decodeProtoFields(bytes);

  // resp_scan_result = field 15
  const inner = getMessageField(outer, 15);
  if (!inner) return [];

  // entries = field 1 (repeated WiFiScanResult)
  const networks: WiFiNetwork[] = [];
  const entries = getAllMessageFields(inner, 1);

  for (const entry of entries) {
    const ssidBytes = getBytesField(entry, 1);
    const ssid = ssidBytes ? new TextDecoder().decode(ssidBytes) : '';
    const channel = getVarintField(entry, 2);
    const rssi = getVarintField(entry, 3);
    const auth = getVarintField(entry, 5);

    if (ssid) {
      networks.push({
        ssid,
        rssi,
        auth: auth === -1 ? 0 : auth,
        channel: channel === -1 ? 0 : channel,
      });
    }
  }

  return networks;
}

// ============================================================================
// BLE Communication
// ============================================================================

/** Hex dump helper for debug logging */
function toHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

/** Write data to characteristic, then read response */
async function bleWriteRead(
  char: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array
): Promise<DataView> {
  const ep = char.uuid.substring(4, 8);
  console.log(`[BLE] Write ${ep}: ${toHex(data)}`);
  await char.writeValueWithResponse(data as unknown as BufferSource);
  // Small delay for device to process
  await new Promise(r => setTimeout(r, 200));
  const resp = await char.readValue();
  const respBytes = new Uint8Array(resp.buffer, resp.byteOffset, resp.byteLength);
  console.log(`[BLE] Read  ${ep}: ${toHex(respBytes)}`);
  return resp;
}

// ============================================================================
// MQTT Configuration via Custom BLE Endpoint
// ============================================================================

/**
 * Send MQTT broker config to gateway via custom-mqtt BLE endpoint.
 * Silently skips if the endpoint doesn't exist (older firmware).
 */
async function sendMqttConfig(
  service: BluetoothRemoteGATTService,
  brokerUri: string
): Promise<boolean> {
  let mqttChar: BluetoothRemoteGATTCharacteristic;
  try {
    mqttChar = await service.getCharacteristic(CHAR_MQTT_UUID);
  } catch {
    console.log('[BLE] custom-mqtt endpoint not available (older firmware)');
    return false;
  }

  const json = JSON.stringify({ broker: brokerUri });
  const data = new TextEncoder().encode(json);
  console.log(`[BLE] Sending MQTT config: ${json}`);
  const resp = await bleWriteRead(mqttChar, data);
  const respBytes = new Uint8Array(resp.buffer, resp.byteOffset, resp.byteLength);
  const respText = new TextDecoder().decode(respBytes);
  console.log(`[BLE] MQTT config response: ${respText}`);

  try {
    const result = JSON.parse(respText);
    return result.status === 'ok';
  } catch {
    return false;
  }
}

// ============================================================================
// Public API
// ============================================================================

/** Check if Web Bluetooth is available */
export function isBleSupported(): boolean {
  return !!(navigator.bluetooth);
}

/** Scan for OmniaPi gateway BLE devices */
export async function scanForGateway(): Promise<BluetoothDevice> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'OmniaPi-' }],
    optionalServices: [SERVICE_UUID],
  });
  return device;
}

export interface WiFiNetwork {
  ssid: string;
  rssi: number;
  auth: number;
  channel: number;
}

export interface BleConnection {
  gattServer: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  sessionChar: BluetoothRemoteGATTCharacteristic;
  configChar: BluetoothRemoteGATTCharacteristic;
}

export type ProvProgress =
  | 'connecting'
  | 'session'
  | 'sending'
  | 'applying'
  | 'success'
  | 'error';

/**
 * Connect to a gateway BLE device and provision WiFi credentials.
 *
 * @param device - BluetoothDevice from scanForGateway()
 * @param ssid - WiFi SSID
 * @param password - WiFi password
 * @param onProgress - Progress callback
 * @returns true on success
 */
export async function provisionWiFi(
  device: BluetoothDevice,
  ssid: string,
  password: string,
  onProgress?: (step: ProvProgress, message: string) => void,
  mqttBrokerUri?: string
): Promise<boolean> {
  const progress = (step: ProvProgress, msg: string) => {
    onProgress?.(step, msg);
  };

  try {
    // 1. Connect to GATT server
    progress('connecting', 'Connessione al gateway...');
    const server = device.gatt;
    if (!server) throw new Error('GATT non disponibile');

    const gattServer = await server.connect();
    const service = await gattServer.getPrimaryService(SERVICE_UUID);

    // 2. Get characteristics
    const sessionChar = await service.getCharacteristic(CHAR_SESSION_UUID);
    const configChar = await service.getCharacteristic(CHAR_CONFIG_UUID);

    // 3. Establish sec0 session
    progress('session', 'Creazione sessione...');
    const sessionCmd = buildSec0SessionCmd();
    const sessionResp = await bleWriteRead(sessionChar, sessionCmd);
    const sessionResult = parseSessionResponse(sessionResp);

    if (sessionResult.status !== 0) {
      throw new Error(`Errore sessione: status=${sessionResult.status}`);
    }

    // 4. Send MQTT config (if provided)
    if (mqttBrokerUri) {
      progress('sending', 'Configurazione MQTT...');
      await sendMqttConfig(service, mqttBrokerUri);
    }

    // 5. Send WiFi credentials
    progress('sending', 'Invio credenziali WiFi...');
    const setConfigCmd = buildSetConfigCmd(ssid, password);
    const setConfigResp = await bleWriteRead(configChar, setConfigCmd);
    const setConfigResult = parseConfigResponse(setConfigResp);

    if (setConfigResult.status !== 0) {
      throw new Error(`Errore configurazione: status=${setConfigResult.status}`);
    }

    // 6. Apply config (gateway will reboot)
    progress('applying', 'Applicazione configurazione...');
    const applyCmd = buildApplyConfigCmd();
    try {
      const applyResp = await bleWriteRead(configChar, applyCmd);
      const applyResult = parseConfigResponse(applyResp);
      if (applyResult.status !== 0) {
        throw new Error(`Errore applicazione: status=${applyResult.status}`);
      }
    } catch (e) {
      // The device may reboot before we can read the response — that's OK
      const err = e as Error;
      if (err.message?.includes('GATT') || err.message?.includes('disconnect')) {
        // Expected — device rebooted
      } else {
        throw e;
      }
    }

    // 6. Disconnect (device is rebooting)
    try {
      gattServer.disconnect();
    } catch {
      // Already disconnected
    }

    progress('success', 'Gateway configurato! Si sta riavviando...');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Errore sconosciuto';
    progress('error', msg);
    return false;
  }
}

/**
 * Connect to gateway, establish session, and scan WiFi networks.
 * Returns the scanned networks and the open BLE connection for provisioning.
 */
export async function connectAndScan(
  device: BluetoothDevice,
  onProgress?: (msg: string) => void
): Promise<{ networks: WiFiNetwork[]; connection: BleConnection }> {
  const progress = (msg: string) => onProgress?.(msg);

  // 1. Connect GATT
  progress('Connessione al gateway...');
  const server = device.gatt;
  if (!server) throw new Error('GATT non disponibile');

  const gattServer = await server.connect();
  const service = await gattServer.getPrimaryService(SERVICE_UUID);

  // 2. Get characteristics
  const sessionChar = await service.getCharacteristic(CHAR_SESSION_UUID);
  const configChar = await service.getCharacteristic(CHAR_CONFIG_UUID);
  const connection: BleConnection = { gattServer, service, sessionChar, configChar };

  // 3. Establish sec0 session
  progress('Creazione sessione...');
  const sessionCmd = buildSec0SessionCmd();
  const sessionResp = await bleWriteRead(sessionChar, sessionCmd);
  const sessionResult = parseSessionResponse(sessionResp);
  if (sessionResult.status !== 0) {
    throw new Error(`Errore sessione: status=${sessionResult.status}`);
  }

  // 4. Try to get scan characteristic (may not exist on older firmware)
  let scanChar: BluetoothRemoteGATTCharacteristic;
  try {
    scanChar = await service.getCharacteristic(CHAR_SCAN_UUID);
  } catch {
    // prov-scan not available — return empty list, connection stays open
    return { networks: [], connection };
  }

  // 5. Start WiFi scan (non-blocking)
  progress('Scansione reti WiFi...');
  const scanStartResp = await bleWriteRead(scanChar, buildScanStartCmd());
  const scanStartResult = parseScanResponse(scanStartResp);
  if (scanStartResult.status !== 0) {
    return { networks: [], connection };
  }

  // 6. Poll scan status
  let resultCount = 0;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const statusResp = await bleWriteRead(scanChar, buildScanStatusCmd());
    const statusResult = parseScanStatusResponse(statusResp);
    if (statusResult.scanFinished) {
      resultCount = statusResult.resultCount;
      break;
    }
  }

  if (resultCount === 0) {
    return { networks: [], connection };
  }

  // 7. Fetch results in batches of 4
  const allNetworks: WiFiNetwork[] = [];
  const batchSize = 4;
  for (let i = 0; i < resultCount; i += batchSize) {
    const count = Math.min(batchSize, resultCount - i);
    const resultResp = await bleWriteRead(scanChar, buildScanResultCmd(i, count));
    allNetworks.push(...parseScanResultResponse(resultResp));
  }

  // 8. Sort by RSSI (strongest first), deduplicate by SSID
  const seen = new Set<string>();
  const unique = allNetworks
    .filter(n => n.ssid.length > 0)
    .sort((a, b) => b.rssi - a.rssi)
    .filter(n => {
      if (seen.has(n.ssid)) return false;
      seen.add(n.ssid);
      return true;
    });

  return { networks: unique, connection };
}

/**
 * Provision WiFi using an already-open BLE connection (from connectAndScan).
 */
export async function provisionWithConnection(
  connection: BleConnection,
  ssid: string,
  password: string,
  onProgress?: (step: ProvProgress, message: string) => void,
  mqttBrokerUri?: string
): Promise<boolean> {
  const progress = (step: ProvProgress, msg: string) => onProgress?.(step, msg);

  try {
    // Send MQTT config first (if provided)
    if (mqttBrokerUri) {
      progress('sending', 'Configurazione MQTT...');
      await sendMqttConfig(connection.service, mqttBrokerUri);
    }

    // Send WiFi credentials
    progress('sending', 'Invio credenziali WiFi...');
    const setConfigCmd = buildSetConfigCmd(ssid, password);
    const setConfigResp = await bleWriteRead(connection.configChar, setConfigCmd);
    const setConfigResult = parseConfigResponse(setConfigResp);
    if (setConfigResult.status !== 0) {
      throw new Error(`Errore configurazione: status=${setConfigResult.status}`);
    }

    // Apply config (gateway will reboot)
    progress('applying', 'Applicazione configurazione...');
    const applyCmd = buildApplyConfigCmd();
    try {
      const applyResp = await bleWriteRead(connection.configChar, applyCmd);
      const applyResult = parseConfigResponse(applyResp);
      if (applyResult.status !== 0) {
        throw new Error(`Errore applicazione: status=${applyResult.status}`);
      }
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes('GATT') || err.message?.includes('disconnect')) {
        // Expected — device rebooted
      } else {
        throw e;
      }
    }

    // Disconnect
    try {
      connection.gattServer.disconnect();
    } catch {
      // Already disconnected
    }

    progress('success', 'Gateway configurato! Si sta riavviando...');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Errore sconosciuto';
    progress('error', msg);
    return false;
  }
}
