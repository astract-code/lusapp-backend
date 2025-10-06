import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export const Card = ({
  children,
  onPress,
  style,
  elevation = 'md', // none, sm, md, lg, xl
  padding = 'md', // none, sm, md, lg
  noBorder = false,
}) => {
  const { colors } = useTheme();

  const paddingStyles = {
    none: {},
    sm: { padding: SPACING.sm },
    md: { padding: SPACING.lg },
    lg: { padding: SPACING.xl },
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    !noBorder && styles.border,
    SHADOWS[elevation],
    paddingStyles[padding],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  border: {
    borderWidth: 1,
  },
});
