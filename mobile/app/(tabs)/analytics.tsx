import AnalyticsHeader from "@/components/AnalyticsHeader";
import BMIBar from "@/components/BMIBar";
import CalorieChart from "@/components/CalorieChart";
import NutritionTrend from "@/components/NutritionTrend";
import ToggleTabs, { TabOption } from "@/components/ToggleTabs";
import { AnalysisService } from "@/services";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

const getBMIStatus = (bmi: number): string => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

const Analytics = () => {
  const [tab, setTab] = useState<TabOption>("daily");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    AnalysisService.getAnalysis()
      .then((res) => {
        if (mounted) {
          setAnalysisData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError("Failed to fetch analysis data.");
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Select stats for current tab
  const stats = useMemo(() => {
    if (!analysisData) return [];
    if (tab === "daily") return analysisData.dailyStats || [];
    if (tab === "weekly") return analysisData.weeklyStats || [];
    if (tab === "monthly") return analysisData.monthlyStats || [];
    return [];
  }, [analysisData, tab]);

  // Aggregate calorie data for CalorieChart
  const calorieChartData = useMemo(() => {
    return stats.map((s: any) => ({
      date: s.period,
      value: s.calories,
    }));
  }, [stats]);

  // Nutrition trend data for NutritionTrend
  const nutritionTrendData = useMemo(() => {
    if (!stats.length) return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    // Use the latest period's stats for trend
    const latest = stats[stats.length - 1];
    return {
      protein: latest.protein,
      carbs: latest.carbs,
      fat: latest.fat,
      calories: latest.calories,
    };
  }, [stats]);

  // BMI and status
  const bmi = analysisData?.bmi ?? 0;
  const bmiStatus = getBMIStatus(bmi);

  // Weight goal and current weight
  const weightGoal = analysisData?.weightGoal ?? 0;
  const currentWeight = analysisData?.currentWeight ?? 0;

  // Optimistic UI update example: handle weight update
  // (You can add a function to update weight and update state optimistically)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#009FFA" />
        <Text className="mt-4 text-gray-500">Loading analytics...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-red-500">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        className="px-4"
      >
        <AnalyticsHeader
          weightGoal={weightGoal}
          currentWeight={currentWeight}
        />

        <View className="mt-4">
          <BMIBar bmi={bmi} status={bmiStatus} />
        </View>

        <View className="mt-4">
          <ToggleTabs value={tab} onChange={setTab} />
        </View>

        <View className="mt-4">
          <CalorieChart data={calorieChartData} mode={tab} />
        </View>

        <View className="mt-6">
          <NutritionTrend
            protein={nutritionTrendData.protein}
            carbs={nutritionTrendData.carbs}
            fat={nutritionTrendData.fat}
            calories={nutritionTrendData.calories}
            period={stats[stats.length - 1]?.period || ""}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Analytics;
