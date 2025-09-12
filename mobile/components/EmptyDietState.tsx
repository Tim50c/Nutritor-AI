import { icons } from "@/constants/icons";
import React from "react";
import { View } from "react-native";
import { Text } from "./CustomText";

export default function EmptyDietState() {
  return (
    <View className="mx-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 items-center justify-center border border-gray-100 dark:border-gray-700">
      <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
        <icons.diet width={32} height={32} color="#F97316" />
      </View>

      <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
        No food logged yet
      </Text>

      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-5">
        Start tracking your nutrition by adding foods from the Home tab or using
        the search feature.
      </Text>
    </View>
  );
}
