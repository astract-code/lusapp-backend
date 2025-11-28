import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GRADIENTS } from '../constants/theme';

const iconMap = {
  run: 'walk-outline',
  bike: 'bicycle-outline',
  swim: 'water-outline',
  triathlon: 'trophy-outline',
  fitness: 'barbell-outline',
  mountain: 'flag-outline',
  trophy: 'trophy-outline',
  check: 'checkmark-circle-outline',
  target: 'locate-outline',
  calendar: 'calendar-outline',
  location: 'location-outline',
  clock: 'time-outline',
  users: 'people-outline',
  heart: 'heart-outline',
  star: 'star-outline',
  medal: 'ribbon-outline',
  fire: 'flame-outline',
  bolt: 'flash-outline',
  chart: 'stats-chart-outline',
  settings: 'settings-outline',
  edit: 'create-outline',
  camera: 'camera-outline',
  mail: 'mail-outline',
  lock: 'lock-closed-outline',
  user: 'person-outline',
  plus: 'add-outline',
  minus: 'remove-outline',
  close: 'close-outline',
  back: 'arrow-back-outline',
  forward: 'arrow-forward-outline',
  up: 'arrow-up-outline',
  down: 'arrow-down-outline',
  search: 'search-outline',
  filter: 'options-outline',
  share: 'share-outline',
  bookmark: 'bookmark-outline',
  home: 'home-outline',
  discover: 'compass-outline',
  feed: 'newspaper-outline',
  profile: 'person-circle-outline',
  group: 'people-outline',
  message: 'chatbubble-outline',
  notification: 'notifications-outline',
  refresh: 'refresh-outline',
  upload: 'cloud-upload-outline',
  download: 'cloud-download-outline',
};

export const Icon = ({ 
  name, 
  size = 24, 
  color = '#FFFFFF',
  gradient = false,
  gradientColors,
  style 
}) => {
  const iconName = iconMap[name] || name || 'ellipse';
  
  if (gradient && gradientColors) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <LinearGradient
          colors={gradientColors}
          style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Ionicons name={iconName} size={size * 0.5} color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <Ionicons name={iconName} size={size} color={color} style={style} />
  );
};

export const IconButton = ({ 
  name, 
  size = 44, 
  iconSize = 20,
  color = '#FFFFFF',
  backgroundColor = 'rgba(255,255,255,0.1)',
  onPress,
  style 
}) => {
  return (
    <View 
      style={[
        styles.iconButton, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor 
        },
        style
      ]}
    >
      <Icon name={name} size={iconSize} color={color} />
    </View>
  );
};

export const SportIcon = ({ sport, size = 32, style }) => {
  const sportGradients = {
    'Running': GRADIENTS.running,
    'Marathon': GRADIENTS.running,
    'Trail Running': GRADIENTS.running,
    'Triathlon': GRADIENTS.triathlon,
    'Cycling': GRADIENTS.cycling,
    'Swimming': GRADIENTS.swimming,
    'Fitness': GRADIENTS.fitness,
    'HYROX': GRADIENTS.fitness,
    'default': GRADIENTS.primary,
  };

  const sportIcons = {
    'Running': 'walk-outline',
    'Marathon': 'walk-outline',
    'Trail Running': 'flag-outline',
    'Triathlon': 'trophy-outline',
    'Cycling': 'bicycle-outline',
    'Swimming': 'water-outline',
    'Fitness': 'barbell-outline',
    'HYROX': 'barbell-outline',
    'default': 'walk-outline',
  };

  const gradientColors = sportGradients[sport] || sportGradients.default;
  const iconName = sportIcons[sport] || sportIcons.default;

  return (
    <View style={[styles.sportIconContainer, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.sportIconGradient, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Ionicons name={iconName} size={size * 0.5} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportIconContainer: {
    overflow: 'hidden',
  },
  sportIconGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
