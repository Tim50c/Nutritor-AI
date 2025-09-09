import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './CustomText';
import { useRouter } from 'expo-router';
import { icons } from '@/constants/icons';

interface CustomHeaderWithBackProps {
  title: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

const CustomHeaderWithBack: React.FC<CustomHeaderWithBackProps> = ({
  title,
  onBackPress,
  rightComponent,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      <TouchableOpacity
        className="bg-black w-10 h-10 rounded-full justify-center items-center"
        onPress={handleBackPress}
      >
        <View style={{ transform: [{ rotate: '0deg' }] }}>
          <icons.arrow width={20} height={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      
      <Text className="text-xl font-bold text-black flex-1 text-center">
        {title}
      </Text>
      
      <View className="w-10 h-10 justify-center items-center">
        {rightComponent}
      </View>
    </View>
  );
};

export default CustomHeaderWithBack;
