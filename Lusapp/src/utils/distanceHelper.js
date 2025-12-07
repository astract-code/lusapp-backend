// Conversion constants
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

// Standard distances for common race types (stored in km)
// exactKm/exactMi flags indicate distances that should display with full precision
const STANDARD_DISTANCES_KM = {
  // Running distances
  '5K': { km: 5, label: '5K' },
  '10K': { km: 10, label: '10K' },
  'Half Marathon': { km: 21.097, mi: 13.1, label: 'Half Marathon', exact: true },
  'Marathon': { km: 42.195, mi: 26.2, label: 'Marathon', exact: true },
  'Ultra Marathon': { km: 50, label: '50+ km', isMin: true },
  
  // Triathlon distances (total running/main distance for display)
  'Sprint': { km: 25.75, label: 'Sprint Tri', description: true },
  'Olympic': { km: 51.5, label: 'Olympic Tri', description: true },
  'Half Ironman': { km: 113, label: 'Half Ironman', description: true },
  'Ironman': { km: 226, label: 'Ironman', description: true },
  'Aquathlon': { km: null, label: 'Aquathlon' },
  'Duathlon': { km: null, label: 'Duathlon' },
  
  // Cycling distances
  'Criterium': { km: 50, label: '40-60 km', range: true },
  'Gran Fondo': { km: 100, label: '100+ km', isMin: true },
  'Mountain Biking': { km: null, label: 'MTB' },
  'Road Race': { km: null, label: 'Road Race' },
  
  // Other sports
  'HYROX': { km: 8, label: 'HYROX' },
  'Spartan Race': { km: null, label: 'Spartan' },
  'Obstacle Course': { km: null, label: 'OCR' },
  'Open Water Swim': { km: null, label: 'Open Water' },
  'Pool Competition': { km: null, label: 'Pool' },
  'Trail Running': { km: null, label: 'Trail' },
  'Cross Country': { km: null, label: 'XC' },
  'Custom Distance': { km: null, label: 'Custom' }
};

// Triathlon detailed descriptions
const TRIATHLON_DESCRIPTIONS = {
  'Sprint': { swim: 0.75, bike: 20, run: 5 },
  'Olympic': { swim: 1.5, bike: 40, run: 10 },
  'Half Ironman': { swim: 1.9, bike: 90, run: 21.097 },
  'Ironman': { swim: 3.8, bike: 180, run: 42.195 },
};

/**
 * Format a distance value based on user preference
 * @param {number} km - Distance in kilometers
 * @param {boolean} useMetric - Whether to use metric (km) or imperial (miles)
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted distance string
 */
export const formatDistanceValue = (km, useMetric = true, decimals = 1) => {
  if (km === null || km === undefined) return '';
  
  if (useMetric) {
    return `${Number(km.toFixed(decimals))} km`;
  } else {
    const miles = km * KM_TO_MILES;
    return `${Number(miles.toFixed(decimals))} mi`;
  }
};

/**
 * Get triathlon description based on unit preference
 * @param {string} subtype - The triathlon subtype
 * @param {boolean} useMetric - Whether to use metric units
 * @returns {string} - Formatted triathlon description
 */
const getTriathlonDescription = (subtype, useMetric) => {
  const tri = TRIATHLON_DESCRIPTIONS[subtype];
  if (!tri) return '';
  
  if (useMetric) {
    return `${tri.swim}km swim, ${tri.bike}km bike, ${Number(tri.run.toFixed(1))}km run`;
  } else {
    const swimMi = (tri.swim * KM_TO_MILES).toFixed(1);
    const bikeMi = (tri.bike * KM_TO_MILES).toFixed(1);
    const runMi = (tri.run * KM_TO_MILES).toFixed(1);
    return `${swimMi}mi swim, ${bikeMi}mi bike, ${runMi}mi run`;
  }
};

/**
 * Get the display distance for a race
 * If race.distance is provided, use it
 * Otherwise, infer from sport_subtype
 * @param {Object} race - The race object
 * @param {boolean} useMetric - Whether to use metric (km) or imperial (miles)
 * @returns {string} - The distance to display
 */
