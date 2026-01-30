import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const FilterChipButton = ({ 
  label, 
  icon, 
  value, 
  onPress, 
  isActive = false 
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { 
          backgroundColor: isActive ? colors.primary : colors.card,
          borderColor: isActive ? colors.primary : colors.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <Text 
        style={[
          styles.label, 
          { color: isActive ? '#FFFFFF' : colors.text }
        ]}
        numberOfLines={1}
      >
        {value || label}
      </Text>
      <Ionicons 
        name="chevron-down" 
        size={14} 
        color={isActive ? '#FFFFFF' : colors.textSecondary} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    maxWidth: 100,
  },
});

export default FilterChipButton;
