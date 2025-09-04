import React from "react";
import { View, TouchableOpacity, SafeAreaView } from "react-native";
import { Text } from '../../components/CustomText';
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import { useNotificationContext } from "@/context/NotificationContext";
import Toggle from "@/components/Toggle";

const NotificationSettings = () => {
  const router = useRouter();
  const { preferences, updatePreferences } = useNotificationContext();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          className="bg-black w-10 h-10 rounded-full justify-center items-center" 
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: '0deg' }] }}>
            <icons.arrow width={20} height={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Notification Settings</Text>
        <View className="w-10 h-10" />
      </View>

      <View className="flex-1 px-6 pt-8">
      <View className="bg-white rounded-2xl border border-black p-2 mt-2">
        {/* Meal Reminders */}
        <View className="flex-row items-center justify-between py-4 px-2 border-b border-gray-200">
          <Text className="text-base text-black">Meal Reminders</Text>
          <Toggle
            value={preferences.mealReminders}
            onValueChange={(val) => updatePreferences({ mealReminders: val })}
          />
        </View>
        {/* Goal Milestone Notifications */}
        <View className="flex-row items-center justify-between py-4 px-2 border-b border-gray-200">
          <Text className="text-base text-black">
            Goal Milestone Notifications
          </Text>
          <Toggle
            value={preferences.goalMilestones}
            onValueChange={(val) => updatePreferences({ goalMilestones: val })}
          />
        </View>
        {/* New Plan Recommendations */}
        <View className="flex-row items-center justify-between py-4 px-2">
          <Text className="text-base text-black">New Plan Recommendations</Text>
          <Toggle
            value={preferences.planRecommendations}
            onValueChange={(val) =>
              updatePreferences({ planRecommendations: val })
            }
          />
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationSettings;
