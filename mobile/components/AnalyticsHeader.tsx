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
}

const AnalyticsHeader = ({
  weightGoal,
  currentWeight,
}: AnalyticsHeaderProps) => {
  const { userProfile, setUserProfile } = useUser();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [goalAchievedModalVisible, setGoalAchievedModalVisible] =
    useState(false);

  // Use userProfile weight if available, otherwise fallback to props
  const displayCurrentWeight = userProfile?.weightCurrent ?? currentWeight;
  const displayWeightGoal = userProfile?.weightGoal ?? weightGoal;

  // Calculate BMI immediately using current data
  const calculateBMI = () => {
    if (!displayCurrentWeight || !userProfile?.height) return 0;
    const heightInMeters = userProfile.height / 100; // Convert cm to meters
    return displayCurrentWeight / (heightInMeters * heightInMeters);
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
    // Update local state immediately - this is all the UI needs
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        weightCurrent: newValue,
      });
    }

    // Check goal achievement immediately
    if (
      displayWeightGoal > 0 &&
      Math.abs(newValue - displayWeightGoal) <= 0.1
    ) {
      setTimeout(() => setGoalAchievedModalVisible(true), 300);
    }

    // Save to database in background - fire and forget
    AnalysisService.updateWeight({
      currentWeight: newValue,
      goalWeight: displayWeightGoal,
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
          <Text className="text-2xl font-bold">{displayCurrentWeight} kg</Text>
        </View>

        <View className="flex-1 items-end">
          <Text className="text-gray-700">Weight goal</Text>
          <Text className="text-2xl font-bold">{displayWeightGoal} kg</Text>
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
