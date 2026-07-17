// Workaround for a React Native 0.81 Fabric bug: setting tintColor on
// <RefreshControl> at mount time is stored but never applied to the
// native UIRefreshControl, because the iOS Fabric component
// (RCTPullToRefreshViewComponentView) only updates tintColor on a
// genuine prop diff, and pre-layout props are snapshotted as the "old"
// baseline — so a first post-layout render where the color hasn't
// changed is treated as a no-op.
//
// Flickering the tint from a throwaway color to mustard on the next
// tick creates a real diff, which the native component honors. This
// gives us a mustard-tinted pull spinner on iOS + Android without
// rewriting the refresh gesture.
//
// See: node_modules/react-native/React/Fabric/Mounting/ComponentViews/
//      ScrollView/RCTPullToRefreshViewComponentView.mm lines 71-84.

import { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useTheme } from '../ui';

// Throwaway color used for one render to force a diff on the next.
const PLACEHOLDER_TINT = '#00000001';

export function usePullRefresh({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { colors } = useTheme();
  const [tint, setTint] = useState<string>(PLACEHOLDER_TINT);

  useEffect(() => {
    // Fires after initial layout; the setter flips tint to the real
    // color on the next render, triggering Fabric's diff path.
    const id = setTimeout(() => setTint(colors.mustard), 50);
    return () => clearTimeout(id);
  }, [colors.mustard]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tint}
      colors={[tint]}
    />
  );
}
