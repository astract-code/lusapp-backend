import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const TOS_URL = 'https://lusapp-backend-1.onrender.com/terms-of-service';
const PRIVACY_URL = 'https://lusapp-backend-1.onrender.com/privacy';

export const TermsAcceptanceScreen = ({ onAccept, onDecline }) => {
  const { t } = useLanguage();

  const handleDecline = () => {
    Alert.alert(
      t('termsTitle'),
      'You must accept the Terms of Service and Privacy Policy to use Lusapp.',
      [{ text: 'OK' }]
    );
  };

  return (
    <LinearGradient colors={['#0B0F1A', '#0B0F1A']} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.appName}>Lusapp</Text>
          <Text style={styles.tagline}>Endurance Race Discovery</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('termsTitle')}</Text>
          <Text style={styles.intro}>{t('termsIntro')}</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.bullet}>• You must be 13 years or older to use this app.</Text>
            <Text style={styles.bullet}>• Be respectful to other community members.</Text>
            <Text style={styles.bullet}>• Do not post offensive, abusive, or misleading content.</Text>
            <Text style={styles.bullet}>• You can report inappropriate content at any time using the "⋯" menu on any post.</Text>
            <Text style={styles.bullet}>• You can block any user from their profile page.</Text>
            <Text style={styles.bullet}>• We may remove content or accounts that violate our guidelines.</Text>
          </ScrollView>

          <View style={styles.links}>
            <TouchableOpacity onPress={() => Linking.openURL(TOS_URL)}>
              <Text style={styles.link}>{t('termsOfService')}</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.link}>{t('privacyPolicy')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <LinearGradient
            colors={['#4ADE80', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptGradient}
          >
            <Text style={styles.acceptText}>{t('termsAccept')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
          <Text style={styles.declineText}>{t('termsDecline')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0B0F1A',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  intro: {
    fontSize: FONT_SIZE.sm,
    color: '#94a3b8',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  scroll: {
    maxHeight: 180,
  },
  bullet: {
    fontSize: FONT_SIZE.sm,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 6,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  link: {
    fontSize: FONT_SIZE.sm,
    color: '#4ADE80',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  linkDivider: {
    color: '#475569',
    fontSize: FONT_SIZE.sm,
  },
  acceptButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  acceptGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: '#0B0F1A',
  },
  declineButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  declineText: {
    fontSize: FONT_SIZE.sm,
    color: '#475569',
  },
});
