import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZE, SPORTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { getDisplayDistance } from '../utils/distanceHelper';
import { Icon } from './Icon';

export const RaceCard = ({ race, onPress }) => {
  const { colors } = useTheme();
  const { useMetric } = useSettings();
  const sport = SPORTS.find(s => s.id === race.sport || s.name === race.sport) || SPORTS[0];
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getRaceSubtitle = () => {
    const category = race.sport_category || '';
    if (category.toLowerCase().includes('hyrox')) {
      return category;
    }
    if (race.sport_subtype && race.sport_subtype !== category) {
      return race.sport_subtype;
    }
    return category || sport.name;
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.sportIconContainer}>
            <Icon name={sport.icon} size={24} color="#10B981" />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.title} numberOfLines={2}>{race.name}</Text>
            <Text style={styles.subtitle}>{getRaceSubtitle()}</Text>
          </View>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{getDisplayDistance(race, useMetric)}</Text>
        </View>
      </View>

      <View style={styles.location}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>{race.city}, {race.country}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.date}>
          📅 {formatDate(race.date)}
          {race.start_time && ` • ${formatTime(race.start_time)}`}
        </Text>
        {race.participants > 0 && (
          <View style={styles.participants}>
            <Text style={styles.participantsText}>👥 {race.participants}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  sportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  distanceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    color: '#6B7280',
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
