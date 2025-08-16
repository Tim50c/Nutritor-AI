import { View, ScrollView } from "react-native";
import HomeTopBar from "../../components/HomeTopBar";
import TodaySummary from "../../components/TodaySummary";
import FoodSection from "../../components/FoodSection";
import { images } from "@/constants/images";

export default function HomeScreen() {
  // Sample food data
  const suggestedFoods = [
    {
      id: "1",
      name: "Beef Noodle Soup - 400g",
      image: images.pho,
      calories: 2000,
      protein: 180,
      fat: 80,
      carbs: 150,
    },
    {
      id: "2",
      name: "Beef Noodle Soup - 400g",
      image: images.pho,
      calories: 2000,
      protein: 180,
      fat: 80,
      carbs: 150,
    },
    {
      id: "3",
      name: "Beef Noodle Soup - 400g",
      image: images.pho,
      calories: 2000,
      protein: 180,
      fat: 80,
      carbs: 150,
    },
  ];

  const historyFoods = [
    {
      id: "4",
      name: "Beef Noodle Soup - 400g",
      image: images.pho,
      calories: 2000,
      protein: 180,
      fat: 80,
      carbs: 150,
    },
  ];

  return (
    <View className="flex-1 bg-gray-50 pt-8">
      <HomeTopBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-6">
          <TodaySummary />
          <FoodSection title="Suggesting Food" foods={suggestedFoods} />
          <FoodSection title="History Food" foods={historyFoods} />
        </View>
      </ScrollView>
    </View>
  );
}