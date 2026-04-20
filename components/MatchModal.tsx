import { Image, Modal, Pressable, Text, View } from 'react-native';
import type { Candidate } from '../lib/discover/queries';

type MatchModalProps = {
  match: Candidate | null;
  myPhotoUrl: string | null;
  onKeepSwiping: () => void;
};

export function MatchModal({ match, myPhotoUrl, onKeepSwiping }: MatchModalProps) {
  const theirPhoto = match?.photo_urls[0];

  return (
    <Modal
      visible={match !== null}
      transparent
      animationType="fade"
      onRequestClose={onKeepSwiping}
    >
      <View className="flex-1 items-center justify-center bg-black/75 px-8">
        <Text className="mb-2 text-center text-5xl font-bold text-emerald-400">
          It's a match!
        </Text>
        <Text className="mb-10 text-center text-base text-white/80">
          You and {match?.display_name ?? 'they'} liked each other.
        </Text>

        <View className="mb-12 flex-row items-center justify-center">
          <Avatar uri={myPhotoUrl} />
          <Text className="mx-2 text-3xl">⛳</Text>
          <Avatar uri={theirPhoto ?? null} />
        </View>

        <Pressable
          onPress={onKeepSwiping}
          className="w-full items-center rounded-lg bg-emerald-600 py-3 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">
            Keep swiping
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Avatar({ uri }: { uri: string | null }) {
  return (
    <View className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-300">
      {uri ? (
        <Image source={{ uri }} style={{ flex: 1 }} resizeMode="cover" />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl">⛳</Text>
        </View>
      )}
    </View>
  );
}
