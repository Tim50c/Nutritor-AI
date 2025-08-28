import React from "react";
import { View } from "react-native";
import { useDietContext } from "@/context/DietContext";
import FoodSection from "@/components/FoodSection";

export default function DietFoodList() {
  const { foods, isFavorite, toggleFavorite } = useDietContext();

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
