import React from "react";
import { View } from "react-native";
import { Text } from "./CustomText";

interface NutritionTrendProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  period?: string;
  mode?: "daily" | "weekly" | "monthly";
  targetNutrition?: {
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Default daily goals (used as fallback)
const DEFAULT_PROTEIN_GOAL = 100;
const DEFAULT_CARBS_GOAL = 250;
const DEFAULT_FAT_GOAL = 70;

const NutritionTrend: React.FC<NutritionTrendProps> = ({
  protein,
  carbs,
  fat,
  calories,
  period,
  mode = "daily",
  targetNutrition,
}) => {
  // Calculate target values based on mode and user's target nutrition
  const getTargetValues = () => {
    let multiplier = 1;

    if (mode === "weekly") {
      multiplier = 7;
    } else if (mode === "monthly") {
      // Calculate actual days in the month
      multiplier = getDaysInMonth();
    }

    if (!targetNutrition) {
      // Use default values
      console.log(
        `🎯 Using default targets for ${mode} mode (multiplier: ${multiplier})`
      );
      return {
        proteinGoal: DEFAULT_PROTEIN_GOAL * multiplier,
        carbsGoal: DEFAULT_CARBS_GOAL * multiplier,
        fatGoal: DEFAULT_FAT_GOAL * multiplier,
      };
    }

    // Use user's target nutrition with appropriate multiplier
    console.log(`🎯 Using user targets for ${mode} mode:`, {
      dailyTargets: targetNutrition,
      multiplier,
      calculatedTargets: {
        protein: targetNutrition.protein * multiplier,
        carbs: targetNutrition.carbs * multiplier,
        fat: targetNutrition.fat * multiplier,
      },
    });
    return {
      proteinGoal: targetNutrition.protein * multiplier,
      carbsGoal: targetNutrition.carbs * multiplier,
      fatGoal: targetNutrition.fat * multiplier,
    };
  };

  // Helper function to get the actual number of days in the month
  const getDaysInMonth = (): number => {
    if (!period) {
      // If no period specified, use current month
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }

    try {
      // Try to parse the period to extract year and month
      // Period formats could be: "2025-09", "2025-09-01", "September 2025", etc.
      let year: number, month: number;

      if (period.match(/^\d{4}-\d{2}$/)) {
        // Format: "2025-09"
        const [yearStr, monthStr] = period.split("-");
        year = parseInt(yearStr);
        month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
      } else if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Format: "2025-09-01"
        const [yearStr, monthStr] = period.split("-");
        year = parseInt(yearStr);
        month = parseInt(monthStr) - 1;
      } else {
        // Try to parse as a date string
        const date = new Date(period);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear();
          month = date.getMonth();
        } else {
          // Fallback to current month
          console.warn(
            `🗓️ Could not parse period "${period}", using current month`
          );
          const now = new Date();
          year = now.getFullYear();
          month = now.getMonth();
        }
      }

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      console.log(`🗓️ Calculated days in month for period "${period}":`, {
        year,
        month: month + 1,
        daysInMonth,
      });

      return daysInMonth;
    } catch (error) {
      console.error(`🗓️ Error parsing period "${period}":`, error);
      // Fallback to current month
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }
  };

  const { proteinGoal, carbsGoal, fatGoal } = getTargetValues();

  // Calculate percentages
  const proteinPct = Math.round((protein / proteinGoal) * 100);
  const carbsPct = Math.round((carbs / carbsGoal) * 100);
  const fatPct = Math.round((fat / fatGoal) * 100);

  // Get period display text
  const getPeriodText = () => {
    if (mode === "weekly") return "Weekly";
    if (mode === "monthly") return "Monthly";
    return "Daily";
  };

  return (
    <View className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-black">
      <Text className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
        {getPeriodText()} Nutrition Trend
      </Text>

      {period ? (
        <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
          Period: {period}
        </Text>
      ) : null}

      {/* Protein */}
      <View className="mt-4">
        <Text className="text-sm text-gray-800 dark:text-gray-100">
          Protein Intake
        </Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 h-3">
          <View
            style={{ width: `${Math.min(proteinPct, 100)}%` }}
            className="h-3 bg-protein-200"
          />
        </View>
        <Text className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          {proteinPct >= 100 ? "Met" : "Meeting"} your {mode} protein goal •{" "}
          {proteinPct}%
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500">
          {protein.toFixed(1)}g / {proteinGoal.toFixed(1)}g
        </Text>
      </View>

      {/* Carbs */}
      <View className="mt-4">
        <Text className="text-sm text-gray-800 dark:text-gray-100">
          Carbohydrate Balance
        </Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 h-3">
          <View
            style={{ width: `${Math.min(carbsPct, 100)}%` }}
            className="h-3 bg-primary-100"
          />
        </View>
        <Text className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          {carbsPct >= 100 ? "Above" : "Within"} recommended range • {carbsPct}%
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500">
          {carbs.toFixed(1)}g / {carbsGoal.toFixed(1)}g
        </Text>
      </View>

      {/* Fat */}
      <View className="mt-4">
        <Text className="text-sm text-gray-800 dark:text-gray-100">
          Fat Intake
        </Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 h-3">
          <View
            style={{ width: `${Math.min(fatPct, 100)}%` }}
            className="h-3 bg-calories-500"
          />
        </View>
        <Text className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          {fatPct < 100 ? "Below" : "Above"} recommended intake • {fatPct}%
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500">
          {fat.toFixed(1)}g / {fatGoal.toFixed(1)}g
        </Text>
      </View>
    </View>
  );
};

export default NutritionTrend;
