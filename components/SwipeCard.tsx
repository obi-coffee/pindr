import { Image, Text, View } from 'react-native';
import type { Candidate } from '../lib/discover/queries';

const STYLE_COLORS: Record<string, { bg: string; text: string }> = {
  relaxed: { bg: 'bg-sky-100', text: 'text-sky-700' },
  improvement: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  competitive: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

export function SwipeCard({ candidate }: { candidate: Candidate }) {
  const photo = candidate.photo_urls[0];
  const styleColors = candidate.style_default
    ? STYLE_COLORS[candidate.style_default]
    : undefined;

  const handicapText = candidate.has_handicap
    ? candidate.handicap !== null
      ? `HCP ${candidate.handicap}`
      : null
    : 'No handicap';

  const locationText = [
    candidate.home_city,
    candidate.distance_km !== null
      ? `${candidate.distance_km.toFixed(0)} km`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="overflow-hidden rounded-3xl bg-white shadow-lg" style={{ flex: 1 }}>
      {photo ? (
        <Image source={{ uri: photo }} style={{ flex: 1 }} resizeMode="cover" />
      ) : (
        <View className="flex-1 items-center justify-center bg-slate-200">
          <Text className="text-6xl">⛳</Text>
        </View>
      )}

      <View
        className="absolute bottom-0 left-0 right-0 bg-black/40 p-5"
        style={{ paddingTop: 40 }}
      >
        <Text className="text-2xl font-bold text-white">
          {candidate.display_name ?? 'Unnamed'}
          {candidate.age ? `, ${candidate.age}` : ''}
        </Text>
        {locationText ? (
          <Text className="mt-1 text-sm text-white/90">{locationText}</Text>
        ) : null}

        <View className="mt-3 flex-row flex-wrap gap-2">
          {candidate.style_default && styleColors ? (
            <View className={`rounded-full px-3 py-1 ${styleColors.bg}`}>
              <Text
                className={`text-xs font-semibold uppercase ${styleColors.text}`}
              >
                {candidate.style_default}
              </Text>
            </View>
          ) : null}
          {handicapText ? (
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {handicapText}
              </Text>
            </View>
          ) : null}
          {candidate.pace ? (
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {candidate.pace}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
