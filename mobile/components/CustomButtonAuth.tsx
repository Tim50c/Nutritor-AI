import React from 'react';
import { TouchableOpacity, Text, Image, ImageSourcePropType, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'social';
  icon?: ImageSourcePropType;
  isLoading?: boolean;
  disabled?: boolean; // --- ADD THIS LINE ---
  containerStyles?: StyleProp<ViewStyle>;
}

const CustomButtonAuth: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon,
  isLoading = false,
  disabled = false, // --- ADD THIS LINE ---
  containerStyles 
}) => {
  const isPrimary = variant === 'primary';
  const isButtonDisabled = isLoading || disabled; // --- COMBINE DISABLED LOGIC ---

  // Base styles
  let buttonStyle = "w-full py-4 rounded-xl flex-row items-center justify-center";
  let textStyle = "text-base font-bold";

  // Variant-specific styles
  if (isPrimary) {
    buttonStyle += " bg-orange-500";
    textStyle += " text-white";
  } else { // Social
    buttonStyle += " bg-white border border-gray-200";
    textStyle += " text-gray-800";
  }
  
  // Style for when the button is loading or disabled
  if (isButtonDisabled) {
    buttonStyle += " opacity-60"; // Apply a single opacity style if disabled for any reason
  }

  return (
    <TouchableOpacity
      style={containerStyles}
      className={buttonStyle}
      onPress={onPress}
      disabled={isButtonDisabled} // --- USE THE COMBINED LOGIC HERE ---
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#FF5A16'} />
      ) : (
        <>
          {icon && <Image source={icon} className="w-6 h-6 mr-3" resizeMode="contain" />}
          <Text className={textStyle}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default CustomButtonAuth;