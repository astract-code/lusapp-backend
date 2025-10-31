import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/context/AppContext';

const AppContent = () => {
  const { user, firebaseUser, emailVerified, isLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const fetchRaces = useAppStore((state) => state.fetchRaces);
  const { EmailVerificationScreen } = require('./src/screens/EmailVerificationScreen');

  useEffect(() => {
    if (user) {
      fetchRaces();
    }
  }, [user]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {!firebaseUser ? (
        <OnboardingScreen />
      ) : !emailVerified ? (
        <EmailVerificationScreen />
      ) : (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
