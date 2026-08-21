import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../supabase';

// Native-token sign-in (Phase S): provider sheet → identity token →
// supabase.auth.signInWithIdToken. No browser OAuth. Post-auth routing
// is the same as email — a session with no onboarded profile lands in
// onboarding via the existing layout gates.
//
// Both helpers return true on success and false when the person closed
// the provider sheet; they throw on real failures.

// From Obi's Google Cloud OAuth clients (see the Phase S checklist in
// the build log). The web client id is what Supabase validates the
// token against; the iOS client id must also match the reversed URL
// scheme in app.json's google-signin plugin config.
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

// The Google button only renders once the client ids are configured,
// so a build with placeholders never shows a dead button.
export const googleSignInConfigured = GOOGLE_WEB_CLIENT_ID.length > 0;

let googleConfigured = false;
function configureGoogleOnce(): void {
  if (googleConfigured) return;
  googleConfigured = true;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });
}

export async function signInWithApple(): Promise<boolean> {
  // The nonce dance is required: Apple gets the SHA-256 hash, Supabase
  // gets the raw value and re-hashes to verify the token was minted
  // for this request. Skipping it fails silently server-side.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      return false;
    }
    throw err;
  }

  if (!credential.identityToken) {
    throw new Error("couldn't finish apple sign-in. try again?");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  return true;
}

export async function signInWithGoogle(): Promise<boolean> {
  configureGoogleOnce();
  await GoogleSignin.hasPlayServices();

  let idToken: string | null | undefined;
  try {
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') return false;
    idToken = response.data?.idToken;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      return false;
    }
    throw err;
  }

  if (!idToken) {
    throw new Error("couldn't finish google sign-in. try again?");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  return true;
}
