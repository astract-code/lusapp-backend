// Standard distances for common race types
const STANDARD_DISTANCES = {
  // Running distances
  '5K': '5 km',
  '10K': '10 km',
  'Half Marathon': '21.097 km (13.1 mi)',
  'Marathon': '42.195 km (26.2 mi)',
  'Ultra Marathon': '50+ km',
  
  // Triathlon distances
  'Sprint': '750m swim, 20km bike, 5km run',
  'Olympic': '1.5km swim, 40km bike, 10km run',
  'Half Ironman': '1.9km swim, 90km bike, 21.097km run',
  'Ironman': '3.8km swim, 180km bike, 42.195km run',
  'Aquathlon': 'Swim + Run',
  'Duathlon': 'Run + Bike + Run',
  
  // Cycling distances
  'Criterium': '40-60 km',
  'Gran Fondo': '100+ km',
  'Mountain Biking': 'Varies',
  'Road Race': 'Varies',
  
  // Other sports
  'HYROX': '8 km + 8 workouts',
  'Spartan Race': 'Varies',
  'Obstacle Course': 'Varies',
  'Open Water Swim': 'Varies',
  'Pool Competition': 'Varies',
  'Trail Running': 'Varies',
  'Cross Country': 'Varies',
  'Custom Distance': 'Varies'
};

/**
 * Get the display distance for a race
 * If race.distance is provided, use it
 * Otherwise, infer from sport_subtype
 * @param {Object} race - The race object
 * @returns {string} - The distance to display
 */
export const getDisplayDistance = (race) => {
  // If distance is provided and not "TBD", use it
  if (race.distance && race.distance !== 'TBD' && race.distance.trim() !== '') {
    return race.distance;
  }
  
  // Try to infer from sport_subtype
  if (race.sport_subtype && STANDARD_DISTANCES[race.sport_subtype]) {
    return STANDARD_DISTANCES[race.sport_subtype];
  }
  
  // Fallback to "TBD" only if we can't infer
  return 'TBD';
};

/**
 * Check if a sport should show distance information
 * Some sports like HYROX have fixed formats, not traditional distances
 * @param {Object} race - The race object
 * @returns {boolean} - Whether to show distance
 */
export const shouldShowDistance = (race) => {
  const category = race.sport_category?.toLowerCase() || '';
  const subtype = race.sport_subtype?.toLowerCase() || '';
  
  // Always show distance for all sports now that we have standard distances
  return true;
};
