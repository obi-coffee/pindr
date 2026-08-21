import {
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import {
  googleSignInConfigured,
  signInWithApple,
  signInWithGoogle,
} from '../lib/auth/social';
import { Typography, radii, useTheme } from './ui';

// Phase S: one-tap sign-in/sign-up. Apple first, then Google, then the
// caller's existing email entry below. Both buttons are the providers'
// own system/branded components — their appearance is a review
// requirement (App Review 4.8 for Apple, Google's brand rules), so
// they are deliberately NOT restyled into paper/ink beyond the corner
// radius Apple's API explicitly allows.
//
// Never render Google without Apple: guideline 4.8. The Google button
// also hides itself until the OAuth client ids are configured, so a
// build with placeholder config never shows a dead button.
export function SocialSignInButtons() {
  const { colors, scheme } = useTheme();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const showGoogle = appleAvailable && googleSignInConfigured;
  if (!appleAvailable) return null;

  const run = async (provider: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    try {
      // false = the person closed the provider sheet; nothing to say.
      await provider();
    } catch (err) {
      Alert.alert('sign in failed', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={
          scheme === 'dark'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={radii.pill}
        style={{ height: 48, opacity: busy ? 0.6 : 1 }}
        onPress={() => run(signInWithApple)}
      />
      {showGoogle ? (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={
              scheme === 'dark'
                ? GoogleSigninButton.Color.Light
                : GoogleSigninButton.Color.Dark
            }
            disabled={busy}
            onPress={() => run(signInWithGoogle)}
          />
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 20,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.stroke }} />
        <Typography variant="caption" color="ink-subtle">
          or with email
        </Typography>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.stroke }} />
      </View>
    </View>
  );
}
