import React from 'react';
import { View, TextInput, TextInputProps, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text } from './CustomText';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isActive?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, isActive, ...props }) => {
  const getBorderColor = () => {
    if (error) {
      return '#DC2626';
    }
    if (isActive) {
      return '#F97316';
    }
    return '#E5E7EB';
  };

  // --- FIX IS HERE: We define the base and platform styles separately ---

  // 1. Define the base styles that are common to both platforms.
  // We explicitly type this to ensure correctness.
  const baseStyles: StyleProp<TextStyle> = {
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: getBorderColor(),
    height: 56,
  };

  // 2. Define the platform-specific styles. Platform.select might return undefined,
  // but that's okay because React Native's style array will ignore it.
  const platformStyles: StyleProp<TextStyle> = Platform.select({
    ios: {
      // On iOS, paddingVertical is the best way to center text and prevent clipping.
      paddingVertical: 16,
    },
    android: {
      // On Android, textAlignVertical works perfectly.
      textAlignVertical: 'center',
      paddingVertical: 0, // Explicitly set to 0 to avoid default padding issues.
    },
  });

  return (
    <View className="w-full mb-4">
      <Text className="text-gray-700 text-sm font-semibold mb-2">{label}</Text>
      <TextInput
        className="text-base font-regular px-4 rounded-xl"
        // 3. Pass an array to the style prop. This is the key to the fix.
        style={[baseStyles, platformStyles]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="text-red-600 text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default FormField;