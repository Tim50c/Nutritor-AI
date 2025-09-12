import { useDietContext } from "@/context/DietContext";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Text } from "./CustomText";
import LoadingSpinner from "./LoadingSpinner";
import { useIsDark } from "@/theme/useIsDark";

// A new component for the simplified macro display, now with animated text and progress.
const MacroItem = ({
  label,
  color,
  animatedValue, // We pass the Animated.Value directly
  targetValue, // Target value for calculating progress
}: {
  label: string;
  color: string;
  animatedValue: Animated.Value;
  targetValue: number;
}) => {
  const [displayText, setDisplayText] = useState("0");
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // This listener updates both text and progress, which guarantees a re-render.
    const listenerId = animatedValue.addListener((animation) => {
      // Remove decimal places for macros
      const newValue = Math.round(animation.value);
      const newText = newValue.toString();
      const newProgress = Math.min((newValue / (targetValue || 1)) * 100, 100);

      if (newText !== displayText || newProgress !== progressPercent) {
        setDisplayText(newText);
        setProgressPercent(newProgress);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, label, displayText, progressPercent, targetValue]);

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm text-gray-500 dark:text-gray-200">{label}</Text>
        <Text className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {displayText}g
        </Text>
      </View>

      {/* Animated Progress Bar */}
      <View className="h-2 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
        <View
          style={{
            width: `${progressPercent}%`,
            backgroundColor: color,
            height: "100%",
          }}
          className="rounded-full"
        />
      </View>
    </View>
  );
};

export default function DietSummary({
  isTabFocused = false,
}: {
  isTabFocused?: boolean;
}) {
  const { dietSummary, targetNutrition, loading, syncing } = useDietContext();
  const isDark = useIsDark();

  // Animation values for each metric
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const caloriesAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const proteinAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;

  // Animation control for cancellation during rapid updates
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isAnimatingRef = useRef(false);

  // State for the main calorie text to fix the re-render bug
  const [animatedCalorieText, setAnimatedCalorieText] = useState("0");
  const [pieChartData, setPieChartData] = useState([
    { value: 0, color: "#F97316" },
    { value: 100, color: isDark ? "#050505" : "#F3F4F6" },
  ]);

  // Optimized listener for the main calorie animation with throttling
  useEffect(() => {
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps

    const listenerId = caloriesAnim.addListener((animation) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      // Remove decimal places for calories
      const roundedValue = Math.round(animation.value);
      setAnimatedCalorieText(roundedValue.toString());

      // Update pie chart data synchronously with animation
      const targets = { calories: targetNutrition?.calories || 2000 };
      const animatedCaloriesPercent =
        (roundedValue / (targets.calories || 1)) * 100;
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

  // Optimized animation trigger with debouncing and cancellation
  useEffect(() => {
    // Cancel any running animation
    if (animationRef.current && isAnimatingRef.current) {
      animationRef.current.stop();
      isAnimatingRef.current = false;
    }

    // Only animate if we have actual data, not loading, AND tab is focused
    if (
      !loading &&
      isTabFocused &&
      (dietSummary.calories > 0 ||
        dietSummary.carbs > 0 ||
        dietSummary.protein > 0 ||
        dietSummary.fat > 0)
    ) {
      console.log(
        "🎨 [DietSummary] Starting optimized animations with data:",
        dietSummary
      );

      // Immediate updates for snappy feel, then animate
      setAnimatedCalorieText(dietSummary.calories.toString());

      // Reduced animation duration for snappier feel
      const animations = [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300, // Reduced from 600ms
          useNativeDriver: true,
        }),
        Animated.timing(caloriesAnim, {
          toValue: dietSummary.calories,
          duration: 400, // Reduced from 1000ms
          easing: Easing.out(Easing.quad), // Lighter easing than cubic
          useNativeDriver: false,
        }),
        Animated.timing(carbsAnim, {
          toValue: dietSummary.carbs,
          duration: 400, // Reduced from 1000ms
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(proteinAnim, {
          toValue: dietSummary.protein,
          duration: 400, // Reduced from 1000ms
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(fatAnim, {
          toValue: dietSummary.fat,
          duration: 400, // Reduced from 1000ms
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ];

      isAnimatingRef.current = true;
      animationRef.current = Animated.parallel(animations);

      animationRef.current.start(({ finished }) => {
        if (finished) {
          console.log("🎨 [DietSummary] Animation completed!");
          isAnimatingRef.current = false;
        }
      });
    } else if (!loading && isTabFocused) {
      // If no data but tab is focused, show zeros but still animate the fade in quickly
      console.log("🎨 [DietSummary] No data to animate, showing zeros");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200, // Even faster for no-data case
        useNativeDriver: true,
      }).start();
    }
  }, [
    dietSummary.calories,
    dietSummary.carbs,
    dietSummary.protein,
    dietSummary.fat,
    loading,
    isTabFocused, // Add isTabFocused to dependencies
  ]); // Remove summary from dependencies

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
        { value: 100, color: isDark ? "#050505" : "#F3F4F6" },
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

  // Don't display anything if no food is logged
  const hasAnyFood =
    dietSummary.calories > 0 ||
    dietSummary.carbs > 0 ||
    dietSummary.protein > 0 ||
    dietSummary.fat > 0;
  if (!hasAnyFood) {
    return null;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View className="mx-4 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-800 dark:text-gray-200 ml-2">
            Diet Summary
          </Text>
          {syncing && (
            <View className="flex-row items-center mr-2">
              <LoadingSpinner isProcessing={true} size={16} color="#F97316" />
              <Text className="text-sm text-orange-500 ml-2">Syncing...</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center justify-between bg-white dark:bg-black rounded-2xl p-6 shadow-sm">
          {/* Left Side: Calorie Donut Chart */}
          <View className="relative w-[140px] h-[140px] items-center justify-center">
            <PieChart
              data={pieChartData}
              donut
              radius={65}
              innerRadius={50} // Bigger ring
              showText={false}
              showTooltip={false}
              backgroundColor={isDark ? "#050505" : "#F3F4F6"}
            />
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-2xl font-extrabold text-orange-500 dark:text-orange-200">
                {animatedCalorieText}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-300">kcal</Text>
            </View>
          </View>

          {/* Right Side: Macronutrient List */}
          <View className="flex-1 ml-8 justify-center">
            <MacroItem
              label="Carbohydrate"
              color="#FBBF24" // Amber-400
              animatedValue={carbsAnim}
              targetValue={targetNutrition?.carbs || 250}
            />
            <MacroItem
              label="Protein"
              color="#34D399" // Emerald-400
              animatedValue={proteinAnim}
              targetValue={targetNutrition?.protein || 150}
            />
            <MacroItem
              label="Fat"
              color="#F87171" // Red-400
              animatedValue={fatAnim}
              targetValue={targetNutrition?.fat || 67}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
