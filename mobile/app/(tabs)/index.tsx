import { useDietContext } from "@/context/DietContext";
import { useUser } from "@/context/UserContext";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useState } from "react";
import FoodSection from "../../components/FoodSection";
import HomeTopBar from "../../components/HomeTopBar";
import TodaySummary from "../../components/TodaySummary";

export default function HomeScreen() {
  const {
    isFavorite,
    toggleFavorite,
    homeFoods,
    suggestedFoods,
    loading,
    refreshing,
    refreshHomeData,
  } = useDietContext();

  const { refetchUserProfile } = useUser();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both home data and user profile (including name in header)
      await Promise.all([
        refreshHomeData(true), // Force refresh home data
        refetchUserProfile(), // Refresh user profile data for header
      ]);
    } catch (error) {
      console.error("Failed to refresh home data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // History foods are the consumed foods from the backend
  const historyFoods = homeFoods;

  return (
    <View
      className={`flex-1 bg-gray-50 dark:bg-gray-900 ${Platform.OS === "ios" ? "pt-10" : ""}`}
    >
      <HomeTopBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#FF6F2D"]} // Android - orange theme
            tintColor="#FF6F2D" // iOS - orange theme
          />
        }
      >
        <View className="p-4">
          {loading ? (
            // Show loading spinner only on initial load (when no data exists)
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#FF5A16" />
            </View>
          ) : (
            <>
              <TodaySummary />
              <FoodSection
                title="Suggesting Food"
                foods={suggestedFoods}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                source="suggestions"
              />
              <FoodSection
                title="History Food"
                foods={historyFoods}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                source="history"
              />
              {/* Optional: Show a small refresh indicator during background updates */}
              {refreshing && (
                <View className="py-2 items-center">
                  <ActivityIndicator size="small" color="#FF5A16" />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
