import React from "react";
import { View } from "react-native";
import { Text } from "./CustomText";

interface NutritionTrendProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  period?: string;
}

// Example goals (could be fetched from user profile or context)
const PROTEIN_GOAL = 100;
const CARBS_GOAL = 250;
const FAT_GOAL = 70;

const NutritionTrend: React.FC<NutritionTrendProps> = ({
  protein,
  carbs,
  fat,
  calories,
  period,
}) => {
  // Calculate percentages
  const proteinPct = Math.round((protein / PROTEIN_GOAL) * 100);
  const carbsPct = Math.round((carbs / CARBS_GOAL) * 100);
  const fatPct = Math.round((fat / FAT_GOAL) * 100);

  return (
    <View className="rounded-lg border border-gray-200 p-4 bg-white">
      <Text className="text-center text-lg font-semibold">Nutrition Trend</Text>
      {period ? (
        <Text className="text-center text-xs text-gray-500 mt-1">
          Period: {period}
        </Text>
      ) : null}

      <View className="mt-4">
        <Text className="text-sm">Protein Intake</Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 h-3">
          <View
            style={{ width: `${Math.min(proteinPct, 100)}%` }}
            className="h-3 bg-protein-200"
          />
        </View>
        <Text className="text-xs mt-1 text-gray-500">
          {proteinPct >= 100 ? "Met" : "Meeting"} your daily protein goal •{" "}
          {proteinPct}%
        </Text>
      </View>

      <View className="mt-4">
        <Text className="text-sm">Carbohydrate Balance</Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 h-3">
          <View
            style={{ width: `${Math.min(carbsPct, 100)}%` }}
            className="h-3 bg-primary-100"
          />
        </View>
        <Text className="text-xs mt-1 text-gray-500">
          {carbsPct >= 100 ? "Above" : "Within"} recommended range • {carbsPct}%
        </Text>
      </View>

      <View className="mt-4">
        <Text className="text-sm">Fat Intake</Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 h-3">
          <View
            style={{ width: `${Math.min(fatPct, 100)}%` }}
            className="h-3 bg-calories-500"
          />
        </View>
        <Text className="text-xs mt-1 text-gray-500">
          {fatPct < 100 ? "Below" : "Above"} recommended intake • {fatPct}%
        </Text>
      </View>
    </View>
  );
};

export default NutritionTrend;
