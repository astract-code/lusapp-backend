import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export const StatCard = ({ icon, label, value }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
});
