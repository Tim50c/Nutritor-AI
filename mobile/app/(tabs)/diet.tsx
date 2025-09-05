import DietCalendar from "@/components/DietCalendar";
import DietFoodList from "@/components/DietFoodList";
import DietSummary from "@/components/DietSummary";
import React from "react";
import { ScrollView } from "react-native";

const DietScreen = () => {
  return (
    <>
      <ScrollView className="flex-1 bg-white pt-8">
        <DietCalendar />
        <DietSummary />
        <DietFoodList />
      </ScrollView>
    </>
  );
};

export default DietScreen;
