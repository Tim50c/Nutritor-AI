import { icons } from "@/constants/icons";
import React from "react";
import { View } from "react-native";
import { Text } from "./CustomText";

export default function EmptyDietState() {
  return (
    <View className="mx-4 mb-6 bg-bg-surface dark:bg-bg-surface-dark rounded-2xl p-8 items-center justify-center border border-border-default dark:border-border-default-dark">
      <View className="w-16 h-16 bg-calories-100 rounded-full items-center justify-center mb-4">
        <icons.diet width={32} height={32} color="#F47551" />
      </View>

      <Text className="text-lg font-semibold mb-2 text-center text-default dark:text-default-dark">
        No food logged yet
      </Text>

      <Text className="text-sm text-center leading-5 text-secondary dark:text-secondary-dark">
        Start tracking your nutrition by adding foods from the Home tab or using
        the search feature.
      </Text>
    </View>
  );
}
