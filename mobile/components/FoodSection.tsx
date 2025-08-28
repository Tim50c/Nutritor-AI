import { View, Text } from "react-native";
import FoodSuggestionCard from "./FoodSuggestionCard";

interface FoodItem {
  id: string;
  name: string;
  image: any;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface FoodSectionProps {
  title: string;
  foods: FoodItem[];
  isFavorite?: (foodId: string) => boolean;
  onToggleFavorite?: (foodId: string) => void;
}

export default function FoodSection({ title, foods, isFavorite, onToggleFavorite }: FoodSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-4 px-4">
        {title}
      </Text>
      <View className="px-4">
        {foods.map((food) => (
          <FoodSuggestionCard
            key={food.id}
            food={food}
            isFavorite={isFavorite ? isFavorite(food.id) : false}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(food.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
}