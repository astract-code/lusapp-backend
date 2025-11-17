import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompactRaceCard } from '../components/CompactRaceCard';
import { FilterChip } from '../components/FilterChip';
import { DropdownFilter } from '../components/DropdownFilter';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SPORTS, CONTINENTS, COUNTRIES, COUNTRY_TO_CONTINENT } from '../constants/theme';
import { SPORT_TAXONOMY, SPORT_CATEGORIES, normalizeLegacySport, formatSportDisplay } from '../constants/sportTaxonomy';

export const DiscoverScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { races, addRace, fetchRaces } = useAppStore();
  const { token } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [newRace, setNewRace] = useState({
    name: '',
    sport: '',
    sport_category: '',
    sport_subtype: '',
    city: '',
    country: '',
    continent: '',
    date: '',
    distance: '',
    description: '',
    participants: '',
  });

  const filteredCountries = useMemo(() => {
    if (!selectedContinent) return COUNTRIES;
    return COUNTRIES.filter(country => COUNTRY_TO_CONTINENT[country] === selectedContinent);
  }, [selectedContinent]);

  const formFilteredCountries = useMemo(() => {
    if (!newRace.continent) return COUNTRIES;
    return COUNTRIES.filter(country => COUNTRY_TO_CONTINENT[country] === newRace.continent);
  }, [newRace.continent]);

  const filteredRaces = useMemo(() => {
    return races.filter((race) => {
      if (selectedCategory || selectedSubtype) {
        const raceCategory = race.sport_category || normalizeLegacySport(race.sport).category;
        const raceSubtype = race.sport_subtype || normalizeLegacySport(race.sport).subtype;
        
        if (selectedCategory && raceCategory !== selectedCategory) return false;
        if (selectedSubtype && raceSubtype !== selectedSubtype) return false;
      }
      if (selectedContinent && race.continent !== selectedContinent) return false;
      if (selectedCountry && race.country !== selectedCountry) return false;
      if (searchQuery && !race.city?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [races, selectedCategory, selectedSubtype, selectedContinent, selectedCountry, searchQuery]);


  const handleAddRace = async () => {
    if (!newRace.name.trim() || !newRace.sport_category || !newRace.sport_subtype || !newRace.date) {
      Alert.alert('Error', 'Please fill in at least Name, Sport Category, Distance/Type, and Date');
      return;
    }

    try {
      const displaySport = formatSportDisplay(newRace.sport_category, newRace.sport_subtype);

      const raceData = {
        name: newRace.name,
        sport: displaySport,
        sport_category: newRace.sport_category,
        sport_subtype: newRace.sport_subtype,
        city: newRace.city || 'TBD',
        country: newRace.country || 'TBD',
        continent: newRace.continent || 'Other',
        date: newRace.date,
        start_time: null,
        distance: newRace.distance || 'TBD',
        description: newRace.description || '',
        participants: parseInt(newRace.participants) || 0,
      };

      console.log('[RACE CREATE] Sending to backend:', raceData);

      const response = await fetch(`${API_URL}/api/races/user-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(raceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create race');
      }

      const createdRace = await response.json();
      console.log('[RACE CREATE] Success:', createdRace);

      Alert.alert('Race Submitted!', createdRace.message || 'Race submitted successfully! Waiting for admin approval to avoid duplicates.');
      
      setNewRace({
        name: '',
        sport: '',
        sport_category: '',
        sport_subtype: '',
        city: '',
        country: '',
        continent: '',
        date: '',
        distance: '',
        description: '',
        participants: '',
      });
      setShowAddForm(false);

      fetchRaces();
    } catch (error) {
      console.error('[RACE CREATE] Error:', error);
      Alert.alert('Error', error.message || 'Failed to create race. Please try again.');
    }
  };

  const handleContinentSelect = (continent) => {
    const newContinent = selectedContinent === continent ? null : continent;
    setSelectedContinent(newContinent);
    
    if (selectedCountry && newContinent && COUNTRY_TO_CONTINENT[selectedCountry] !== newContinent) {
      setSelectedCountry(null);
    }
  };

  const handleCategorySelect = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setSelectedSubtype(null);
    } else {
      setSelectedCategory(category);
      setSelectedSubtype(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubtype(null);
    setSelectedContinent(null);
    setSelectedCountry(null);
    setSearchQuery('');
  };

  const hasFilters = selectedCategory || selectedSubtype || selectedContinent || selectedCountry || searchQuery;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Discover Races</Text>
        <View style={styles.headerButtons}>
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.headerButton}>
              <Text style={[styles.clearButton, { color: colors.primary }]}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Race</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Race Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., Boston Marathon"
              placeholderTextColor={colors.textSecondary}
              value={newRace.name}
              onChangeText={(text) => setNewRace({ ...newRace, name: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>Sport Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportPicker}>
              {SPORT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.sportOption,
                    { backgroundColor: newRace.sport_category === category ? colors.primary : colors.card, borderColor: colors.border }
                  ]}
                  onPress={() => setNewRace({ ...newRace, sport_category: category, sport_subtype: '' })}
                >
                  <Text style={[styles.sportText, { color: newRace.sport_category === category ? '#FFF' : colors.text }]}>
                    {SPORT_TAXONOMY[category].icon} {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {newRace.sport_category && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Distance / Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportPicker}>
                  {SPORT_TAXONOMY[newRace.sport_category].subtypes.map((subtype) => (
                    <TouchableOpacity
                      key={subtype}
                      style={[
                        styles.sportOption,
                        { backgroundColor: newRace.sport_subtype === subtype ? colors.primary : colors.card, borderColor: colors.border }
                      ]}
                      onPress={() => setNewRace({ ...newRace, sport_subtype: subtype })}
                    >
                      <Text style={[styles.sportText, { color: newRace.sport_subtype === subtype ? '#FFF' : colors.text }]}>
                        {subtype}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="2025-12-31"
              placeholderTextColor={colors.textSecondary}
              value={newRace.date}
              onChangeText={(text) => setNewRace({ ...newRace, date: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., Boston"
              placeholderTextColor={colors.textSecondary}
              value={newRace.city}
              onChangeText={(text) => setNewRace({ ...newRace, city: text })}
            />

            <DropdownFilter
              title="Continent (optional - helps filter countries)"
              options={CONTINENTS}
              selectedValue={newRace.continent}
              onSelect={(value) => setNewRace({ ...newRace, continent: value })}
            />

            <DropdownFilter
              title="Country"
              options={formFilteredCountries}
              selectedValue={newRace.country}
              onSelect={(value) => setNewRace({ ...newRace, country: value })}
            />

            <Text style={[styles.label, { color: colors.text }]}>Distance</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 42.2 km"
              placeholderTextColor={colors.textSecondary}
              value={newRace.distance}
              onChangeText={(text) => setNewRace({ ...newRace, distance: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>Participants</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 30000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={newRace.participants}
              onChangeText={(text) => setNewRace({ ...newRace, participants: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Describe the race..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              value={newRace.description}
              onChangeText={(text) => setNewRace({ ...newRace, description: text })}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAddRace}
            >
              <Text style={styles.submitButtonText}>Add Race</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <View style={styles.filtersSection}>
        <ScrollView
          style={styles.filters}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <Text style={[styles.filterLabel, { color: colors.text }]}>🔍 Search by City</Text>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., Tokyo, Paris, New York..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <DropdownFilter
            title="Sport Category"
            options={SPORT_CATEGORIES}
            selectedValue={selectedCategory}
            onSelect={handleCategorySelect}
            renderOption={(value) => 
              value === 'All' ? value : `${SPORT_TAXONOMY[value]?.icon || ''} ${value}`
            }
          />

          {selectedCategory && (
            <DropdownFilter
              title="Distance / Type"
              options={SPORT_TAXONOMY[selectedCategory].subtypes}
              selectedValue={selectedSubtype}
              onSelect={(value) => setSelectedSubtype(value)}
            />
          )}

          <DropdownFilter
            title="Continent"
            options={CONTINENTS}
            selectedValue={selectedContinent}
            onSelect={handleContinentSelect}
          />

          {selectedContinent && (
            <DropdownFilter
              title="Country"
              options={filteredCountries}
              selectedValue={selectedCountry}
              onSelect={(value) => setSelectedCountry(value)}
            />
          )}
        </ScrollView>
      </View>

      <View style={styles.resultsSection}>
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
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
              {filteredRaces.length} {filteredRaces.length === 1 ? 'race' : 'races'} found
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchRaces();
                setRefreshing(false);
              }}
              tintColor={colors.primary}
            />
          }
        />
      </View>
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
  filtersSection: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  filters: {
    flex: 1,
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  resultsSection: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
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
