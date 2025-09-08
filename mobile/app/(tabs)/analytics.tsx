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
  if (bmi <= 0 || isNaN(bmi)) return "Unknown"; // Handle invalid BMI
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obesity";
};

const Analytics = () => {
  const [tab, setTab] = useState<TabOption>("daily");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [nutritionData, setNutritionData] = useState<any>({
    daily: null,
    weekly: null,
    monthly: null,
  });
  const [loading, setLoading] = useState(true);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for selected bar and nutrition trend
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [selectedBarDate, setSelectedBarDate] = useState<string>("");

  // Fetch initial comprehensive data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    AnalysisService.getComprehensiveAnalytics()
      .then((res) => {
        if (mounted) {
          setAnalysisData(res.analysisData);
          setNutritionData({
            daily: res.dailyNutrition,
            weekly: res.weeklyNutrition,
            monthly: res.monthlyNutrition,
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to fetch comprehensive analytics:", err);
          // Fallback: try to get at least the basic analysis data
          AnalysisService.getAnalysis()
            .then((res) => {
              if (mounted) {
                setAnalysisData(res.data);
                setError("Some nutrition data may be unavailable.");
                setLoading(false);
              }
            })
            .catch(() => {
              if (mounted) {
                setError("Failed to fetch analysis data.");
                setLoading(false);
              }
            });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch nutrition data when tab changes (if not already loaded)
  useEffect(() => {
    // Only fetch for monthly tab (always reload) or if data is missing for daily/weekly
    if (tab === "monthly" && !loading) {
      // Always fetch monthly data to get fresh data
      setNutritionLoading(true);
      AnalysisService.getNutritionByTab(tab)
        .then((data) => {
          setNutritionData((prev: any) => ({
            ...prev,
            [tab]: data,
          }));
          setNutritionLoading(false);
        })
        .catch((err) => {
          console.error(`Failed to fetch ${tab} nutrition:`, err);
          setNutritionLoading(false);
        });
    } else if (
      !nutritionData[tab] &&
      !loading &&
      (tab === "daily" || tab === "weekly")
    ) {
      // For daily and weekly, only fetch if not already loaded
      setNutritionLoading(true);
      AnalysisService.getNutritionByTab(tab)
        .then((data) => {
          setNutritionData((prev: any) => ({
            ...prev,
            [tab]: data,
          }));
          setNutritionLoading(false);
        })
        .catch((err) => {
          console.error(`Failed to fetch ${tab} nutrition:`, err);
          setNutritionLoading(false);
        });
    }
  }, [tab, loading]); // Removed nutritionData from dependencies to prevent unnecessary re-fetching

  // Helper to determine if we should show loading for current tab
  const shouldShowLoading = useMemo(() => {
    if (loading) return true; // Initial app loading

    // Show loading only if:
    // 1. We're currently fetching (nutritionLoading is true) AND
    // 2. We don't have data for this tab yet
    return nutritionLoading && !nutritionData[tab];
  }, [loading, nutritionLoading, nutritionData, tab]);

  // Get current nutrition data for the selected tab
  const currentNutritionData = nutritionData[tab];

  // Transform nutrition data for charts
  const stats = useMemo(() => {
    if (!currentNutritionData?.success) {
      // Fallback to old analysis data structure
      if (!analysisData) return [];
      if (tab === "daily") return analysisData.dailyStats || [];
      if (tab === "weekly") return analysisData.weeklyStats || [];
      if (tab === "monthly") return analysisData.monthlyStats || [];
      return [];
    }

    // Transform new nutrition data structure based on actual backend response
    const data = currentNutritionData.data;

    if (tab === "daily" && data.dailyNutritionArray) {
      return data.dailyNutritionArray.map((item: any) => ({
        period: item.date,
        calories: item.totalNutrition.calories,
        protein: item.totalNutrition.protein,
        carbs: item.totalNutrition.carbs,
        fat: item.totalNutrition.fat,
      }));
    }

    if (tab === "weekly" && data.weeklyData) {
      return data.weeklyData.map((item: any) => ({
        period: item.week,
        calories: item.weekTotal.calories,
        protein: item.weekTotal.protein,
        carbs: item.weekTotal.carbs,
        fat: item.weekTotal.fat,
      }));
    }

    if (tab === "monthly" && data.monthlyData) {
      return data.monthlyData.map((item: any) => ({
        period: item.month,
        calories: item.monthTotal.calories,
        protein: item.monthTotal.protein,
        carbs: item.monthTotal.carbs,
        fat: item.monthTotal.fat,
      }));
    }

    return [];
  }, [currentNutritionData, analysisData, tab]);

  // Aggregate calorie data for CalorieChart
  const calorieChartData = useMemo(() => {
    if (!stats.length) return [];

    // For daily mode, ensure we have all 7 days in correct order (Monday to Sunday)
    if (tab === "daily") {
      // Sort stats by date to ensure correct order
      const sortedStats = [...stats].sort(
        (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
      );

      // Create a map for quick lookup
      const dataMap = new Map();
      sortedStats.forEach((s: any) => {
        dataMap.set(s.period, s.calories);
      });

      // Always generate a complete Monday-to-Sunday week
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert to Monday = 0

      // Calculate Monday of current week
      const mondayOfWeek = new Date(today);
      mondayOfWeek.setDate(today.getDate() - daysFromMonday);

      console.log(`📅 Week calculation:`, {
        today: today.toISOString().slice(0, 10),
        currentDay,
        daysFromMonday,
        mondayOfWeek: mondayOfWeek.toISOString().slice(0, 10),
      });

      const result = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(mondayOfWeek);
        currentDate.setDate(mondayOfWeek.getDate() + i);
        const dateKey = currentDate.toISOString().slice(0, 10);
        const dayName = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
        });

        result.push({
          date: dateKey,
          value: dataMap.get(dateKey) || 0,
        });

        console.log(`📅 Day ${i}:`, {
          dayName,
          dateKey,
          value: dataMap.get(dateKey) || 0,
        });
      }

      console.log(`📊 Daily Chart Data (Monday-Sunday week):`, result);
      return result;
    }

    // For weekly and monthly, we need to convert the period to a proper date format
    if (tab === "weekly") {
      return stats.map((s: any, index: number) => {
        try {
          // Extract start date from period like "2025-09-01 to 2025-09-07"
          const periodParts = s.period.split(" to ");
          const startDate = periodParts[0];

          // Validate the date
          const dateObj = new Date(startDate);
          if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date in weekly data: ${startDate}`);
            return {
              date: `2025-01-0${index + 1}`, // Fallback date
              value: s.calories,
            };
          }

          return {
            date: startDate, // Use start date of the week
            value: s.calories,
          };
        } catch (error) {
          console.error(`Error parsing weekly date:`, error);
          return {
            date: `2025-01-0${index + 1}`, // Fallback date
            value: s.calories,
          };
        }
      });
    }

    if (tab === "monthly") {
      // Create a map for quick lookup of existing data
      const dataMap = new Map();
      const statsMap = new Map(); // Map to store full stats data by month key
      stats.forEach((s: any) => {
        dataMap.set(s.period, s.calories);
        statsMap.set(s.period, s); // Store full stats object
      });

      // Generate current month and previous 6 months (7 months total)
      const today = new Date();
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(
          today.getFullYear(),
          today.getMonth() - i,
          1
        );
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
        const monthDate = `${monthKey}-01`;

        result.push({
          date: monthDate,
          value: dataMap.get(monthKey) || 0, // Use 0 if no data for this month
          monthKey, // Add monthKey for mapping back to stats
          fullStats: statsMap.get(monthKey) || null, // Add full stats data
        });
      }

      console.log(
        `📊 Monthly Chart Data (Current + 6 previous months):`,
        result
      );
      return result;
    }

    // Fallback
    return stats.map((s: any) => ({
      date: s.period,
      value: s.calories,
    }));
  }, [stats, tab]);

  // Debug logging
  useEffect(() => {
    console.log(`📊 Analytics Debug - Tab: ${tab}`, {
      currentNutritionData,
      hasData: !!currentNutritionData?.success,
      dataStructure: currentNutritionData?.data
        ? Object.keys(currentNutritionData.data)
        : "No data",
      statsLength: stats.length,
      firstFewStats: stats.slice(0, 5),
      chartDataLength: calorieChartData.length,
      firstFewChartData: calorieChartData.slice(0, 5),
    });

    // Additional debug for specific modes
    if (tab === "monthly") {
      console.log(`📊 Monthly Debug - All stats:`, stats);
      console.log(`📊 Monthly Debug - Chart data:`, calorieChartData);
    }

    if (tab === "daily") {
      console.log(`📊 Daily Debug - Stats:`, stats);
      console.log(`📊 Daily Debug - Chart data:`, calorieChartData);
    }
  }, [tab, currentNutritionData, stats, calorieChartData]);

  // Nutrition trend data for NutritionTrend - based on selected bar or default
  const nutritionTrendData = useMemo(() => {
    // If a bar is selected, show data for that specific period
    if (
      selectedBarIndex !== null &&
      calorieChartData.length > selectedBarIndex
    ) {
      console.log(`🔍 Selected bar data:`, {
        selectedBarIndex,
        chartDataLength: calorieChartData.length,
        tab,
      });

      if (tab === "monthly") {
        // For monthly, use the fullStats from chart data
        const selectedChartData = calorieChartData[selectedBarIndex];
        if (selectedChartData && selectedChartData.fullStats) {
          const selectedData = selectedChartData.fullStats;
          console.log(`🔍 Monthly selected data:`, selectedData);
          return {
            protein: selectedData.protein || 0,
            carbs: selectedData.carbs || 0,
            fat: selectedData.fat || 0,
            calories: selectedData.calories || 0,
          };
        } else {
          // No data for this month
          return { protein: 0, carbs: 0, fat: 0, calories: 0 };
        }
      } else {
        // For daily and weekly, use stats array directly
        if (stats.length > selectedBarIndex) {
          const selectedData = stats[selectedBarIndex];
          console.log(`🔍 Daily/Weekly selected data:`, selectedData);
          return {
            protein: selectedData.protein || 0,
            carbs: selectedData.carbs || 0,
            fat: selectedData.fat || 0,
            calories: selectedData.calories || 0,
          };
        }
      }
    }

    // Default behavior - show data for the latest period or overall totals
    if (!currentNutritionData?.success) {
      if (!stats.length) return { protein: 0, carbs: 0, fat: 0, calories: 0 };
      // Use the latest period's stats for trend
      const latest = stats[stats.length - 1];
      return {
        protein: latest.protein || 0,
        carbs: latest.carbs || 0,
        fat: latest.fat || 0,
        calories: latest.calories || 0,
      };
    }

    // For default display when no bar is selected, show appropriate totals
    const data = currentNutritionData.data;

    if (tab === "daily" && data.weeklyTotal) {
      return data.weeklyTotal;
    }

    if (tab === "weekly") {
      // Show the latest week's data instead of total
      if (stats.length > 0) {
        const latest = stats[stats.length - 1];
        return {
          protein: latest.protein || 0,
          carbs: latest.carbs || 0,
          fat: latest.fat || 0,
          calories: latest.calories || 0,
        };
      }
    }

    if (tab === "monthly") {
      // Show the latest month's data instead of total
      if (stats.length > 0) {
        const latest = stats[stats.length - 1];
        return {
          protein: latest.protein || 0,
          carbs: latest.carbs || 0,
          fat: latest.fat || 0,
          calories: latest.calories || 0,
        };
      }
    }

    return { protein: 0, carbs: 0, fat: 0, calories: 0 };
  }, [stats, currentNutritionData, tab, selectedBarIndex, calorieChartData]);

  // Callback for when a bar is selected in the chart
  const handleBarSelect = (index: number | null, date: string) => {
    setSelectedBarIndex(index);
    setSelectedBarDate(date);
  };

  // Reset selected bar when tab changes
  useEffect(() => {
    setSelectedBarIndex(null);
    setSelectedBarDate("");
  }, [tab]);

  // BMI and status
  const bmi = analysisData?.bmi ?? 0;
  const bmiStatus = getBMIStatus(bmi);

  // Debug BMI data
  console.log("🔍 BMI Debug:", {
    analysisData: analysisData
      ? {
          bmi: analysisData.bmi,
          currentWeight: analysisData.currentWeight,
          weightGoal: analysisData.weightGoal,
        }
      : null,
    calculatedBmi: bmi,
    bmiStatus,
    isValidBmi: bmi > 0 && bmi < 100,
  });

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

        {shouldShowLoading ? (
          <View className="mt-4 flex-1 justify-center items-center py-8">
            <ActivityIndicator size="small" color="#009FFA" />
            <Text className="mt-2 text-gray-500 text-sm">
              Loading {tab} data...
            </Text>
          </View>
        ) : (
          <>
            <View className="mt-4">
              <CalorieChart
                data={calorieChartData}
                mode={tab}
                onBarSelect={handleBarSelect}
              />
            </View>

            <View className="mt-6">
              <NutritionTrend
                protein={nutritionTrendData.protein}
                carbs={nutritionTrendData.carbs}
                fat={nutritionTrendData.fat}
                calories={nutritionTrendData.calories}
                period={(() => {
                  if (selectedBarIndex !== null) {
                    if (
                      tab === "monthly" &&
                      calorieChartData[selectedBarIndex]
                    ) {
                      // For monthly, get the period from the chart data or construct it from monthKey
                      const selectedChartData =
                        calorieChartData[selectedBarIndex];
                      if (selectedChartData.fullStats) {
                        return selectedChartData.fullStats.period;
                      } else if (selectedChartData.monthKey) {
                        return selectedChartData.monthKey;
                      }
                    } else if (stats[selectedBarIndex]) {
                      // For daily and weekly
                      return stats[selectedBarIndex].period;
                    }
                  }
                  // Default to latest period
                  return stats[stats.length - 1]?.period || "";
                })()}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Analytics;
