import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUsers, getCurrentUser } from '../data/mockUsers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const mockUser = getCurrentUser();
    setUser(mockUser);
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    return mockUser;
  };

  const signupWithEmail = async (email, password, userInfo) => {
    const newUser = {
      ...getCurrentUser(),
      email,
      name: userInfo.name,
      location: userInfo.location || 'Unknown',
      bio: userInfo.bio || '',
      favoriteSport: userInfo.favoriteSport || '',
    };
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  };

  const signupWithApple = async () => {
    const mockUser = getCurrentUser();
    setUser(mockUser);
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signupWithEmail,
        signupWithApple,
        logout,
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
