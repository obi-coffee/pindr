import { View } from 'react-native';
import { colors, type ColorToken } from './theme';

export type PlusIconProps = {
  size?: number;
  thickness?: number;
  color?: ColorToken;
};

export function PlusIcon({
  size = 28,
  thickness = 2,
  color = 'ink-subtle',
}: PlusIconProps) {
  const c = colors[color];
  const offset = (size - thickness) / 2;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: 0,
          width: size,
          height: thickness,
          backgroundColor: c,
          borderRadius: thickness / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: offset,
          top: 0,
          width: thickness,
          height: size,
          backgroundColor: c,
          borderRadius: thickness / 2,
        }}
      />
    </View>
  );
}
