import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { radii } from './theme';

export type CardProps = {
  photo?: ImageSourcePropType;
  stateBadge?: ReactNode;
  children: ReactNode;
  /** Photo aspect ratio. Defaults to 4/5 per §6.1. */
  aspectRatio?: number;
  /**
   * Fraction of photo height the card body overlaps. 0.3 is calibrated
   * so the name sits ~75% down the photo on typical phones, matching
   * the HTML reference's fixed 120pt on a ~400pt photo.
   */
  overlapRatio?: number;
  style?: ViewStyle;
};

export function Card({
  photo,
  stateBadge,
  children,
  aspectRatio = 4 / 5,
  overlapRatio = 0.3,
  style,
}: CardProps) {
  const { colors } = useTheme();
  const [photoHeight, setPhotoHeight] = useState(0);
  const overlap = Math.round(photoHeight * overlapRatio);

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderRadius: 24,
          backgroundColor: colors['paper-raised'],
        },
        style,
      ]}
    >
      <View
        style={{ aspectRatio, backgroundColor: colors.stone }}
        onLayout={(e) => setPhotoHeight(e.nativeEvent.layout.height)}
      >
        {photo ? (
          <Image
            source={photo}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : null}
        <LinearGradient
          colors={['rgba(246, 243, 236, 0)', colors['paper-raised']]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {stateBadge ? (
          <View style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
            {stateBadge}
          </View>
        ) : null}
      </View>
      <View
        style={{
          flex: 1,
          marginTop: -overlap,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: 'transparent',
          zIndex: 2,
        }}
      >
        {children}
      </View>
    </View>
  );
}
