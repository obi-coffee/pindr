import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;
const BUCKET = 'photos';
const TARGET_ASPECT = 4 / 5;

export type PickAndUploadResult =
  | { status: 'cancelled' }
  | { status: 'permission_denied' }
  | { status: 'error'; message: string }
  | { status: 'uploaded'; urls: string[] };

export async function pickAndUploadPhotos(
  userId: string,
  limit: number,
): Promise<PickAndUploadResult> {
  if (limit <= 0) return { status: 'uploaded', urls: [] };

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'permission_denied' };

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
  });
  if (picked.canceled) return { status: 'cancelled' };
  const assets = picked.assets ?? [];
  if (assets.length === 0) return { status: 'error', message: 'No image picked.' };

  const urls: string[] = [];
  for (const asset of assets) {
    try {
      const url = await processAndUpload(asset, userId);
      urls.push(url);
    } catch (err) {
      return { status: 'error', message: (err as Error).message };
    }
  }
  return { status: 'uploaded', urls };
}

async function processAndUpload(
  asset: ImagePicker.ImagePickerAsset,
  userId: string,
): Promise<string> {
  const actions: ImageManipulator.Action[] = [];
  const w = asset.width;
  const h = asset.height;
  if (w > 0 && h > 0) {
    const currentAspect = w / h;
    if (Math.abs(currentAspect - TARGET_ASPECT) > 0.01) {
      let cropWidth = w;
      let cropHeight = h;
      if (currentAspect > TARGET_ASPECT) {
        // Too wide; shrink width.
        cropWidth = Math.round(h * TARGET_ASPECT);
      } else {
        // Too tall; shrink height.
        cropHeight = Math.round(w / TARGET_ASPECT);
      }
      const originX = Math.round((w - cropWidth) / 2);
      const originY = Math.round((h - cropHeight) / 2);
      actions.push({
        crop: { originX, originY, width: cropWidth, height: cropHeight },
      });
    }
  }
  actions.push({ resize: { width: MAX_DIMENSION } });

  const processed = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const response = await fetch(processed.uri);
  const arrayBuffer = await response.arrayBuffer();

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
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
