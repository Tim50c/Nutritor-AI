import React from 'react';
import { 
  TouchableOpacity, 
  Image, 
  ImageSourcePropType, 
  ActivityIndicator, 
  ViewStyle, 
  StyleProp,
  StyleSheet,
} from 'react-native';
import { Text } from './CustomText';
import { useIsDark } from '@/theme/useIsDark';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'social';
  icon?: ImageSourcePropType;
  isLoading?: boolean;
  disabled?: boolean;
  containerStyles?: StyleProp<ViewStyle>;
}

const CustomButtonAuth: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon,
  isLoading = false,
  disabled = false,
  containerStyles 
}) => {
  const isDark = useIsDark();
  const isPrimary = variant === 'primary';
  const isButtonDisabled = isLoading || disabled;

  let buttonStyle = "w-full py-4 rounded-xl flex-row items-center justify-center";

  if (isPrimary) {
    buttonStyle += " bg-orange-500";
  } else {
    buttonStyle += " bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600";
  }
  
  if (isButtonDisabled) {
    buttonStyle += " opacity-60";
  }

  return (
    <TouchableOpacity
      style={containerStyles}
      className={buttonStyle}
      onPress={onPress}
      disabled={isButtonDisabled}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : isDark ? '#FF5A16' : '#FF5A16'} />
      ) : (
        <>
          {icon && <Image source={icon} className="w-6 h-6 mr-3" resizeMode="contain" />}
          
          <Text style={[
            styles.baseText,
            isPrimary ? styles.primaryText : isDark ? styles.darkSocialText : styles.socialText
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  socialText: {
    color: '#1F2937',
  },
  darkSocialText: {
    color: '#FFFFFF',
  },
});

export default CustomButtonAuth;