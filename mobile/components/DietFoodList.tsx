import React from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { useDietContext } from "@/context/DietContext";

export default function DietFoodList() {
  const { foods } = useDietContext();

  return (
    <ScrollView className="w-full" showsVerticalScrollIndicator={false}>
      {foods.map((food) => (
        <View
          key={food.id}
          className="bg-white rounded-2xl p-4 mb-4 mx-4 flex-row items-center border border-gray-200 shadow-sm"
        >
          <Image
            source={food.image}
            className="w-16 h-16 rounded-xl mr-4"
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-800 mb-1">
              {food.name}
            </Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-gray-600 mr-4">
                {food.calories.toLocaleString()} kcal
              </Text>
              <Text className="text-sm text-gray-600">
                Carbs: {food.carbs}g
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600 mr-4">
                Protein: {food.protein}g
              </Text>
              <Text className="text-sm text-gray-600">
                Fat: {food.fat}g
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

