import FoodSuggestionCard from "@/components/FoodSuggestionCard";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { useDietContext } from "@/context/DietContext";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";
import { Text } from "../../components/CustomText";
import { useIsDark } from "@/theme/useIsDark";

const Favorites = () => {
  const router = useRouter();
  const { getFavoriteFoods, toggleFavorite, fetchFavoriteFoods } =
    useDietContext();
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useIsDark();
  const favoriteFoods = getFavoriteFoods();

  useFocusEffect(
    React.useCallback(() => {
      console.log("🎯 Favorites page focused, fetching favorite foods...");
      fetchFavoriteFoods();
    }, [fetchFavoriteFoods])
  );

  if (favoriteFoods.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-3">
          <TouchableOpacity
            className="bg-black dark:bg-white w-10 h-10 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <View style={{ transform: [{ rotate: "0deg" }] }}>
              {isDark ? (
                <icons.arrowDark width={20} height={20} />
              ) : (
                <icons.arrow width={20} height={20} />
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black dark:text-white">
            Favorites
          </Text>
          <View className="w-10 h-10" />
        </View>

        <View className="flex-1 items-center justify-center">
          <Image
            source={images.emptyScreen}
            className="w-56 h-56 mb-6"
            resizeMode="contain"
          />
          <Text className="text-xl font-semibold text-black dark:text-white mb-2">
            No Favorites Yet.
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center px-8">
            Quick access to your most-loved items makes logging even faster!
          </Text>
        </View>
      </SafeAreaView>
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
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-3">
        <TouchableOpacity
          className="bg-black dark:bg-white w-10 h-10 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: "0deg" }] }}>
            {isDark ? (
              <icons.arrowDark width={20} height={20} />
            ) : (
              <icons.arrow width={20} height={20} />
            )}
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black dark:text-white">
          Favorites
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
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
            source="favorites"
          />
        ))}
        {refreshing && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#999" />
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Refreshing favorites…
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Favorites;
