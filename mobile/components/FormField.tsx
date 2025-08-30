import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isActive?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, isActive, ...props }) => {
  // This function determines the border color based on the component's state
  const getBorderColor = () => {
    if (error) {
      // If there is an error, the border is always orange/red
      return '#C93838';
    }
    if (isActive) {
      // If the field is active (focused), the border is white
      return '#FFFFFF';
    }
    // The default, inactive border color is gray
    return '#4B5563'; // Tailwind's gray-600
  };

  return (
    <View className="w-full mb-4">
      <Text className="text-gray-400 text-sm font-medium mb-2">{label}</Text>
      <TextInput
        className="text-white text-base font-normal px-4 py-3 rounded-lg"
        // The style prop dynamically applies the border color
        style={{ borderWidth: 1, borderColor: getBorderColor() }}
        placeholderTextColor="#9CA3AF" // Tailwind's gray-400
        {...props}
      />
      {/* This text only appears if an error message is passed in */}
      {error && <Text className="text-orange-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default FormField;