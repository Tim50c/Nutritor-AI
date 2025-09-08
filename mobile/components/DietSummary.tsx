import { useDietContext } from "@/context/DietContext";
import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Easing } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Text } from "./CustomText";
import LoadingSpinner from "./LoadingSpinner";

// A new component for the simplified macro display, now with animated text.
const MacroItem = ({
  label,
  color,
  animatedValue, // We pass the Animated.Value directly
}: {
  label: string;
  color: string;
  animatedValue: Animated.Value;
}) => {
  const [displayText, setDisplayText] = useState("0");

  useEffect(() => {
    // This listener updates a state variable, which guarantees a re-render.
    const listenerId = animatedValue.addListener((animation) => {
      // Remove decimal places for macros
      const newValue = Math.round(animation.value).toString();
      if (newValue !== displayText) {
        console.log(`🎨 [MacroItem-${label}] Animation value: ${animation.value} -> ${newValue}`);
        setDisplayText(newValue);
      }
    });

    // Also set initial value
    animatedValue.addListener(({ value }) => {
      if (value === 0) {
        console.log(`🎨 [MacroItem-${label}] Initial value set to 0`);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, label, displayText]);

  return (
    <View className="flex-row items-center mb-4">
      {/* The new indicator style: a colored dot inside a grey circle */}
      <View className="w-10 h-10 bg-gray-100 rounded-full justify-center items-center mr-4">
        <View
          style={{ backgroundColor: color }}
          className="w-4 h-4 rounded-full"
        />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800">
          {displayText}g
        </Text>
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
    </View>
  );
};

export default function DietSummary() {
  const { summary, targetNutrition, loading } = useDietContext();

  // Animation values for each metric
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const caloriesAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const proteinAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;

  // State for the main calorie text to fix the re-render bug
  const [animatedCalorieText, setAnimatedCalorieText] = useState("0");
  const [pieChartData, setPieChartData] = useState([
    { value: 0, color: "#F97316" },
    { value: 100, color: "#F3F4F6" },
  ]);

  // Listener for the main calorie animation
  useEffect(() => {
    const listenerId = caloriesAnim.addListener((animation) => {
      // Remove decimal places for calories
      const roundedValue = Math.round(animation.value);
      setAnimatedCalorieText(roundedValue.toString());
      
      // Update pie chart data synchronously with animation
      const targets = { calories: targetNutrition?.calories || 2000 };
      const animatedCaloriesPercent = (roundedValue / (targets.calories || 1)) * 100;
      setPieChartData([
        { value: Math.min(animatedCaloriesPercent, 100), color: "#F97316" },
        { value: Math.max(100 - animatedCaloriesPercent, 0), color: "#F3F4F6" },
      ]);
    });
    return () => {
      caloriesAnim.removeListener(listenerId);
    };
  }, [caloriesAnim, targetNutrition]);

  // Fallback targets for calculating progress
  const targets = {
    calories: targetNutrition?.calories || 2000,
  };

  // Trigger animations when data changes (not when loading changes)
  useEffect(() => {
    // Only animate if we have actual data and not loading
    if (!loading && (summary.calories > 0 || summary.carbs > 0 || summary.protein > 0 || summary.fat > 0)) {
      console.log("🎨 [DietSummary] Starting animations with data:", summary);
      
      // Small delay to ensure component is mounted
      const timeoutId = setTimeout(() => {
        const animations = [
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(caloriesAnim, {
            toValue: summary.calories,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(carbsAnim, {
            toValue: summary.carbs,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(proteinAnim, {
            toValue: summary.protein,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(fatAnim, {
            toValue: summary.fat,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ];
        
        console.log("🎨 [DietSummary] Animation started!");
        Animated.parallel(animations).start(() => {
          console.log("🎨 [DietSummary] Animation completed!");
        });
      }, 150);
      
      return () => clearTimeout(timeoutId);
    } else if (!loading) {
      // If no data, show zeros but still animate the fade in
      console.log("🎨 [DietSummary] No data to animate, showing zeros");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [summary.calories, summary.carbs, summary.protein, summary.fat, loading]); // Remove summary from dependencies

  // Reset animations when starting to load new data
  useEffect(() => {
    if (loading) {
      fadeAnim.setValue(0);
      caloriesAnim.setValue(0);
      carbsAnim.setValue(0);
      proteinAnim.setValue(0);
      fatAnim.setValue(0);
      setAnimatedCalorieText("0");
      setPieChartData([
        { value: 0, color: "#F97316" },
        { value: 100, color: "#F3F4F6" },
      ]);
    }
  }, [loading]);

  if (loading) {
    return (
      <View className="h-48 items-center justify-center">
        <LoadingSpinner isProcessing={true} size={50} color="#F97316" />
      </View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View className="mx-4 mb-6">
        <Text className="text-xl font-bold text-gray-800 mb-4 ml-2">Today's Diet</Text>
        <View className="flex-row items-center justify-between bg-white rounded-2xl p-6 shadow-sm">
          {/* Left Side: Calorie Donut Chart */}
          <View className="relative w-[140px] h-[140px] items-center justify-center">
            <PieChart
              data={pieChartData}
              donut
              radius={65}
              innerRadius={50} // Bigger ring
              showText={false}
              showTooltip={false}
            />
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-2xl font-extrabold text-orange-500">
                {animatedCalorieText}
              </Text>
              <Text className="text-sm text-gray-500">kcal</Text>
            </View>
          </View>

          {/* Right Side: Macronutrient List */}
          <View className="flex-1 ml-8 justify-center">
            <MacroItem
              label="Carbohydrate"
              color="#FBBF24" // Amber-400
              animatedValue={carbsAnim}
            />
            <MacroItem
              label="Protein"
              color="#34D399" // Emerald-400
              animatedValue={proteinAnim}
            />
            <MacroItem
              label="Fat"
              color="#F87171" // Red-400
              animatedValue={fatAnim}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}