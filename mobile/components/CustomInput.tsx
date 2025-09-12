import React from "react";
import { TextInput, View } from "react-native";
import { Text } from './CustomText';
import { useIsDark } from "@/theme/useIsDark";

interface CustomInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  style?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  style = "",
}) => {
  const isDark = useIsDark();

  return (
    <View className={`mb-6 ${style}`}>
      {label && <Text className="mb-2 text-base text-black dark:text-white font-medium">{label}</Text>}
      <TextInput
        className="bg-white dark:bg-gray-800 border border-black dark:border-gray-600 rounded-2xl px-4 py-3 text-base text-black dark:text-white"
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#999" : "#888"} // We'll need isDark here
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

export default CustomInput;