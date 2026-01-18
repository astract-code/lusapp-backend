import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { EmailVerificationScreen } from './src/screens/EmailVerificationScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/context/AppContext';

const AuthStack = createNativeStackNavigator();

const AppContent = () => {
  const { user, token, firebaseUser, emailVerified, isLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const fetchRaces = useAppStore((state) => state.fetchRaces);

  useEffect(() => {
    if (user) {
      fetchRaces();
    }
  }, [user]);

  if (isLoading) {
    return null;
  }

  const isAuthenticated = !!user && !!token;
  const isSocialAuth = isAuthenticated && !firebaseUser;
  const isFirebaseAuth = !!firebaseUser;

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {!isAuthenticated && !isFirebaseAuth ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
      ) : isSocialAuth ? (
        <AppNavigator />
      ) : !emailVerified ? (
        <EmailVerificationScreen />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
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
