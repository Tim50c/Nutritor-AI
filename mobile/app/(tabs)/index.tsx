import { View, ScrollView, ActivityIndicator, Platform } from "react-native";
import HomeTopBar from "../../components/HomeTopBar";
import TodaySummary from "../../components/TodaySummary";
import FoodSection from "../../components/FoodSection";
import { useDietContext } from "@/context/DietContext";

export default function HomeScreen() {
  const {
    isFavorite,
    toggleFavorite,
    homeFoods,
    suggestedFoods,
    loading,
    refreshing,
  } = useDietContext();

  // History foods are the consumed foods from the backend
  const historyFoods = homeFoods;

  return (
    <View
      className={`flex-1 bg-gray-50 ${Platform.OS === "ios" ? "pt-8" : ""}`}
    >
      <HomeTopBar />
      <ScrollView showsVerticalScrollIndicator={false}>
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
