import { View, type DimensionValue } from 'react-native';
import { Skeleton } from '../motion/Skeleton';

// Chat history placeholder: alternating-side bubbles.
export function SkeletonChatList() {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      <Bubble side="left" width="60%" />
      <Bubble side="right" width="40%" />
      <Bubble side="left" width="75%" />
      <Bubble side="right" width="55%" />
    </View>
  );
}

function Bubble({
  side,
  width,
}: {
  side: 'left' | 'right';
  width: DimensionValue;
}) {
  return (
    <View style={{ alignItems: side === 'right' ? 'flex-end' : 'flex-start' }}>
      <Skeleton style={{ height: 36, width }} borderRadius={18} />
    </View>
  );
}
