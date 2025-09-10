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
      className={`w-12 h-7 rounded-full flex-row items-center px-1 ${value ? "bg-accent dark:bg-accent-dark" : "bg-secondary dark:bg-secondary-dark"}`}
      style={{ justifyContent: value ? "flex-end" : "flex-start" }}
    >
      <View
        className={`w-5 h-5 rounded-full bg-bg-default dark:bg-bg-default-dark border ${value ? "border-accent dark:border-accent-dark" : "border-secondary dark:border-secondary-dark"}`}
        style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 }}
      />
    </TouchableOpacity>
  );
};

export default Toggle;
