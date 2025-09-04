import React from "react";
import { View } from "react-native";
import { Text } from './CustomText';
import { useDietContext } from "@/context/DietContext";
import { Svg, Circle } from "react-native-svg";

export default function DietSummary() {
  const { summary } = useDietContext();
  const totalCalories = summary.calories;
  const percent = Math.min(totalCalories / 100, 1); // Demo: 100 kcal max for circle
  const size = 80;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = percent * circumference;

  return (
    <View className="flex-row items-center justify-center mb-6">
      {/* Circular Progress */}
      <View className="items-center mr-6">
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fff"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fff"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </Svg>
        <View className="absolute items-center justify-center w-full h-full top-0 left-0">
          <Text className="text-lg font-bold text-orange-500">{totalCalories.toFixed(2)}kcal</Text>
        </View>
      </View>
      {/* Macronutrients */}
      <View>
        <View className="flex-row items-center mb-2">
          <View className="w-3 h-3 rounded-full bg-yellow-300 mr-2" />
          <Text className="text-gray-700 font-semibold mr-2">{summary.carbs}g</Text>
          <Text className="text-gray-400">Carbohydrate</Text>
        </View>
        <View className="flex-row items-center mb-2">
          <View className="w-3 h-3 rounded-full bg-green-300 mr-2" />
          <Text className="text-gray-700 font-semibold mr-2">{summary.protein}g</Text>
          <Text className="text-gray-400">Protein</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-red-300 mr-2" />
          <Text className="text-gray-700 font-semibold mr-2">{summary.fat}g</Text>
          <Text className="text-gray-400">Fat</Text>
        </View>
      </View>
    </View>
  );
}

