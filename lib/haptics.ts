import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  createElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useReducedMotion } from 'react-native-reanimated';

// Haptics. One hook, six named callbacks mapped to the events listed in
// Pindr-MicroInteractions-Plan.md §4.2. Every call is gated on:
//   1. The user's haptics_enabled setting (default true), persisted here.
//   2. Reanimated's useReducedMotion() — a user who asked for reduced
//      motion probably doesn't want haptic buzz either.
//
// Callers never touch expo-haptics directly. If a new event needs a
// haptic, add it to the plan's §4.2 table first, then add a named
// callback here.

const STORAGE_KEY = 'pindr.haptics.enabled';

type HapticsContextValue = {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
};

const HapticsContext = createContext<HapticsContextValue | null>(null);

export function HapticsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'false') setEnabledState(false);
    });
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    AsyncStorage.setItem(STORAGE_KEY, next ? 'true' : 'false').catch(() => {});
  }, []);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);

  // createElement (not JSX) keeps this file as .ts so the name matches
  // the CLAUDE.md pointer — the provider is trivial enough that JSX
  // sugar isn't worth a file-name split.
  return createElement(HapticsContext.Provider, { value }, children);
}

function useHapticsSettings(): HapticsContextValue {
  const ctx = useContext(HapticsContext);
  if (!ctx) {
    throw new Error('useHaptics must be used inside <HapticsProvider>');
  }
  return ctx;
}

export type UseHaptics = {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  swipeRelease: () => void;
  match: () => void;
  primaryTap: () => void;
  destructiveConfirm: () => void;
  error: () => void;
  toggle: () => void;
};

export function useHaptics(): UseHaptics {
  const { enabled, setEnabled } = useHapticsSettings();
  const reducedMotion = useReducedMotion();
  const active = enabled && !reducedMotion;

  const swipeRelease = useCallback(() => {
    if (active) void Haptics.selectionAsync();
  }, [active]);

  const match = useCallback(() => {
    if (active) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [active]);

  const primaryTap = useCallback(() => {
    if (active) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [active]);

  const destructiveConfirm = useCallback(() => {
    if (active) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [active]);

  const error = useCallback(() => {
    if (active) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [active]);

  const toggle = useCallback(() => {
    if (active) void Haptics.selectionAsync();
  }, [active]);

  // Memoize the returned shape so consumers who list `haptics` as a
  // useEffect dep don't re-fire on every parent render.
  return useMemo(
    () => ({
      enabled,
      setEnabled,
      swipeRelease,
      match,
      primaryTap,
      destructiveConfirm,
      error,
      toggle,
    }),
    [
      enabled,
      setEnabled,
      swipeRelease,
      match,
      primaryTap,
      destructiveConfirm,
      error,
      toggle,
    ],
  );
}
