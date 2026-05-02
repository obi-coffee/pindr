import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Typography, useTheme } from '../../../components/ui';
import { parseQrPayload } from '../../../lib/match/qr';

export default function QrScanScreen() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  // Once we hand off to the confirm screen we don't want a second
  // scan to fire and queue another navigation.
  const handledRef = useRef(false);

  const onBarcode = useCallback((event: { data: string }) => {
    if (handledRef.current) return;
    const parsed = parseQrPayload(event.data);
    if (!parsed) {
      setError("that doesn't look like a Pindr code.");
      return;
    }
    handledRef.current = true;
    setError(null);
    router.replace(`/qr/confirm/${parsed}` as never);
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#000' }}
      edges={['top', 'bottom']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: 10,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography
            variant="caption"
            style={{ color: '#FFFFFF' }}
          >
            close
          </Typography>
        </Pressable>
        <Typography variant="caption" style={{ color: '#FFFFFF' }}>
          scan
        </Typography>
        <View style={{ minWidth: 48 }} />
      </View>

      {!permission ? (
        // Permissions are still resolving on first mount. Black
        // viewport is fine for the half-second this lasts.
        <View style={{ flex: 1 }} />
      ) : !permission.granted ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 32,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <Typography
            variant="body-lg"
            style={{ color: '#FFFFFF', textAlign: 'center' }}
          >
            we need camera access to scan a code.
          </Typography>
          {permission.canAskAgain ? (
            <Button
              variant="primary"
              size="lg"
              onPress={() => requestPermission()}
            >
              Allow camera
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onPress={() => Linking.openSettings()}
            >
              Open Settings
            </Button>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcode}
          />
          <View
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: 32,
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          >
            <Typography
              variant="body"
              style={{ color: '#FFFFFF', textAlign: 'center' }}
            >
              {error
                ? error
                : 'hold steady on a friend’s pindr code.'}
            </Typography>
            {error ? (
              <Pressable
                onPress={() => setError(null)}
                hitSlop={8}
                style={{ alignSelf: 'center', marginTop: 8 }}
              >
                <Typography
                  variant="caption"
                  style={{ color: colors.mustard }}
                >
                  try again
                </Typography>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
