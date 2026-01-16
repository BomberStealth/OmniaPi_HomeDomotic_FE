import { memo } from 'react';
import {
  RiLightbulbLine,
  RiPlugLine,
  RiTempHotLine,
  RiSunLine,
  RiCpuLine,
  RiFlashlightLine,
} from 'react-icons/ri';

// ============================================
// DEVICE ICON - Simple icon component
// ============================================

interface DeviceIconProps {
  deviceType: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const iconMap: Record<string, React.ElementType> = {
  // LED types
  omniapi_led: RiLightbulbLine,
  omniapi_led_rgb: RiLightbulbLine,
  omniapi_led_rgbw: RiLightbulbLine,
  led: RiLightbulbLine,
  // Relay types
  omniapi_node: RiFlashlightLine,
  omniapi_relay_2ch: RiFlashlightLine,
  omniapi_relay_4ch: RiFlashlightLine,
  relay: RiFlashlightLine,
  // Sensor types
  sensor: RiTempHotLine,
  omniapi_sensor_th: RiTempHotLine,
  omniapi_sensor_motion: RiTempHotLine,
  // Dimmer
  dimmer: RiSunLine,
  omniapi_dimmer: RiSunLine,
  // Tasmota
  tasmota: RiPlugLine,
};

const DeviceIconComponent = ({ deviceType, size = 20, className = '', style }: DeviceIconProps) => {
  const normalizedType = deviceType?.toLowerCase() || '';
  const Icon = iconMap[normalizedType] || RiCpuLine;

  return <Icon size={size} className={className} style={style} />;
};

export const DeviceIcon = memo(DeviceIconComponent);
