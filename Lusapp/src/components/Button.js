import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, GRADIENTS } from '../constants/theme';
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
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptic.light();
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    md: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    lg: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 18 },
  };

  const textSizeStyles = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Text style={[styles.icon, { marginRight: 8 }]}>{icon}</Text>}
          <Text style={[
            styles.text,
            textSizeStyles[size],
            variant === 'primary' && styles.primaryText,
            variant === 'secondary' && { color: colors.text },
            variant === 'outline' && { color: colors.primary },
            variant === 'ghost' && { color: colors.primary },
            variant === 'danger' && styles.dangerText,
            textStyle,
          ]}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && <Text style={[styles.icon, { marginLeft: 8 }]}>{icon}</Text>}
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Animated.View style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && styles.fullWidth,
        style,
      ]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.button,
              sizeStyles[size],
              styles.primaryButton,
              disabled && styles.disabled,
            ]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      { transform: [{ scale: scaleAnim }] },
      fullWidth && styles.fullWidth,
      style,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          sizeStyles[size],
          variant === 'secondary' && [styles.secondaryButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }],
          variant === 'outline' && [styles.outlineButton, { borderColor: colors.primary }],
          variant === 'ghost' && styles.ghostButton,
          variant === 'danger' && styles.dangerButton,
          disabled && styles.disabled,
        ]}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const GradientButton = ({
  children,
  onPress,
  gradientColors = GRADIENTS.primary,
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptic.light();
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    md: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    lg: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 18 },
  };

  const textSizeStyles = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  return (
    <Animated.View style={[
      { transform: [{ scale: scaleAnim }] },
      fullWidth && styles.fullWidth,
      style,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            styles.gradientButton,
            disabled && styles.disabled,
          ]}
        >
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                {icon && <Text style={[styles.icon, { marginRight: 8 }]}>{icon}</Text>}
                <Text style={[styles.text, textSizeStyles[size], styles.primaryText]}>
                  {children}
                </Text>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const PillButton = ({
  children,
  onPress,
  active = false,
  size = 'sm',
  style,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptic.selection();
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {active ? (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.pill, size === 'sm' ? styles.pillSm : styles.pillMd, style]}
          >
            <Text style={[styles.pillText, size === 'sm' ? styles.pillTextSm : styles.pillTextMd, { color: '#FFFFFF' }]}>
              {children}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[
            styles.pill,
            size === 'sm' ? styles.pillSm : styles.pillMd,
            { backgroundColor: isDark ? colors.surface : '#F1F5F9' },
            style,
          ]}>
            <Text style={[
              styles.pillText,
              size === 'sm' ? styles.pillTextSm : styles.pillTextMd,
              { color: colors.textSecondary },
            ]}>
              {children}
            </Text>
          </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    fontSize: 18,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  primaryButton: {
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  secondaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },

  ghostButton: {
    backgroundColor: 'transparent',
  },

  dangerButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  gradientButton: {
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  pill: {
    borderRadius: 100,
  },
  pillSm: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillMd: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pillText: {
    fontWeight: '600',
  },
  pillTextSm: {
    fontSize: 13,
  },
  pillTextMd: {
    fontSize: 15,
  },
});
