import React, { createContext, useContext, useState, useEffect } from 'react';
import { themeService } from '../services/api';

const ThemeContext = createContext();

const defaultThemeData = {
  id: 1,
  name: 'Default Ocean',
  color_background: '#ffffff',
  color_primary: '#003049',
  color_secondary: '#669bbc',
};

export const ThemeProvider = ({ children }) => {
  const [themes, setThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(defaultThemeData);
  const [loadingThemes, setLoadingThemes] = useState(false);

  const applyThemeColors = (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.color_background || '#ffffff');
    root.style.setProperty('--primary-color', theme.color_primary || '#003049');
    root.style.setProperty('--secondary-color', theme.color_secondary || '#669bbc');
  };

  const fetchThemes = async () => {
    try {
      setLoadingThemes(true);
      const data = await themeService.getThemes();
      if (data && data.themes) {
        setThemes(data.themes);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar tema:', err);
    } finally {
      setLoadingThemes(false);
    }
  };

  useEffect(() => {
    fetchThemes();
    applyThemeColors(currentTheme);
  }, []);

  const selectTheme = async (theme) => {
    if (!theme) return;
    setCurrentTheme(theme);
    applyThemeColors(theme);
    try {
      await themeService.updateTheme(theme.id);
    } catch (err) {
      console.error('Gagal menyimpan tema pengguna:', err);
    }
  };

  const syncUserTheme = (userTheme) => {
    if (userTheme) {
      setCurrentTheme(userTheme);
      applyThemeColors(userTheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themes,
        currentTheme,
        selectTheme,
        syncUserTheme,
        fetchThemes,
        loadingThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
