import FoodSuggestionCard from "@/components/FoodSuggestionCard";
import { images } from "@/constants/images";
import { useDietContext } from "@/context/DietContext";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const Favorites = () => {
  const { getFavoriteFoods, toggleFavorite, fetchFavoriteFoods } =
    useDietContext();
  const [refreshing, setRefreshing] = useState(false);
  const favoriteFoods = getFavoriteFoods();

  useFocusEffect(
    React.useCallback(() => {
      console.log("🎯 Favorites page focused, fetching favorite foods...");
      fetchFavoriteFoods();
    }, [fetchFavoriteFoods])
  );

  if (favoriteFoods.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Image
          source={images.emptyScreen}
          className="w-56 h-56 mb-6"
          resizeMode="contain"
        />
        <Text className="text-xl font-semibold text-black mb-2">
          No Favorites Yet.
        </Text>
        <Text className="text-base text-gray-500 text-center px-8">
          Quick access to your most-loved items makes logging even faster!
        </Text>
      </View>
    );
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchFavoriteFoods();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white px-4 pt-4"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {favoriteFoods.map((food) => (
        <FoodSuggestionCard
          key={food.id}
          food={food}
          isFavorite={true}
          onToggleFavorite={() => toggleFavorite(food.id, food)}
        />
      ))}
      {refreshing && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#999" />
          <Text className="text-xs text-gray-500 mt-2">
            Refreshing favorites…
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default Favorites;
