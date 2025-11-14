import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { firebaseAuthService } from '../services/firebaseAuth';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
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
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
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

  const signupWithApple = async () => {
    throw new Error('Apple sign-in not yet implemented. Please use email signup.');
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await firebaseAuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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
