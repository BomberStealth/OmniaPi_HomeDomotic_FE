import { memo } from 'react';
import { RiWifiLine, RiWifiOffLine } from 'react-icons/ri';

// ============================================
// DEVICE STATUS - Online/offline indicator
// ============================================

interface DeviceStatusProps {
  online?: boolean;
  rssi?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeMap = {
  sm: { icon: 12, font: '10px', gap: '2px' },
  md: { icon: 14, font: '11px', gap: '4px' },
  lg: { icon: 18, font: '13px', gap: '6px' },
};

const DeviceStatusComponent = ({
  online = false,
  rssi,
  size = 'md',
  showLabel = true
}: DeviceStatusProps) => {
  const s = sizeMap[size];
  const color = online ? '#22c55e' : '#ef4444';

  // Signal strength based on RSSI
  const getSignalStrength = () => {
    if (!rssi) return null;
    if (rssi >= -50) return 'Ottimo';
    if (rssi >= -60) return 'Buono';
    if (rssi >= -70) return 'Discreto';
    return 'Debole';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      {online ? (
        <RiWifiLine size={s.icon} style={{ color }} />
      ) : (
        <RiWifiOffLine size={s.icon} style={{ color }} />
      )}
      {showLabel && (
        <span style={{ fontSize: s.font, color, fontWeight: 500 }}>
          {online ? (rssi ? getSignalStrength() : 'Online') : 'Offline'}
        </span>
      )}
    </div>
  );
};

export const DeviceStatus = memo(DeviceStatusComponent);
