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
        <View style={{ marginTop: 20 }}>
          {/* Time Setting */}
          <TouchableOpacity
            onPress={() => openTimePicker("weekly", weeklyProgress.time)}
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
            <Text style={{ fontSize: 16, color: "#333" }}>
              Notification Time
            </Text>
            <Text style={{ fontSize: 16, color: "#ff5a16", fontWeight: "500" }}>
              {formatTime(weeklyProgress.time)}
            </Text>
          </TouchableOpacity>

          {/* Day Selection */}
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                marginBottom: 12,
                color: "#333",
              }}
            >
              Notification Day
            </Text>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              {days.map((day, index) => (
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
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      weeklyProgress.day === day ? "#ff5a16" : "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: weeklyProgress.day === day ? "white" : "#666",
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

export default WeeklyProgressSection;
