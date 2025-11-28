// Modern Theme System with Dark Mode Support

export const COLORS = {
  light: {
    // Primary Colors - Emerald Green
    primary: '#10B981',        // Emerald Green (primary-500)
    primaryLight: '#34D399',   // Light Green (primary-400)
    primaryDark: '#059669',    // Darker Green (primary-600)
    
    // Secondary Colors - Blue
    secondary: '#3B82F6',      // Blue (secondary-500)
    secondaryLight: '#60A5FA', // Light Blue (secondary-400)
    
    // Backgrounds
    background: '#FAFAFA',     // Light Gray
    backgroundElevated: '#FFFFFF', // White (surface)
    card: '#FFFFFF',           // White (surface)
    surface: '#F8FAFC',        // Off-white (surface-2)
    
    // Text
    text: '#1F2937',           // Dark Gray (text-primary)
    textSecondary: '#6B7280',  // Medium Gray (text-secondary)
    textTertiary: '#9CA3AF',   // Light Gray (text-muted)
    
    // Borders
    border: '#E5E7EB',         // Light grey
    borderLight: '#F3F4F6',
    
    // Status Colors
    success: '#10B981',        // Emerald Green
    successLight: '#D1FAE5',
    warning: '#F59E0B',        // Gold
    warningLight: '#FEF3C7',
    error: '#EF4444',          // Red
    errorLight: '#FEE2E2',
    info: '#3B82F6',           // Blue
    infoLight: '#DBEAFE',
    
    // Accent Colors
    gold: '#F59E0B',           // Gold for medals
    purple: '#8B5CF6',         // Purple for premium
    
    // Gradients
    gradient1: '#10B981',      // Emerald Green
    gradient2: '#059669',      // Darker Green
    
    // Overlay
    overlay: 'rgba(31, 41, 55, 0.5)',
  },
  dark: {
    // Primary Colors - Emerald Green (brighter for dark mode)
    primary: '#10B981',        // Emerald Green (primary-500)
    primaryLight: '#34D399',   // Light Green (primary-400)
    primaryDark: '#059669',    // Darker Green (primary-600)
    
    // Secondary Colors - Blue
    secondary: '#60A5FA',      // Light Blue (secondary-400)
    secondaryLight: '#93C5FD',
    
    // Backgrounds - Dark
    background: '#111827',     // Dark grey
    backgroundElevated: '#1F2937',
    card: '#1F2937',
    surface: '#374151',
    
    // Text - Light
    text: '#F9FAFB',           // Almost white
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',   // text-muted
    
    // Borders
    border: '#374151',
    borderLight: '#4B5563',
    
    // Status Colors
    success: '#10B981',        // Emerald
    successLight: '#064E3B',
    warning: '#F59E0B',        // Gold
    warningLight: '#78350F',
    error: '#EF4444',          // Red
    errorLight: '#7F1D1D',
    info: '#60A5FA',           // Light Blue
    infoLight: '#1E3A5F',
    
    // Accent Colors
    gold: '#F59E0B',           // Gold for medals
    purple: '#8B5CF6',         // Purple for premium
    
    // Gradients
    gradient1: '#10B981',      // Emerald Green
    gradient2: '#059669',      // Darker Green
    
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
  // Semantic Typography Styles
  h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  
  // Font Families (using system defaults for Expo compatibility)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font Sizes (legacy support)
  fontSize: {
    xs: 12,   // caption
    sm: 14,   // body2
    base: 16, // body1
    md: 16,   // body1
    lg: 18,   // h4
    xl: 20,   // h3
    xxl: 24,  // h2
    xxxl: 32, // h1
    huge: 36,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 16,   // caption
    snug: 20,    // body2
    normal: 24,  // body1
    relaxed: 26, // h4
    loose: 28,   // h3
    spacious: 32, // h2
    generous: 40, // h1
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

// Comprehensive country list organized by continent (195 countries total)
export const COUNTRY_TO_CONTINENT = {
  // Africa (54 countries)
  'Algeria': 'Africa',
  'Angola': 'Africa',
  'Benin': 'Africa',
  'Botswana': 'Africa',
  'Burkina Faso': 'Africa',
  'Burundi': 'Africa',
  'Cameroon': 'Africa',
  'Cape Verde': 'Africa',
  'Central African Republic': 'Africa',
  'Chad': 'Africa',
  'Comoros': 'Africa',
  'Congo': 'Africa',
  'Democratic Republic of the Congo': 'Africa',
  'Djibouti': 'Africa',
  'Egypt': 'Africa',
  'Equatorial Guinea': 'Africa',
  'Eritrea': 'Africa',
  'Eswatini': 'Africa',
  'Ethiopia': 'Africa',
  'Gabon': 'Africa',
  'Gambia': 'Africa',
  'Ghana': 'Africa',
  'Guinea': 'Africa',
  'Guinea-Bissau': 'Africa',
  'Ivory Coast': 'Africa',
  'Kenya': 'Africa',
  'Lesotho': 'Africa',
  'Liberia': 'Africa',
  'Libya': 'Africa',
  'Madagascar': 'Africa',
  'Malawi': 'Africa',
  'Mali': 'Africa',
  'Mauritania': 'Africa',
  'Mauritius': 'Africa',
  'Morocco': 'Africa',
  'Mozambique': 'Africa',
  'Namibia': 'Africa',
  'Niger': 'Africa',
  'Nigeria': 'Africa',
  'Rwanda': 'Africa',
  'Sao Tome and Principe': 'Africa',
  'Senegal': 'Africa',
  'Seychelles': 'Africa',
  'Sierra Leone': 'Africa',
  'Somalia': 'Africa',
  'South Africa': 'Africa',
  'South Sudan': 'Africa',
  'Sudan': 'Africa',
  'Tanzania': 'Africa',
  'Togo': 'Africa',
  'Tunisia': 'Africa',
  'Uganda': 'Africa',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',

  // Asia (48 countries)
  'Afghanistan': 'Asia',
  'Armenia': 'Asia',
  'Azerbaijan': 'Asia',
  'Bahrain': 'Asia',
  'Bangladesh': 'Asia',
  'Bhutan': 'Asia',
  'Brunei': 'Asia',
  'Cambodia': 'Asia',
  'China': 'Asia',
  'Cyprus': 'Asia',
  'Georgia': 'Asia',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Iran': 'Asia',
  'Iraq': 'Asia',
  'Israel': 'Asia',
  'Japan': 'Asia',
  'Jordan': 'Asia',
  'Kazakhstan': 'Asia',
  'Kuwait': 'Asia',
  'Kyrgyzstan': 'Asia',
  'Laos': 'Asia',
  'Lebanon': 'Asia',
  'Malaysia': 'Asia',
  'Maldives': 'Asia',
  'Mongolia': 'Asia',
  'Myanmar': 'Asia',
  'Nepal': 'Asia',
  'North Korea': 'Asia',
  'Oman': 'Asia',
  'Pakistan': 'Asia',
  'Palestine': 'Asia',
  'Philippines': 'Asia',
  'Qatar': 'Asia',
  'Saudi Arabia': 'Asia',
  'Singapore': 'Asia',
  'South Korea': 'Asia',
  'Sri Lanka': 'Asia',
  'Syria': 'Asia',
  'Taiwan': 'Asia',
  'Tajikistan': 'Asia',
  'Thailand': 'Asia',
  'Timor-Leste': 'Asia',
  'Turkey': 'Asia',
  'Turkmenistan': 'Asia',
  'United Arab Emirates': 'Asia',
  'Uzbekistan': 'Asia',
  'Vietnam': 'Asia',
  'Yemen': 'Asia',

  // Europe (44 countries)
  'Albania': 'Europe',
  'Andorra': 'Europe',
  'Austria': 'Europe',
  'Belarus': 'Europe',
  'Belgium': 'Europe',
  'Bosnia and Herzegovina': 'Europe',
  'Bulgaria': 'Europe',
  'Croatia': 'Europe',
  'Czech Republic': 'Europe',
  'Denmark': 'Europe',
  'Estonia': 'Europe',
  'Finland': 'Europe',
  'France': 'Europe',
  'Germany': 'Europe',
  'Greece': 'Europe',
  'Hungary': 'Europe',
  'Iceland': 'Europe',
  'Ireland': 'Europe',
  'Italy': 'Europe',
  'Kosovo': 'Europe',
  'Latvia': 'Europe',
  'Liechtenstein': 'Europe',
  'Lithuania': 'Europe',
  'Luxembourg': 'Europe',
  'Malta': 'Europe',
  'Moldova': 'Europe',
  'Monaco': 'Europe',
  'Montenegro': 'Europe',
  'Netherlands': 'Europe',
  'North Macedonia': 'Europe',
  'Norway': 'Europe',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'Romania': 'Europe',
  'Russia': 'Europe',
  'San Marino': 'Europe',
  'Serbia': 'Europe',
  'Slovakia': 'Europe',
  'Slovenia': 'Europe',
  'Spain': 'Europe',
  'Sweden': 'Europe',
  'Switzerland': 'Europe',
  'Ukraine': 'Europe',
  'United Kingdom': 'Europe',
  'Vatican City': 'Europe',

  // North America (23 countries)
  'Antigua and Barbuda': 'North America',
  'Bahamas': 'North America',
  'Barbados': 'North America',
  'Belize': 'North America',
  'Canada': 'North America',
  'Costa Rica': 'North America',
  'Cuba': 'North America',
  'Dominica': 'North America',
  'Dominican Republic': 'North America',
  'El Salvador': 'North America',
  'Grenada': 'North America',
  'Guatemala': 'North America',
  'Haiti': 'North America',
  'Honduras': 'North America',
  'Jamaica': 'North America',
  'Mexico': 'North America',
  'Nicaragua': 'North America',
  'Panama': 'North America',
  'Saint Kitts and Nevis': 'North America',
  'Saint Lucia': 'North America',
  'Saint Vincent and the Grenadines': 'North America',
  'Trinidad and Tobago': 'North America',
  'United States': 'North America',

  // South America (12 countries)
  'Argentina': 'South America',
  'Bolivia': 'South America',
  'Brazil': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Ecuador': 'South America',
  'Guyana': 'South America',
  'Paraguay': 'South America',
  'Peru': 'South America',
  'Suriname': 'South America',
  'Uruguay': 'South America',
  'Venezuela': 'South America',

  // Oceania (14 countries)
  'Australia': 'Oceania',
  'Fiji': 'Oceania',
  'Kiribati': 'Oceania',
  'Marshall Islands': 'Oceania',
  'Micronesia': 'Oceania',
  'Nauru': 'Oceania',
  'New Zealand': 'Oceania',
  'Palau': 'Oceania',
  'Papua New Guinea': 'Oceania',
  'Samoa': 'Oceania',
  'Solomon Islands': 'Oceania',
  'Tonga': 'Oceania',
  'Tuvalu': 'Oceania',
  'Vanuatu': 'Oceania',
};

// Generate alphabetically sorted countries list from the mapping
export const COUNTRIES = Object.keys(COUNTRY_TO_CONTINENT).sort();
