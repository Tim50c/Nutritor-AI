import AnalyticsHeader from "@/components/AnalyticsHeader";
import BMIBar from "@/components/BMIBar";
import CalorieChart from "@/components/CalorieChart";
import NutritionTrend from "@/components/NutritionTrend";
import ToggleTabs, { TabOption } from "@/components/ToggleTabs";
import { generateMockCalories } from "@/data/mockData";
import { AnalysisService } from "@/services";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

const Analytics = () => {
  const [tab, setTab] = useState<TabOption>("daily");

  // Mock dynamic data generator: returns an array of {label, value, date}
  const data = useMemo(() => generateMockCalories(), []);

  // Aggregate data depending on tab
  // For daily: show days in a selected week (dynamic number of days)
  // For weekly: show weeks in a month (dynamic weeks)
  // For monthly: show months in a year (12 but keep dynamic)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analysis = await AnalysisService.getAnalysis();
        console.log("Fetched Analysis:", analysis);
      } catch (error) {
        console.error("Error fetching analysis:", error);
      }
    };

    fetchData();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        className="px-4"
      >
        <AnalyticsHeader weightGoal={60} currentWeight={70} />

        <View className="mt-4">
          <BMIBar bmi={19.21} status="Healthy" />
        </View>

        <View className="mt-4">
          <ToggleTabs value={tab} onChange={setTab} />
        </View>

        <View className="mt-4">
          <CalorieChart data={data} mode={tab} />
        </View>

        <View className="mt-6">
          <NutritionTrend />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Analytics;
