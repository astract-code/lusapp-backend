import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS, FONT_SIZE, SPORTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export const RaceCard = ({ race, onPress }) => {
  const { colors } = useTheme();
  const sport = SPORTS.find(s => s.id === race.sport || s.name === race.sport) || SPORTS[0];
  
  const formatTime = (time) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getRaceSubtitle = () => {
    const category = race.sport_category || '';
    if (category.toLowerCase().includes('hyrox')) {
      return category;
    }
    return race.sport_subtype || category || sport.name;
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={[colors.gradient1, colors.gradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.sportIcon}>{sport.icon}</Text>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>{race.name}</Text>
              <Text style={styles.sport}>{getRaceSubtitle()}</Text>
            </View>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{race.city}, {race.country}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>
                {new Date(race.date).toLocaleDateString()}
                {race.start_time && ` • ${formatTime(race.start_time)}`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📏</Text>
              <Text style={styles.detailText}>{race.distance}</Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.participants}>👥 {race.participants} participants</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sportIcon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  sport: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  details: {
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailIcon: {
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: SPACING.sm,
  },
  participants: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
