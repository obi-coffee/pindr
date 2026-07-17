import { View } from 'react-native';
import { Skeleton } from '../motion/Skeleton';

// Card-shaped placeholder for the discovery deck. Matches the aspect
// ratio the real SwipeCard settles at so the fade-in doesn't jostle
// the layout.
export function SkeletonDeck({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <View style={{ width, height, padding: 16, justifyContent: 'flex-end' }}>
      <Skeleton style={{ width, height, position: 'absolute', top: 0, left: 0 }} borderRadius={20} />
      <Skeleton style={{ height: 20, width: '60%', marginBottom: 10 }} />
      <Skeleton style={{ height: 14, width: '40%', marginBottom: 8 }} />
      <Skeleton style={{ height: 14, width: '80%' }} />
    </View>
  );
}
