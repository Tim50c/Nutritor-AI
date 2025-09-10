import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "./CustomText";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/context/UserContext";
import WeightEditModal from "./WeightEditModal";
import GoalAchievedModal from "./GoalAchievedModal";
import BMIBar from "./BMIBar";
import { AnalysisService } from "@/services";

interface AnalyticsHeaderProps {
  weightGoal: number;
  currentWeight: number;
  weightUnit?: string;
}

const AnalyticsHeader = ({
  weightGoal,
  currentWeight,
  weightUnit = "kg",
}: AnalyticsHeaderProps) => {
  const { userProfile, setUserProfile } = useUser();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [goalAchievedModalVisible, setGoalAchievedModalVisible] =
    useState(false);

  // Weight conversion logic
  const KG_TO_LBS = 2.20462;
  const kgToLbs = (kg: number) => Math.round(kg * KG_TO_LBS * 10) / 10;

  // Convert weights based on unit preference
  let displayCurrentWeight = userProfile?.weightCurrent ?? currentWeight;
  let displayWeightGoal = userProfile?.weightGoal ?? weightGoal;

  if (weightUnit === "lbs") {
    displayCurrentWeight = displayCurrentWeight
      ? kgToLbs(displayCurrentWeight)
      : 0;
    displayWeightGoal = displayWeightGoal ? kgToLbs(displayWeightGoal) : 0;
  } else {
    // Round kg values to 1 decimal place
    displayCurrentWeight = Math.round(displayCurrentWeight * 10) / 10;
    displayWeightGoal = Math.round(displayWeightGoal * 10) / 10;
  }

  // Calculate BMI immediately using current data (always use kg for BMI calculation)
  const calculateBMI = () => {
    const weightInKg = userProfile?.weightCurrent ?? currentWeight; // Always use original kg value for BMI
    if (!weightInKg || !userProfile?.height) return 0;
    const heightInMeters = userProfile.height / 100; // Convert cm to meters
    return weightInKg / (heightInMeters * heightInMeters);
  };

  const currentBMI = calculateBMI();

  // Calculate BMI status for the BMI bar
  const getBMIStatus = (bmi: number): string => {
    if (bmi <= 0 || isNaN(bmi)) return "Unknown";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity";
  };

  const bmiStatus = getBMIStatus(currentBMI);

  const handleEditWeight = () => {
    setEditModalVisible(true);
  };

  const handleUpdateWeight = async (newValue: number) => {
    // Convert input back to kg if needed (WeightEditModal always works in the display unit)
    let weightInKg = newValue;
    if (weightUnit === "lbs") {
      weightInKg = newValue / KG_TO_LBS; // Convert lbs back to kg for storage
    }

    // Update local state immediately - store in kg
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        weightCurrent: weightInKg,
      });
    }

    // Check goal achievement using kg values
    const goalInKg = userProfile?.weightGoal ?? weightGoal;
    if (goalInKg > 0 && Math.abs(weightInKg - goalInKg) <= 0.1) {
      setTimeout(() => setGoalAchievedModalVisible(true), 300);
    }

    // Save to database in background - fire and forget (always in kg)
    AnalysisService.updateWeight({
      currentWeight: weightInKg,
      goalWeight: goalInKg,
    }).catch((error) => console.error("Weight save failed:", error));
  };

  return (
    <>
      <View className="flex-row justify-between items-start mt-4 mx-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-700">Current weight</Text>
            <TouchableOpacity
              onPress={handleEditWeight}
              className="p-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold">
            {displayCurrentWeight} {weightUnit}
          </Text>
        </View>

        <View className="flex-1 items-end">
          <Text className="text-gray-700">Weight goal</Text>
          <Text className="text-2xl font-bold">
            {displayWeightGoal} {weightUnit}
          </Text>
        </View>
      </View>

      {/* BMI Bar - updates immediately with weight changes */}
      <View className="mt-4">
        <BMIBar bmi={currentBMI} status={bmiStatus} />
      </View>

      <WeightEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        currentValue={displayCurrentWeight}
        type="current"
        onUpdate={handleUpdateWeight}
        weightUnit={weightUnit}
      />

      <GoalAchievedModal
        visible={goalAchievedModalVisible}
        onClose={() => setGoalAchievedModalVisible(false)}
        onSetNewGoal={() => {}}
      />
    </>
  );
};

export default AnalyticsHeader;
