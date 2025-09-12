// /app/components/BMIBar.tsx
import React, { useState } from "react";
import { View, LayoutChangeEvent } from "react-native";
import { Text } from "./CustomText";
import { LinearGradient } from "expo-linear-gradient";

interface BMIBarProps {
  bmi: number;
  status: string;
  /** optional scale bounds (defaults are reasonable) */
  min?: number;
  max?: number;
}

const BMIBar: React.FC<BMIBarProps> = ({ bmi, status, min = 15, max = 35 }) => {
  const [barWidth, setBarWidth] = useState<number>(0);

  // Handle invalid BMI values
  if (bmi <= 0 || isNaN(bmi)) {
    return (
      <View className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-4">
        <Text className="text-sm text-gray-500 dark:text-gray-100">
          BMI data not available. Please update your weight and height in
          settings.
        </Text>
      </View>
    );
  }

  // clamp percentage between 0 and 1
  const pct = Math.max(0, Math.min(1, (bmi - min) / (max - min)));

  // Get color based on BMI status to match legend
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Underweight":
        return "#60A5FA"; // Light Blue - matches legend
      case "Healthy":
      case "Normal weight":
        return "#34D399"; // Light Green - matches legend
      case "Overweight":
        return "#FBBF24"; // Light Orange - matches legend
      case "Obese":
      case "Obesity":
        return "#F87171"; // Light Red - matches legend
      default:
        return "#6B7280"; // Gray for unknown
    }
  };

  const textColor = getStatusColor(status);

  // Calculate gradient stops based on BMI ranges
  // Underweight: 15-18.5, Normal: 18.5-24.9, Overweight: 25-29.9, Obese: 30-35
  const underweightEnd = (18.5 - min) / (max - min); // ~17.5%
  const normalEnd = (24.9 - min) / (max - min); // ~49.5%
  const overweightEnd = (29.9 - min) / (max - min); // ~74.5%

  // Use lighter versions for the gradient
  const lightColors = ["#60A5FA", "#34D399", "#FBBF24", "#F87171"]; // Lighter versions

  // marker dimensions (px)
  const MARKER_WIDTH = 2;
  const MARKER_HEIGHT = 28; // extends above the bar
  const MARKER_OFFSET_TOP = -8; // to place marker slightly above the bar

  // compute left in px once we know the bar width
  const markerLeft = barWidth ? pct * barWidth - MARKER_WIDTH / 2 : 0;

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-4">
      <Text className="text-sm text-black dark:text-white">
        Your weight is{" "}
        <Text style={{ color: textColor }} className="font-semibold">
          {status}
        </Text>
      </Text>

      <Text style={{ color: textColor }} className="mt-2 text-xl font-bold">
        BMI {bmi.toFixed(2)}
      </Text>

      <View className="mt-4">
        {/* Gradient bar container */}
        <View
          onLayout={onBarLayout}
          // height is handled by style below; keep full width via className
          className="w-full rounded-full overflow-hidden"
          style={{ height: 12, position: "relative" }}
        >
          {/* LinearGradient fills the container horizontally */}
          <LinearGradient
            colors={[
              "#60A5FA",
              "#60A5FA",
              "#34D399",
              "#34D399",
              "#FBBF24",
              "#FBBF24",
              "#F87171",
              "#F87171",
            ]}
            locations={[
              0,
              underweightEnd,
              underweightEnd,
              normalEnd,
              normalEnd,
              overweightEnd,
              overweightEnd,
              1,
            ]}
            start={[0, 0]}
            end={[1, 0]}
            style={{ flex: 1 }}
          />

          {/* Marker: vertical line positioned absolutely */}
          {barWidth > 0 && (
            <View
              style={{
                position: "absolute",
                left: markerLeft,
                top: MARKER_OFFSET_TOP,
                width: MARKER_WIDTH,
                height: MARKER_HEIGHT,
                backgroundColor: "#000000", // Black marker
                borderRadius: 1,
              }}
            />
          )}
        </View>

        {/* labels under the bar */}
        <View className="flex-row justify-between mt-2">
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#60A5FA" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs text-black dark:text-white">{"Underweight\n< 18.5"}</Text>
          </View>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#34D399" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs text-black dark:text-white">{"Normal\n18.5 – 24.9"}</Text>
          </View>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#FBBF24" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs text-black dark:text-white">{"Overweight\n25 – 29.9"}</Text>
          </View>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#F87171" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs text-black dark:text-white">{"Obesity\n≥ 30"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BMIBar;