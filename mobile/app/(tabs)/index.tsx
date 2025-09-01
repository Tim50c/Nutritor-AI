import { View, ScrollView } from "react-native";
import HomeTopBar from "../../components/HomeTopBar";
import TodaySummary from "../../components/TodaySummary";
import FoodSection from "../../components/FoodSection";
import { useDietContext } from "@/context/DietContext";

export default function HomeScreen() {
  const { isFavorite, toggleFavorite, foods, loading } = useDietContext();

  // Example logic: suggested foods are first 3, history foods are the rest
  const suggestedFoods = foods.slice(0, 3);
  const historyFoods = foods.slice(3);

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