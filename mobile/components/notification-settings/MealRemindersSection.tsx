import React from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Text } from "../CustomText";
import Toggle from "../Toggle";
import SectionHeader from "./SectionHeader";
import {
  MealReminders,
  TimePreference,
} from "@/models/notification-preferences-model";

interface MealRemindersSectionProps {
  mealReminders: MealReminders;
  updatePreferences: (prefs: { mealReminders?: MealReminders }) => void;
  expandedSection: string | null;
  rotationValue: Animated.Value;
  onPress: () => void;
  openTimePicker: (
    type: "meal" | "weekly" | "goal",
    currentTime: TimePreference,
    mealType?: "breakfast" | "lunch" | "dinner"
  ) => void;
  formatTime: (time: TimePreference) => string;
  days: string[];
  dayLabels: string[];
}

const MealRemindersSection = ({
  mealReminders,
  updatePreferences,
  expandedSection,
  rotationValue,
  onPress,
  openTimePicker,
  formatTime,
  days,
  dayLabels,
}: MealRemindersSectionProps) => {
  const toggleMealDay = (
    mealType: "breakfast" | "lunch" | "dinner",
    day: string
  ) => {
    const currentDays = mealReminders[mealType]?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d: string) => d !== day)
      : [...currentDays, day];

    updatePreferences({
      mealReminders: {
        ...mealReminders,
        [mealType]: {
          ...mealReminders[mealType],
          days: newDays,
        },
      },
    });
  };

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
        title="Meal Reminders"
        description="Get notified for breakfast, lunch, and dinner"
        enabled={mealReminders.enabled}
        onToggle={(val) =>
          updatePreferences({
            mealReminders: { ...mealReminders, enabled: val },
          })
        }
        rotationValue={rotationValue}
      />

      {expandedSection === "meals" && mealReminders.enabled && (
        <View className="mt-5">
          {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
            <View
              key={meal}
              className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
            >
              <View className="flex-row justify-between items-center mb-3">
                <Text
                  className="text-base font-medium capitalize text-gray-700 dark:text-gray-300"
                >
                  {meal}
                </Text>
                <Toggle
                  value={mealReminders[meal]?.enabled || false}
                  onValueChange={(val) =>
                    updatePreferences({
                      mealReminders: {
                        ...mealReminders,
                        [meal]: {
                          ...mealReminders[meal],
                          enabled: val,
                        },
                      },
                    })
                  }
                />
              </View>

              {mealReminders[meal]?.enabled && (
                <>
                  {/* Time Setting */}
                  <TouchableOpacity
                    onPress={() =>
                      openTimePicker(
                        "meal",
                        mealReminders[meal]?.time || { hour: 8, minute: 0 },
                        meal
                      )
                    }
                    activeOpacity={0.7}
                    className="flex-row justify-between items-center py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3"
                  >
                    <Text className="text-base text-gray-700 dark:text-gray-300">
                      Reminder Time
                    </Text>
                    <Text
                      className="text-base text-orange-500 font-medium"
                    >
                      {formatTime(
                        mealReminders[meal]?.time || { hour: 8, minute: 0 }
                      )}
                    </Text>
                  </TouchableOpacity>

                  {/* Days Selection */}
                  <View>
                    <Text
                      className="text-base font-medium mb-3 text-gray-700 dark:text-gray-300"
                    >
                      Active Days
                    </Text>
                    <View
                      className="flex-row justify-between"
                    >
                      {days.map((day, index) => {
                        const isSelected = (
                          mealReminders[meal]?.days || []
                        ).includes(day);
                        const buttonClasses = `w-10 h-10 rounded-full justify-center items-center ${
                          isSelected
                            ? "bg-orange-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`;
                        const textClasses = `text-xs font-semibold ${
                          isSelected
                            ? "text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }`;
                        
                        return (
                          <TouchableOpacity
                            key={day}
                            onPress={() => toggleMealDay(meal, day)}
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
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MealRemindersSection;