import DietCalendar from "@/components/DietCalendar";
import DietFoodList from "@/components/DietFoodList";
import DietSummary from "@/components/DietSummary";
import EmptyDietState from "@/components/EmptyDietState";
import { useDietContext } from "@/context/DietContext";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";

const DietScreen = () => {
  const { dietDate, refreshDietData, dietSummary, loading } = useDietContext();
  const [isTabFocused, setIsTabFocused] = useState(false);

  // Handle tab focus to trigger animations only when tab is visible
  useFocusEffect(
    useCallback(() => {
      setIsTabFocused(true);
      return () => {
        setIsTabFocused(false);
      };
    }, [])
  );

  // Refresh diet data when the date changes
  useEffect(() => {
    refreshDietData(dietDate);
  }, [dietDate, refreshDietData]);

  // Check if there's any food data
  const hasAnyFood =
    !loading &&
    (dietSummary.calories > 0 ||
      dietSummary.carbs > 0 ||
      dietSummary.protein > 0 ||
      dietSummary.fat > 0);

  return (
    <>
      <ScrollView className="flex-1 bg-white pt-8">
        <DietCalendar />
        {hasAnyFood ? (
          <>
            <DietSummary isTabFocused={isTabFocused} />
            <DietFoodList />
          </>
        ) : (
          <EmptyDietState />
        )}
      </ScrollView>
    </>
  );
};

export default DietScreen;
