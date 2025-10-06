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
} from 'react-native';
import { RaceCard } from '../components/RaceCard';
import { FilterChip } from '../components/FilterChip';
import { useAppStore } from '../context/AppContext';
import { fetchCSVFromURL, parseCSV } from '../utils/csvImporter';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SPORTS, CONTINENTS } from '../constants/theme';

export const DiscoverScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;
  const { races, addRace } = useAppStore();
  
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [csvUrl, setCsvUrl] = useState('');

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

  const handleImportCSV = async () => {
    if (!csvUrl.trim()) {
      Alert.alert('Error', 'Please enter a CSV URL');
      return;
    }

    try {
      const importedRaces = await fetchCSVFromURL(csvUrl);
      importedRaces.forEach((race) => addRace(race));
      Alert.alert('Success', `Imported ${importedRaces.length} races!`);
      setCsvUrl('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const clearFilters = () => {
    setSelectedSport(null);
    setSelectedContinent(null);
    setSelectedCountry(null);
  };

  const hasFilters = selectedSport || selectedContinent || selectedCountry;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Discover Races</Text>
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={[styles.clearButton, { color: theme.primary }]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.csvImport}>
        <TextInput
          style={[styles.csvInput, { 
            backgroundColor: theme.card, 
            color: theme.text,
            borderColor: theme.border 
          }]}
          placeholder="Enter CSV URL to import races..."
          placeholderTextColor={theme.textSecondary}
          value={csvUrl}
          onChangeText={setCsvUrl}
        />
        <TouchableOpacity
          style={[styles.importButton, { backgroundColor: theme.primary }]}
          onPress={handleImportCSV}
        >
          <Text style={styles.importButtonText}>Import</Text>
        </TouchableOpacity>
      </View>

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
    </View>
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
  clearButton: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  csvImport: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  csvInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
  },
  importButton: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
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
