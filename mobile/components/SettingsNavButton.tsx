// mobile/components/SettingsNavButton.tsx
import { icons } from "@/constants/icons"; // Your icons are imported here
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

  // Conditional styling based on the variant
  const isLight = variant === "light";
  const containerClass = isLight
    ? `bg-transparent my-0` // Light variant has no background or margin
    : `bg-accent dark:bg-accent-dark my-1`; // Dark variant uses accent

  const textClass = isLight
    ? "text-default dark:text-default-dark" // Light variant uses semantic text
    : "text-white"; // Dark variant has white text

  const iconColor = isLight ? "#111214" : "#FFFFFF"; // Set icon color

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl ${containerClass} ${style || ""}`}
      activeOpacity={0.7}
      onPress={() => router.push(route)}
    >
      <Text className={`${textClass} text-base font-medium`}>{label}</Text>
      {/* Pass the color prop to your SVG icon component */}
      <icons.forwardArrow width={20} height={20} color={iconColor} />
    </TouchableOpacity>
  );
};

export default SettingsNavButton;
