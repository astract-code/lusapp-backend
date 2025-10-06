import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card } from '../components/Card';

export const SettingsScreen = ({ navigation }) => {
  const { colors, themeMode, setTheme } = useTheme();
  const { use24HourFormat, useMetric, toggle24HourFormat, toggleDistanceUnit } = useSettings();

  const themeOptions = [
    { label: 'Light', value: 'light', icon: '☀️' },
    { label: 'Dark', value: 'dark', icon: '🌙' },
    { label: 'Auto', value: 'auto', icon: '⚙️' },
  ];

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
});
