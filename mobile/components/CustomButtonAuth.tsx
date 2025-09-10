import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet, // --- 1. IMPORT StyleSheet ---
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Text } from "./CustomText";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "social";
  icon?: ImageSourcePropType;
  isLoading?: boolean;
  disabled?: boolean;
  containerStyles?: StyleProp<ViewStyle>;
}

const CustomButtonAuth: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  icon,
  isLoading = false,
  disabled = false,
  containerStyles,
}) => {
  const isPrimary = variant === "primary";
  const isButtonDisabled = isLoading || disabled;

  // --- 2. REMOVE THE TEXT STYLE STRING ---
  // We will handle text styling with StyleSheet now.
  let buttonStyle =
    "w-full py-4 rounded-xl flex-row items-center justify-center";

  if (isPrimary) {
    buttonStyle += " bg-accent dark:bg-accent-dark";
  } else {
    buttonStyle +=
      " bg-surface dark:bg-surface-dark border border-border-default dark:border-border-default-dark";
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
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : "#FF5A16"} />
      ) : (
        <>
          {icon && (
            <Image
              source={icon}
              className="w-6 h-6 mr-3"
              resizeMode="contain"
            />
          )}

          {/* --- 3. APPLY STYLES USING THE `style` PROP --- */}
          <Text
            style={[
              styles.baseText,
              isPrimary ? styles.primaryText : styles.socialText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// --- 4. CREATE THE STYLESHEET FOR THE TEXT ---
const styles = StyleSheet.create({
  baseText: {
    fontSize: 15, // Equivalent to NativeWind's 'text-base'
    fontWeight: "700", // Use '700' or 'bold'. This is what makes the text bold.
  },
  primaryText: {
    color: "#FFFFFF", // Equivalent to 'text-white'
  },
  socialText: {
    color: "#1F2937", // Equivalent to 'text-default dark:text-default-dark'
  },
});

export default CustomButtonAuth;
