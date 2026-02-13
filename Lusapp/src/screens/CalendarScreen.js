import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList, 
  TouchableOpacity, 
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS } from '../constants/theme';
import { API_BASE_URL } from '../config/api';
import { getDisplayDistance } from '../utils/distanceHelper';
import haptic from '../utils/haptics';

const raceTypeColors = {
  'Running': { primary: '#4ADE80', secondary: '#22C55E', dot: '#4ADE80' },
  'Marathon': { primary: '#4ADE80', secondary: '#22C55E', dot: '#4ADE80' },
  'Triathlon': { primary: '#38BDF8', secondary: '#0EA5E9', dot: '#38BDF8' },
  'Cycling': { primary: '#A78BFA', secondary: '#8B5CF6', dot: '#A78BFA' },
  'Swimming': { primary: '#22D3EE', secondary: '#06B6D4', dot: '#22D3EE' },
  'Fitness': { primary: '#FB923C', secondary: '#F97316', dot: '#FB923C' },
  'HYROX': { primary: '#F87171', secondary: '#EF4444', dot: '#F87171' },
  'Trail Running': { primary: '#A3E635', secondary: '#84CC16', dot: '#A3E635' },
  'Ultra Marathon': { primary: '#F472B6', secondary: '#EC4899', dot: '#F472B6' },
  'default': { primary: '#4ADE80', secondary: '#22C55E', dot: '#4ADE80' },
};

const getRaceColors = (race) => {
  return raceTypeColors[race.sport_category] || raceTypeColors['default'];
};

