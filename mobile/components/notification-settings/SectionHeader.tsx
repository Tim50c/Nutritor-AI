import { icons } from "@/constants/icons";
import React from "react";
import { Animated, View } from "react-native";
import { Text } from "../CustomText";
import Toggle from "../Toggle";
import { useIsDark } from "@/theme/useIsDark";

interface SectionHeaderProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  rotationValue: Animated.Value;
}

const SectionHeader = ({
  title,
  description,
  enabled,
  onToggle,
  rotationValue,
}: SectionHeaderProps) => {
  const isDark = useIsDark();
  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center flex-1">
        <Animated.View
          className="mr-3.5"
          style={{
            transform: [
              {
                rotate: rotationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "90deg"],
                }),
              },
            ],
          }}
        >
          {isDark ? (
            <icons.forwardArrowDark width={16} height={16} />
          ) : (
            <icons.forwardArrow width={16} height={16} />
          )}
        </Animated.View>
        <View className="flex-[0.9]">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{description}</Text>
        </View>
      </View>
      <Toggle value={enabled} onValueChange={onToggle} />
    </View>
  );
};

export default SectionHeader;