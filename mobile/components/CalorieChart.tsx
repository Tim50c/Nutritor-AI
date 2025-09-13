// === /app/components/CalorieChart.tsx (UPDATED) ===
import { useIsDark } from "@/theme/useIsDark";
import { format } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Text } from "./CustomText";
import type { TabOption } from "./ToggleTabs";

type CalDatum = { date: string; value: number };

interface CalorieChartProps {
  data: CalDatum[];
  mode: TabOption;
  onBarSelect?: (index: number | null, date: string) => void; // Callback when a bar is selected
}

/** Process incoming data to labels & values for chart display */
function processDataForChart(data: CalDatum[], mode: TabOption) {
  if (!data || data.length === 0)
    return { labels: [] as string[], values: [] as number[], rangeLabel: "" };

  const labels: string[] = [];
  const values: number[] = [];

  if (mode === "daily") {
    data.forEach((item) => {
      const date = new Date(item.date);
      const dayLabel = format(date, "EEE");
      labels.push(dayLabel);
      values.push(item.value);
    });

    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const lastDate = new Date(data[data.length - 1].date);
      const rangeLabel = `${format(firstDate, "MMM d")} - ${format(lastDate, "MMM d")}`;
      return { labels, values, rangeLabel };
    }
  }

  if (mode === "weekly") {
    data.forEach((item, index) => {
      labels.push(`W${index + 1}`);
      values.push(item.value);
    });

    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const lastDate = new Date(data[data.length - 1].date);
      const rangeLabel = `${format(firstDate, "MMM d")} - ${format(lastDate, "MMM d")}`;
      return { labels, values, rangeLabel };
    }
  }

  if (mode === "monthly") {
    data.forEach((item) => {
      const date = new Date(item.date);
      const monthLabel = format(date, "MMM");
      labels.push(monthLabel);
      values.push(item.value);
    });

    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const rangeLabel = `${format(firstDate, "yyyy")}`;
      return { labels, values, rangeLabel };
    }
  }

  return { labels: [], values: [], rangeLabel: "" };
}

