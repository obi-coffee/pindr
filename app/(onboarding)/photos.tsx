import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, PlusIcon, Typography, radii, useTheme } from '../../components/ui';
import { useAuth } from '../../lib/auth/AuthProvider';
import { deletePhoto, pickAndUploadPhoto } from '../../lib/profile/photos';
import { supabase } from '../../lib/supabase';

const MAX_PHOTOS = 6;

export default function Photos() {
  const { user, profile, refetchProfile } = useAuth();
  const { colors } = useTheme();
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
          'photo access needed',
          'enable photos for pindr in settings to add them here.',
        );
      } else if (result.status === 'error') {
        Alert.alert('upload failed', result.message);
      }
    } catch (err) {
      Alert.alert('upload failed', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    Alert.alert('remove photo?', undefined, [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const next = urls.filter((u) => u !== url);
            await savePhotoUrls(next);
            await deletePhoto(url);
          } catch (err) {
            Alert.alert('could not remove', (err as Error).message);
          }
        },
      },
    ]);
  };

  const onContinue = () => {
    if (urls.length < 1) {
      Alert.alert(
        'add at least one photo',
        'profiles need a photo to match.',
      );
      return;
    }
    router.push('/interests');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.paper }}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Typography
          variant="caption"
          color="ink-soft"
          style={{ marginBottom: 8 }}
        >
          step 4 of 6
        </Typography>
        <Typography variant="h1" style={{ marginBottom: 6 }}>
          your photos.
        </Typography>
        <Typography variant="body" color="ink-soft" style={{ marginBottom: 24 }}>
          add 1–6 photos. the first is your main profile picture.
        </Typography>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 18,
              gap: 8,
            }}
          >
            <ActivityIndicator color={colors.ink} />
            <Typography variant="body-sm" color="ink-soft">
              uploading…
            </Typography>
          </View>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={onContinue}
          disabled={uploading}
          style={{ marginTop: 28 }}
        >
          Continue
        </Button>

        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ alignSelf: 'center', marginTop: 20, paddingVertical: 8 }}
        >
          <Typography variant="caption" color="ink-subtle">
            back
          </Typography>
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
  const { colors } = useTheme();
  if (url) {
    return (
      <Pressable
        onPress={onRemove}
        disabled={disabled}
        style={{
          width: '31%',
          aspectRatio: 4 / 5,
          borderRadius: radii.md,
          overflow: 'hidden',
          backgroundColor: colors['paper-raised'],
          position: 'relative',
        }}
      >
        <Image source={{ uri: url }} style={{ flex: 1 }} resizeMode="cover" />
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" color="paper-high">
            ×
          </Typography>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onAdd}
      disabled={disabled}
      style={{
        width: '31%',
        aspectRatio: 4 / 5,
        borderRadius: radii.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors['stroke-strong'],
        backgroundColor: colors['paper-raised'],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PlusIcon size={28} />
    </Pressable>
  );
}
