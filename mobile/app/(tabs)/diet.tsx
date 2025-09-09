import DietCalendar from "@/components/DietCalendar";
import DietFoodList from "@/components/DietFoodList";
import DietSummary from "@/components/DietSummary";
import { useDietContext } from "@/context/DietContext";
import React, { useEffect } from "react";
import { ScrollView } from "react-native";

const DietScreen = () => {
  const { dietDate, refreshDietData } = useDietContext();

  // Refresh diet data when the date changes
  useEffect(() => {
    refreshDietData(dietDate);
  }, [dietDate, refreshDietData]);

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
