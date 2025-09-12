import React from "react";
import { TouchableOpacity, View } from "react-native";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      className={`w-12 h-7 rounded-full flex-row items-center px-1 ${
        value
          ? "bg-primary-200 dark:bg-primary-300"
          : "bg-gray-400 dark:bg-gray-600"
      }`}
      style={{ justifyContent: value ? "flex-end" : "flex-start" }}
    >
      <View
        className={`w-5 h-5 rounded-full bg-white dark:bg-gray-200 border ${
          value
            ? "border-primary-200 dark:border-primary-300"
            : "border-gray-400 dark:border-gray-600"
        }`}
        style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 }}
      />
    </TouchableOpacity>
  );
};

export default Toggle;
