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
}

export default function FoodSection({ title, foods }: FoodSectionProps) {
  const handleAddFood = (foodId: string) => {
    // Handle adding food to meal plan
    console.log(`Adding food ${foodId} to meal plan`);
  };

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
            onAddPress={() => handleAddFood(food.id)}
          />
        ))}
      </View>
    </View>
  );
}