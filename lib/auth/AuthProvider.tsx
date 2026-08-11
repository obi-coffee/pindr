import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Profile } from '../profile/types';
import { supabase } from '../supabase';
import { useAuthDeepLinks } from './linking';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Explicit column list instead of '*': home_location is excluded so the
// column-privilege hardening (supabase/pending/APPLY-AFTER-1.0.1_...) can
// revoke client read access to raw coordinates without breaking this
// query. Nothing in the app reads home_location back — screens only ever
// write it (edit/location, onboarding/location) and display home_city.
const PROFILE_COLUMNS = [
  'user_id',
  'display_name',
  'age',
  'gender',
  'pronouns',
  'bio',
  'home_city',
  'home_course_name',
  'home_course_id',
  'can_host_guests',
  'handicap',
  'has_handicap',
  'years_playing',
  'walking_preference',
  'holes_preference',
  'pace',
  'betting',
  'drinks',
  'post_round',
  'teaching_mindset',
  'style_default',
  'photo_urls',
  'profile_answers',
  'availability',
  'onboarded_at',
  'created_at',
  'updated_at',
].join(', ');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useAuthDeepLinks();

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) console.warn('[auth] fetchProfile failed:', error.message);
    setProfile((data as Profile | null) ?? null);
    setProfileLoading(false);
  }, []);

  const refetchProfile = useCallback(async () => {
    if (!session?.user.id) return;
    await fetchProfile(session.user.id);
  }, [fetchProfile, session?.user.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile(session.user.id);
    } else {
      setProfile(null);
    }
  }, [session?.user.id, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        profileLoading,
        signOut,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
