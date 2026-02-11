import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, BORDER_RADIUS, GRADIENTS } from '../constants/theme';
import haptic from '../utils/haptics';

const backgroundImage = require('../../assets/images/athletes_running_at_sunrise.png');

const { width, height } = Dimensions.get('window');

const InputField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType, 
  autoCapitalize,
  showToggle,
  isVisible,
  onToggleVisibility,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      styles.inputWrapper,
      isFocused && styles.inputWrapperFocused,
    ]}>
      <Ionicons name={icon} size={18} color="#64748B" style={styles.inputIcon} />
      <TextInput
        style={styles.inputField}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !isVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
          <Ionicons name={isVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// Configure Google Sign-In with the native SDK
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

const hasGoogleConfig = Boolean(GOOGLE_WEB_CLIENT_ID);

export const OnboardingScreen = ({ navigation }) => {
  const { login, signupWithEmail, signupWithGoogle, signupWithApple } = useAuth();
  const { t } = useLanguage();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [error, setError] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [googleAuthAvailable] = useState(hasGoogleConfig);
  
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const checkAppleAuth = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleAuthAvailable(isAvailable);
      }
    };
    checkAppleAuth();
  }, []);

  const handleEmailAuth = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError(t('nameRequired'));
          return;
        }
        if (password.length < 6) {
          setError(t('passwordMinLength'));
          return;
        }
        if (password !== confirmPassword) {
          setError(t('passwordsDoNotMatch'));
          return;
        }
        if (!ageConfirmed) {
          setError(t('ageConfirmationRequired'));
          return;
        }
        const result = await signupWithEmail(email, password, { name, location, bio, favoriteSport });
        Alert.alert(t('success'), result.message || t('accountCreatedVerifyEmail'));
      }
    } catch (err) {
      setError(err.message || t('somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonPressIn = () => {
    haptic.light();
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handleAppleSignIn = async () => {
    if (!appleAuthAvailable) {
      Alert.alert(t('notAvailable'), t('appleSignInNotAvailable'));
      return;
    }
    
    setIsSocialLoading(true);
    setError('');
    
    try {
      await signupWithApple();
    } catch (err) {
      if (err.message !== 'Sign-in was cancelled') {
        setError(err.message || t('failedToSignInApple'));
      }
    } finally {
      setIsSocialLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (!googleAuthAvailable) {
      Alert.alert(t('configurationError'), t('googleSignInNotConfigured'));
      return;
    }
    
    setError('');
    setIsSocialLoading(true);
    haptic.light();
    
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      console.log('[GOOGLE AUTH] Sign-in successful:', userInfo.data?.user?.email);
      
      const idToken = userInfo.data?.idToken;
      if (idToken) {
        await signupWithGoogle(idToken);
      } else {
        throw new Error('No ID token received from Google');
      }
    } catch (err) {
      console.error('[GOOGLE AUTH] Error:', err);
      
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GOOGLE AUTH] User cancelled sign-in');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError(t('signInInProgress'));
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError(t('googlePlayServicesNotAvailable'));
      } else {
        setError(err.message || t('failedToSignInGoogle'));
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay} />
      </ImageBackground>
      
      <View style={styles.glowEffect} />
      <View style={styles.glowEffect2} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.logoContainer}
              >
                <Text style={styles.logoText}>L</Text>
              </LinearGradient>
              <Text style={styles.appName}>LUSAPP</Text>
              <Text style={styles.tagline}>
                {t('tagline')}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, isLogin && styles.tabActive]}
                  onPress={() => { haptic.selection(); setIsLogin(true); }}
                >
                  {isLogin ? (
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>{t('signIn')}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>{t('signIn')}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, !isLogin && styles.tabActive]}
                  onPress={() => { haptic.selection(); setIsLogin(false); }}
                >
                  {!isLogin ? (
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <Text style={styles.tabTextActive}>{t('signUp')}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.tabText}>{t('signUp')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                {!isLogin && (
                  <>
                    <InputField
                      icon="person-outline"
                      placeholder={t('fullName')}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                    <InputField
                      icon="location-outline"
                      placeholder={t('locationOptional')}
                      value={location}
                      onChangeText={setLocation}
                    />
                    <InputField
                      icon="trophy-outline"
                      placeholder={t('favoriteSportOptional')}
                      value={favoriteSport}
                      onChangeText={setFavoriteSport}
                    />
                  </>
                )}

                <InputField
                  icon="mail-outline"
                  placeholder={t('email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <InputField
                  icon="lock-closed-outline"
                  placeholder={t('password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  showToggle
                  isVisible={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                />

                {!isLogin && (
                  <>
                    <InputField
                      icon="lock-closed-outline"
                      placeholder={t('confirmPassword')}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      showToggle
                      isVisible={showConfirmPassword}
                      onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                    />

                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => { haptic.selection(); setAgeConfirmed(!ageConfirmed); }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                        {ageConfirmed && <Ionicons name="checkmark-outline" size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        {t('ageConfirmation')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={handleEmailAuth}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={isLoading}
                  activeOpacity={1}
                >
                  <LinearGradient
                    colors={GRADIENTS.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {isLogin ? t('signIn') : t('createAccount')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtonsContainer}>
                {Platform.OS === 'ios' && appleAuthAvailable && (
                  <TouchableOpacity
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                    disabled={isSocialLoading}
                  >
                    {isSocialLoading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <>
                        <Text style={styles.appleIcon}></Text>
                        <Text style={styles.appleButtonText}>{t('apple')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {googleAuthAvailable && (
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={isSocialLoading}
                  >
                    {isSocialLoading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <>
                        <Text style={styles.googleIcon}>G</Text>
                        <Text style={styles.googleButtonText}>{t('google')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.termsText}>
              {t('termsAgreement')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 15, 26, 0.75)',
  },
  glowEffect: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#4ADE80',
    opacity: 0.1,
  },
  glowEffect2: {
    position: 'absolute',
    bottom: -50,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#38BDF8',
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 15,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {},
  tabGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperFocused: {
    borderColor: '#4ADE80',
  },
  inputIcon: {
    fontSize: 16,
    color: '#64748B',
    marginRight: SPACING.sm,
  },
  inputField: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    fontSize: 16,
    color: '#F8FAFC',
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#64748B',
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
    borderColor: '#475569',
    borderRadius: 6,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 4,
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  forgotPasswordText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: '#64748B',
    fontSize: 13,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 50,
  },
  appleIcon: {
    fontSize: 20,
    color: '#000000',
    marginRight: SPACING.xs,
  },
  appleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 50,
  },
  googleIcon: {
    fontSize: 18,
    color: '#4285F4',
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
});
