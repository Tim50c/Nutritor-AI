import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";

interface SettingsNavButtonProps {
  label: string;
  route: any;
  style?: string;
}

const SettingsNavButton: React.FC<SettingsNavButtonProps> = ({ label, route, style }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl bg-primary-200 mb-3 ${style || ''}`}
      activeOpacity={0.8}
      onPress={() => router.push(route)}
    >
      <Text className="text-white text-base font-medium">{label}</Text>
      <Image source={icons.settings} className="w-5 h-5 tint-white" style={{ tintColor: '#fff', transform: [{ rotate: '270deg' }] }} />
    </TouchableOpacity>
  );
};

export default SettingsNavButton;

