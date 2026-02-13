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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompactRaceCard } from '../components/CompactRaceCard';
import { FilterChipButton } from '../components/FilterChipButton';
import { ActiveFiltersBar } from '../components/ActiveFiltersBar';
import { DateFilterModal } from '../components/DateFilterModal';
import { FilterSelectModal } from '../components/FilterSelectModal';
import { DropdownFilter } from '../components/DropdownFilter';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import API_URL from '../config/api';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SPORTS, CONTINENTS, COUNTRIES, COUNTRY_TO_CONTINENT } from '../constants/theme';
import { SPORT_TAXONOMY, SPORT_CATEGORIES, normalizeLegacySport, formatSportDisplay } from '../constants/sportTaxonomy';

export const DiscoverScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { races, addRace, fetchRaces } = useAppStore();
  const { token } = useAuth();
  const { t } = useLanguage();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [dateFilterOption, setDateFilterOption] = useState(null);
  const [dateFilterMonth, setDateFilterMonth] = useState(null);
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showSubtypeModal, setShowSubtypeModal] = useState(false);
  const [showContinentModal, setShowContinentModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return races.filter((race) => {
      const raceDate = new Date(race.date);
      if (raceDate < today) return false;
      
      if (dateFilterOption && dateFilterOption.days) {
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + dateFilterOption.days);
        if (raceDate > maxDate) return false;
      }
      
      if (dateFilterMonth) {
        const raceMonth = raceDate.getMonth();
        if (raceMonth !== dateFilterMonth.month) return false;
      }
      
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
  }, [races, selectedCategory, selectedSubtype, selectedContinent, selectedCountry, searchQuery, dateFilterOption, dateFilterMonth]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (dateFilterOption) {
      filters.push({ type: 'date', label: dateFilterOption.label });
    }
    if (dateFilterMonth) {
      filters.push({ type: 'month', label: dateFilterMonth.label });
    }
    if (selectedCategory) {
      filters.push({ type: 'category', label: `${SPORT_TAXONOMY[selectedCategory]?.icon || ''} ${selectedCategory}` });
    }
    if (selectedSubtype) {
      filters.push({ type: 'subtype', label: selectedSubtype });
    }
    if (selectedContinent) {
      filters.push({ type: 'continent', label: selectedContinent });
    }
    if (selectedCountry) {
      filters.push({ type: 'country', label: selectedCountry });
    }
    if (searchQuery) {
      filters.push({ type: 'search', label: `${t('city')}: ${searchQuery}` });
    }
    return filters;
  }, [dateFilterOption, dateFilterMonth, selectedCategory, selectedSubtype, selectedContinent, selectedCountry, searchQuery]);

  const handleRemoveFilter = (filterType) => {
    switch (filterType) {
      case 'date':
        setDateFilterOption(null);
        break;
      case 'month':
        setDateFilterMonth(null);
        break;
      case 'category':
        setSelectedCategory(null);
        setSelectedSubtype(null);
        break;
      case 'subtype':
        setSelectedSubtype(null);
        break;
      case 'continent':
        setSelectedContinent(null);
        setSelectedCountry(null);
        break;
      case 'country':
        setSelectedCountry(null);
        break;
      case 'search':
        setSearchQuery('');
        break;
    }
  };

  const handleAddRace = async () => {
    if (!newRace.name.trim() || !newRace.sport_category || !newRace.sport_subtype || !newRace.date) {
      Alert.alert(t('error'), t('fillRequiredFields'));
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

      Alert.alert(t('raceSubmittedTitle'), createdRace.message || 'Race submitted successfully! Waiting for admin approval to avoid duplicates.');
      
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
      Alert.alert(t('error'), error.message || t('failedToCreateRace'));
    }
  };

  const handleContinentSelect = (continent) => {
    setSelectedContinent(continent);
    if (selectedCountry && continent && COUNTRY_TO_CONTINENT[selectedCountry] !== continent) {
      setSelectedCountry(null);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubtype(null);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubtype(null);
    setSelectedContinent(null);
    setSelectedCountry(null);
    setSearchQuery('');
    setDateFilterOption(null);
    setDateFilterMonth(null);
  };

  const hasFilters = selectedCategory || selectedSubtype || selectedContinent || selectedCountry || searchQuery || dateFilterOption || dateFilterMonth;

  const getDateChipValue = () => {
    if (dateFilterMonth) return dateFilterMonth.label;
    if (dateFilterOption) return dateFilterOption.label;
    return null;
  };

  const getSportChipValue = () => {
    if (selectedSubtype) return selectedSubtype;
    if (selectedCategory) return selectedCategory;
    return null;
  };

  const getLocationChipValue = () => {
    if (selectedCountry) return selectedCountry;
    if (selectedContinent) return selectedContinent;
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('discoverRaces')}</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('searchRaces')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
        <FilterChipButton
          label={t('dateFilter')}
          icon="📅"
          value={getDateChipValue()}
          onPress={() => setShowDateModal(true)}
          isActive={!!dateFilterOption || !!dateFilterMonth}
        />
        <FilterChipButton
          label={t('sport')}
          icon="🏃"
          value={getSportChipValue()}
          onPress={() => setShowSportModal(true)}
          isActive={!!selectedCategory}
        />
        <FilterChipButton
          label={t('location')}
          icon="🌍"
          value={getLocationChipValue()}
          onPress={() => setShowContinentModal(true)}
          isActive={!!selectedContinent || !!selectedCountry}
        />
      </ScrollView>

      <ActiveFiltersBar 
        filters={activeFilters}
        onRemove={handleRemoveFilter}
        onClearAll={clearFilters}
      />

      <DateFilterModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        selectedOption={dateFilterOption}
        selectedMonth={dateFilterMonth}
        onSelectOption={setDateFilterOption}
        onSelectMonth={setDateFilterMonth}
      />

      <FilterSelectModal
        visible={showSportModal}
        onClose={() => setShowSportModal(false)}
        title={t('sportCategoryLabel')}
        options={SPORT_CATEGORIES}
        selectedValue={selectedCategory}
        onSelect={(value) => {
          handleCategorySelect(value);
          if (value) {
            setTimeout(() => setShowSubtypeModal(true), 300);
          }
        }}
        renderOption={(value) => `${SPORT_TAXONOMY[value]?.icon || ''} ${value}`}
      />

      <FilterSelectModal
        visible={showSubtypeModal}
        onClose={() => setShowSubtypeModal(false)}
        title={t('distanceType')}
        options={selectedCategory ? SPORT_TAXONOMY[selectedCategory].subtypes : []}
        selectedValue={selectedSubtype}
        onSelect={setSelectedSubtype}
      />

      <FilterSelectModal
        visible={showContinentModal}
        onClose={() => setShowContinentModal(false)}
        title={t('continent')}
        options={CONTINENTS}
        selectedValue={selectedContinent}
        onSelect={(value) => {
          handleContinentSelect(value);
          if (value) {
            setTimeout(() => setShowCountryModal(true), 300);
          }
        }}
      />

      <FilterSelectModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        title={t('country')}
        options={filteredCountries}
        selectedValue={selectedCountry}
        onSelect={setSelectedCountry}
        searchable={true}
      />

      <Modal
        visible={showAddForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddForm(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('addNewRace')}</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
            <Text style={[styles.label, { color: colors.text }]}>{t('raceName')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('raceNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newRace.name}
              onChangeText={(text) => setNewRace({ ...newRace, name: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('sportCategoryLabel')} *</Text>
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
                <Text style={[styles.label, { color: colors.text }]}>{t('distanceType')} *</Text>
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

            <Text style={[styles.label, { color: colors.text }]}>{t('dateFormatLabel')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="2025-12-31"
              placeholderTextColor={colors.textSecondary}
              value={newRace.date}
              onChangeText={(text) => setNewRace({ ...newRace, date: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('city')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('cityPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newRace.city}
              onChangeText={(text) => setNewRace({ ...newRace, city: text })}
            />

            <DropdownFilter
              title={t('continentOptional')}
              options={CONTINENTS}
              selectedValue={newRace.continent}
              onSelect={(value) => setNewRace({ ...newRace, continent: value })}
            />

            <DropdownFilter
              title={t('country')}
              options={formFilteredCountries}
              selectedValue={newRace.country}
              onSelect={(value) => setNewRace({ ...newRace, country: value })}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('distanceOptional')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('distancePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newRace.distance}
              onChangeText={(text) => setNewRace({ ...newRace, distance: text })}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('descriptionOptional')}</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('tellUsAboutRace')}
              placeholderTextColor={colors.textSecondary}
              value={newRace.description}
              onChangeText={(text) => setNewRace({ ...newRace, description: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAddRace}
            >
              <Text style={styles.submitButtonText}>{t('submitRace')}</Text>
            </TouchableOpacity>
            
            <View style={{ height: 50 }} />
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <View style={styles.resultsSection}>
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {filteredRaces.length} {filteredRaces.length === 1 ? t('raceSingular') : t('racePlural')} {t('found')}
        </Text>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  chipsRow: {
    marginTop: SPACING.sm,
    maxHeight: 50,
  },
  chipsContent: {
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  resultsSection: {
    flex: 1,
    paddingTop: SPACING.sm,
  },
  resultCount: {
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sportPicker: {
    marginBottom: SPACING.xs,
  },
  sportOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  sportText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
});
