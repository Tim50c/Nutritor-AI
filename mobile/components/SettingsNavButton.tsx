// mobile/components/SettingsNavButton.tsx
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons"; // Your icons are imported here

interface SettingsNavButtonProps {
  label: string;
  route: any;
  style?: string;
  variant?: 'dark' | 'light'; // <-- ADD THIS PROP
}

const SettingsNavButton: React.FC<SettingsNavButtonProps> = ({ 
  label, 
  route, 
  style, 
  variant = 'dark' // <-- Default to 'dark'
}) => {
  const router = useRouter();

  // Conditional styling based on the variant
  const isLight = variant === 'light';
  const containerClass = isLight 
    ? `bg-transparent my-0` // Light variant has no background or margin
    : `bg-primary-200 my-1`; // Dark variant keeps original style

  const textClass = isLight 
    ? 'text-black' // Light variant has black text
    : 'text-white'; // Dark variant has white text

  const iconColor = isLight ? '#000000' : '#FFFFFF'; // Set icon color

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl ${containerClass} ${style || ''}`}
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