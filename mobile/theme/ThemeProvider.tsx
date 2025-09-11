import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  useColorScheme as RNUseColorScheme,
  View,
} from "react-native";

import { useColorScheme as useNativeWindColorScheme } from "nativewind"; // NativeWind hook
import type { ThemeScheme } from "./types";
import { THEME_KEY } from "./types";

type ThemeContextType = {
  scheme: ThemeScheme;
  setScheme: (s: ThemeScheme) => Promise<void>;
  isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const system = RNUseColorScheme(); // 'light' | 'dark' | null
  const nativewind = useNativeWindColorScheme(); // gives { colorScheme, setColorScheme, toggleColorScheme }
  const { setColorScheme: setNWColorScheme } = nativewind;

  const [scheme, setSchemeState] = useState<ThemeScheme>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // load saved preference once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_KEY);
        if (raw === "light" || raw === "dark" || raw === "system") {
          setSchemeState(raw);
          // tell NativeWind to use that scheme
          setNWColorScheme(raw);
        } else {
          // default: follow system (so NativeWind reacts to system)
          setSchemeState("system");
          setNWColorScheme("system");
        }
      } catch (e) {
        console.warn("Failed to load theme preference", e);
        setSchemeState("system");
        setNWColorScheme("system");
      } finally {
        setIsLoaded(true);
      }
    })();
  }, [setNWColorScheme]);

  // helper to set and persist user selection
  const setScheme = useCallback(
    async (s: ThemeScheme) => {
      try {
        await AsyncStorage.setItem(THEME_KEY, s);
      } catch (e) {
        console.warn("Failed to save theme preference", e);
      }
      setSchemeState(s);
      // NativeWind accepts 'light'|'dark'|'system'
      setNWColorScheme(s);
    },
    [setNWColorScheme]
  );

  // If user picks 'system', NativeWind will follow device. (set as 'system' above)
  // We render a loader until we know the stored preference to avoid a flash
  if (!isLoaded) {
    // You can replace with your splash screen / placeholder
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ scheme, setScheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

// convenience hook
export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
