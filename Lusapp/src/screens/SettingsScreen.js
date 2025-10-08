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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card } from '../components/Card';
import { API_ENDPOINTS } from '../config/api';

export const SettingsScreen = ({ navigation }) => {
  const { colors, themeMode, setTheme } = useTheme();
  const { use24HourFormat, useMetric, toggle24HourFormat, toggleDistanceUnit } = useSettings();
  const { token, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const themeOptions = [
    { label: 'Light', value: 'light', icon: '☀️' },
    { label: 'Dark', value: 'dark', icon: '🌙' },
    { label: 'Auto', value: 'auto', icon: '⚙️' },
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including:\n\n• Profile information\n• Race history\n• Messages\n• Social connections',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
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
                throw new Error(data.error || 'Failed to delete account');
              }

              Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => logout(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
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
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Selection */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 Appearance</Text>
          
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Display Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>24-Hour Format</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {use24HourFormat ? 'Use 24-hour time (14:30)' : 'Use 12-hour time (2:30 PM)'}
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
              <Text style={[styles.settingLabel, { color: colors.text }]}>Distance Unit</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {useMetric ? 'Use kilometers (km)' : 'Use miles (mi)'}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ About</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Name</Text>
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
                Alert.alert('Error', 'Unable to open Privacy Policy. Please visit: ' + url);
              }
            }}
          >
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Privacy Policy</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>View →</Text>
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
                Alert.alert('Error', 'Unable to open Terms of Service. Please visit: ' + url);
              }
            }}
          >
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Terms of Service</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>View →</Text>
          </TouchableOpacity>
        </Card>

        {/* Account Management */}
        <Card elevation="md" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Account</Text>
          
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
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.deleteWarning, { color: colors.textSecondary }]}>
            Warning: This action is permanent and cannot be undone
          </Text>
        </Card>
      </ScrollView>
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
});
