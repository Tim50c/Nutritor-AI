import React from 'react';
import { View, Text } from 'react-native';


const NutritionTrend: React.FC = () => {
  return (
    <View className="rounded-lg border border-gray-200 p-4 bg-white">
      <Text className="text-center text-lg font-semibold">Nutrition Trend</Text>


      <View className="mt-4">
        <Text className="text-sm">Protein intake Trend</Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 h-3">
          <View style={{width: '75%'}} className="h-3 bg-protein-200" />
        </View>
        <Text className="text-xs mt-1 text-gray-500">Meeting your daily protein goal • 75%</Text>
      </View>


      <View className="mt-4">
        <Text className="text-sm">Carbohydrate Balance</Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 h-3">
          <View style={{width: '60%'}} className="h-3 bg-primary-100" />
        </View>
        <Text className="text-xs mt-1 text-gray-500">Within recommended range • 60%</Text>
      </View>

      <View className="mt-4">
        <Text className="text-sm">Fat Intake</Text>
        <View className="mt-2 rounded-full overflow-hidden bg-gray-200 h-3">
          <View style={{width: '45%'}} className="h-3 bg-calories-500" />
        </View>
        <Text className="text-xs mt-1 text-gray-500">Below recommended intake • 45%</Text>
      </View>
    </View>
  );
}


export default NutritionTrend;