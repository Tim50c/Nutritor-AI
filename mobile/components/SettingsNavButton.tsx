// mobile/components/SettingsNavButton.tsx
import { icons } from "@/constants/icons"; // Your icons are imported here
import { useIsDark } from "@/theme/useIsDark";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Text } from "./CustomText";

interface SettingsNavButtonProps {
  label: string;
  route: any;
  style?: string;
  variant?: "dark" | "light"; // <-- ADD THIS PROP
}

const SettingsNavButton: React.FC<SettingsNavButtonProps> = ({
  label,
  route,
  style,
  variant = "dark", // <-- Default to 'dark'
}) => {
  const router = useRouter();
  const isDark = useIsDark();

  if (isDark) variant = "dark";

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl bg-transparent ${style || ""}`}
      activeOpacity={0.7}
      onPress={() => router.push(route)}
    >
      <Text className={`text-black dark:text-white text-base font-medium`}>
        {label}
      </Text>
      {isDark ? (
        <icons.forwardArrowDark width={20} height={20} />
      ) : (
        <icons.forwardArrow width={20} height={20} />
      )}
    </TouchableOpacity>
  );
};

export default SettingsNavButton;
