// PullRefresh — thin wrapper that injects a mustard-tinted
// RefreshControl into a scrollable child. Originally tried a custom
// mustard-arc overlay on top of a hidden native spinner, but iOS'
// UIRefreshControl ignores tintColor='transparent' and tint-matching
// tricks, so the native spinner leaked through. Implementing a truly
// custom indicator requires dropping RefreshControl for a
// Gesture.Pan + scroll-composition setup — plenty of platform
// edge cases, deferred.
//
// Net effect: the refresh indicator is mustard-colored on iOS and
// Android (instead of platform gray), which is the "custom" signal
// plan §4.4 calls for without a gesture rewrite.

import { ReactElement, cloneElement } from 'react';
import { RefreshControl } from 'react-native';
import { useTheme } from '../ui';

export type PullRefreshProps = {
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactElement<{ refreshControl?: React.ReactElement }>;
};

export function PullRefresh({ refreshing, onRefresh, children }: PullRefreshProps) {
  const { colors } = useTheme();

  return cloneElement(children, {
    refreshControl: (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.mustard}
        colors={[colors.mustard]}
      />
    ),
  });
}
