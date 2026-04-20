import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  deletePhoto,
  pickAndUploadPhoto,
} from '../../lib/profile/photos';
import { supabase } from '../../lib/supabase';

const MAX_PHOTOS = 6;

export default function Photos() {
  const { user, profile, refetchProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const urls = profile?.photo_urls ?? [];
  const slots: (string | null)[] = [...urls];
  while (slots.length < MAX_PHOTOS) slots.push(null);

  const savePhotoUrls = async (next: string[]) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ photo_urls: next })
      .eq('user_id', user.id);
    if (error) throw error;
    await refetchProfile();
  };

  const addPhoto = async () => {
    if (!user || uploading) return;
    setUploading(true);
    try {
      const result = await pickAndUploadPhoto(user.id);
      if (result.status === 'uploaded') {
        await savePhotoUrls([...urls, result.url]);
      } else if (result.status === 'permission_denied') {
        Alert.alert(
          'Photo access needed',
          'Enable Photos access for Pindr in Settings to add photos.',
        );
      } else if (result.status === 'error') {
        Alert.alert('Upload failed', result.message);
      }
    } catch (err) {
      Alert.alert('Upload failed', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    Alert.alert('Remove photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const next = urls.filter((u) => u !== url);
            await savePhotoUrls(next);
            await deletePhoto(url);
          } catch (err) {
            Alert.alert('Could not remove', (err as Error).message);
          }
        },
      },
    ]);
  };

  const onContinue = () => {
    if (urls.length < 1) {
      Alert.alert('Add at least one photo', 'Profiles need a photo to match.');
      return;
    }
    router.push('/interests');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Step 4 of 6
        </Text>
        <Text className="mb-2 text-3xl font-bold text-slate-900">
          Your photos
        </Text>
        <Text className="mb-6 text-base text-slate-500">
          Add 1–6 photos. The first one is your main profile picture.
        </Text>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {slots.map((url, index) => (
            <PhotoSlot
              key={`${url ?? 'empty'}-${index}`}
              url={url}
              onAdd={addPhoto}
              onRemove={url ? () => removePhoto(url) : undefined}
              disabled={uploading}
            />
          ))}
        </View>

        {uploading ? (
          <View className="mt-6 flex-row items-center justify-center">
            <ActivityIndicator color="#059669" />
            <Text className="ml-2 text-sm text-slate-500">Uploading…</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onContinue}
          disabled={uploading}
          className="mt-8 items-center rounded-lg bg-emerald-600 py-3 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">Continue</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="mt-4 items-center py-2 active:opacity-70"
        >
          <Text className="text-sm font-medium text-slate-500">Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoSlot({
  url,
  onAdd,
  onRemove,
  disabled,
}: {
  url: string | null;
  onAdd: () => void;
  onRemove?: () => void;
  disabled: boolean;
}) {
  if (url) {
    return (
      <Pressable
        onPress={onRemove}
        disabled={disabled}
        className="relative overflow-hidden rounded-lg bg-slate-100"
        style={{ width: '31%', aspectRatio: 4 / 5 }}
      >
        <Image source={{ uri: url }} style={{ flex: 1 }} resizeMode="cover" />
        <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60">
          <Text className="text-white">×</Text>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onAdd}
      disabled={disabled}
      className="items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 active:opacity-70"
      style={{ width: '31%', aspectRatio: 4 / 5 }}
    >
      <Text className="text-3xl text-slate-400">+</Text>
    </Pressable>
  );
}
