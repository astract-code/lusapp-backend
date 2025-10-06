import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export const FilterChip = ({ label, selected, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
