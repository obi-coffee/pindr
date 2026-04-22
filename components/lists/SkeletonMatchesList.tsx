import { View } from 'react-native';
import { Skeleton } from '../motion/Skeleton';

// Match list rows: avatar + two text lines.
export function SkeletonMatchesList() {
  return (
    <View style={{ padding: 16, gap: 14 }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Skeleton style={{ width: 48, height: 48 }} borderRadius={999} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 14, width: '50%' }} />
            <Skeleton style={{ height: 12, width: '80%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}
