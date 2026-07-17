import { View } from 'react-native';
import { Skeleton } from '../motion/Skeleton';

// Three row placeholders for the rounds list.
export function SkeletonRoundsList() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            padding: 16,
            borderRadius: 14,
            gap: 10,
          }}
        >
          <Skeleton style={{ height: 18, width: '70%' }} />
          <Skeleton style={{ height: 14, width: '50%' }} />
          <Skeleton style={{ height: 12, width: '90%' }} />
        </View>
      ))}
    </View>
  );
}
