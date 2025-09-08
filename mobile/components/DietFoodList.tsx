import FoodSection from "@/components/FoodSection";
import { useDietContext } from "@/context/DietContext";
import { DietService } from "@/services";
import React, { useEffect } from "react";
import { View } from "react-native";

// Define FoodItem inline since it's not exported from interfaces
interface FoodItem {
  id: string;
  name: string;
  image: any;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export default function DietFoodList() {
  const { selectedDate, isFavorite, toggleFavorite } = useDietContext();

  const [foods, setFoods] = React.useState<FoodItem[]>([]);

  // Fetch foods for the selected date
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await DietService.getDiets({
          date: selectedDate.toISOString().split("T")[0],
        });
        const diets = response || [];
        console.log(diets.data.foods);
        // Fetch details for each foodId
        const foodDetailsPromises = diets.data.foods.map(async (food) => {
          return {
            id: food.id,
            name: food.name || "Food",
            image: food.imageUrl ? { uri: food.imageUrl } : null, // Fixed: Proper image format
            calories: food.nutrition.cal,
            protein: food.nutrition.protein,
            fat: food.nutrition.fat,
            carbs: food.nutrition.carbs,
          };
        });
        const foodItems = await Promise.all(foodDetailsPromises);
        setFoods(foodItems);
      } catch (error) {
        console.error("Error fetching foods:", error);
      }
    };

    fetchFoods();
  }, [selectedDate]);

  return (
    <View className="w-full">
      <FoodSection
        title=""
        foods={foods}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
    </View>
  );
}
