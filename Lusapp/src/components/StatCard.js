import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const iconMap = {
  trophy: '🏆',
  users: '👥',
  target: '🎯',
  medal: '🏅',
  fire: '🔥',
  star: '⭐',
  heart: '❤️',
  running: '🏃',
  calendar: '📅',
  check: '✓',
};

export const StatCard = ({ 
  icon, 
  label, 
  value, 
  color = '#10B981' 
}) => {
  const displayIcon = iconMap[icon] || icon;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Text style={styles.icon}>{displayIcon}</Text>
      </View>
      <Text style={[styles.value, { color: '#1F2937' }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
