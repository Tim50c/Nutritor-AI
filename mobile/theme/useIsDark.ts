import { useTheme } from "@/theme/ThemeProvider";
import { useColorScheme as RNUseColorScheme } from "react-native";

export function useIsDark() {
  const system = RNUseColorScheme(); // 'light' | 'dark' | null
  const { scheme } = useTheme();
  return scheme === "system" ? system === "dark" : scheme === "dark";
}
