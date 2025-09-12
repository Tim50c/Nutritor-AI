import React from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Text } from "../CustomText";
import SectionHeader from "./SectionHeader";

interface WeeklyProgressProps {
  weeklyProgress: {
    enabled: boolean;
    time: { hour: number; minute: number };
    day: string;
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

const WeeklyProgressSection = ({
  weeklyProgress,
  updatePreferences,
  expandedSection,
  rotationValue,
  onPress,
  openTimePicker,
  formatTime,
  days,
  dayLabels,
}: WeeklyProgressProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm dark:shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <SectionHeader
        title="Weekly Progress"
        description="Weekly summary of your nutrition goals"
        enabled={weeklyProgress.enabled}
        onToggle={(val) =>
          updatePreferences({
            weeklyProgress: {
              ...weeklyProgress,
              enabled: val,
            },
          })
        }
        rotationValue={rotationValue}
      />

      {expandedSection === "weekly" && weeklyProgress.enabled && (
        <View className="mt-5">
          {/* Time Setting */}
          <TouchableOpacity
            onPress={() => openTimePicker("weekly", weeklyProgress.time)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4"
          >
            <Text className="text-base text-gray-700 dark:text-gray-300">
              Notification Time
            </Text>
            <Text className="text-base text-orange-500 font-medium">
              {formatTime(weeklyProgress.time)}
            </Text>
          </TouchableOpacity>

          {/* Day Selection */}
          <View>
            <Text
              className="text-base font-medium mb-3 text-gray-700 dark:text-gray-300"
            >
              Notification Day
            </Text>
            <View
              className="flex-row justify-between"
            >
              {days.map((day, index) => {
                const isSelected = weeklyProgress.day === day;
                const buttonClasses = `w-10 h-10 rounded-full justify-center items-center ${
                  isSelected ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
                }`;
                const textClasses = `text-xs font-semibold ${
                  isSelected ? "text-white" : "text-gray-500 dark:text-gray-400"
                }`;
                
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() =>
                      updatePreferences({
                        weeklyProgress: {
                          ...weeklyProgress,
                          day,
                        },
                      })
                    }
                    activeOpacity={0.8}
                    className={buttonClasses}
                  >
                    <Text className={textClasses}>
                      {dayLabels[index]}
                    </Text>
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

export default WeeklyProgressSection;