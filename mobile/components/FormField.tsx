import React from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  Platform,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Text } from './CustomText';
import { useIsDark } from '@/theme/useIsDark';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isActive?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, isActive, ...props }) => {
  const isDark = useIsDark();

  const colors = {
    error: '#DC2626', // keep same red for consistency
    active: isDark ? '#FF7A3A' : '#F97316',
    borderDefault: isDark ? '#374151' : '#E5E7EB',
    background: isDark ? '#1E293B' : '#F9FAFB',
    text: isDark ? '#FFFFFF' : '#1F2937',
    placeholder: isDark ? '#9CA3AF' : '#9CA3AF', // same gray works on both
    label: isDark ? '#E5E7EB' : '#374151',
  };

  const getBorderColor = () => {
    if (error) {
      return colors.error;
    }
    if (isActive) {
      return colors.active;
    }
    return colors.borderDefault;
  };

  // --- FIX IS HERE: We define the base and platform styles separately ---

  // 1. Define the base styles that are common to both platforms.
  // We explicitly type this to ensure correctness.
  const baseStyles: StyleProp<TextStyle> = {
    backgroundColor: colors.background,
    color: colors.text,
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
      <Text
        className="text-sm font-semibold mb-2"
        style={{ color: colors.label }}
      >
        {label}
      </Text>
      <TextInput
        className="text-base font-regular px-4 rounded-xl"
        // 3. Pass an array to the style prop. This is the key to the fix.
        style={[baseStyles, platformStyles]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
      {error && (
        <Text className="text-sm mt-1" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default FormField;
