import React from "react";
import { TouchableOpacity } from "react-native";
import { Text } from "./CustomText";

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: string;
  textStyle?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  onPress,
  disabled = false,
  style = "",
  textStyle = "text-white",
}) => {
  // Extract background color from style if present, otherwise use default semantic token
  const hasCustomBg = style.includes("bg-");
  // Use semantic token for accent color, with dark mode support
  const defaultBg = hasCustomBg ? "" : "bg-accent dark:bg-accent-dark";

  return (
    <TouchableOpacity
      className={`w-full py-4 rounded-2xl ${defaultBg} items-center ${disabled ? "opacity-50" : ""} ${style}`}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`${textStyle} text-base font-bold`}>{label}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
