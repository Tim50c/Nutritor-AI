import TimePickerModal from "@/components/TimePickerModal";
import GoalAchievementsSection from "@/components/notification-settings/GoalAchievementsSection";
import MealRemindersSection from "@/components/notification-settings/MealRemindersSection";
import WeeklyProgressSection from "@/components/notification-settings/WeeklyProgressSection";
import { dayLabels, days } from "@/constants/days";
import { icons } from "@/constants/icons";
import { useNotificationContext } from "@/context/NotificationContext";
import {
  GoalAchievements,
  MealReminders,
  TimePreference,
  WeeklyProgress,
} from "@/models/notification-preferences-model";
import { useIsDark } from "@/theme/useIsDark";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../components/CustomText";

const formatTime = (time: TimePreference): string =>
  `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;

const NotificationSettings: React.FC = () => {
  const router = useRouter();
  const { preferences, updatePreferences } = useNotificationContext();
  const isDark = useIsDark();

  // Add fallback values to prevent accessing undefined properties
  const mealReminders: MealReminders = preferences?.mealReminders || {
    enabled: false,
    breakfast: { enabled: false, time: { hour: 8, minute: 0 }, days: [] },
    lunch: { enabled: false, time: { hour: 12, minute: 0 }, days: [] },
    dinner: { enabled: false, time: { hour: 18, minute: 0 }, days: [] },
  };

  const weeklyProgress: WeeklyProgress = preferences?.weeklyProgress || {
    enabled: false,
    time: { hour: 9, minute: 0 },
    day: "sunday",
  };

  const goalAchievements: GoalAchievements = preferences?.goalAchievements || {
    enabled: false,
    time: { hour: 21, minute: 0 },
    days: [],
  };

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<{
    type: "meal" | "weekly" | "goal";
    mealType?: "breakfast" | "lunch" | "dinner";
  } | null>(null);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);

  // Animation values for each section
  const rotationValues = {
    meals: useRef(new Animated.Value(0)).current,
    weekly: useRef(new Animated.Value(0)).current,
    goals: useRef(new Animated.Value(0)).current,
  };

  const toggleSection = (section: string) => {
    // Check if the section's main toggle is enabled before allowing expansion
    let isToggleEnabled = false;
    if (section === "meals") {
      isToggleEnabled = mealReminders.enabled;
    } else if (section === "weekly") {
      isToggleEnabled = weeklyProgress.enabled;
    } else if (section === "goals") {
      isToggleEnabled = goalAchievements.enabled;
    }

    // If the toggle is off, don't allow expansion and don't rotate arrow
    if (!isToggleEnabled) {
      return;
    }

    const isExpanding = expandedSection !== section;
    const previousSection = expandedSection;

    setExpandedSection(isExpanding ? section : null);

    // If there was a previously expanded section and we're opening a new one, close the previous one
    if (previousSection && previousSection !== section && isExpanding) {
      Animated.timing(
        rotationValues[previousSection as keyof typeof rotationValues],
        {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }
      ).start();
    }

    // Animate the current section's arrow
    Animated.timing(rotationValues[section as keyof typeof rotationValues], {
      toValue: isExpanding ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const openTimePicker = (
    type: "meal" | "weekly" | "goal",
    currentTime: TimePreference,
    mealType?: "breakfast" | "lunch" | "dinner"
  ) => {
    const displayHour = currentTime.hour === 0 ? 24 : currentTime.hour;
    setSelectedHour(displayHour);
    setSelectedMinute(currentTime.minute);
    setShowTimePicker({ type, mealType });
  };

  const saveTime = () => {
    if (!showTimePicker) return;

    const hour24 = selectedHour === 24 ? 0 : selectedHour;
    const time = { hour: hour24, minute: selectedMinute };

    if (showTimePicker.type === "meal" && showTimePicker.mealType) {
      updatePreferences({
        mealReminders: {
          ...mealReminders,
          [showTimePicker.mealType]: {
            ...mealReminders[showTimePicker.mealType],
            time,
          },
        },
      });
    } else if (showTimePicker.type === "weekly") {
      updatePreferences({
        weeklyProgress: { ...weeklyProgress, time },
      });
    } else if (showTimePicker.type === "goal") {
      updatePreferences({
        goalAchievements: { ...goalAchievements, time },
      });
    }

    setShowTimePicker(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-3">
        <TouchableOpacity
          className="bg-black dark:bg-white w-10 h-10 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: "0deg" }] }}>
            {isDark ? (
              <icons.arrowDark width={20} height={20} color="#FFFFFF" />
            ) : (
              <icons.arrow width={20} height={20} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black dark:text-white">
          Notification Settings
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView style={{ flex: 1, padding: 24 }}>
        <MealRemindersSection
          mealReminders={mealReminders}
          rotationValue={rotationValues.meals}
          expandedSection={expandedSection}
          onPress={() => toggleSection("meals")}
          updatePreferences={updatePreferences}
          openTimePicker={openTimePicker}
          formatTime={formatTime}
          days={days}
          dayLabels={dayLabels}
        />

        <WeeklyProgressSection
          weeklyProgress={weeklyProgress}
          rotationValue={rotationValues.weekly}
          expandedSection={expandedSection}
          onPress={() => toggleSection("weekly")}
          updatePreferences={updatePreferences}
          openTimePicker={openTimePicker}
          formatTime={formatTime}
          days={days}
          dayLabels={dayLabels}
        />

        <GoalAchievementsSection
          goalAchievements={goalAchievements}
          rotationValue={rotationValues.goals}
          expandedSection={expandedSection}
          onPress={() => toggleSection("goals")}
          updatePreferences={updatePreferences}
          openTimePicker={openTimePicker}
          formatTime={formatTime}
          days={days}
          dayLabels={dayLabels}
        />
      </ScrollView>

      <TimePickerModal
        visible={showTimePicker !== null}
        selectedHour={selectedHour}
        selectedMinute={selectedMinute}
        onTimeChange={(hour: number, minute: number) => {
          setSelectedHour(hour);
          setSelectedMinute(minute);
        }}
        onClose={() => setShowTimePicker(null)}
        onSave={saveTime}
      />
    </SafeAreaView>
  );
};

export default NotificationSettings;
