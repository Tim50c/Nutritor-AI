import { useDietContext } from "@/context/DietContext";
import React from "react";
import { View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Text } from "./CustomText";

export default function DietSummary() {
  const { summary, targetNutrition } = useDietContext();

  // Default targets if not set
  const targets = {
    calories: targetNutrition.calories || 2000,
    carbs: targetNutrition.carbs || 250,
    protein: targetNutrition.protein || 150,
    fat: targetNutrition.fat || 65,
  };

  // Calculate percentages and check if exceeded
  const caloriesPercent = (summary.calories / targets.calories) * 100;
  const carbsPercent = (summary.carbs / targets.carbs) * 100;
  const proteinPercent = (summary.protein / targets.protein) * 100;
  const fatPercent = (summary.fat / targets.fat) * 100;

  // Check if targets are exceeded
  const isCaloriesExceeded = summary.calories > targets.calories;
  const isCarbsExceeded = summary.carbs > targets.carbs;
  const isProteinExceeded = summary.protein > targets.protein;
  const isFatExceeded = summary.fat > targets.fat;

  // Progress ring component
  const ProgressRing = ({
    percentage,
    consumed,
    target,
    unit,
    color,
    label,
    isExceeded,
  }: {
    percentage: number;
    consumed: number;
    target: number;
    unit: string;
    color: string;
    label: string;
    isExceeded: boolean;
  }) => {
    // Use red color if exceeded, otherwise use the provided color
    const ringColor = isExceeded ? "#EF4444" : color;
    const textColor = isExceeded ? "text-red-500" : "text-gray-700";

    const pieData = [
      {
        value: Math.min(percentage, 100),
        color: ringColor,
        gradientCenterColor: ringColor,
      },
      {
        value: Math.max(100 - percentage, 0),
        color: "#f0f0f0",
      },
    ];

    return (
      <View className="items-center mx-2">
        <View className="relative">
          <PieChart
            data={pieData}
            donut
            radius={35}
            innerRadius={25}
            strokeWidth={1}
            strokeColor="white"
            showText={false}
            showTooltip={false}
            isThreeD={false}
            showGradient={true}
          />
          <View className="absolute inset-0 items-center justify-center">
            <Text
              className={`text-xs font-bold ${isExceeded ? "text-red-500" : "text-gray-800"}`}
            >
              {Math.round(Math.min(percentage, 100))}%
            </Text>
          </View>
        </View>
        <Text className={`text-xs font-semibold mt-2 ${textColor}`}>
          {label}
        </Text>
        <Text
          className={`text-xs ${isExceeded ? "text-red-400" : "text-gray-500"}`}
        >
          {consumed}
          {unit} / {target}
          {unit}
        </Text>
      </View>
    );
  };

  // Main calories display with gradient and exceeded logic
  const mainPieColor = isCaloriesExceeded ? "#EF4444" : "#F47551";
  const mainPieData = [
    {
      value: Math.min(caloriesPercent, 100),
      color: mainPieColor,
      gradientCenterColor: mainPieColor,
    },
    {
      value: Math.max(100 - caloriesPercent, 0),
      color: "#f0f0f0",
    },
  ];

  return (
    <View className="bg-white rounded-xl p-6 mx-4 my-4 shadow-sm">
      {/* Header */}
      <Text className="text-lg font-bold text-gray-800 text-center mb-4">
        Daily Nutrition Summary
      </Text>

      {/* Main Calories Circle */}
      <View className="items-center mb-6">
        <View className="relative">
          <PieChart
            data={mainPieData}
            donut
            radius={60}
            innerRadius={45}
            strokeWidth={2}
            strokeColor="white"
            showText={false}
            showTooltip={false}
            isThreeD={false}
            showGradient={true}
          />
          <View className="absolute inset-0 items-center justify-center">
            <Text
              className={`text-xl font-bold ${isCaloriesExceeded ? "text-red-500" : "text-gray-800"}`}
            >
              {Math.round(summary.calories)}
            </Text>
            <Text
              className={`text-xs ${isCaloriesExceeded ? "text-red-400" : "text-gray-500"}`}
            >
              kcal
            </Text>
            <Text
              className={`text-xs ${isCaloriesExceeded ? "text-red-300" : "text-gray-400"}`}
            >
              of {targets.calories}
            </Text>
          </View>
        </View>
        <View
          className={`mt-3 rounded-full px-3 py-1 ${isCaloriesExceeded ? "bg-red-100" : "bg-gray-100"}`}
        >
          <Text
            className={`text-sm font-semibold ${isCaloriesExceeded ? "text-red-600" : "text-gray-600"}`}
          >
            {Math.round(Math.min(caloriesPercent, 100))}%{" "}
            {isCaloriesExceeded ? "Exceeded" : "Complete"}
          </Text>
        </View>
      </View>

      {/* Macronutrients */}
      <View className="border-t border-gray-100 pt-4">
        <Text className="text-sm font-semibold text-gray-700 text-center mb-4">
          Macronutrients
        </Text>
        <View className="flex-row justify-around">
          <ProgressRing
            percentage={carbsPercent}
            consumed={Math.round(summary.carbs)}
            target={targets.carbs}
            unit="g"
            color="#F5F378"
            label="Carbs"
            isExceeded={isCarbsExceeded}
          />
          <ProgressRing
            percentage={proteinPercent}
            consumed={Math.round(summary.protein)}
            target={targets.protein}
            unit="g"
            color="#45C57B"
            label="Protein"
            isExceeded={isProteinExceeded}
          />
          <ProgressRing
            percentage={fatPercent}
            consumed={Math.round(summary.fat)}
            target={targets.fat}
            unit="g"
            color="#FF6F43"
            label="Fat"
            isExceeded={isFatExceeded}
          />
        </View>
      </View>

      {/* Remaining calories indicator */}
      <View className="mt-4 pt-4 border-t border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-600">
            {isCaloriesExceeded ? "Exceeded calories:" : "Remaining calories:"}
          </Text>
          <Text
            className={`text-sm font-semibold ${
              targets.calories - summary.calories >= 0
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {Math.abs(Math.round(targets.calories - summary.calories))} kcal
          </Text>
        </View>
      </View>
    </View>
  );
}
