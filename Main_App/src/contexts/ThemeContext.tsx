import React, {createContext, useContext, useState, useEffect, PropsWithChildren} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@signvision_theme_is_dark';

export function ThemeProvider({children}: PropsWithChildren) {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(value => {
      if (value === 'true') {
        setIsDark(true);
      }
      setIsLoaded(true);
    });
  }, []);

  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, String(newDark));
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{isDark, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
}
