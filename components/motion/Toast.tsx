// Toast — global snackbar mounted via ToastProvider at the root. One
// toast at a time; a new show() replaces whatever's active. Plan §4.3:
// enter translateY: 40→0, opacity 0→1 with spring.settle. Exit reverses.
// Auto-dismiss at 3.2s (info) or 5s (error).

import {
  createContext,
  createElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { duration, spring } from '../../lib/motion';
import { Typography, useTheme } from '../ui';

type ToastVariant = 'info' | 'error';

type ActiveToast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ShowOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  show: (message: string, options?: ShowOptions) => void;
};

const DEFAULT_INFO_MS = 3200;
const DEFAULT_ERROR_MS = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveToast | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clear();
    setActive(null);
  }, [clear]);

  const show = useCallback(
    (message: string, options: ShowOptions = {}) => {
      clear();
      idRef.current += 1;
      const variant = options.variant ?? 'info';
      const fallback = variant === 'error' ? DEFAULT_ERROR_MS : DEFAULT_INFO_MS;
      const hold = options.durationMs ?? fallback;
      setActive({ id: idRef.current, message, variant });
      timeoutRef.current = setTimeout(() => {
        setActive((prev) => (prev?.id === idRef.current ? null : prev));
      }, hold);
    },
    [clear],
  );

  useEffect(() => () => clear(), [clear]);

  const value = useMemo(() => ({ show }), [show]);

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    active
      ? createElement(ToastView, {
          key: active.id,
          message: active.message,
          variant: active.variant,
          onDismiss: dismiss,
        })
      : null,
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function ToastView({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      translateY.value = 0;
      opacity.value = withTiming(1, { duration: duration.fast });
    } else {
      translateY.value = withSpring(0, spring.settle);
      opacity.value = withTiming(1, { duration: duration.fast });
    }
  }, [reduced, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const bg =
    variant === 'error' ? colors.burgundy : colors.ink;
  const textColor = colors['paper-high'];

  return (
    <SafeAreaView
      pointerEvents="box-none"
      edges={['bottom']}
      style={StyleSheet.absoluteFillObject}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }} pointerEvents="box-none">
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={onDismiss}
            style={{
              backgroundColor: bg,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: colors.ink,
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Typography variant="body" style={{ color: textColor }}>
              {message}
            </Typography>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
