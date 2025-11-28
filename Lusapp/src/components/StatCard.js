import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const iconMap = {
  trophy: 'trophy-outline',
  check: 'checkmark-circle-outline',
  target: 'locate-outline',
  medal: 'ribbon-outline',
  fire: 'flame-outline',
  chart: 'stats-chart-outline',
  heart: 'heart-outline',
  bolt: 'flash-outline',
  users: 'people-outline',
  running: 'walk-outline',
  calendar: 'calendar-outline',
  star: 'star-outline',
};

export const StatCard = ({ 
  icon, 
  label, 
  value, 
  color = '#4ADE80',
  animated = true,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated]);

  const gradientColors = [color, adjustColor(color, -30)];
  const iconName = iconMap[icon] || 'ellipse';

  return (
    <Animated.View style={[
      styles.wrapper,
      { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
    ]}>
      <View style={[
        styles.container,
        { backgroundColor: isDark ? colors.card : '#FFFFFF' },
        SHADOWS.md,
      ]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Ionicons name={iconName} size={20} color="#FFFFFF" />
        </LinearGradient>
        
        <Animated.Text style={[styles.value, { color: colors.text }]}>
          {value}
        </Animated.Text>
        
        <Animated.Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  container: {
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    padding: SPACING.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontWeight: '800',
    marginBottom: 2,
    fontSize: 22,
  },
  label: {
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default StatCard;
