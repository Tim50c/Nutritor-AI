import React from "react";
import { TouchableOpacity } from "react-native";
import { Text } from './CustomText';

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ label, onPress, disabled = false, style = "" }) => {
  return (
    <TouchableOpacity
      className={`w-full py-4 rounded-2xl bg-primary-200 items-center ${disabled ? 'opacity-50' : ''} ${style}`}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-white text-base font-bold">{label}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

