import React from "react";
import {ScrollView} from "react-native";
import { Text } from '@/components/CustomText';
import DietCalendar from "@/components/DietCalendar";
import DietSummary from "@/components/DietSummary";
import DietFoodList from "@/components/DietFoodList";

const DietScreen = () => {
  return (
    <>
      <ScrollView className="flex-1 bg-white pt-8">
        <DietCalendar />
        <Text className="text-xl font-bold text-center mb-4">Today&#39;s Diet</Text>
        <DietSummary />
        <DietFoodList />
      </ScrollView>
    </>
  );
};

export default DietScreen;
