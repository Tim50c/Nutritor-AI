import {useMemo, useState} from 'react';
import { SafeAreaView, View, ScrollView } from 'react-native';
import AnalyticsHeader from '@/components/AnalyticsHeader';
import BMIBar from '@/components/BMIBar';
import ToggleTabs, { TabOption } from '@/components/ToggleTabs';
import CalorieChart from '@/components/CalorieChart';
import NutritionTrend from '@/components/NutritionTrend';
import { generateMockCalories } from '@/data/mockData';


const Analytics = () => {
  const [tab, setTab] = useState<TabOption>('daily');


// Mock dynamic data generator: returns an array of {label, value, date}
  const data = useMemo(() => generateMockCalories(), []);


// Aggregate data depending on tab
// For daily: show days in a selected week (dynamic number of days)
// For weekly: show weeks in a month (dynamic weeks)
// For monthly: show months in a year (12 but keep dynamic)


  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{paddingBottom: 120}} className="px-4">
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