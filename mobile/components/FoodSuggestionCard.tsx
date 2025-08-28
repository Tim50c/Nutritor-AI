import { View, Text, Image, TouchableOpacity } from "react-native";
import { icons } from "@/constants/icons";

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
}

export default function FoodSuggestionCard({
  food,
  isFavorite = false,
  onToggleFavorite,
}: FoodSuggestionCardProps) {
  // Format calories with comma and unit
  const formattedCalories = `${food.calories.toLocaleString()} kcal`;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-200 shadow-sm">
      {/* Food Image */}
      <Image
        source={food.image}
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
          <Text className="text-sm text-gray-600">
            Carbs: {food.carbs}g
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 mr-4">
            Protein: {food.protein}g
          </Text>
          <Text className="text-sm text-gray-600">
            Fat: {food.fat}g
          </Text>
        </View>
      </View>

      {/* Heart button */}
      <TouchableOpacity
        onPress={onToggleFavorite}
        className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
      >
        <Image source={isFavorite ? icons.heartFill : icons.heart} className="w-4 h-4" />
      </TouchableOpacity>
    </View>
  );
}