import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';

const InputWithIcon = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, showToggle, isVisible, onToggleVisibility }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputIcon}>{icon}</Text>
    <TextInput
      style={styles.inputField}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry && !isVisible}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
    {showToggle && (
      <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
        <Text style={styles.eyeIcon}>{isVisible ? '👁️' : '👁️‍🗨️'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const OnboardingScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { login, signupWithEmail, signupWithApple } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailAuth = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Name is required');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (!ageConfirmed) {
          setError('You must confirm that you are at least 13 years old');
          return;
        }
        const result = await signupWithEmail(email, password, { name, location, bio, favoriteSport });
        Alert.alert('Success', result.message || 'Account created! Please verify your email.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Alert.alert(
      'Coming Soon',
      'Apple sign-in will be available in the next update. Please use email signup for now.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🏃</Text>
              </View>
              <Text style={styles.appName}>Lusapp</Text>
              <Text style={styles.tagline}>
                Your race calendar & athletic community
              </Text>
            </View>

            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>
                {isLogin ? 'Welcome Back' : 'Join Lusapp'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {isLogin ? 'Sign in to your account' : 'Create your athlete profile'}
              </Text>

              <View style={styles.inputContainer}>
                {!isLogin && (
                  <>
                    <InputWithIcon
                      icon="👤"
                      placeholder="Full Name"
                      value={name}
                      onChangeText={setName}
                    />
                    <InputWithIcon
                      icon="📍"
                      placeholder="Location (e.g., San Francisco, CA)"
                      value={location}
                      onChangeText={setLocation}
                    />
                    <InputWithIcon
                      icon="🏅"
                      placeholder="Favorite Sport (e.g., Marathon)"
                      value={favoriteSport}
                      onChangeText={setFavoriteSport}
                    />
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]}>📝</Text>
                      <TextInput
                        style={[styles.inputField, styles.textArea]}
                        placeholder="Bio (optional)"
                        placeholderTextColor="#9CA3AF"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </>
                )}

                <InputWithIcon
                  icon="✉️"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <InputWithIcon
                  icon="🔒"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  showToggle
                  isVisible={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                />

                {!isLogin && (
                  <InputWithIcon
                    icon="🔒"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    showToggle
                    isVisible={showConfirmPassword}
                    onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                )}

                {!isLogin && (
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setAgeConfirmed(!ageConfirmed)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                      {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I confirm that I am at least 13 years old
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleEmailAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isLogin ? 'Log In' : 'Sign Up'}
                  </Text>
                )}
              </TouchableOpacity>

              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              >
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchContainer}
                onPress={() => setIsLogin(!isLogin)}
              >
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.switchLink}>
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.md,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  inputField: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: FONT_SIZE.sm,
    color: '#6B7280',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: '#9CA3AF',
    fontSize: FONT_SIZE.sm,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  appleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: SPACING.sm,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  switchContainer: {
    marginTop: SPACING.sm,
  },
  switchText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: FONT_SIZE.sm,
  },
  switchLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});
