import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DropdownFilter = ({ 
  title, 
  options, 
  selectedValue, 
  onSelect, 
  icon = '▼',
  renderOption,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (value) => {
    onSelect(value);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
  };

  const displayValue = selectedValue || t('all');

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.header,
          { 
            backgroundColor: colors.card,
            borderColor: isExpanded ? colors.primary : colors.border,
          }
        ]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.selectedValue, { color: colors.text }]}>
            {renderOption ? renderOption(displayValue) : displayValue}
          </Text>
        </View>
        <Text style={[
          styles.arrow,
          { 
            color: colors.primary,
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }
        ]}>
          ▼
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.optionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView 
            style={styles.scrollView}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <TouchableOpacity
              style={[
                styles.option,
                selectedValue === null && styles.selectedOption,
                { borderBottomColor: colors.border }
              ]}
              onPress={() => handleSelect(null)}
            >
              <Text style={[
                styles.optionText,
                { color: selectedValue === null ? colors.primary : colors.text }
              ]}>
                {t('all')}
              </Text>
              {selectedValue === null && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>

            {options.map((option, index) => {
              const isSelected = selectedValue === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    isSelected && styles.selectedOption,
                    index < options.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: isSelected ? colors.primary : colors.text }
                  ]}>
                    {renderOption ? renderOption(option) : option}
                  </Text>
                  {isSelected && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  optionsContainer: {
    marginTop: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    maxHeight: 300,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  selectedOption: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  optionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
