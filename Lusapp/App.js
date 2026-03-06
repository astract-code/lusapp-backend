import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { EmailVerificationScreen } from './src/screens/EmailVerificationScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/context/AppContext';

const AuthStack = createNativeStackNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[APP CRASH]', error.message);
    console.error('[APP CRASH STACK]', error.stack);
    console.error('[APP CRASH COMPONENT]', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>App Error</Text>
          <Text style={errorStyles.subtitle}>Please share this with the developer:</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.message}>{this.state.error?.message}</Text>
            <Text style={errorStyles.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A', padding: 20, paddingTop: 60 },
  title: { color: '#EF4444', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 16 },
  scroll: { flex: 1 },
  message: { color: '#F472B6', fontSize: 14, marginBottom: 12, fontWeight: 'bold' },
  stack: { color: '#CBD5E1', fontSize: 11, fontFamily: 'monospace' },
});

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
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <SettingsProvider>
              <LanguageProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </LanguageProvider>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
