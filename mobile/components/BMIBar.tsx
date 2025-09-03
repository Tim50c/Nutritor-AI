// /app/components/BMIBar.tsx
import React, { useState } from "react";
import { View, LayoutChangeEvent } from "react-native";
import { Text } from './CustomText';
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

  // clamp percentage between 0 and 1
  const pct = Math.max(0, Math.min(1, (bmi - min) / (max - min)));

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
        <Text className="text-green-500 font-semibold">{status}</Text>
      </Text>

      <Text className="mt-2 text-xl font-bold">BMI {bmi.toFixed(2)}</Text>

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
            colors={["#009FFA", "#23D154", "#DCF805", "#FF0000"]}
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
                backgroundColor: "#111827", // dark marker (you can change color)
                borderRadius: 1,
              }}
            />
          )}
        </View>

        {/* labels under the bar */}
        <View className="flex-row justify-between mt-2">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-bmi-under mr-1" />
            <Text className="text-xs">Underweight</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-bmi-healthy mr-1" />
            <Text className="text-xs">Healthy</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-bmi-over mr-1" />
            <Text className="text-xs">Overweight</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-bmi-obese mr-1" />
            <Text className="text-xs">Obese</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BMIBar;