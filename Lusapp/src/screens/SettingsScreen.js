import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card } from '../components/Card';
import { API_ENDPOINTS } from '../config/api';

export const SettingsScreen = ({ navigation }) => {
  const { colors, themeMode, setTheme } = useTheme();
  const { use24HourFormat, useMetric, toggle24HourFormat, toggleDistanceUnit } = useSettings();
  const { token, logout } = useAuth();
  const { t, language, setLanguage, languages, getCurrentLanguage } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const themeOptions = [
    { label: t('light'), value: 'light', icon: '☀️' },
    { label: t('dark'), value: 'dark', icon: '🌙' },
    { label: t('auto'), value: 'auto', icon: '⚙️' },
  ];

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    setShowLanguageModal(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccountConfirmTitle'),
      t('deleteAccountConfirmMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await fetch(API_ENDPOINTS.auth.deleteAccount, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || t('failedToDeleteAccount'));
              }

              Alert.alert(
                t('accountDeleted'),
                t('accountDeletedMessage'),
                [
                  {
                    text: t('ok'),
                    onPress: () => logout(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(t('error'), error.message || t('failedToDeleteAccount'));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Selection */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌐 {t('language')}</Text>
          
          <TouchableOpacity
            style={[styles.languageSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text style={[styles.languageText, { color: colors.text }]}>
              {getCurrentLanguage().nativeName}
            </Text>
            <Text style={[styles.languageArrow, { color: colors.textSecondary }]}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Theme Selection */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 {t('appearance')}</Text>
          
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === option.value ? colors.primary : colors.surface,
                    borderColor: themeMode === option.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTheme(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.themeIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.themeLabel,
                    { color: themeMode === option.value ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Display Preferences */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ {t('displayPreferences')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('timeFormat24')}</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {use24HourFormat ? t('timeFormat24Desc') : t('timeFormat12Desc')}
              </Text>
            </View>
            <Switch
              value={use24HourFormat}
              onValueChange={toggle24HourFormat}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('distanceUnit')}</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {useMetric ? t('distanceUnitKm') : t('distanceUnitMi')}
              </Text>
            </View>
            <Switch
              value={useMetric}
              onValueChange={toggleDistanceUnit}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor={colors.border}
            />
          </View>
        </Card>

        {/* About */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ {t('about')}</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('version')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('appName')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Lusapp</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.infoRow}
            onPress={async () => {
              const url = 'https://lusapp-backend-1.onrender.com/privacy-policy';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert(t('error'), t('unableToOpenPrivacyPolicy'));
              }
            }}
          >
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('privacyPolicy')}</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.infoRow}
            onPress={async () => {
              const url = 'https://lusapp-backend-1.onrender.com/terms-of-service';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert(t('error'), t('unableToOpenTermsOfService'));
              }
            }}
          >
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('termsOfService')}</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Account Management */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 {t('account')}</Text>
          
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: colors.error, opacity: isDeleting ? 0.6 : 1 },
            ]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>{t('deleteAccount')}</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.deleteWarning, { color: colors.textSecondary }]}>
            {t('deleteAccountWarning')}
          </Text>
        </Card>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    language === item.code && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <View>
                    <Text style={[styles.languageNative, { color: colors.text }]}>
                      {item.nativeName}
                    </Text>
                    <Text style={[styles.languageEnglish, { color: colors.textSecondary }]}>
                      {item.name}
                    </Text>
                  </View>
                  {language === item.code && (
                    <Text style={[styles.languageCheck, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backButton: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    width: 60,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.lg,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
  },
  themeIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  themeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  deleteButton: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  deleteWarning: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  languageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  languageArrow: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalClose: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  languageNative: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  languageEnglish: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  languageCheck: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
