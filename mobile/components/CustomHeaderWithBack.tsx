import { icons } from "@/constants/icons";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./CustomText";

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
    <View className="flex-row items-center justify-between px-4 py-3 bg-bg-default dark:bg-bg-default-dark">
      <TouchableOpacity
        className="bg-default dark:bg-default-dark w-10 h-10 rounded-full justify-center items-center"
        onPress={handleBackPress}
      >
        <View style={{ transform: [{ rotate: "0deg" }] }}>
          <icons.arrow width={20} height={20} color="#111214" />
        </View>
      </TouchableOpacity>

      <Text className="text-xl font-bold flex-1 text-center text-default dark:text-default-dark">
        {title}
      </Text>

      <View className="w-10 h-10 justify-center items-center">
        {rightComponent}
      </View>
    </View>
  );
};

export default CustomHeaderWithBack;
