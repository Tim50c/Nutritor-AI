import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "./CustomText";
import { useDietContext } from "@/context/DietContext";

function getMonthName(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString("en-US", { month: "long" });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // JS getDay(): 0 (Sun) - 6 (Sat)
  return new Date(year, month, 1).getDay();
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DietCalendar() {
  const { dietDate, setDietDate } = useDietContext();

  // Ensure the calendar shows the current month and selects today on first mount
  useEffect(() => {
    setDietDate(new Date());
    // run once on mount
  }, []);

  // Use the selected date from context as the view date
  const year = dietDate.getFullYear();
  const month = dietDate.getMonth();

  // Monday-first week: map JS getDay (Sun=0..Sat=6) to Mon=0..Sun=6
  const firstDayRaw = getFirstDayOfWeek(year, month);
  const firstDayIndex = (firstDayRaw + 6) % 7; // Monday-first index

  const daysInMonth = getDaysInMonth(year, month);

  // Build calendar grid with leading nulls for the first week
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <View className="bg-orange-500 rounded-2xl mx-4 mt-2 mb-6 p-3 shadow-lg">
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity
          onPress={() => setDietDate(new Date(year, month - 1, 1))}
        >
          <Text className="text-white text-lg">{"<"}</Text>
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold flex-1 text-center mx-2 truncate my-1">
          {getMonthName(year, month)} {year}
        </Text>

        <TouchableOpacity
          onPress={() => setDietDate(new Date(year, month + 1, 1))}
        >
          <Text className="text-white text-lg">{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers (Monday-first) */}
      <View className="flex-row mb-1">
        {weekDays.map((d) => (
          <Text
            key={d}
            className="w-[14.2857%] text-center text-white text-xs font-bold"
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {days.map((d, i) => {
          const cellDate = d ? new Date(year, month, d) : null;
          const today = new Date(); // Get current date for comparison
          const isToday = cellDate ? isSameDate(cellDate, today) : false;
          const isSelected = cellDate ? isSameDate(cellDate, dietDate) : false;

          return (
            <TouchableOpacity
              key={i}
              disabled={!d}
              onPress={() => {
                if (d) {
                  const newDate = new Date(year, month, d);
                  setDietDate(newDate);
                }
              }}
              className="w-[14.2%] h-10 items-center justify-center mb-1"
              accessibilityLabel={d ? `Day ${d}` : `Empty`}
            >
              {d ? (
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center ${isToday ? "bg-white/40" : isSelected ? "bg-white/80" : ""}`}
                >
                  <Text
                    className={`${isToday || isSelected ? "text-black" : "text-white"} text-sm font-semibold`}
                  >
                    {d}
                  </Text>
                </View>
              ) : (
                <View className="w-9 h-9" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
