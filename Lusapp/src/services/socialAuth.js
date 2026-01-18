import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../config/api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};

export const signInWithGoogle = async (idToken) => {
  try {
    const response = await fetch(API_ENDPOINTS.auth.social, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        id_token: idToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google sign-in failed: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[SOCIAL AUTH] Google sign-in error:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign-In is not available on this device');
    }

    const nonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36).substring(2, 15)
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });

    const response = await fetch(API_ENDPOINTS.auth.social, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'apple',
        id_token: credential.identityToken,
        user: credential.user,
        full_name: credential.fullName,
        email: credential.email,
        nonce,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apple sign-in failed: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Sign-in was cancelled');
    }
    console.error('[SOCIAL AUTH] Apple sign-in error:', error);
    throw error;
  }
};

export const checkAppleSignInAvailable = async () => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return await AppleAuthentication.isAvailableAsync();
};
