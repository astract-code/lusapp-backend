import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RaceCard } from '../components/RaceCard';
import { FilterChip } from '../components/FilterChip';
import { useAppStore } from '../context/AppContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SPORTS, CONTINENTS } from '../constants/theme';

export const DiscoverScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;
  const { races, addRace } = useAppStore();
  
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newRace, setNewRace] = useState({
    name: '',
    sport: '',
    city: '',
    country: '',
    continent: '',
    date: '',
    distance: '',
    description: '',
    participants: '',
  });

  const filteredRaces = useMemo(() => {
    return races.filter((race) => {
      if (selectedSport && race.sport !== selectedSport) return false;
      if (selectedContinent && race.continent !== selectedContinent) return false;
      if (selectedCountry && race.country !== selectedCountry) return false;
      return true;
    });
  }, [races, selectedSport, selectedContinent, selectedCountry]);

  const countries = useMemo(() => {
    const countrySet = new Set(races.map((race) => race.country));
    return Array.from(countrySet).sort();
  }, [races]);

  const handleAddRace = () => {
    if (!newRace.name.trim() || !newRace.sport || !newRace.date) {
      Alert.alert('Error', 'Please fill in at least Name, Sport, and Date');
      return;
    }

    const race = {
      id: `race-${Date.now()}`,
      name: newRace.name,
      sport: newRace.sport,
      city: newRace.city || 'TBD',
      country: newRace.country || 'TBD',
      continent: newRace.continent || 'Other',
      date: newRace.date,
      distance: newRace.distance || 'TBD',
      description: newRace.description || '',
      participants: parseInt(newRace.participants) || 0,
      registeredUsers: [],
    };

    addRace(race);
    Alert.alert('Success', `Added ${newRace.name}!`);
    setNewRace({
      name: '',
      sport: '',
      city: '',
      country: '',
      continent: '',
      date: '',
      distance: '',
      description: '',
      participants: '',
    });
    setShowAddForm(false);
  };

  const clearFilters = () => {
    setSelectedSport(null);
    setSelectedContinent(null);
    setSelectedCountry(null);
  };

  const hasFilters = selectedSport || selectedContinent || selectedCountry;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Discover Races</Text>
        <View style={styles.headerButtons}>
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.headerButton}>
              <Text style={[styles.clearButton, { color: theme.primary }]}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Race</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showAddForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddForm(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Race</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Text style={[styles.modalClose, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>Race Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Boston Marathon"
              placeholderTextColor={theme.textSecondary}
              value={newRace.name}
              onChangeText={(text) => setNewRace({ ...newRace, name: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Sport *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportPicker}>
              {SPORTS.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportOption,
                    { backgroundColor: newRace.sport === sport.id ? theme.primary : theme.card, borderColor: theme.border }
                  ]}
                  onPress={() => setNewRace({ ...newRace, sport: sport.id })}
                >
                  <Text style={[styles.sportText, { color: newRace.sport === sport.id ? '#FFF' : theme.text }]}>
                    {sport.icon} {sport.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.text }]}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="2025-12-31"
              placeholderTextColor={theme.textSecondary}
              value={newRace.date}
              onChangeText={(text) => setNewRace({ ...newRace, date: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Boston"
              placeholderTextColor={theme.textSecondary}
              value={newRace.city}
              onChangeText={(text) => setNewRace({ ...newRace, city: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Country</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., USA"
              placeholderTextColor={theme.textSecondary}
              value={newRace.country}
              onChangeText={(text) => setNewRace({ ...newRace, country: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Continent</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportPicker}>
              {CONTINENTS.map((continent) => (
                <TouchableOpacity
                  key={continent}
                  style={[
                    styles.sportOption,
                    { backgroundColor: newRace.continent === continent ? theme.primary : theme.card, borderColor: theme.border }
                  ]}
                  onPress={() => setNewRace({ ...newRace, continent })}
                >
                  <Text style={[styles.sportText, { color: newRace.continent === continent ? '#FFF' : theme.text }]}>
                    {continent}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.text }]}>Distance</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., 42.2 km"
              placeholderTextColor={theme.textSecondary}
              value={newRace.distance}
              onChangeText={(text) => setNewRace({ ...newRace, distance: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Participants</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., 30000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={newRace.participants}
              onChangeText={(text) => setNewRace({ ...newRace, participants: text })}
            />

            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Describe the race..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={newRace.description}
              onChangeText={(text) => setNewRace({ ...newRace, description: text })}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleAddRace}
            >
              <Text style={styles.submitButtonText}>Add Race</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ScrollView
        style={styles.filters}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.filterLabel, { color: theme.text }]}>Sport</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {SPORTS.map((sport) => (
            <FilterChip
              key={sport.id}
              label={`${sport.icon} ${sport.name}`}
              selected={selectedSport === sport.id}
              onPress={() =>
                setSelectedSport(selectedSport === sport.id ? null : sport.id)
              }
            />
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { color: theme.text }]}>Continent</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {CONTINENTS.map((continent) => (
            <FilterChip
              key={continent}
              label={continent}
              selected={selectedContinent === continent}
              onPress={() =>
                setSelectedContinent(selectedContinent === continent ? null : continent)
              }
            />
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { color: theme.text }]}>Country</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {countries.map((country) => (
            <FilterChip
              key={country}
              label={country}
              selected={selectedCountry === country}
              onPress={() =>
                setSelectedCountry(selectedCountry === country ? null : country)
              }
            />
          ))}
        </ScrollView>
      </ScrollView>

      <FlatList
        data={filteredRaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RaceCard
            race={item}
            onPress={() => navigation.navigate('RaceDetail', { raceId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {filteredRaces.length} {filteredRaces.length === 1 ? 'race' : 'races'} found
          </Text>
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
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerButton: {
    marginRight: SPACING.xs,
  },
  clearButton: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sportPicker: {
    marginBottom: SPACING.sm,
  },
  sportOption: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  sportText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  filters: {
    maxHeight: 280,
    paddingHorizontal: SPACING.md,
  },
  filterLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterRow: {
    marginBottom: SPACING.sm,
  },
  list: {
    padding: SPACING.md,
  },
  resultCount: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
});
