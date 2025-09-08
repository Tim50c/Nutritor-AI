import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { router } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Text } from "./CustomText";

interface FoodItem {
  id: string;
  name: string;
  image: any;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface FoodSuggestionCardProps {
  food: FoodItem;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  source?: "suggestions" | "history" | "diet" | "favorites";
}

export default function FoodSuggestionCard({
  food,
  isFavorite = false,
  onToggleFavorite,
  source = "suggestions",
}: FoodSuggestionCardProps) {
  // Format calories with comma and unit
  const formattedCalories = `${food.calories.toString()} kcal`;

  const handleFoodPress = () => {
    // Convert food to the format expected by food details page
    const foodData = {
      id: food.id,
      name: food.name,
      description: `${food.name} - Nutritional Information`,
      nutrition: {
        cal: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      },
      source: "suggestions",
      imageUrl: food.image?.uri || food.image || null, // Handle both uri format and direct string
    };

    console.log("📱 FoodSuggestionCard: Navigating with food data:", {
      id: food.id,
      name: food.name,
      imageUrl: foodData.imageUrl,
      hasImage: !!food.image,
    });

    router.push({
      pathname: "/food/[id]" as const,
      params: {
        id: food.id,
        foodData: JSON.stringify(foodData),
        source: source, // Pass the source to determine UI state
      },
    });
  };

  return (
    <TouchableOpacity onPress={handleFoodPress}>
      <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-200 shadow-sm">
        {/* Food Image */}
        <Image
          source={food.image ? food.image : images.fallback_food}
          className="w-16 h-16 rounded-xl mr-4"
          resizeMode="cover"
        />

        {/* Food Info */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800 mb-1">
            {food.name}
          </Text>

          <View className="flex-row items-center mb-2">
            <Text className="text-sm text-gray-600 mr-4">
              {formattedCalories}
            </Text>
            <Text className="text-sm text-gray-600">Carbs: {food.carbs}g</Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-sm text-gray-600 mr-4">
              Protein: {food.protein}g
            </Text>
            <Text className="text-sm text-gray-600">Fat: {food.fat}g</Text>
          </View>
        </View>

        {/* Heart button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
        >
          {isFavorite ? (
            <icons.heartFill width={16} height={16} />
          ) : (
            <icons.heart width={16} height={16} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
