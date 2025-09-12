import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from './CustomText';
import { useIsDark } from '@/theme/useIsDark';

// Renamed interface for clarity
interface ToggleSelectorProps {
  options: string[];
  selectedOption: string;
  onSelectOption: (option: any) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

// Renamed component from Toggle to ToggleSelector
const ToggleSelector: React.FC<ToggleSelectorProps> = ({ options, selectedOption, onSelectOption, containerStyle }) => {
  const isDark = useIsDark();

  const colors = {
    containerBg: isDark ? '#1E293B' : '#F3F4F6',
    optionText: isDark ? '#D1D5DB' : '#6B7280',
    selectedOptionBg: isDark ? '#334155' : '#FFFFFF',
    selectedOptionText: isDark ? '#FFFFFF' : '#1F2937',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.containerBg }, containerStyle]}>
      {options.map((option) => {
        const isSelected = selectedOption === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelectOption(option)}
            style={[
              styles.option,
              isSelected && [styles.selectedOption, { backgroundColor: colors.selectedOptionBg }],
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.optionText },
                isSelected && { ...styles.selectedOptionText, color: colors.selectedOptionText },
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
    flexDirection: 'row',
    borderRadius: 20,
    height: 40,
    padding: 4,
  },
  option: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  selectedOption: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280', // fallback
  },
  selectedOptionText: {
    color: '#1F2937', // fallback
  },
});

// Renamed default export
export default ToggleSelector;
