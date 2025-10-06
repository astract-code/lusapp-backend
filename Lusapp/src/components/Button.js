import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export const Button = ({
  children,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'md', // sm, md, lg
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getButtonStyle = () => {
    const baseStyle = {
      transform: [{ scale: scaleAnim }],
    };

    const sizeStyles = {
      sm: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
      },
      md: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
      },
      lg: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        ...SHADOWS.md,
      },
      secondary: {
        backgroundColor: colors.secondary,
        ...SHADOWS.md,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.error,
        ...SHADOWS.md,
      },
    };

    return [
      styles.button,
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
    ];
  };

  const getTextStyle = () => {
    const sizeStyles = {
      sm: { fontSize: TYPOGRAPHY.fontSize.sm },
      md: { fontSize: TYPOGRAPHY.fontSize.base },
      lg: { fontSize: TYPOGRAPHY.fontSize.lg },
    };

    const variantStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
      danger: { color: '#FFFFFF' },
    };

    return [
      styles.text,
      sizeStyles[size],
      variantStyles[variant],
    ];
  };

  return (
    <Animated.View style={getButtonStyle()}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.touchable, style]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[getTextStyle(), textStyle]}>{children}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
});
