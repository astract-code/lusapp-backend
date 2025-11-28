import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { CompactRaceCard } from '../components/CompactRaceCard';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { API_BASE_URL } from '../config/api';

export const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, token, refreshUser } = useAuth();
  const { races, fetchRaces } = useAppStore();
  
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [completionDataMap, setCompletionDataMap] = useState({});

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

  // Filter to only show races the user has joined
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
  upcomingRaces.forEach((race) => {
    markedDates[race.date] = {
      marked: true,
      dotColor: colors.primary,
    };
  });

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };
  }

  const sections = [];
  
  if (!selectedDate) {
    if (upcomingRaces.length > 0) {
      sections.push({ title: 'Upcoming Races', data: upcomingRaces });
    }
    if (pastUncompletedRaces.length > 0) {
      sections.push({ title: 'Past Races (Not Marked Complete)', data: pastUncompletedRaces });
    }
    if (completedRaces.length > 0) {
      sections.push({ title: 'Completed Races', data: completedRaces });
    }
  } else {
    const filteredRaces = [...upcomingRaces, ...pastUncompletedRaces, ...completedRaces]
      .filter((race) => race.date === selectedDate);
    if (filteredRaces.length > 0) {
      sections.push({ title: 'Races on ' + selectedDate, data: filteredRaces });
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
        <Text style={[styles.title, { color: colors.text }]}>Race Calendar</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'calendar' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setViewMode('calendar')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: viewMode === 'calendar' ? '#FFFFFF' : colors.text },
              ]}
            >
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: viewMode === 'list' ? '#FFFFFF' : colors.text },
              ]}
            >
              List
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'calendar' && (
        <Calendar
          firstDay={1}
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textSecondary,
            dotColor: colors.primary,
            selectedDotColor: '#FFFFFF',
            arrowColor: colors.primary,
            monthTextColor: colors.text,
          }}
          style={[styles.calendar, { backgroundColor: colors.card }]}
        />
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
            <CompactRaceCard
              race={item}
              onPress={() => navigation.navigate('RaceDetail', { raceId: item.id })}
              isPastUncompleted={isPastUncompleted}
              isCompleted={isCompleted}
              completionData={completionData}
              onMarkComplete={() => handleMarkComplete(item)}
            />
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {selectedDate
              ? 'No registered races on this date'
              : 'No registered races. Go to Discover to find races!'}
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
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
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
  },
  toggleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.xs,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  calendar: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 2,
  },
  list: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
});
