import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const ActiveFiltersBar = ({ filters, onRemove, onClearAll }) => {
  const { colors } = useTheme();

  if (!filters || filters.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter, index) => (
          <View
            key={`${filter.type}-${index}`}
            style={[styles.tag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          >
            <Text style={[styles.tagText, { color: colors.primary }]}>
              {filter.label}
            </Text>
            <TouchableOpacity
              onPress={() => onRemove(filter.type)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
        
        {filters.length > 1 && (
          <TouchableOpacity
            style={[styles.clearAll, { borderColor: colors.border }]}
            onPress={onClearAll}
          >
            <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  clearAll: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  clearAllText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});

export default ActiveFiltersBar;
