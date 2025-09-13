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
  const hasCustomBg = style.includes("bg-");
  const defaultBg = hasCustomBg ? "" : "bg-orange-500";

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