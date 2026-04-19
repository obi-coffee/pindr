import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;
const BUCKET = 'photos';

export type PickAndUploadResult =
  | { status: 'cancelled' }
  | { status: 'permission_denied' }
  | { status: 'error'; message: string }
  | { status: 'uploaded'; url: string };

export async function pickAndUploadPhoto(
  userId: string,
): Promise<PickAndUploadResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'permission_denied' };

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: true,
    aspect: [4, 5],
  });
  if (picked.canceled) return { status: 'cancelled' };
  const asset = picked.assets[0];
  if (!asset) return { status: 'error', message: 'No image picked.' };

  const resized = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const response = await fetch(resized.uri);
  const arrayBuffer = await response.arrayBuffer();

  const filename = `${Date.now()}.jpg`;
  const path = `${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) return { status: 'error', message: uploadError.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { status: 'uploaded', url: data.publicUrl };
}

export async function deletePhoto(url: string): Promise<void> {
  const path = extractStoragePath(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
