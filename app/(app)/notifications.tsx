import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type Prefs = {
  matches: boolean;
  messages: boolean;
  rounds: boolean;
  quiet_hours_start: string; // 'HH:MM:SS'
  quiet_hours_end: string;
};

type Category = 'matches' | 'messages' | 'rounds';

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = (m || 0).toString().padStart(2, '0');
  return `${hour12}:${mm} ${ampm}`;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [openPicker, setOpenPicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('matches, messages, rounds, quiet_hours_start, quiet_hours_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setPrefs({
          matches: true,
          messages: true,
          rounds: true,
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '08:00:00',
        });
      } else {
        setPrefs(data as Prefs);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const writeThrough = async (patch: Partial<Prefs>) => {
    if (!user || !prefs) return;
    const before = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const { error } = await supabase
      .from('notification_preferences')
      .update(patch)
      .eq('user_id', user.id);
    if (error) setPrefs(before);
  };

  const onToggle = (category: Category) => (value: boolean) => {
    void writeThrough({ [category]: value } as Partial<Prefs>);
  };

  const onTimeChange = (key: 'quiet_hours_start' | 'quiet_hours_end') =>
    (_: unknown, nextDate?: Date) => {
      setOpenPicker(null);
      if (!nextDate) return;
      void writeThrough({ [key]: dateToTimeString(nextDate) } as Partial<Prefs>);
    };

  if (!user) return null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top', 'bottom']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 28,
          paddingBottom: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography variant="caption" color="ink-soft">
            back
          </Typography>
        </Pressable>
        <Typography variant="caption" color="ink">
          notifications
        </Typography>
        <View style={{ minWidth: 48 }} />
      </View>

      {loading || !prefs ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <SectionLabel>categories</SectionLabel>
          <ToggleRow
            label="matches"
            helper="when you and someone lock in"
            value={prefs.matches}
            onChange={onToggle('matches')}
          />
          <ToggleRow
            label="messages"
            helper="new messages in your chats"
            value={prefs.messages}
            onChange={onToggle('messages')}
          />
          <ToggleRow
            label="rounds"
            helper="requests, confirmations, reminders"
            value={prefs.rounds}
            onChange={onToggle('rounds')}
          />

          <SectionLabel>quiet hours</SectionLabel>
          <TimeRow
            label="start"
            value={prefs.quiet_hours_start}
            onPress={() => setOpenPicker('start')}
          />
          <TimeRow
            label="end"
            value={prefs.quiet_hours_end}
            onPress={() => setOpenPicker('end')}
          />

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Typography variant="caption" color="ink-subtle">
              during quiet hours, pushes are held and delivered when the window ends.
            </Typography>
          </View>

          {openPicker && (Platform.OS === 'ios' || Platform.OS === 'android') ? (
            <DateTimePicker
              mode="time"
              display="default"
              value={timeStringToDate(
                openPicker === 'start'
                  ? prefs.quiet_hours_start
                  : prefs.quiet_hours_end,
              )}
              onChange={onTimeChange(
                openPicker === 'start' ? 'quiet_hours_start' : 'quiet_hours_end',
              )}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
      <Typography variant="caption" color="ink-subtle">
        {children}
      </Typography>
    </View>
  );
}

function ToggleRow({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderColor: colors.stroke,
      }}
    >
      <View style={{ flex: 1, paddingRight: 16 }}>
        <Typography variant="body">{label}</Typography>
        <Typography variant="caption" color="ink-subtle">
          {helper}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.stroke, true: colors.moss }}
        thumbColor={colors['paper-high']}
        ios_backgroundColor={colors.stroke}
      />
    </View>
  );
}

function TimeRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderColor: colors.stroke,
        }}
      >
        <Typography variant="body">{label}</Typography>
        <Typography variant="body" color="ink-subtle">
          {formatTimeDisplay(value)} ›
        </Typography>
      </View>
    </Pressable>
  );
}
