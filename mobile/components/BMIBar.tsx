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

const BMIBar: React.FC<BMIBarProps> = ({ bmi, status, min = 12, max = 40 }) => {
  const [barWidth, setBarWidth] = useState<number>(0);

  // Handle invalid BMI values
  if (bmi <= 0 || isNaN(bmi)) {
    return (
      <View className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
        <Text className="text-sm text-gray-500">
          BMI data not available. Please update your weight and height in
          settings.
        </Text>
      </View>
    );
  }

  // clamp percentage between 0 and 1
  const pct = Math.max(0, Math.min(1, (bmi - min) / (max - min)));

  // Get color based on position on gradient (where the marker is)
  const getTextColor = (percentage: number) => {
    // Define the gradient colors (lighter versions used in the gradient bar)
    const colors = [
      { pos: 0, color: [96, 165, 250] }, // #60A5FA - Light Blue (Underweight)
      { pos: 0.33, color: [52, 211, 153] }, // #34D399 - Light Green (Healthy)
      { pos: 0.66, color: [251, 191, 36] }, // #FBBF24 - Light Orange (Overweight)
      { pos: 1, color: [248, 113, 113] }, // #F87171 - Light Red (Obese)
    ];

    // Find the two colors to interpolate between
    let startColor = colors[0];
    let endColor = colors[1];

    for (let i = 0; i < colors.length - 1; i++) {
      if (percentage >= colors[i].pos && percentage <= colors[i + 1].pos) {
        startColor = colors[i];
        endColor = colors[i + 1];
        break;
      }
    }

    // Calculate interpolation factor
    const range = endColor.pos - startColor.pos;
    const factor = range === 0 ? 0 : (percentage - startColor.pos) / range;

    // Interpolate RGB values
    const r = Math.round(
      startColor.color[0] + (endColor.color[0] - startColor.color[0]) * factor
    );
    const g = Math.round(
      startColor.color[1] + (endColor.color[1] - startColor.color[1]) * factor
    );
    const b = Math.round(
      startColor.color[2] + (endColor.color[2] - startColor.color[2]) * factor
    );

    return `rgb(${r}, ${g}, ${b})`;
  };

  const textColor = getTextColor(pct);

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
    <View className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
      <Text className="text-sm">
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
            colors={["#60A5FA", "#34D399", "#FBBF24", "#F87171"]}
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
            <Text className="text-xs">Underweight</Text>
          </View>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#34D399" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs">Healthy</Text>
          </View>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#FBBF24" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs">Overweight</Text>
          </View>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: "#F87171" }}
              className="w-2 h-2 rounded-full mr-1"
            />
            <Text className="text-xs">Obese</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BMIBar;
