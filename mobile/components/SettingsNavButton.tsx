import React from "react";
import { Text, TouchableOpacity } from "react-native";
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
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl bg-primary-200 my-1 ${style || ''}`}
      activeOpacity={0.8}
      onPress={() => router.push(route)}
    >
      <Text className="text-white text-base font-medium">{label}</Text>
      <icons.arrow width={20} height={20} />
    </TouchableOpacity>
  );
};

export default SettingsNavButton;

