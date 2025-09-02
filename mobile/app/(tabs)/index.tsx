import { View, ScrollView } from "react-native";
import HomeTopBar from "../../components/HomeTopBar";
import TodaySummary from "../../components/TodaySummary";
import FoodSection from "../../components/FoodSection";
import { useDietContext } from "@/context/DietContext";

export default function HomeScreen() {
  const { isFavorite, toggleFavorite, foods, suggestedFoods, loading } =
    useDietContext();

  // History foods are the consumed foods from the backend
  const historyFoods = foods;

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 pt-8">
        <HomeTopBar />
        <ScrollView>
          <View className="pt-6">
            <TodaySummary loading={true} />
            <FoodSection title="Suggesting Food" foods={[]} />
            <FoodSection title="History Food" foods={[]} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 pt-8">
      <HomeTopBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-6">
          <TodaySummary />
          <FoodSection
            title="Suggesting Food"
            foods={suggestedFoods}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
          <FoodSection
            title="History Food"
            foods={historyFoods}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        </View>
      </ScrollView>
    </View>
  );
}
