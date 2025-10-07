export const SPORT_TAXONOMY = {
  Running: {
    icon: '🏃',
    subtypes: ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra Marathon', 'Trail Running', 'Cross Country', 'Custom Distance']
  },
  Triathlon: {
    icon: '🏊',
    subtypes: ['Sprint', 'Olympic', 'Half Ironman', 'Ironman', 'Aquathlon', 'Duathlon', 'Custom Distance']
  },
  Cycling: {
    icon: '🚴',
    subtypes: ['Criterium', 'Gran Fondo', 'Mountain Biking', 'Road Race', 'Custom Distance']
  },
  Obstacle: {
    icon: '💪',
    subtypes: ['Spartan Race', 'HYROX', 'Obstacle Course', 'Custom Distance']
  },
  Swimming: {
    icon: '🏊',
    subtypes: ['Open Water Swim', 'Pool Competition', 'Custom Distance']
  }
};

export const SPORT_CATEGORIES = Object.keys(SPORT_TAXONOMY);

export const normalizeLegacySport = (sportString) => {
  const sportLower = sportString.toLowerCase();
  
  const LEGACY_MAP = {
    '5k': { category: 'Running', subtype: '5K' },
    '10k': { category: 'Running', subtype: '10K' },
    'half marathon': { category: 'Running', subtype: 'Half Marathon' },
    'marathon': { category: 'Running', subtype: 'Marathon' },
    'ultra marathon': { category: 'Running', subtype: 'Ultra Marathon' },
    'trail running': { category: 'Running', subtype: 'Trail Running' },
    'cross country': { category: 'Running', subtype: 'Cross Country' },
    
    'triathlon': { category: 'Triathlon', subtype: 'Olympic' },
    'ironman': { category: 'Triathlon', subtype: 'Ironman' },
    'sprint': { category: 'Triathlon', subtype: 'Sprint' },
    'olympic': { category: 'Triathlon', subtype: 'Olympic' },
    'half ironman': { category: 'Triathlon', subtype: 'Half Ironman' },
    'aquathlon': { category: 'Triathlon', subtype: 'Aquathlon' },
    'duathlon': { category: 'Triathlon', subtype: 'Duathlon' },
    
    'cycling': { category: 'Cycling', subtype: 'Road Race' },
    'bike race': { category: 'Cycling', subtype: 'Road Race' },
    'criterium': { category: 'Cycling', subtype: 'Criterium' },
    'gran fondo': { category: 'Cycling', subtype: 'Gran Fondo' },
    'mountain biking': { category: 'Cycling', subtype: 'Mountain Biking' },
    
    'spartan race': { category: 'Obstacle', subtype: 'Spartan Race' },
    'hyrox': { category: 'Obstacle', subtype: 'HYROX' },
    'obstacle course': { category: 'Obstacle', subtype: 'Obstacle Course' },
    
    'open water swim': { category: 'Swimming', subtype: 'Open Water Swim' }
  };
  
  return LEGACY_MAP[sportLower] || { category: null, subtype: sportString };
};

export const formatSportDisplay = (category, subtype) => {
  if (!category) return subtype || 'Unknown';
  if (subtype === 'Custom Distance') return `${category} - Custom`;
  return subtype || category;
};