export const getDisplayDistance = (race, useMetric = true) => {
  // If distance is provided and not "TBD", parse and convert it
  if (race.distance && race.distance !== 'TBD' && race.distance.trim() !== '') {
    return convertDistanceString(race.distance, useMetric);
  }
  
  // Try to infer from sport_subtype
  if (race.sport_subtype && STANDARD_DISTANCES_KM[race.sport_subtype]) {
    const dist = STANDARD_DISTANCES_KM[race.sport_subtype];
    
    // For triathlons, show the label (e.g., "Half Ironman") not the detailed breakdown
    if (dist.description && TRIATHLON_DESCRIPTIONS[race.sport_subtype]) {
      return dist.label;
    }
    
    // For distances with km value
    if (dist.km !== null) {
      if (dist.isMin) {
        // e.g., "50+ km" or "31+ mi"
        const value = useMetric ? dist.km : (dist.km * KM_TO_MILES);
        const unit = useMetric ? 'km' : 'mi';
        return `${Math.round(value)}+ ${unit}`;
      }
      if (dist.range) {
        // e.g., "40-60 km" or "25-37 mi"
        if (useMetric) {
          return '40-60 km';
        } else {
          return '25-37 mi';
        }
      }
      // For exact distances (marathon, half marathon), show precise values
      if (dist.exact) {
        if (useMetric) {
          return `${dist.km} km`;
        } else {
          return `${dist.mi} mi`;
        }
      }
      return formatDistanceValue(dist.km, useMetric, dist.km >= 100 ? 0 : 1);
    }
    
    // For sports without specific distance (label only)
    return dist.label;
  }
  
  // Fallback
  return 'TBD';
};

/**
 * Convert a distance string from one unit to another
 * @param {string} distanceString - The distance string (e.g., "42.195 km" or "26.2 miles")
 * @param {boolean} useMetric - Whether to use metric (km) or imperial (miles)
 * @returns {string} - Converted distance string
 */
export const convertDistanceString = (distanceString, useMetric = true) => {
  if (!distanceString) return '';
  
  // Exact distances that should preserve precision
  const EXACT_DISTANCES = {
    42.195: { km: 42.195, mi: 26.2 },  // Marathon
    21.097: { km: 21.097, mi: 13.1 },  // Half Marathon
    21.0975: { km: 21.097, mi: 13.1 }, // Half Marathon (alternate precision)
  };
  
  // Match km pattern
  const kmMatch = distanceString.match(/(\d+\.?\d*)\s*km/i);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1]);
    
    // Check for exact marathon/half marathon distances
    const exactMatch = EXACT_DISTANCES[km];
    if (exactMatch) {
      return useMetric ? `${exactMatch.km} km` : `${exactMatch.mi} mi`;
    }
    
    if (useMetric) {
      // Preserve original precision for km values
      return `${km} km`;
    } else {
      const miles = km * KM_TO_MILES;
      return `${Number(miles.toFixed(1))} mi`;
    }
  }
  
  // Match miles pattern
  const milesMatch = distanceString.match(/(\d+\.?\d*)\s*(?:miles?|mi)/i);
  if (milesMatch) {
    const miles = parseFloat(milesMatch[1]);
    
    // Check for exact marathon/half marathon distances in miles
    if (miles === 26.2) {
      return useMetric ? '42.195 km' : '26.2 mi';
    }
    if (miles === 13.1) {
      return useMetric ? '21.097 km' : '13.1 mi';
    }
    
    if (useMetric) {
      const km = miles * MILES_TO_KM;
      return `${Number(km.toFixed(1))} km`;
    } else {
      return `${miles} mi`;
    }
  }
  
  // If no unit found, assume km and convert if needed
  const numMatch = distanceString.match(/^(\d+\.?\d*)$/);
  if (numMatch) {
    const km = parseFloat(numMatch[1]);
    
    // Check for exact distances
    const exactMatch = EXACT_DISTANCES[km];
    if (exactMatch) {
      return useMetric ? `${exactMatch.km} km` : `${exactMatch.mi} mi`;
    }
    
    if (useMetric) {
      return `${km} km`;
    } else {
      const miles = km * KM_TO_MILES;
      return `${Number(miles.toFixed(1))} mi`;
    }
  }
  
  // Return as-is if we can't parse it
  return distanceString;
};

/**
 * Check if a sport should show distance information
 * Some sports like HYROX have fixed formats, not traditional distances
 * @param {Object} race - The race object
 * @returns {boolean} - Whether to show distance
 */
export const shouldShowDistance = (race) => {
  // Always show distance for all sports now that we have standard distances
  return true;
};
