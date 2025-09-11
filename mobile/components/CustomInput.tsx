import React from "react";
import { TextInput, View } from "react-native";
import { Text } from "./CustomText";

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
      {label && (
        <Text className="mb-2 text-base font-medium text-default dark:text-default-dark">
          {label}
        </Text>
      )}
      <TextInput
        className="bg-bg-surface dark:bg-bg-surface-dark border border-border-default dark:border-border-default-dark rounded-2xl px-4 py-3 text-base text-default dark:text-default-dark"
        placeholder={placeholder}
        placeholderTextColor="#A7A9AC"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

export default CustomInput;
