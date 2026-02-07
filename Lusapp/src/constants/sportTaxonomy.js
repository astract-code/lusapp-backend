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
  Fitness: {
    icon: '💪',
    subtypes: ['Spartan Race', 'HYROX', 'Obstacle Course', 'CrossFit', 'Bootcamp', 'Custom Distance']
  },
  Swimming: {
    icon: '🏊',
    subtypes: ['Open Water Swim', 'Pool Competition', 'Custom Distance']
  },
  Custom: {
    icon: '⭐',
    subtypes: ['Custom Event']
  }
};

export const SPORT_CATEGORIES = Object.keys(SPORT_TAXONOMY);

export const normalizeLegacySport = (sportString) => {
  if (!sportString) return { category: null, subtype: null };
  const sportLower = sportString.toLowerCase().trim();
  
  const LEGACY_MAP = {
    '5k': { category: 'Running', subtype: '5K' },
    '10k': { category: 'Running', subtype: '10K' },
    'half marathon': { category: 'Running', subtype: 'Half Marathon' },
    'half-marathon': { category: 'Running', subtype: 'Half Marathon' },
    'marathon': { category: 'Running', subtype: 'Marathon' },
    'ultra marathon': { category: 'Running', subtype: 'Ultra Marathon' },
    'ultra-marathon': { category: 'Running', subtype: 'Ultra Marathon' },
    'ultra': { category: 'Running', subtype: 'Ultra Marathon' },
    'trail running': { category: 'Running', subtype: 'Trail Running' },
    'trail': { category: 'Running', subtype: 'Trail Running' },
    'cross country': { category: 'Running', subtype: 'Cross Country' },
    'cross-country': { category: 'Running', subtype: 'Cross Country' },
    'running': { category: 'Running', subtype: 'Custom Distance' },
    
    'triathlon': { category: 'Triathlon', subtype: 'Olympic' },
    'ironman': { category: 'Triathlon', subtype: 'Ironman' },
    'sprint': { category: 'Triathlon', subtype: 'Sprint' },
    'olympic': { category: 'Triathlon', subtype: 'Olympic' },
    'half ironman': { category: 'Triathlon', subtype: 'Half Ironman' },
    'half-ironman': { category: 'Triathlon', subtype: 'Half Ironman' },
    'aquathlon': { category: 'Triathlon', subtype: 'Aquathlon' },
    'duathlon': { category: 'Triathlon', subtype: 'Duathlon' },
    
    'cycling': { category: 'Cycling', subtype: 'Road Race' },
    'bike race': { category: 'Cycling', subtype: 'Road Race' },
    'bike': { category: 'Cycling', subtype: 'Road Race' },
    'road race': { category: 'Cycling', subtype: 'Road Race' },
    'criterium': { category: 'Cycling', subtype: 'Criterium' },
    'gran fondo': { category: 'Cycling', subtype: 'Gran Fondo' },
    'mountain biking': { category: 'Cycling', subtype: 'Mountain Biking' },
    'mountain bike': { category: 'Cycling', subtype: 'Mountain Biking' },
    'mtb': { category: 'Cycling', subtype: 'Mountain Biking' },
    
    'spartan race': { category: 'Fitness', subtype: 'Spartan Race' },
    'spartan': { category: 'Fitness', subtype: 'Spartan Race' },
    'hyrox': { category: 'Fitness', subtype: 'HYROX' },
    'obstacle course': { category: 'Fitness', subtype: 'Obstacle Course' },
    'obstacle': { category: 'Fitness', subtype: 'Obstacle Course' },
    'ocr': { category: 'Fitness', subtype: 'Obstacle Course' },
    'crossfit': { category: 'Fitness', subtype: 'CrossFit' },
    'bootcamp': { category: 'Fitness', subtype: 'Bootcamp' },
    
    'open water swim': { category: 'Swimming', subtype: 'Open Water Swim' },
    'swim': { category: 'Swimming', subtype: 'Open Water Swim' },
    'swimming': { category: 'Swimming', subtype: 'Open Water Swim' }
  };
  
  return LEGACY_MAP[sportLower] || { category: null, subtype: sportString };
};

export const formatSportDisplay = (category, subtype) => {
  if (!category) return subtype || 'Unknown';
  if (subtype === 'Custom Distance') return `${category} - Custom`;
  return subtype || category;
};
