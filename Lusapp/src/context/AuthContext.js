import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { firebaseAuthService } from '../services/firebaseAuth';
import { API_ENDPOINTS } from '../config/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    let tokenRefreshInterval = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AUTH] Firebase auth state changed:', firebaseUser ? firebaseUser.uid : 'null');
      
      if (firebaseUser) {
        // CRITICAL: Reload user to get latest email verification status
        await firebaseUser.reload();
        const currentUser = auth.currentUser;
        
        setFirebaseUser(currentUser);
        setEmailVerified(currentUser.emailVerified);
        
        console.log('[AUTH] Email verified status:', currentUser.emailVerified);
        
        if (currentUser.emailVerified) {
          try {
            const idToken = await currentUser.getIdToken();
            setToken(idToken);
            
            console.log('[AUTH] Starting backend sync...');
            const dbUser = await syncUserWithBackend(currentUser, idToken);
            setUser(dbUser);
            
            await AsyncStorage.setItem('token', idToken);
            await AsyncStorage.setItem('user', JSON.stringify(dbUser));
            console.log('[AUTH] ✅ User fully synced and stored');

            // Set up automatic token refresh every 45 minutes (tokens expire after 1 hour)
            if (tokenRefreshInterval) {
              clearInterval(tokenRefreshInterval);
            }
            tokenRefreshInterval = setInterval(async () => {
              try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                  const newToken = await currentUser.getIdToken(true);
                  setToken(newToken);
                  await AsyncStorage.setItem('token', newToken);
                  console.log('[AUTH] Token refreshed automatically');
                }
              } catch (error) {
                console.log('[AUTH] Auto token refresh failed:', error.message);
              }
            }, 45 * 60 * 1000); // 45 minutes
          } catch (error) {
            console.error('[AUTH] ❌ Error syncing user with backend:', error);
            console.error('[AUTH] Error details:', error.message);
          }
        } else {
          console.log('[AUTH] Email not verified yet');
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('[AUTH] User logged out');
        setFirebaseUser(null);
        setUser(null);
        setToken(null);
        setEmailVerified(false);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        
        // Clear token refresh interval on logout
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
          tokenRefreshInterval = null;
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  const syncUserWithBackend = async (firebaseUser, idToken) => {
    try {
      console.log('[AUTH] Syncing user with backend:', API_ENDPOINTS.auth.sync);
      const response = await fetch(API_ENDPOINTS.auth.sync, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        }),
      });

      console.log('[AUTH] Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AUTH] Backend error response:', errorText);
        throw new Error(`Failed to sync user with backend: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[AUTH] User synced successfully');
      return data.user;
    } catch (error) {
      console.error('[AUTH] Error syncing user with backend:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const result = await firebaseAuthService.login(email, password);
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signupWithEmail = async (email, password, userInfo) => {
    try {
      const result = await firebaseAuthService.signup(
        email, 
        password, 
        userInfo.name
      );
      
      return {
        user: result.user,
        message: result.message
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signupWithGoogle = async (idToken) => {
    try {
      console.log('[AUTH] Starting Google sign-in...');
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
      console.log('[AUTH] Google sign-in successful');
      
      setToken(data.token);
      setUser(data.user);
      setEmailVerified(true);
      
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('[AUTH] Google sign-in error:', error);
      throw error;
    }
  };

  const signupWithApple = async () => {
    try {
      console.log('[AUTH] Starting Apple sign-in...');
      
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }
      
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
      console.log('[AUTH] Apple sign-in successful');
      
      setToken(data.token);
      setUser(data.user);
      setEmailVerified(true);
      
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED' || 
          error.code === 'ERR_CANCELED' ||
          error.code === 'ERR_REQUEST_CANCELLED') {
        throw new Error('Sign-in was cancelled');
      }
      console.error('[AUTH] Apple sign-in error:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      // Clear local state first
      setToken(null);
      setUser(null);
      setEmailVerified(false);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Only call Firebase logout if there's a Firebase user
      if (firebaseUser) {
        await firebaseAuthService.logout();
      }
      
      console.log('[AUTH] Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state even if Firebase logout fails
      setToken(null);
      setUser(null);
      setEmailVerified(false);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
  };

  const refreshToken = async () => {
    try {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
        await AsyncStorage.setItem('token', idToken);
        return idToken;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const refreshEmailVerificationStatus = async () => {
    try {
      const isVerified = await firebaseAuthService.checkEmailVerified();
      
      if (!isVerified || !auth.currentUser) {
        return false;
      }
      
      const firebaseUser = auth.currentUser;
      
      const idToken = await firebaseUser.getIdToken(true);
      
      const dbUser = await syncUserWithBackend(firebaseUser, idToken);
      
      await AsyncStorage.setItem('token', idToken);
      await AsyncStorage.setItem('user', JSON.stringify(dbUser));
      
      setEmailVerified(true);
      setToken(idToken);
      setUser(dbUser);
      
      return true;
    } catch (error) {
      console.error('Error refreshing verification status:', error);
      setEmailVerified(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isLoading,
        emailVerified,
        login,
        signupWithEmail,
        signupWithGoogle,
        signupWithApple,
        logout,
        updateUser,
        refreshToken,
        refreshEmailVerificationStatus,
        firebaseAuthService,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
