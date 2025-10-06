import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';

export const OnboardingScreen = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;
  const { login, signupWithEmail, signupWithApple } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleEmailAuth = async () => {
    if (isLogin) {
      await login(email, password);
    } else {
      await signupWithEmail(email, password, name);
    }
  };

  const handleAppleSignIn = async () => {
    await signupWithApple();
  };

  return (
    <LinearGradient
      colors={[theme.gradient1, theme.gradient2]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🏃</Text>
          <Text style={styles.appName}>Lusapp</Text>
          <Text style={styles.tagline}>
            Your race calendar & athletic community
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {isLogin ? 'Welcome Back' : 'Join Lusapp'}
          </Text>

          {!isLogin && (
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleEmailAuth}
          >
            <Text style={styles.buttonText}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.appleButton, { borderColor: theme.border }]}
            onPress={handleAppleSignIn}
          >
            <Text style={styles.appleIcon}>&#xF8FF;</Text>
            <Text style={[styles.appleButtonText, { color: theme.text }]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={[styles.switchLink, { color: theme.primary }]}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    fontSize: 80,
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  button: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.sm,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  appleIcon: {
    fontSize: FONT_SIZE.lg,
    marginRight: SPACING.sm,
  },
  appleButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
  },
  switchLink: {
    fontWeight: '600',
  },
});
