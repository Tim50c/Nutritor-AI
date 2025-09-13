import { View } from "react-native";
import { Text } from "./CustomText";
import { Svg, Path } from "react-native-svg";
import { useDietContext } from "@/context/DietContext";
import LoadingSpinner from "./LoadingSpinner";

interface MacroProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function MacroItem({ label, current, target, color }: MacroProps) {
  const viewClassName: string = `h-1 rounded-full ${color}`;

  return (
    <View className="items-center">
      <Text className="text-sm font-medium mb-1 dark:text-white">{label}</Text>
      <View className="w-12 h-1 bg-gray-200 rounded-full">
        <View
          className={viewClassName}
          style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
        />
      </View>
      <Text className="text-xs text-gray-500 dark:text-gray-200 mt-1">
        {current.toFixed(1)}/{target}g
      </Text>
    </View>
  );
}

interface CircularProgressProps {
  current: number;
  target: number;
}

function CircularProgress({ current, target }: CircularProgressProps) {
  // Use 600/1000 for demo to match screenshot
  const percentage = Math.min((current / target) * 100, 100);
  const strokeWidth = 12; // Thicker stroke for better visibility
  const radius = 60;
  const centerX = 70;
  const centerY = 70;
  const width = 140;
  const height = 70;

  const semicircleCircumference = Math.PI * radius;
  const progressLength = (percentage / 100) * semicircleCircumference;

  // Helper to describe an SVG arc path for a semicircle
  const describeArc = (x: number, y: number, r: number) => {
    const startX = x - r;
    const startY = y;
    const endX = x + r;
    const endY = y;
    return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
  };

  return (
    <View className="items-center justify-center">
      <View className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 p-2">
        <Svg width={width} height={height}>
          {/* Background semicircle */}
          <Path
            d={describeArc(centerX, centerY, radius)}
            stroke="#D9D9D9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress semicircle */}
          <Path
            d={describeArc(centerX, centerY, radius)}
            stroke="#FF5A16"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={semicircleCircumference}
            strokeDashoffset={semicircleCircumference - progressLength}
            strokeLinecap="round"
          />
        </Svg>
        <View className="items-center -mt-6">
          <Text className="text-lg font-semibold mb-1 dark:text-gray-200">
            Calories
          </Text>
          <Text className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            {current}/{target}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TodaySummary({
  loading = false,
}: {
  loading?: boolean;
}) {
  const {
    homeSummary,
    targetNutrition,
    loading: contextLoading,
    syncing,
  } = useDietContext();
  const isLoading = loading || contextLoading;

  // Show loading state if needed
  if (isLoading) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <Text className="text-lg font-semibold mb-6">Today Summary</Text>
        <View className="items-center mb-8">
          <Text className="text-gray-500 dark:text-gray-200">Loading...</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-500 dark:text-gray-200">Loading...</Text>
        </View>
      </View>
    );
  }

  const calorieData = {
    current: homeSummary.calories,
    target: targetNutrition.calories,
  };

  const macroData = [
    {
      label: "Protein",
      current: homeSummary.protein,
      target: targetNutrition.protein,
      color: "bg-protein-100",
    },
    {
      label: "Fats",
      current: homeSummary.fat,
      target: targetNutrition.fat,
      color: "bg-fats-100",
    },
    {
      label: "Carbs",
      current: homeSummary.carbs,
      target: targetNutrition.carbs,
      color: "bg-carbs-300",
    },
  ];

  return (
    <View className="bg-white dark:bg-black rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-lg font-semibold dark:text-gray-200">
          Today Summary
        </Text>
        {syncing && (
          <View className="flex-row items-center">
            <LoadingSpinner isProcessing={true} size={14} color="#F97316" />
            <Text className="text-xs text-orange-500 ml-1">Syncing...</Text>
          </View>
        )}
      </View>

      {/* Circular Progress */}
      <View className="items-center mb-8">
        <CircularProgress
          current={calorieData.current}
          target={calorieData.target}
        />
      </View>

      {/* Macros */}
      <View className="flex-row justify-between">
        {macroData.map((macro, index) => (
          <MacroItem
            key={index}
            label={macro.label}
            current={macro.current}
            target={macro.target}
            color={macro.color}
          />
        ))}
      </View>
    </View>
  );
}
