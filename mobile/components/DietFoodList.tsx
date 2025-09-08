import FoodSection from "@/components/FoodSection";
import { useDietContext } from "@/context/DietContext";
import React from "react";
import { View } from "react-native";
import { Text } from "./CustomText";

export default function DietFoodList() {
  const { foods, isFavorite, toggleFavorite, loading } = useDietContext();

  const renderContent = () => {
    // The DietSummary component shows the main loader for the screen.
    // This section will simply be empty until the data is ready.
    if (loading) {
      return null;
    }

    if (foods.length === 0) {
      return (
        <View className="items-center justify-center my-10">
          <Text className="text-gray-500">No food logged for this day.</Text>
        </View>
      );
    }

    return (
      <FoodSection
        title=""
        foods={foods}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        source="diet"
      />
    );
  };

  return <View className="w-full px-4 mb-4">{renderContent()}</View>;
}
