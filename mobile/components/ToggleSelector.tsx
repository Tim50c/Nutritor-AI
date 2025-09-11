import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Text } from "./CustomText";

// Renamed interface for clarity
interface ToggleSelectorProps {
  options: string[];
  selectedOption: string;
  onSelectOption: (option: any) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

// Renamed component from Toggle to ToggleSelector
const ToggleSelector: React.FC<ToggleSelectorProps> = ({
  options,
  selectedOption,
  onSelectOption,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((option) => {
        const isSelected = selectedOption === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelectOption(option)}
            style={[styles.option, isSelected && styles.selectedOption]}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "bg-bg-surface dark:bg-bg-surface-dark",
    borderRadius: 20,
    height: 40,
    padding: 4,
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  selectedOption: {
    backgroundColor: "bg-bg-default dark:bg-bg-default-dark",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "text-secondary dark:text-secondary-dark",
  },
  selectedOptionText: {
    color: "text-default dark:text-default-dark",
  },
});

// Renamed default export
export default ToggleSelector;
