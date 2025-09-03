import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import DietService from "@/services/diet-service";
import { FOODS } from "@/data/mockData";
import { useDietContext } from "@/context/DietContext";
import {images} from "@/constants/images";

// Define the Food interface based on the backend response
interface FoodData {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  imageUrl?: string;
  nutrition: {
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  source: string;
  userId?: string;
}

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
  const progressBarWidth =
    percentage !== undefined ? Math.min(percentage, 100) : 0;
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
          <Text
            className={`text-xs font-medium ${textColor} ${isOverGoal ? "text-red-600" : ""}`}
          >
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
  const { id, foodData, capturedImage } = useLocalSearchParams();
  const [isAddingToDiet, setIsAddingToDiet] = useState(false);
  const { refreshData } = useDietContext();

  // Parse real API food data or use mock data as fallback
  const food = React.useMemo(() => {
    if (foodData && typeof foodData === "string") {
      try {
        const parsedFood: FoodData = JSON.parse(foodData);
        console.log("🖼️ ImageURL from parsed food:", parsedFood.imageUrl);

        const finalFood = {
          id: parsedFood.id || id,
          name: parsedFood.name,
          description: parsedFood.description,
          calories: parsedFood.nutrition.cal || 0,
          protein: parsedFood.nutrition.protein || 0,
          carbs: parsedFood.nutrition.carbs || 0,
          fat: parsedFood.nutrition.fat || 0,
          image: parsedFood.imageUrl ? { uri: parsedFood.imageUrl } : null,
          source: parsedFood.source,
          barcode: parsedFood.barcode,
        };

        return finalFood;
      } catch (error) {
        console.error("Error parsing food data:", error);
      }
    }

    // Fallback to mock data if no API data available
    return FOODS.find((item) => item.id === id);
  }, [id, foodData]);

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
  const proteinPercentage = Math.round(((food.protein || 0) / 150) * 100); // 150g daily target
  const carbsPercentage = Math.round(((food.carbs || 0) / 250) * 100); // 250g daily target
  const fatPercentage = Math.round(((food.fat || 0) / 70) * 100); // 70g daily target

  const handleAddToDiet = async () => {
    if (!food?.id) {
      Alert.alert("Error", "Unable to add food to diet. Food ID not found.");
      return;
    }

    try {
      setIsAddingToDiet(true);

      // Ensure food.id is a string
      const foodId = Array.isArray(food.id) ? food.id[0] : food.id;

      // Add food to today's diet using the DietService
      await DietService.addFoodToTodayDiet({ foodId });

      // Refresh home screen data to show updated nutrition
      await refreshData();

      // Show success message
      Alert.alert("Success!", `${food.name} has been added to your diet.`, [
        {
          text: "Go to Home",
          onPress: () => router.replace("/"),
        },
        {
          text: "Add Another",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Error adding food to diet:", error);
      Alert.alert("Error", "Failed to add food to diet. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsAddingToDiet(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Header with Image */}
      <View className="relative">
        {/* Use captured image, food's image URL, or fallback */}
        {capturedImage ? (
          <Image
            source={{ uri: capturedImage as string }}
            className="w-full h-80"
            resizeMode="cover"
          />
        ) : food?.image ? (
          <ImageBackground source={food.image} className="w-full h-80">
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
        ) : (
          // Fallback for foods without images
          <ImageBackground source={images.fallback_food} className="w-full h-80 ">
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
              className="flex-1 w-full justify-between"
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

              {/* Placeholder content */}
              <View className="items-center justify-center flex-1">
                <Ionicons name="nutrition" size={80} color="white" />
                <Text className="text-white text-lg font-semibold mt-2">
                  Food Image
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        )}
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
          {/* Show source information for API-recognized foods */}
          {"source" in food && food.source && (
            <View className="flex-row items-center mt-2">
              <Ionicons
                name={
                  food.source === "gemini"
                    ? "sparkles"
                    : food.source === "openfoodfacts"
                      ? "barcode"
                      : "information-circle"
                }
                size={16}
                color="#666"
              />
              <Text className="text-gray-500 text-sm ml-2 capitalize">
                Recognized by{" "}
                {food.source === "gemini"
                  ? "AI"
                  : food.source === "openfoodfacts"
                    ? "Barcode Database"
                    : food.source}
              </Text>
            </View>
          )}
        </View>

        {/* Macro Cards Grid */}
        <View className="mb-6">
          {/* Top Row - Calories and Protein */}
          <View className="flex-row mb-3">
            <MacroCard
              title="Calories"
              value={`${(food.calories || 0).toLocaleString()} kcal`}
              backgroundColor="bg-purple-200"
            />
            <MacroCard
              title="Protein"
              value={`${food.protein || 0}g`}
              percentage={proteinPercentage}
              backgroundColor="bg-green-300"
            />
          </View>

          {/* Bottom Row - Carbs and Fat */}
          <View className="flex-row">
            <MacroCard
              title="Carbs"
              value={`${food.carbs || 0}g`}
              percentage={carbsPercentage}
              backgroundColor="bg-yellow-300"
            />
            <MacroCard
              title="Fat"
              value={`${food.fat || 0}g`}
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
          label={isAddingToDiet ? "Adding..." : "Add to My Diet"}
          onPress={handleAddToDiet}
          style="mb-8"
          disabled={isAddingToDiet}
        />
      </ScrollView>
    </View>
  );
};

export default FoodDetails;
