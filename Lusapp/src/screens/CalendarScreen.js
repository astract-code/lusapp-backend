import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { CompactRaceCard } from '../components/CompactRaceCard';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const { races, fetchRaces } = useAppStore();
  
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filter to only show races the user has joined
  const joinedRaceIds = user?.joined_races || [];
  const upcomingRaces = races
    .filter((race) => {
      const isUpcoming = new Date(race.date) >= new Date();
      const isJoined = joinedRaceIds.includes(race.id.toString());
      return isUpcoming && isJoined;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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

  const filteredRaces = selectedDate
    ? upcomingRaces.filter((race) => race.date === selectedDate)
    : upcomingRaces;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRaces(),
      refreshUser(),
    ]);
    setRefreshing(false);
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

      <FlatList
        data={filteredRaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CompactRaceCard
            race={item}
            onPress={() => navigation.navigate('RaceDetail', { raceId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {selectedDate
              ? 'No registered races on this date'
              : 'No registered upcoming races. Go to Discover to find races!'}
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
});
