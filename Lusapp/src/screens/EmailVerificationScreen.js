import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONT_SIZE, SPACING } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export const EmailVerificationScreen = ({ navigation }) => {
  const { firebaseUser, firebaseAuthService, logout, refreshEmailVerificationStatus } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const isVerified = await refreshEmailVerificationStatus();
      
      if (isVerified) {
        Alert.alert(t('success'), t('emailVerifiedSuccess'));
      } else {
        Alert.alert(t('notVerified'), t('pleaseCheckEmailVerification'));
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert(t('oops'), t('failedToCheckVerification'));
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await firebaseAuthService.resendVerificationEmail();
      Alert.alert(t('success'), result.message);
    } catch (error) {
      console.error('Error resending email:', error);
      Alert.alert(t('oops'), error.message || t('failedToResendVerification'));
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert(t('oops'), t('failedToLogout'));
    }
  };

  return (
    <LinearGradient
      colors={['#0B0F1A', '#1E3A5A']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>{t('verifyYourEmail')}</Text>
        <Text style={[styles.subtitle, { color: colors.background }]}>
          {t('weSentVerificationEmail')}
        </Text>
        <Text style={[styles.email, { color: colors.background }]}>
          {firebaseUser?.email}
        </Text>
        <Text style={[styles.instructions, { color: colors.background }]}>
          {t('verificationInstructions')}
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
              {t('iveVerifiedMyEmail')}
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
              {t('resendVerificationEmail')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleLogout}
        >
          <Text style={[styles.linkText, { color: colors.background }]}>
            {t('signOut')}
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
