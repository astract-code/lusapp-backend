import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { COLORS } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'light', 'dark', or 'auto'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine actual theme based on mode
  const getActiveTheme = () => {
    if (themeMode === 'auto') {
      return deviceColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const activeTheme = getActiveTheme();
  const colors = COLORS[activeTheme];
  const isDarkMode = activeTheme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setTheme,
        colors,
        isDarkMode,
        activeTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
