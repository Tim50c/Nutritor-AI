import React from "react";
import { View } from "react-native";
import { Text } from '../../components/CustomText';
import { useNotificationContext } from "@/context/NotificationContext";
import Toggle from "@/components/Toggle";

const NotificationSettings = () => {
  const { preferences, updatePreferences } = useNotificationContext();

  return (
    <View className="flex-1 bg-white px-6 pt-8">
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
  );
};

export default NotificationSettings;
