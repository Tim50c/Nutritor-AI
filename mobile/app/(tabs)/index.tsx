// app/(tabs)/index.tsx
import { View, ScrollView } from "react-native";
import HomeTopBar from "../../components/HomeTopBar";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-gray-50 pt-8">
      <HomeTopBar name="Con GÀ" />
      <ScrollView>
        {/* Your Today Summary, Suggesting Food, etc. */}
      </ScrollView>
    </View>
  );
}
