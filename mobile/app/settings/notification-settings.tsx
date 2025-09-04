import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import { Text } from "../../components/CustomText";
import { useRouter } from "expo-router";
import { useNotificationContext } from "@/context/NotificationContext";
import Toggle from "@/components/Toggle";
import { icons } from "@/constants/icons";

const NotificationSettings = () => {
  const router = useRouter();
  const { preferences, updatePreferences } = useNotificationContext();
  
  // Add fallback values to prevent accessing undefined properties
  const mealReminders = preferences?.mealReminders || {
    enabled: false,
    breakfast: { enabled: false, time: { hour: 8, minute: 0 }, days: [] },
    lunch: { enabled: false, time: { hour: 12, minute: 0 }, days: [] },
    dinner: { enabled: false, time: { hour: 18, minute: 0 }, days: [] },
  };

  const weeklyProgress = preferences?.weeklyProgress || {
    enabled: false,
    time: { hour: 9, minute: 0 },
    day: 'sunday'
  };

  const goalAchievements = preferences?.goalAchievements || {
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

  const days = [
    "monday",
    "tuesday", 
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const formatTime = (time: { hour: number; minute: number }) => {
    return `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openTimePicker = (
    type: "meal" | "weekly" | "goal",
    currentTime: { hour: number; minute: number },
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

  const toggleMealDay = (
    mealType: "breakfast" | "lunch" | "dinner",
    day: string
  ) => {
    const currentDays = mealReminders[mealType]?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
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

  // ✅ FIXED: TimePickerWheel with improved styling and functionality
  const TimePickerWheel = ({
    values,
    selectedValue,
    onValueChange,
    label,
  }: {
    values: (string | number)[];
    selectedValue: string | number;
    onValueChange: (value: any) => void;
    label: string;
  }) => {
    const selectedIndex = values.findIndex((v) => v === selectedValue);
    const itemHeight = 50;
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
      if (scrollViewRef.current && selectedIndex >= 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedIndex * itemHeight,
            animated: false,
          });
        }, 100);
      }
    }, [selectedIndex, itemHeight]);

    return (
      <View style={{ alignItems: "center", flex: 1 }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: "600", 
          marginBottom: 10, 
          color: "#333" 
        }}>
          {label}
        </Text>
        
        <View style={{ height: 150, position: "relative" }}>
          {/* Selection indicator - center line */}
          <View
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              right: 0,
              height: 50,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: "#007AFF",
              backgroundColor: "rgba(0, 122, 255, 0.1)",
              zIndex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Display selected value in the indicator */}
            <Text style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#007AFF",
            }}>
              {typeof selectedValue === "number" && label === "Minute"
                ? selectedValue.toString().padStart(2, "0")
                : selectedValue.toString().padStart(2, "0")}
            </Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={{ height: 150 }}
            contentContainerStyle={{ paddingVertical: 50 }}
            showsVerticalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              const index = Math.round(offsetY / itemHeight);
              const clampedIndex = Math.max(
                0,
                Math.min(values.length - 1, index)
              );
              onValueChange(values[clampedIndex]);
            }}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            {values.map((value, index) => {
              const isSelected = selectedValue === value;
              return (
                <View
                  key={index}
                  style={{
                    height: itemHeight,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isSelected ? 24 : 18,
                      fontWeight: isSelected ? "bold" : "normal",
                      color: isSelected ? "transparent" : "#666", // ✅ FIXED: Hide selected text
                      opacity: isSelected ? 0 : 1,
                    }}
                  >
                    {typeof value === "number" && label === "Minute"
                      ? value.toString().padStart(2, "0")
                      : String(value).padStart(2, "0")}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const TimeSelector = ({
    selectedHour,
    selectedMinute,
    onTimeChange,
  }: {
    selectedHour: number;
    selectedMinute: number;
    onTimeChange: (hour: number, minute: number) => void;
  }) => {
    return (
      <View style={{ 
        flexDirection: "row", 
        justifyContent: "space-around",
        height: 200,
        marginVertical: 20
      }}>
        <TimePickerWheel
          values={Array.from({ length: 24 }, (_, i) => i + 1)}
          selectedValue={selectedHour}
          onValueChange={(hour) => onTimeChange(hour, selectedMinute)}
          label="Hour"
        />
        <TimePickerWheel
          values={Array.from({ length: 60 }, (_, i) => i)}
          selectedValue={selectedMinute}
          onValueChange={(minute) => onTimeChange(selectedHour, minute)}
          label="Minute"
        />
      </View>
    );
  };

  // ✅ FIXED: TimePickerModal with improved styling
  const TimePickerModal = () => (
    <Modal
      visible={showTimePicker !== null}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTimePicker(null)}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}>
        <SafeAreaView style={{
          backgroundColor: "white",
          borderRadius: 15,
          padding: 20,
          width: "85%",
          maxHeight: "60%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          {/* Header component */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: "bold", 
              color: "#333",
              marginBottom: 10 
            }}>
              Change Time
            </Text>
            <View style={{ 
              width: 50, 
              height: 3, 
              backgroundColor: "#007AFF", 
              borderRadius: 2 
            }} />
          </View>

          {/* TimeSelector component */}
          <TimeSelector
            selectedHour={selectedHour}
            selectedMinute={selectedMinute}
            onTimeChange={(hour, minute) => {
              setSelectedHour(hour);
              setSelectedMinute(minute);
            }}
          />

          {/* Action buttons */}
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between",
            marginTop: 20
          }}>
            <TouchableOpacity
              onPress={() => setShowTimePicker(null)}
              activeOpacity={0.7}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                backgroundColor: "#f0f0f0",
                flex: 1,
                marginRight: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#666", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveTime}
              activeOpacity={0.7}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                backgroundColor: "#007AFF",
                flex: 1,
                marginLeft: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
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

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* ✅ FIXED: Meal Reminders Section */}
        <TouchableOpacity
          onPress={() => toggleSection("meals")}
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
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {mealReminders.enabled && (
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#4CAF50",
                  marginRight: 12,
                }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
                  Meal Reminders
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  Get notified for breakfast, lunch, and dinner
                </Text>
              </View>
            </View>
            <Toggle
              value={mealReminders.enabled}
              onValueChange={(val) =>
                updatePreferences({
                  mealReminders: { ...mealReminders, enabled: val },
                })
              }
            />
          </View>

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
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: "500", 
                      textTransform: "capitalize",
                      color: "#333" 
                    }}>
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
                        <Text style={{ fontSize: 16, color: "#007AFF", fontWeight: "500" }}>
                          {formatTime(mealReminders[meal]?.time || { hour: 8, minute: 0 })}
                        </Text>
                      </TouchableOpacity>

                      {/* Days Selection */}
                      <View>
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: "500", 
                          marginBottom: 12,
                          color: "#333" 
                        }}>
                          Active Days
                        </Text>
                        <View style={{ 
                          flexDirection: "row", 
                          justifyContent: "space-between" 
                        }}>
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
                                backgroundColor: (mealReminders[meal]?.days || []).includes(day)
                                  ? "#007AFF"
                                  : "#f0f0f0",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: (mealReminders[meal]?.days || []).includes(day)
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

        {/* ✅ FIXED: Weekly Progress Section */}
        <TouchableOpacity
          onPress={() => toggleSection("weekly")}
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
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {weeklyProgress.enabled && (
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#4CAF50",
                  marginRight: 12,
                }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
                  Weekly Progress
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  Weekly summary of your nutrition goals
                </Text>
              </View>
            </View>
            <Toggle
              value={weeklyProgress.enabled}
              onValueChange={(val) =>
                updatePreferences({
                  weeklyProgress: {
                    ...weeklyProgress,
                    enabled: val,
                  },
                })
              }
            />
          </View>

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
                <Text style={{ fontSize: 16, color: "#007AFF", fontWeight: "500" }}>
                  {formatTime(weeklyProgress.time)}
                </Text>
              </TouchableOpacity>

              {/* Day Selection */}
              <View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "500", 
                  marginBottom: 12,
                  color: "#333" 
                }}>
                  Notification Day
                </Text>
                <View style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between" 
                }}>
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
                        backgroundColor: weeklyProgress.day === day
                          ? "#007AFF"
                          : "#f0f0f0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: weeklyProgress.day === day
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

        {/* ✅ FIXED: Goal Achievements Section */}
        <TouchableOpacity
          onPress={() => toggleSection("goals")}
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
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {goalAchievements.enabled && (
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#4CAF50",
                  marginRight: 12,
                }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
                  Goal Achievements
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  Celebrate when you reach your daily goals
                </Text>
              </View>
            </View>
            <Toggle
              value={goalAchievements.enabled}
              onValueChange={(val) =>
                updatePreferences({
                  goalAchievements: {
                    ...goalAchievements,
                    enabled: val,
                  },
                })
              }
            />
          </View>

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
                <Text style={{ fontSize: 16, color: "#333" }}>
                  Check Time
                </Text>
                <Text style={{ fontSize: 16, color: "#007AFF", fontWeight: "500" }}>
                  {formatTime(goalAchievements.time)}
                </Text>
              </TouchableOpacity>

              {/* Days Selection */}
              <View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "500", 
                  marginBottom: 12,
                  color: "#333" 
                }}>
                  Active Days
                </Text>
                <View style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between" 
                }}>
                  {days.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        const currentDays = goalAchievements.days || [];
                        const newDays = currentDays.includes(day)
                          ? currentDays.filter((d) => d !== day)
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
      </ScrollView>
      
      <TimePickerModal />
    </SafeAreaView>
  );
};

export default NotificationSettings;
