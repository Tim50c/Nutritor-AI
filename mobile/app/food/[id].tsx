import React from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import { FOODS } from "@/data/mockData";

// Reusable MacroCard Component
interface MacroCardProps {
  title: string;
  value: string;
  percentage?: number;
  backgroundColor: string;
  textColor?: string;
}

const MacroCard: React.FC<MacroCardProps> = ({
                                               title,
                                               value,
                                               percentage,
                                               backgroundColor,
                                               textColor = "text-gray-800",
                                             }) => {
  // Determine if percentage exceeds 100% and set appropriate colors
  const isOverGoal = percentage !== undefined && percentage > 100;
  const progressBarWidth = percentage !== undefined ? Math.min(percentage, 100) : 0;
  const progressBarColor = isOverGoal ? "bg-red-500" : "bg-black/40";

  return (
    <View className={`flex-1 p-4 rounded-2xl mx-1 ${backgroundColor}`}>
      <Text className={`text-sm font-medium ${textColor} mb-1`}>{title}</Text>
      <Text className={`text-xl font-bold ${textColor} mb-2`}>{value}</Text>
      {percentage !== undefined && (
        <View className="flex-row items-center justify-between">
          <View className="flex-1 bg-black/20 rounded-full h-1.5 mr-2">
            <View
              className={`${progressBarColor} rounded-full h-1.5`}
              style={{ width: `${progressBarWidth}%` }}
            />
          </View>
          <Text className={`text-xs font-medium ${textColor} ${isOverGoal ? 'text-red-600' : ''}`}>
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

// Goal Component
const GoalCard: React.FC = () => (
  <View className="bg-gray-100 rounded-2xl p-4 mb-6">
    <View className="flex-row items-center">
      <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center mr-3">
        <Ionicons name="checkmark-circle-outline" size={24} color="#666" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800 mb-1">Goal</Text>
        <Text className="text-gray-600">Heart Health, Weight Maintenance</Text>
      </View>
    </View>
  </View>
);

const FoodDetails = () => {
  const { id } = useLocalSearchParams();

  // Find food by ID - this structure makes it easy to replace with API call later
  const food = React.useMemo(() => {
    return FOODS.find((item) => item.id === id);
  }, [id]);

  // Handle case where food is not found
  if (!food) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Food not found</Text>
        <CustomButton
          label="Go Back"
          onPress={() => router.back()}
          style="mt-4 mx-6"
        />
      </View>
    );
  }

  // Calculate percentages for macros (assuming daily targets)
  const proteinPercentage = Math.round((food.protein / 150) * 100); // 150g daily target
  const carbsPercentage = Math.round((food.carbs / 250) * 100); // 250g daily target
  const fatPercentage = Math.round((food.fat / 70) * 100); // 70g daily target

  const handleAddToDiet = () => {
    // TODO: Implement add to diet functionality
    console.log(`Adding ${food.name} to diet`);
    // This is where you'll later add the API call to save to backend
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Header with Image */}
      <View className="relative">
        <ImageBackground
          source={food.image}
          className="w-full h-80"
        >
          {/* Dark overlay for better text readability */}
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
            className="flex-1 justify-between"
          >
            {/* Top Navigation */}
            <View className="flex-row justify-between items-center pt-12 px-4">
              <TouchableOpacity
                className="w-10 h-10 bg-black rounded-full items-center justify-center"
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-10 h-10 bg-black rounded-full items-center justify-center"
                onPress={() => console.log("More options")}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>

      <ScrollView className="flex-1 -mt-6 bg-white rounded-t-3xl px-6 pt-6">
        {/* Title Section */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {food.name}
          </Text>
          <Text className="text-gray-600 leading-relaxed">
            {food.description}
          </Text>
        </View>

        {/* Macro Cards Grid */}
        <View className="mb-6">
          {/* Top Row - Calories and Protein */}
          <View className="flex-row mb-3">
            <MacroCard
              title="Calories"
              value={`${food.calories.toLocaleString()} kcal`}
              backgroundColor="bg-purple-200"
            />
            <MacroCard
              title="Protein"
              value={`${food.protein}g`}
              percentage={proteinPercentage}
              backgroundColor="bg-green-300"
            />
          </View>

          {/* Bottom Row - Carbs and Fat */}
          <View className="flex-row">
            <MacroCard
              title="Carbs"
              value={`${food.carbs}g`}
              percentage={carbsPercentage}
              backgroundColor="bg-yellow-300"
            />
            <MacroCard
              title="Fat"
              value={`${food.fat}g`}
              percentage={fatPercentage}
              backgroundColor="bg-orange-400"
              textColor="text-white"
            />
          </View>
        </View>

        {/* Goal Section */}
        <GoalCard />

        {/* Add to Diet Button */}
        <CustomButton
          label="Add to My Diet"
          onPress={handleAddToDiet}
          style="mb-8"
        />
      </ScrollView>
    </View>
  );
};

export default FoodDetails;