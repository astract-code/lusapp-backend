import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [use24HourFormat, setUse24HourFormat] = useState(false);
  const [useMetric, setUseMetric] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const timeFormat = await AsyncStorage.getItem('use24HourFormat');
      const distanceUnit = await AsyncStorage.getItem('useMetric');
      
      if (timeFormat !== null) {
        setUse24HourFormat(JSON.parse(timeFormat));
      }
      if (distanceUnit !== null) {
        setUseMetric(JSON.parse(distanceUnit));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle24HourFormat = async () => {
    const newValue = !use24HourFormat;
    setUse24HourFormat(newValue);
    await AsyncStorage.setItem('use24HourFormat', JSON.stringify(newValue));
  };

  const toggleDistanceUnit = async () => {
    const newValue = !useMetric;
    setUseMetric(newValue);
    await AsyncStorage.setItem('useMetric', JSON.stringify(newValue));
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    if (use24HourFormat) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const formatDistance = (distanceString) => {
    if (!distanceString) return '';
    
    const kmMatch = distanceString.match(/(\d+\.?\d*)\s*km/i);
    const milesMatch = distanceString.match(/(\d+\.?\d*)\s*miles?/i);
    
    if (kmMatch) {
      const km = parseFloat(kmMatch[1]);
      if (useMetric) {
        return `${km} km`;
      } else {
        return `${(km * 0.621371).toFixed(1)} miles`;
      }
    }
    
    if (milesMatch) {
      const miles = parseFloat(milesMatch[1]);
      if (useMetric) {
        return `${(miles * 1.60934).toFixed(1)} km`;
      } else {
        return `${miles} miles`;
      }
    }
    
    return distanceString;
  };

  return (
    <SettingsContext.Provider
      value={{
        use24HourFormat,
        useMetric,
        isLoading,
        toggle24HourFormat,
        toggleDistanceUnit,
        formatTime,
        formatDistance,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
