import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const FilterSelectModal = ({ 
  visible, 
  onClose, 
  title,
  options,
  selectedValue,
  onSelect,
  renderOption,
  searchable = false,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt => 
      opt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, searchable]);

  const handleSelect = (value) => {
    onSelect(selectedValue === value ? null : value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {searchable && (
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search..."
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
        )}

        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {filteredOptions.map((option, index) => {
            const isSelected = selectedValue === option;
            const displayText = renderOption ? renderOption(option) : option;
            
            return (
              <TouchableOpacity
                key={`${option}-${index}`}
                style={[
                  styles.option,
                  { 
                    backgroundColor: isSelected ? colors.primary + '20' : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => handleSelect(option)}
              >
                <Text 
                  style={[
                    styles.optionText, 
                    { color: isSelected ? colors.primary : colors.text }
                  ]}
                >
                  {displayText}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedValue && (
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.border }]}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
              Clear Selection
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  optionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  clearButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  clearButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
});

export default FilterSelectModal;
