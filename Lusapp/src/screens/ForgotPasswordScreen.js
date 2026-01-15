import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, SPACING } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export const ForgotPasswordScreen = ({ navigation }) => {
  const { firebaseAuthService } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await firebaseAuthService.sendPasswordReset(email.trim());
      Alert.alert(
        'Success', 
        result.message,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#0B0F1A', '#1E3A5A']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.background }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.background },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={[styles.linkText, { color: colors.background }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 12,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  button: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  linkText: {
    fontSize: FONT_SIZE.sm,
    textDecorationLine: 'underline',
  },
});
