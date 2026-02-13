import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
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
  'Fitness': '💪',
  'HYROX': '🏋️',
  'Other': '🏅',
};

export const CompactRaceCard = ({ race, onPress, isPastUncompleted, isCompleted, completionData, onMarkComplete }) => {
  const { colors } = useTheme();
  const { useMetric } = useSettings();
  const { t } = useLanguage();

  const sportIcon = sportIcons[race.sport_category] || sportIcons[race.sport] || '🏅';
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sportIcon}>{sportIcon}</Text>
          <Text style={styles.title} numberOfLines={1}>{race.name}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{getDisplayDistance(race, useMetric)}</Text>
        </View>
      </View>

      <View style={styles.location}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>{race.city}, {race.country}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.date}>📅 {formatDate(race.date)}</Text>
        <View style={styles.rightSection}>
          {race.participants > 0 && (
            <View style={styles.participants}>
              <Text style={styles.participantsText}>👥 {race.participants}</Text>
            </View>
          )}
          {isPastUncompleted ? (
            <TouchableOpacity
              style={styles.markCompleteButton}
              onPress={onMarkComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{t('markComplete')}</Text>
            </TouchableOpacity>
          ) : isCompleted ? (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>{`✓ ${t('done')}`}</Text>
            </View>
          ) : null}
        </View>
      </View>
      
      {isCompleted && completionData && (
        <View style={styles.completionDetails}>
          {completionData.completion_time && (
            <View style={styles.completionStat}>
              <Text style={styles.completionLabel}>{t('time')}</Text>
              <Text style={styles.completionValue}>{completionData.completion_time}</Text>
            </View>
          )}
          {completionData.position && (
            <View style={styles.completionStat}>
              <Text style={styles.completionLabel}>{t('position')}</Text>
              <Text style={styles.completionValue}>#{completionData.position}</Text>
            </View>
          )}
          {completionData.certificate_url && (
            <View style={styles.completionStat}>
              <Text style={styles.certificateBadge}>{`📄 ${t('certificate')}`}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  sportIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  locationText: {
    color: '#6B7280',
    fontSize: 14,
    flex: 1,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  markCompleteButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  completionDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 20,
  },
  completionStat: {
    alignItems: 'center',
  },
  completionLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  certificateBadge: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
