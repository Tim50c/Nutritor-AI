import React from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Text } from "../CustomText";
import SectionHeader from "./SectionHeader";

interface GoalAchievementsProps {
  goalAchievements: {
    enabled: boolean;
    time: { hour: number; minute: number };
    days: string[];
  };
  updatePreferences: (prefs: any) => void;
  expandedSection: string | null;
  rotationValue: Animated.Value;
  onPress: () => void;
  openTimePicker: (
    type: "meal" | "weekly" | "goal",
    currentTime: { hour: number; minute: number }
  ) => void;
  formatTime: (time: { hour: number; minute: number }) => string;
  days: string[];
  dayLabels: string[];
}

const GoalAchievementsSection = ({
  goalAchievements,
  updatePreferences,
  expandedSection,
  rotationValue,
  onPress,
  openTimePicker,
  formatTime,
  days,
  dayLabels,
}: GoalAchievementsProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-4 shadow-sm dark:shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <SectionHeader
        title="Goal Achievements"
        description="Celebrate when you reach your daily goals"
        enabled={goalAchievements.enabled}
        onToggle={(val) =>
          updatePreferences({
            goalAchievements: {
              ...goalAchievements,
              enabled: val,
            },
          })
        }
        rotationValue={rotationValue}
      />

      {expandedSection === "goals" && goalAchievements.enabled && (
        <View className="mt-5">
          {/* Time Setting */}
          <TouchableOpacity
            onPress={() => openTimePicker("goal", goalAchievements.time)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center py-3 px-6 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4"
          >
            <Text className="text-base text-gray-700 dark:text-gray-300">
              Check Time
            </Text>
            <Text className="text-base text-orange-500 font-medium">
              {formatTime(goalAchievements.time)}
            </Text>
          </TouchableOpacity>

          {/* Days Selection */}
          <View>
            <Text className="text-base font-medium mb-3 text-gray-700 dark:text-gray-300">
              Active Days
            </Text>
            <View className="flex-row justify-between">
              {days.map((day, index) => {
                const isSelected = (goalAchievements.days || []).includes(day);
                const buttonClasses = `w-10 h-10 rounded-full justify-center items-center ${
                  isSelected ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
                }`;
                const textClasses = `text-xs font-semibold ${
                  isSelected ? "text-white" : "text-gray-500 dark:text-gray-400"
                }`;

                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      const currentDays = goalAchievements.days || [];
                      const newDays = currentDays.includes(day)
                        ? currentDays.filter((d: string) => d !== day)
                        : [...currentDays, day];
                      updatePreferences({
                        goalAchievements: {
                          ...goalAchievements,
                          days: newDays,
                        },
                      });
                    }}
                    activeOpacity={0.8}
                    className={buttonClasses}
                  >
                    <Text className={textClasses}>{dayLabels[index]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default GoalAchievementsSection;
