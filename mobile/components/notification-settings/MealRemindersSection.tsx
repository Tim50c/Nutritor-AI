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
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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
        <View style={{ marginTop: 20 }}>
          {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
            <View
              key={meal}
              style={{
                borderTopWidth: 1,
                borderTopColor: "#f0f0f0",
                paddingTop: 16,
                marginTop: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    textTransform: "capitalize",
                    color: "#333",
                  }}
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
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: "#f8f8f8",
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: "#333" }}>
                      Reminder Time
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#ff5a16",
                        fontWeight: "500",
                      }}
                    >
                      {formatTime(
                        mealReminders[meal]?.time || { hour: 8, minute: 0 }
                      )}
                    </Text>
                  </TouchableOpacity>

                  {/* Days Selection */}
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        marginBottom: 12,
                        color: "#333",
                      }}
                    >
                      Active Days
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      {days.map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleMealDay(meal, day)}
                          activeOpacity={0.8}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: (
                              mealReminders[meal]?.days || []
                            ).includes(day)
                              ? "#ff5a16"
                              : "#f0f0f0",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: (mealReminders[meal]?.days || []).includes(
                                day
                              )
                                ? "white"
                                : "#666",
                            }}
                          >
                            {dayLabels[index]}
                          </Text>
                        </TouchableOpacity>
                      ))}
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
