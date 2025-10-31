import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONT_SIZE, SPACING } from '../theme';
import LinearGradient from 'expo-linear-gradient';

export const EmailVerificationScreen = ({ navigation }) => {
  const { firebaseUser, firebaseAuthService, logout } = useAuth();
  const { colors } = useTheme();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const isVerified = await firebaseAuthService.checkEmailVerified();
      
      if (isVerified) {
        Alert.alert('Success', 'Email verified! You can now access the app.');
      } else {
        Alert.alert('Not Verified', 'Please check your email and click the verification link before continuing.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert('Error', 'Failed to check verification status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await firebaseAuthService.resendVerificationEmail();
      Alert.alert('Success', result.message);
    } catch (error) {
      console.error('Error resending email:', error);
      Alert.alert('Error', error.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradient1, colors.gradient2]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: colors.background }]}>
          We sent a verification email to:
        </Text>
        <Text style={[styles.email, { color: colors.background }]}>
          {firebaseUser?.email}
        </Text>
        <Text style={[styles.instructions, { color: colors.background }]}>
          Please check your inbox and click the verification link, then tap "I've Verified" below.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.background }]}
          onPress={handleCheckVerification}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primary }]}>
              I've Verified My Email
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.background }]}
          onPress={handleResendEmail}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonTextOutline, { color: colors.background }]}>
              Resend Verification Email
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleLogout}
        >
          <Text style={[styles.linkText, { color: colors.background }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  email: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  instructions: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
  },
  button: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  buttonOutline: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: SPACING.lg,
  },
  buttonTextOutline: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: SPACING.md,
  },
  linkText: {
    fontSize: FONT_SIZE.sm,
    textDecorationLine: 'underline',
  },
});
