import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The app-wide keyboard-avoidance wrapper for full-screen screens.
// RN's KeyboardAvoidingView measures its frame relative to its parent
// but compares against the keyboard's window coordinates, so inside a
// SafeAreaView it under-pads by the safe-area insets — the composer
// ends up behind the keyboard. This pads by the keyboard's actual
// window overlap instead, driven on the UI thread.
//
// Form-sheet screens (presentation: 'formSheet') don't use this — iOS
// lifts the whole sheet above the keyboard natively.
//
// `safeBottom`: pass true when the surrounding SafeAreaView already
// pads the bottom edge (its content stops above the home indicator),
// so that inset isn't double-counted.
type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  safeBottom?: boolean;
};

export function KeyboardAvoider({ children, style, safeBottom }: Props) {
  if (Platform.OS !== 'ios') {
    // Android resizes the window itself (adjustResize); padding on top
    // of that would double-avoid.
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }
  return (
    <IOSKeyboardAvoider style={style} safeBottom={safeBottom}>
      {children}
    </IOSKeyboardAvoider>
  );
}

function IOSKeyboardAvoider({ children, style, safeBottom }: Props) {
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const bottomGap = safeBottom ? insets.bottom : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboard.height.value - bottomGap),
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