const ModernRaceCard = ({ race, onPress, isPastUncompleted, isCompleted, completionData, onMarkComplete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();
  const { useMetric } = useSettings();
  const { t } = useLanguage();
  const raceColors = getRaceColors(race);

  const handlePressIn = () => {
    haptic.light();
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[
          styles.modernCard,
          { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          SHADOWS.md,
        ]}>
          <View style={styles.cardLeftAccent}>
            <LinearGradient
              colors={[raceColors.primary, raceColors.secondary]}
              style={styles.accentBar}
            />
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleSection}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {race.name}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.sportBadge, { color: raceColors.primary }]}>
                    {race.sport_category || t('raceSingular')}
                  </Text>
                  <Text style={[styles.metaDot, { color: colors.textTertiary }]}>•</Text>
                  <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    {formatDate(race.date)}
                  </Text>
                </View>
              </View>
              <View style={[styles.distanceBadge, { backgroundColor: raceColors.primary + '15' }]}>
                <Text style={[styles.distanceText, { color: raceColors.primary }]}>
                  {getDisplayDistance(race, useMetric)}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textTertiary} style={styles.locationIcon} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {race.city}, {race.country}
                </Text>
              </View>
              
              {isPastUncompleted ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onMarkComplete}
                >
                  <LinearGradient
                    colors={GRADIENTS.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>{t('completeAction')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : isCompleted ? (
                <View style={styles.completedChip}>
                  <Text style={styles.completedIcon}>✓</Text>
                  <Text style={styles.completedText}>{t('done')}</Text>
                </View>
              ) : null}
            </View>

            {isCompleted && completionData && (completionData.completion_time || completionData.position) && (
              <View style={[styles.completionInfo, { borderTopColor: colors.border }]}>
                {completionData.completion_time && (
                  <View style={styles.completionStat}>
                    <Text style={[styles.completionLabel, { color: colors.textTertiary }]}>{t('time')}</Text>
                    <Text style={[styles.completionValue, { color: colors.text }]}>
                      {completionData.completion_time}
                    </Text>
                  </View>
                )}
                {completionData.position && (
                  <View style={styles.completionStat}>
                    <Text style={[styles.completionLabel, { color: colors.textTertiary }]}>{t('pos')}</Text>
                    <Text style={[styles.completionValue, { color: colors.text }]}>
                      #{completionData.position}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CalendarScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, token, refreshUser } = useAuth();
  const { races, fetchRaces } = useAppStore();
  const { t } = useLanguage();
  
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [completionDataMap, setCompletionDataMap] = useState({});

  const fetchCompletionData = useCallback(async () => {
    const completedRaces = user?.completedRaces || user?.completed_races || [];
    if (!token || !user?.id || !completedRaces.length) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/completions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const completions = await response.json();
        const dataMap = {};
        completions.forEach(c => {
          dataMap[c.race_id.toString()] = c;
        });
        setCompletionDataMap(dataMap);
      }
    } catch (error) {
      console.error('Error fetching completion data:', error);
    }
  }, [token, user?.id, user?.completedRaces, user?.completed_races]);

  useEffect(() => {
    fetchCompletionData();
  }, [fetchCompletionData]);

  // Normalize to strings for consistent comparison with race.id.toString()
  const joinedRaceIds = (user?.joinedRaces || user?.joined_races || []).map(String);
  const completedRaceIds = (user?.completedRaces || user?.completed_races || []).map(String);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const upcomingRaces = useMemo(() => {
    const todayDate = new Date(todayTimestamp);
    return races
      .filter((race) => {
        const isUpcoming = new Date(race.date) >= todayDate;
        const isJoined = joinedRaceIds.includes(race.id.toString());
        return isUpcoming && isJoined;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [races, joinedRaceIds, todayTimestamp]);
  
  const completedRaces = useMemo(() => {
    const todayDate = new Date(todayTimestamp);
    return races
      .filter((race) => {
        const isPast = new Date(race.date) < todayDate;
        const isCompleted = completedRaceIds.includes(race.id.toString());
        return isPast && isCompleted;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [races, completedRaceIds, todayTimestamp]);
  
  const pastUncompletedRaces = useMemo(() => {
    const todayDate = new Date(todayTimestamp);
    return races
      .filter((race) => {
        const isPast = new Date(race.date) < todayDate;
        const isJoined = joinedRaceIds.includes(race.id.toString());
        const isCompleted = completedRaceIds.includes(race.id.toString());
        return isPast && isJoined && !isCompleted;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [races, joinedRaceIds, completedRaceIds, todayTimestamp]);

  const markedDates = useMemo(() => {
    const dates = {};
    
    [...upcomingRaces, ...completedRaces, ...pastUncompletedRaces].forEach((race) => {
      const raceColors = getRaceColors(race);
      dates[race.date] = {
        marked: true,
        dotColor: raceColors.dot,
      };
    });

    if (selectedDate) {
      dates[selectedDate] = {
        ...dates[selectedDate],
        selected: true,
        selectedColor: '#4ADE80',
      };
    }
    
    return dates;
  }, [upcomingRaces, completedRaces, pastUncompletedRaces, selectedDate]);

  const handleDayPress = (day) => {
    haptic.selection();
    setSelectedDate(day.dateString);
  };

  const sections = useMemo(() => {
    const result = [];
    
    if (!selectedDate) {
      if (upcomingRaces.length > 0) {
        result.push({ title: t('upcoming'), data: upcomingRaces, type: 'upcoming' });
      }
      if (pastUncompletedRaces.length > 0) {
        result.push({ title: t('markComplete'), data: pastUncompletedRaces, type: 'pending' });
      }
      if (completedRaces.length > 0) {
        result.push({ title: t('completed'), data: completedRaces, type: 'completed' });
      }
    } else {
      const filteredRaces = [...upcomingRaces, ...pastUncompletedRaces, ...completedRaces]
        .filter((race) => race.date === selectedDate);
      if (filteredRaces.length > 0) {
        const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
        result.push({ title: formattedDate, data: filteredRaces, type: 'filtered' });
      }
    }
    
    return result;
  }, [selectedDate, upcomingRaces, pastUncompletedRaces, completedRaces]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRaces(),
      refreshUser(),
      fetchCompletionData(),
    ]);
    setRefreshing(false);
  };

  const handleMarkComplete = (race) => {
    navigation.navigate('RaceDetail', { raceId: race.id, openCompletionModal: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B0F1A' : colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0B0F1A', '#1E293B'] : [colors.background, colors.surface]}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('calendar')}</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
              onPress={() => { haptic.selection(); setViewMode('calendar'); }}
            >
              {viewMode === 'calendar' ? (
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.toggleButtonGradient}
                >
                  <Text style={styles.toggleTextActive}>▣</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}>▣</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => { haptic.selection(); setViewMode('list'); }}
            >
              {viewMode === 'list' ? (
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.toggleButtonGradient}
                >
                  <Text style={styles.toggleTextActive}>≡</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}>≡</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'calendar' && (
          <View style={[
            styles.calendarContainer, 
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            Platform.OS === 'ios' ? SHADOWS.lg : styles.androidCalendarShadow,
          ]}>
            <Calendar
              firstDay={1}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                calendarBackground: isDark ? '#1E293B' : '#FFFFFF',
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: '#4ADE80',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#4ADE80',
                todayBackgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.1)',
                dayTextColor: colors.text,
                textDisabledColor: colors.textTertiary,
                dotColor: '#4ADE80',
                selectedDotColor: '#FFFFFF',
                arrowColor: '#4ADE80',
                monthTextColor: colors.text,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />
            
            {selectedDate && (
              <TouchableOpacity 
                style={[styles.clearButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                onPress={() => { haptic.selection(); setSelectedDate(''); }}
              >
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                  {t('showAllRaces')}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.legendContainer}>
              {[
                { color: '#4ADE80', label: t('running') },
                { color: '#38BDF8', label: t('tri') },
                { color: '#A78BFA', label: t('cycling') },
                { color: '#FB923C', label: t('fitness') },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const raceDate = new Date(item.date);
            raceDate.setHours(0, 0, 0, 0);
            const isPastRace = raceDate < today;
            const isJoined = joinedRaceIds.includes(item.id.toString());
            const isCompleted = completedRaceIds.includes(item.id.toString());
            const isPastUncompleted = isPastRace && isJoined && !isCompleted;
            const completionData = completionDataMap[item.id.toString()];
            
            return (
              <ModernRaceCard
                race={item}
                onPress={() => navigation.navigate('RaceDetail', { raceId: item.id })}
                isPastUncompleted={isPastUncompleted}
                isCompleted={isCompleted}
                completionData={completionData}
                onMarkComplete={() => handleMarkComplete(item)}
              />
            );
          }}
          renderSectionHeader={({ section: { title, type, data } }) => (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
              <View style={[
                styles.sectionBadge, 
                { backgroundColor: type === 'upcoming' ? '#4ADE80' : type === 'pending' ? '#FBBF24' : '#38BDF8' }
              ]}>
                <Text style={styles.sectionBadgeText}>{data.length}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}>
                <Text style={styles.emptyIconText}>▣</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {selectedDate ? t('noRacesOnThisDate') : t('noRacesYet')}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {selectedDate
                  ? t('trySelectingDifferentDate')
                  : t('discoverAndJoinRaces')}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4ADE80"
            />
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  toggleButtonActive: {},
  toggleButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleTextActive: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  calendarContainer: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'visible',
  },
  androidCalendarShadow: {
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  calendar: {
    borderRadius: BORDER_RADIUS.xl,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 100,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyIconText: {
    fontSize: 28,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  cardContainer: {
    marginBottom: SPACING.md,
  },
  modernCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  cardLeftAccent: {
    width: 4,
  },
  accentBar: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 8,
  },
  cardDate: {
    fontSize: 12,
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 10,
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  completedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  completedIcon: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  completedText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },
  completionInfo: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xl,
  },
  completionStat: {
    alignItems: 'center',
  },
  completionLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
