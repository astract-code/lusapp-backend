// Modern Theme System with Dark Mode Support

export const COLORS = {
  light: {
    // Primary Colors
    primary: '#6366F1', // Indigo - modern and elegant
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    
    // Secondary Colors
    secondary: '#EC4899', // Pink accent
    secondaryLight: '#F472B6',
    
    // Backgrounds
    background: '#F8FAFC', // Very light gray
    backgroundElevated: '#FFFFFF',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    
    // Text
    text: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    textTertiary: '#94A3B8', // Slate 400
    
    // Borders
    border: '#E2E8F0', // Slate 200
    borderLight: '#F1F5F9',
    
    // Status Colors
    success: '#10B981', // Emerald
    successLight: '#D1FAE5',
    warning: '#F59E0B', // Amber
    warningLight: '#FEF3C7',
    error: '#EF4444', // Red
    errorLight: '#FEE2E2',
    info: '#3B82F6', // Blue
    infoLight: '#DBEAFE',
    
    // Gradients
    gradient1: '#6366F1',
    gradient2: '#EC4899',
    
    // Overlay
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  dark: {
    // Primary Colors
    primary: '#818CF8', // Lighter indigo for dark mode
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    
    // Secondary Colors
    secondary: '#F472B6', // Lighter pink for dark mode
    secondaryLight: '#F9A8D4',
    
    // Backgrounds
    background: '#0F172A', // Slate 900
    backgroundElevated: '#1E293B', // Slate 800
    card: '#1E293B',
    surface: '#334155', // Slate 700
    
    // Text
    text: '#F1F5F9', // Slate 100
    textSecondary: '#94A3B8', // Slate 400
    textTertiary: '#64748B', // Slate 500
    
    // Borders
    border: '#334155', // Slate 700
    borderLight: '#475569',
    
    // Status Colors
    success: '#34D399', // Lighter emerald
    successLight: '#064E3B',
    warning: '#FBBF24', // Lighter amber
    warningLight: '#78350F',
    error: '#F87171', // Lighter red
    errorLight: '#7F1D1D',
    info: '#60A5FA', // Lighter blue
    infoLight: '#1E3A8A',
    
    // Gradients
    gradient1: '#818CF8',
    gradient2: '#F472B6',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow System for Depth
export const SHADOWS = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Typography System
export const TYPOGRAPHY = {
  // Font Families (using system defaults for Expo compatibility)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    huge: 36,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Legacy exports for backward compatibility
export const FONT_SIZE = TYPOGRAPHY.fontSize;

// Animation Constants
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
};

// Opacity Levels
export const OPACITY = {
  disabled: 0.4,
  medium: 0.6,
  high: 0.8,
  full: 1,
};

export const SPORTS = [
  { id: '5k', name: '5K Run', icon: '🏃' },
  { id: '10k', name: '10K Run', icon: '🏃' },
  { id: 'half-marathon', name: 'Half Marathon', icon: '🏃' },
  { id: 'marathon', name: 'Marathon', icon: '🏃' },
  { id: 'ultra', name: 'Ultra Marathon', icon: '🏃‍♂️' },
  { id: 'triathlon', name: 'Triathlon', icon: '🏊' },
  { id: 'ironman', name: 'Ironman', icon: '💪' },
  { id: 'trail', name: 'Trail Running', icon: '⛰️' },
  { id: 'spartan', name: 'Spartan Race', icon: '⚔️' },
  { id: 'hyrox', name: 'HYROX', icon: '🏋️' },
  { id: 'obstacle', name: 'Obstacle Course', icon: '🧗' },
  { id: 'cycling', name: 'Cycling', icon: '🚴' },
  { id: 'bike-race', name: 'Bike Race', icon: '🚴' },
  { id: 'criterium', name: 'Criterium', icon: '🚴' },
  { id: 'gran-fondo', name: 'Gran Fondo', icon: '🚴' },
  { id: 'mountain-bike', name: 'Mountain Biking', icon: '🚵' },
  { id: 'duathlon', name: 'Duathlon', icon: '🏃' },
  { id: 'aquathlon', name: 'Aquathlon', icon: '🏊' },
  { id: 'swimming', name: 'Open Water Swim', icon: '🏊‍♀️' },
  { id: 'cross-country', name: 'Cross Country', icon: '🏃' },
];

export const CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
];

export const COUNTRIES = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Kenya',
  'Malaysia',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
];