const CalorieChart: React.FC<CalorieChartProps> = ({
  data,
  mode,
  onBarSelect,
}) => {
  const isDark = useIsDark();
  const { width: windowWidth } = useWindowDimensions();

  // We'll measure the actual container width at runtime to avoid layout races
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const { labels, values, rangeLabel } = useMemo(
    () => processDataForChart(data, mode),
    [data, mode]
  );

  // Determine current index (auto select)
  const getCurrentIndex = React.useMemo(() => {
    if (!data.length) return null;

    const today = new Date();

    if (mode === "daily") {
      const currentDay = today.getDay();
      const mondayIndex = currentDay === 0 ? 6 : currentDay - 1;
      return mondayIndex < data.length ? mondayIndex : data.length - 1;
    }

    if (mode === "weekly") return data.length - 1;

    if (mode === "monthly") {
      const currentMonthKey = `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const currentIndex = data.findIndex((item) =>
        item.date.includes(currentMonthKey)
      );
      return currentIndex >= 0 ? currentIndex : data.length - 1;
    }

    return null;
  }, [data, mode]);

  const [pressedIndex, setPressedIndex] = React.useState<number | null>(
    getCurrentIndex
  );
  const [hasUserSelection, setHasUserSelection] = React.useState(false);

  React.useEffect(() => {
    if (!hasUserSelection) {
      const newIndex = getCurrentIndex;
      setPressedIndex(newIndex);
      if (newIndex !== null && onBarSelect) {
        onBarSelect(newIndex, data[newIndex]?.date || "");
      }
    }
  }, [getCurrentIndex, data, onBarSelect, hasUserSelection]);

  React.useEffect(() => {
    setHasUserSelection(false);
  }, [mode]);

  // Calculate max & y-axis
  const maxValue = values.length ? Math.max(...values, 0) : 0;
  const yAxisMaxValue = Math.ceil((maxValue * 1.2 || 500) / 500) * 500;

  // Chart sizing: for scrollable chart, calculate minimum required width to contain all bars
  const { barWidth, spacing, chartWidth, initialSpacing } = useMemo(() => {
    const totalColumns = values.length || 1;

    // Fixed bar dimensions for consistent scrollable experience
    const fixedBarWidth = 32; // Consistent bar width
    const fixedSpacing = 12; // Consistent spacing between bars

    // Calculate total width needed for all bars + spacing + padding
    const totalBarsWidth = fixedBarWidth * totalColumns;
    const totalSpacingWidth = fixedSpacing * Math.max(0, totalColumns - 1);
    const paddingWidth = 16; // Initial and end spacing
    const totalChartWidth = totalBarsWidth + totalSpacingWidth + paddingWidth;

    // Chart width should be the actual width needed (not container width)
    const computedInitialSpacing = 8;

    return {
      barWidth: fixedBarWidth,
      spacing: fixedSpacing,
      chartWidth: totalChartWidth,
      initialSpacing: computedInitialSpacing,
    };
  }, [values.length]);

  // Build chartData AFTER we have barWidth (so tooltip alignment uses correct barWidth)
  const chartData = useMemo(() => {
    return values.map((value: number, index: number) => ({
      value: value,
      label: labels[index] || "",
      frontColor: pressedIndex === index ? "#FF6B35" : "#facec3ff",
      onPress: () => {
        const newIndex = index;
        setPressedIndex(newIndex);
        setHasUserSelection(true);
        if (onBarSelect) onBarSelect(newIndex, data[newIndex]?.date || "");
      },
      topLabelComponent: () =>
        pressedIndex === index ? (
          <View
            style={{
              position: "absolute",
              top: -8,
              left: -(50 - barWidth) / 2,
              width: 50,
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{value.toLocaleString()}</Text>
              <View style={styles.trianglePointer} />
            </View>
          </View>
        ) : null,
    }));
  }, [values, labels, pressedIndex, barWidth, data, onBarSelect]);

  // Responsive container padding class fallback (Tailwind classes are kept in JSX; we use measured width for layout)
  const containerPadding = windowWidth < 375 ? "p-4" : "p-6";

  const chartHeight = windowWidth < 360 ? 180 : 220;

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w && w !== measuredWidth) setMeasuredWidth(w);
  };

  return (
    <View
      onLayout={onContainerLayout}
      className={`bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 ${containerPadding} shadow-sm`}
    >
      <Text className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">
        Calorie Trends
      </Text>
      <Text className="text-xs text-center text-gray-400 dark:text-gray-500">
        {rangeLabel || ""}
      </Text>

      <View className="mt-1">
        {labels.length === 0 ? (
          <View className="h-56 items-center justify-center">
            <Text className="text-sm text-gray-400 dark:text-gray-500">
              No data
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 2,
              paddingTop: 10,
            }}
            style={{
              width: "100%",
            }}
          >
            <BarChart
              data={chartData}
              width={chartWidth + 20} // Slightly more than container width for padding
              height={chartHeight}
              barWidth={barWidth}
              spacing={spacing}
              roundedTop
              roundedBottom
              hideRules={true}
              xAxisColor="transparent"
              yAxisColor="transparent"
              hideYAxisText={false}
              yAxisTextStyle={{
                color: isDark ? "#9CA3AF" : "#9CA3AF",
                fontSize: 11,
              }}
              xAxisLabelTextStyle={{
                color: isDark ? "#D1D5DB" : "#6B7280",
                fontSize: 10,
                fontWeight: "500",
              }}
              noOfSections={4}
              maxValue={yAxisMaxValue}
              isAnimated
              animationDuration={800}
              disableScroll={true}
              backgroundColor={isDark ? "#000000" : "#FFFFFF"}
              initialSpacing={initialSpacing}
              endSpacing={8}
              showGradient={false}
              activeOpacity={0.8}
              formatYLabel={(value) => {
                const num = parseFloat(value);
                if (num >= 1000) {
                  return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
                }
                return num.toString();
              }}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#9CA3AF",
  },
  chartContainer: {
    marginTop: 2,
  },
  noDataContainer: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  tooltipContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  tooltipText: {
    color: "#ff5a16",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  trianglePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#ff5a16",
    marginTop: 1,
  },
});

export default CalorieChart;
