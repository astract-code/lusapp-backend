import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { getDisplayDistance } from '../utils/distanceHelper';

const sportIcons = {
  'Marathon': '🏃',
  'Running': '🏃',
  'Triathlon': '🏊',
  'Cycling': '🚴',
  'Swimming': '🏊',
  'Trail Running': '⛰️',
  'Ultra Marathon': '🏃',
  'Other': '🏅',
};

export const CompactRaceCard = ({ race, onPress }) => {
  const { colors } = useTheme();

  const sportIcon = sportIcons[race.sport_category] || sportIcons[race.sport] || '🏅';
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const getDistanceColor = () => {
    const dist = parseFloat(race.distance);
    if (dist >= 100) return '#E53E3E'; // Red for ultra distances
    if (dist >= 42) return '#DD6B20'; // Orange for marathon+
    if (dist >= 21) return '#D69E2E'; // Yellow for half marathon+
    return '#48BB78'; // Green for shorter
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Left: Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          <Text style={styles.icon}>{sportIcon}</Text>
        </View>

        {/* Middle: Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {race.name}
            </Text>
            {race.sport_subtype && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {race.sport_subtype}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.detailsRow}>
            <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
              📍 {race.city}, {race.country}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                📅 {formatDate(race.date)}
              </Text>
            </View>
            {race.participants > 0 && (
              <View style={styles.stat}>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  👥 {race.participants}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Distance & Button */}
        <View style={styles.rightContainer}>
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceIcon, { color: getDistanceColor() }]}>📍</Text>
            <Text style={[styles.distance, { color: colors.text }]}>
              {getDisplayDistance(race)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  icon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailsRow: {
    marginBottom: 2,
  },
  location: {
    fontSize: FONT_SIZE.xs,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: FONT_SIZE.xs,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  distanceIcon: {
    fontSize: 14,
    marginRight: 2,
  },
  distance: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
