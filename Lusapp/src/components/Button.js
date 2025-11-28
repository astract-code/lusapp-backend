import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import haptic from '../utils/haptics';

export const Button = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
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
    haptic.light();
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
    const sizeStyles = {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    };

    const variantStyles = {
      primary: styles.primaryButton,
      secondary: styles.secondaryButton,
      outline: styles.outlineButton,
      ghost: styles.ghostButton,
      danger: styles.dangerButton,
    };

    return [
      styles.button,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      style,
    ];
  };

  const getTextStyle = () => {
    const sizeStyles = {
      sm: styles.textSm,
      md: styles.textMd,
      lg: styles.textLg,
    };

    const variantStyles = {
      primary: styles.primaryButtonText,
      secondary: styles.secondaryButtonText,
      outline: styles.outlineButtonText,
      ghost: styles.ghostButtonText,
      danger: styles.dangerButtonText,
    };

    return [
      styles.text,
      sizeStyles[size],
      variantStyles[variant],
      textStyle,
    ];
  };

  const getLoaderColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return '#10B981';
    }
    return '#FFFFFF';
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], alignSelf: fullWidth ? 'stretch' : 'flex-start' }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={getButtonStyle()}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={getLoaderColor()} />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={getTextStyle()}>{children}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
    fontSize: 18,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  sizeSm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sizeMd: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sizeLg: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
  },

  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },

  primaryButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },

  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  outlineButtonText: {
    color: '#10B981',
    fontWeight: '600',
  },

  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: '#10B981',
    fontWeight: '600',
  },

  dangerButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
