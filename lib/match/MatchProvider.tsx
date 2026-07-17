// Lifts the match-moment overlay out of the discover screen so any
// screen that records a mutual swipe (originally just the deck; now
// also the full-profile screen at /profile/[userId]) can fire the
// MatchModal through a single shared piece of state.
//
// The modal renders from this provider, mounted at the root, so it
// sits above whatever screen the user is on when the match fires.
//
// Usage:
//   const { showMatch } = useMatch();
//   if (result.matched) showMatch(candidate, result.matchId);

import { router } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { MatchModal } from '../../components/MatchModal';
import { useAuth } from '../auth/AuthProvider';
import type { Candidate } from '../discover/queries';

type MatchState = { candidate: Candidate; matchId: string };

type MatchContextValue = {
  showMatch: (candidate: Candidate, matchId: string) => void;
};

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [match, setMatch] = useState<MatchState | null>(null);

  const showMatch = useCallback(
    (candidate: Candidate, matchId: string) => {
      setMatch({ candidate, matchId });
    },
    [],
  );

  const handleKeepSwiping = useCallback(() => setMatch(null), []);

  const handleSayHi = useCallback(() => {
    if (!match) return;
    const { matchId } = match;
    setMatch(null);
    router.push(`/chat/${matchId}` as never);
  }, [match]);

  const value = useMemo<MatchContextValue>(() => ({ showMatch }), [showMatch]);

  return (
    <MatchContext.Provider value={value}>
      {children}
      <MatchModal
        match={match?.candidate ?? null}
        myPhotoUrl={profile?.photo_urls?.[0] ?? null}
        onKeepSwiping={handleKeepSwiping}
        onSayHi={handleSayHi}
      />
    </MatchContext.Provider>
  );
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside <MatchProvider>');
  return ctx;
}
