import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { useDietContext } from "@/context/DietContext";
import FoodSuggestionCard from "@/components/FoodSuggestionCard";
import { images } from "@/constants/images";
import { useFocusEffect } from '@react-navigation/native';

const Favorites = () => {
  const { getFavoriteFoods, toggleFavorite, refreshData } = useDietContext();
  const favoriteFoods = getFavoriteFoods();

  useFocusEffect(
    React.useCallback(() => {
      refreshData();
    }, [])
  );

  if (favoriteFoods.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Image source={images.emptyScreen} className="w-56 h-56 mb-6" resizeMode="contain" />
        <Text className="text-xl font-semibold text-black mb-2">No Favorites Yet.</Text>
        <Text className="text-base text-gray-500 text-center px-8">Quick access to your most-loved items makes logging even faster!</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4" showsVerticalScrollIndicator={false}>
      {favoriteFoods.map((food) => (
        <FoodSuggestionCard
          key={food.id}
          food={food}
          isFavorite={true}
          onToggleFavorite={() => toggleFavorite(food.id)}
        />
      ))}
    </ScrollView>
  );
};

export default Favorites;