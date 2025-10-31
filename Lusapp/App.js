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
  const { user, firebaseUser, emailVerified, isLoading } = useAuth();
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

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {!firebaseUser ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
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
