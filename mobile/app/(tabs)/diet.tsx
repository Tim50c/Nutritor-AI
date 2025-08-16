import React from "react";
import { View, Text } from "react-native";
import DietCalendar from "@/components/DietCalendar";
import DietSummary from "@/components/DietSummary";
import DietFoodList from "@/components/DietFoodList";
import { DietProvider } from "@/context/DietContext";

const DietScreen = () => {
  return (
    <DietProvider>
      <View className="flex-1 bg-white pt-8">
        <DietCalendar />
        <Text className="text-xl font-bold text-center mb-4">Today&#39;s Diet</Text>
        <DietSummary />
        <DietFoodList />
      </View>
    </DietProvider>
  );
};

export default DietScreen;
