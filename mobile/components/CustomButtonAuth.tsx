import React from 'react';
import { TouchableOpacity, Text, Image, ImageSourcePropType, View } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'social';
  icon?: ImageSourcePropType;
}

const CustomButtonAuth: React.FC<CustomButtonProps> = ({ title, onPress, variant = 'primary', icon }) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      className={`w-full py-4 rounded-lg flex-row items-center justify-center ${
        isPrimary ? 'bg-orange-500' : 'bg-gray-700'
      }`}
      onPress={onPress}
    >
      {icon && <Image source={icon} className="w-6 h-6 mr-3" />}
      <Text className={`text-white text-base font-bold ${!isPrimary && 'text-gray-200'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButtonAuth;