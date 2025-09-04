import React from "react";
import { TextInput, View } from "react-native";
import { Text } from './CustomText';

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
  return (
    <View className={`mb-6 ${style}`}>
      {label && <Text className="mb-2 text-base text-black font-medium">{label}</Text>}
      <TextInput
        className="bg-white border border-black rounded-2xl px-4 py-3 text-base text-black"
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

export default CustomInput;

