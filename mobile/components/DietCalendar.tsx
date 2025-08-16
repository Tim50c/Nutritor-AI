import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useDietContext } from "@/context/DietContext";

function getMonthName(month: number) {
  return new Date(2021, month, 1).toLocaleString('default', { month: 'long' });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DietCalendar() {
  const { selectedDate, setSelectedDate } = useDietContext();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const today = new Date();

  // Month navigation
  function handlePrevMonth() {
    setSelectedDate(new Date(year, month - 1, 1));
  }
  function handleNextMonth() {
    setSelectedDate(new Date(year, month + 1, 1));
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Build calendar grid
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <View className="bg-orange-500 rounded-2xl mx-4 mt-2 mb-6 p-4 shadow-lg">
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity onPress={handlePrevMonth}>
          <Text className="text-white text-lg">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          {getMonthName(month)} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Text className="text-white text-lg">{'>'}</Text>
        </TouchableOpacity>
      </View>
      {/* Days of week */}
      <View className="flex-row justify-between mb-2">
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
          <Text key={d} className="text-white text-xs font-bold w-6 text-center">{d}</Text>
        ))}
      </View>
      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {days.map((d, i) => {
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = d === selectedDate.getDate();
          return (
            <TouchableOpacity
              key={i}
              disabled={!d}
              onPress={() => d && setSelectedDate(new Date(year, month, d))}
              className="w-6 h-6 items-center justify-center mb-2"
            >
              {d ? (
                <View
                  className={
                    isToday
                      ? "bg-white/40 rounded-full w-6 h-6 items-center justify-center"
                      : isSelected
                      ? "bg-white/80 rounded-full w-6 h-6 items-center justify-center"
                      : ""
                  }
                >
                  <Text className="text-white text-sm font-semibold">
                    {d}
                  </Text>
                </View>
              ) : (
                <View className="w-6 h-6" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

