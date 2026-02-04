import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations, { LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      await AsyncStorage.setItem('appLanguage', langCode);
    }
  };

  const t = useCallback((key) => {
    const currentTranslations = translations[language] || translations.en;
    return currentTranslations[key] || translations.en[key] || key;
  }, [language]);

  const getCurrentLanguage = useCallback(() => {
    return LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isLoading,
        languages: LANGUAGES,
        getCurrentLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
