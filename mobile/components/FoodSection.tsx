import { View } from "react-native";
import { Text } from "./CustomText";
import FoodSuggestionCard from "./FoodSuggestionCard";

interface FoodItem {
  id: string;
  name: string;
  image: any;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  addedAt?: string; // For diet foods - timestamp when added
  dietIndex?: number; // For diet foods - index in the diet array
}

interface FoodSectionProps {
  title: string;
  foods: FoodItem[];
  isFavorite?: (foodId: string) => boolean;
  onToggleFavorite?: (foodId: string) => void;
  source?: "suggestions" | "history" | "diet" | "favorites";
}

export default function FoodSection({
  title,
  foods,
  isFavorite,
  onToggleFavorite,
  source = "suggestions",
}: FoodSectionProps) {
  return (
    <View className="mb-6">
      {title && (
        <Text className="text-lg font-bold text-gray-800 mb-4 px-4">
          {title}
        </Text>
      )}
      <View className="px-4">
        {foods.map((food, index) => {
          // Create a unique key that includes the source to prevent conflicts
          // between the same food appearing in different contexts (home vs diet)
          let uniqueKey = `${source}-${food.id}-${index}`;

          // For diet foods with addedAt, use that for more precise targeting
          if (
            source === "diet" &&
            food.addedAt &&
            typeof food.addedAt === "string"
          ) {
            uniqueKey = `diet-${food.id}-${food.addedAt}`;
          }

          // Add a random suffix to ensure absolute uniqueness in edge cases
          uniqueKey += `-${Math.random().toString(36).substring(7)}`;

          // For diet foods, ensure dietIndex is set to current array position
          const enhancedFood =
            source === "diet"
              ? { ...food, dietIndex: food.dietIndex ?? index }
              : food;

          return (
            <FoodSuggestionCard
              key={uniqueKey}
              food={enhancedFood}
              isFavorite={isFavorite ? isFavorite(food.id) : false}
              onToggleFavorite={
                onToggleFavorite ? () => onToggleFavorite(food.id) : undefined
              }
              source={source}
            />
          );
        })}
      </View>
    </View>
  );
}
