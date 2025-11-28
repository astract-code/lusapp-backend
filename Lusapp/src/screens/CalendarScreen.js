import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList, 
  TouchableOpacity, 
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { API_BASE_URL } from '../config/api';
import { getDisplayDistance } from '../utils/distanceHelper';
import haptic from '../utils/haptics';

const raceTypeColors = {
  'Running': { primary: '#10B981', secondary: '#059669', dot: '#10B981' },
  'Marathon': { primary: '#10B981', secondary: '#059669', dot: '#10B981' },
  'Triathlon': { primary: '#3B82F6', secondary: '#2563EB', dot: '#3B82F6' },
  'Cycling': { primary: '#8B5CF6', secondary: '#7C3AED', dot: '#8B5CF6' },
  'Swimming': { primary: '#06B6D4', secondary: '#0891B2', dot: '#06B6D4' },
  'Fitness': { primary: '#F59E0B', secondary: '#D97706', dot: '#F59E0B' },
  'HYROX': { primary: '#EF4444', secondary: '#DC2626', dot: '#EF4444' },
  'Trail Running': { primary: '#84CC16', secondary: '#65A30D', dot: '#84CC16' },
  'Ultra Marathon': { primary: '#EC4899', secondary: '#DB2777', dot: '#EC4899' },
  'default': { primary: '#10B981', secondary: '#059669', dot: '#10B981' },
};

const getRaceColors = (race) => {
  return raceTypeColors[race.sport_category] || raceTypeColors['default'];
};

const ModernRaceCard = ({ race, onPress, isPastUncompleted, isCompleted, completionData, onMarkComplete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colors = getRaceColors(race);

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
    return date.toLocaleDateString('en-US', { 
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
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.glassOverlay}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleSection}>
                <Text style={styles.cardTitle} numberOfLines={1}>{race.name}</Text>
                <Text style={styles.cardSubtitle}>{race.sport_category || 'Race'}</Text>
              </View>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{getDisplayDistance(race)}</Text>
              </View>
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{race.city}, {race.country}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>{formatDate(race.date)}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              {race.participants > 0 && (
                <Text style={styles.participants}>👥 {race.participants} athletes</Text>
              )}
              
              {isPastUncompleted ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onMarkComplete}
                >
                  <Text style={styles.actionButtonText}>Mark Complete</Text>
                </TouchableOpacity>
              ) : isCompleted ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Completed</Text>
                </View>
              ) : null}
            </View>

            {isCompleted && completionData && (
              <View style={styles.completionInfo}>
                {completionData.completion_time && (
                  <View style={styles.completionStat}>
                    <Text style={styles.completionLabel}>Time</Text>
                    <Text style={styles.completionValue}>{completionData.completion_time}</Text>
                  </View>
                )}
                {completionData.position && (
                  <View style={styles.completionStat}>
                    <Text style={styles.completionLabel}>Position</Text>
                    <Text style={styles.completionValue}>#{completionData.position}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, token, refreshUser } = useAuth();
  const { races, fetchRaces } = useAppStore();
  
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [completionDataMap, setCompletionDataMap] = useState({});
  const selectionAnim = useRef(new Animated.Value(0)).current;

  const fetchCompletionData = useCallback(async () => {
    if (!token || !user?.id || !user?.completed_races?.length) return;
    
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
  }, [token, user?.id, user?.completed_races]);

  useEffect(() => {
    fetchCompletionData();
  }, [fetchCompletionData]);

  const joinedRaceIds = user?.joined_races || [];
  const completedRaceIds = user?.completed_races || [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingRaces = races
    .filter((race) => {
      const isUpcoming = new Date(race.date) >= today;
      const isJoined = joinedRaceIds.includes(race.id.toString());
      return isUpcoming && isJoined;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const completedRaces = races
    .filter((race) => {
      const isPast = new Date(race.date) < today;
      const isCompleted = completedRaceIds.includes(race.id.toString());
      return isPast && isCompleted;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const pastUncompletedRaces = races
    .filter((race) => {
      const isPast = new Date(race.date) < today;
      const isJoined = joinedRaceIds.includes(race.id.toString());
      const isCompleted = completedRaceIds.includes(race.id.toString());
      return isPast && isJoined && !isCompleted;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const markedDates = {};
  
  [...upcomingRaces, ...completedRaces, ...pastUncompletedRaces].forEach((race) => {
    const raceColors = getRaceColors(race);
    markedDates[race.date] = {
      marked: true,
      dotColor: raceColors.dot,
    };
  });

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#10B981',
    };
  }

  const handleDayPress = (day) => {
    haptic.selection();
    Animated.sequence([
      Animated.timing(selectionAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(selectionAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedDate(day.dateString);
  };

  const sections = [];
  
  if (!selectedDate) {
    if (upcomingRaces.length > 0) {
      sections.push({ title: 'Upcoming Races', data: upcomingRaces, type: 'upcoming' });
    }
    if (pastUncompletedRaces.length > 0) {
      sections.push({ title: 'Needs Completion', data: pastUncompletedRaces, type: 'pending' });
    }
    if (completedRaces.length > 0) {
      sections.push({ title: 'Completed', data: completedRaces, type: 'completed' });
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
      sections.push({ title: formattedDate, data: filteredRaces, type: 'filtered' });
    }
  }

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Calendar</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'calendar' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'calendar' && styles.toggleTextActive,
            ]}>
              📅
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'list' && styles.toggleTextActive,
            ]}>
              📋
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'calendar' && (
        <View style={styles.calendarContainer}>
          <Calendar
            firstDay={1}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#10B981',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#10B981',
              todayBackgroundColor: '#10B98115',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              dotColor: '#10B981',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#10B981',
              monthTextColor: '#1F2937',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
          
          {selectedDate && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSelectedDate('')}
            >
              <Text style={styles.clearButtonText}>Show All Races</Text>
            </TouchableOpacity>
          )}

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Running</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Triathlon</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Fitness</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>Cycling</Text>
            </View>
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
        renderSectionHeader={({ section: { title, type } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {type === 'upcoming' && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{upcomingRaces.length}</Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>
              {selectedDate ? 'No races on this date' : 'No races yet'}
            </Text>
            <Text style={styles.emptyText}>
              {selectedDate
                ? 'Try selecting a different date'
                : 'Discover and join races to see them here!'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 18,
  },
  toggleTextActive: {
    color: '#10B981',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 16,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cardContainer: {
    marginBottom: 12,
  },
  gradientCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  distanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participants: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  completionInfo: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 24,
  },
  completionStat: {
    alignItems: 'center',
  },
  completionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  completionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
