import { View, ScrollView } from "react-native";
import HomeTopBar from "../../components/HomeTopBar";
import TodaySummary from "../../components/TodaySummary";
import FoodSection from "../../components/FoodSection";
import { useDietContext } from "@/context/DietContext";
import {FOODS} from "@/data/mockData";

export default function HomeScreen() {
  const { isFavorite, toggleFavorite } = useDietContext();
  // Sample food data
  const suggestedFoods = FOODS.filter(food => parseInt(food.id) < 4);

  const historyFoods = FOODS.filter(food => parseInt(food.id) === 4);

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