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
        <View style={{ marginTop: 20 }}>
          {/* Time Setting */}
          <TouchableOpacity
            onPress={() => openTimePicker("goal", goalAchievements.time)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: "#f8f8f8",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, color: "#333" }}>Check Time</Text>
            <Text style={{ fontSize: 16, color: "#007AFF", fontWeight: "500" }}>
              {formatTime(goalAchievements.time)}
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
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              {days.map((day, index) => (
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
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: (goalAchievements.days || []).includes(day)
                      ? "#007AFF"
                      : "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: (goalAchievements.days || []).includes(day)
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
        </View>
      )}
    </TouchableOpacity>
  );
};

export default GoalAchievementsSection;
