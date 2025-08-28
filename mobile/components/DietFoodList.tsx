import React from "react";
import { ScrollView } from "react-native";
import { useDietContext } from "@/context/DietContext";
import FoodSuggestionCard from "@/components/FoodSuggestionCard";

export default function DietFoodList() {
  const { foods, isFavorite, toggleFavorite } = useDietContext();

  return (
    <ScrollView className="w-full" showsVerticalScrollIndicator={false}>
      {foods.map((food) => (
        <FoodSuggestionCard
          key={food.id}
          food={food}
          isFavorite={isFavorite(food.id)}
          onToggleFavorite={() => toggleFavorite(food.id)}
        />
      ))}
    </ScrollView>
  );
}
