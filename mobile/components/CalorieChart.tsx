// /app/components/CalorieChart.tsx
import { useIsDark } from "@/theme/useIsDark";
import { format } from "date-fns";
import React, { useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Text } from "./CustomText";
import type { TabOption } from "./ToggleTabs";

// Helper function for timezone-safe date formatting
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type CalDatum = { date: string; value: number };

interface CalorieChartProps {
  data: CalDatum[];
  mode: TabOption;
  onBarSelect?: (index: number | null, date: string) => void; // Callback when a bar is selected
}

/** Process incoming data to labels & values for chart display */
function processDataForChart(data: CalDatum[], mode: TabOption) {
  console.log(`🔧 processDataForChart - Mode: ${mode}`, {
    dataLength: data.length,
    sampleData: data.slice(0, 3),
  });

  if (!data || data.length === 0)
    return { labels: [] as string[], values: [] as number[], rangeLabel: "" };

  // Data from analytics is already properly formatted, just need to extract labels and values
  const labels: string[] = [];
  const values: number[] = [];

  if (mode === "daily") {
    // For daily mode, we expect 7 days of data with proper dates
    data.forEach((item) => {
      const date = new Date(item.date);
      const dayLabel = format(date, "EEE"); // Mon, Tue, Wed, etc. (first letter capitalized only)
      labels.push(dayLabel);
      values.push(item.value);
    });

    console.log(`🔧 Daily processed:`, { labels, values });

    // Create range label from first and last dates
    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const lastDate = new Date(data[data.length - 1].date);
      const rangeLabel = `${format(firstDate, "MMM d")} - ${format(lastDate, "MMM d")}`;
      return { labels, values, rangeLabel };
    }
  }

  if (mode === "weekly") {
    // For weekly mode, create week labels
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
    // For monthly mode, create month labels
    data.forEach((item) => {
      const date = new Date(item.date);
      const monthLabel = format(date, "MMM");
      labels.push(monthLabel);
      values.push(item.value);
    });

    console.log(`🔧 Monthly processed:`, { labels, values });

    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const lastDate = new Date(data[data.length - 1].date);
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
  const contentPaddingHorizontal = 24;
  const containerWidth = Math.max(windowWidth - contentPaddingHorizontal, 300);

  // Debug logging
  console.log(`🔧 CalorieChart Debug - Mode: ${mode}`, {
    dataLength: data.length,
    dataPoints: data.slice(0, 5),
    mode,
    windowWidth,
    containerWidth,
  });

  const { labels, values, rangeLabel } = useMemo(
    () => processDataForChart(data, mode),
    [data, mode]
  );

  // Auto-select current day/week/month based on mode
  const getCurrentIndex = useMemo(() => {
    if (!data.length) return null;

    const today = new Date();
    const todayString = formatDateForAPI(today);

    if (mode === "daily") {
      // Find today's index (or current day of week)
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayIndex = currentDay === 0 ? 6 : currentDay - 1; // Convert to Monday = 0
      return mondayIndex < data.length ? mondayIndex : data.length - 1;
    }

    if (mode === "weekly") {
      // Find current week (last week in data)
      return data.length - 1;
    }

    if (mode === "monthly") {
      // Find current month
      const currentMonthKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}`;
      const currentIndex = data.findIndex((item) =>
        item.date.includes(currentMonthKey)
      );
      return currentIndex >= 0 ? currentIndex : data.length - 1;
    }

    return null;
  }, [data, mode]);

  // State for tracking pressed bar and whether user has manually selected
  const [pressedIndex, setPressedIndex] = React.useState<number | null>(
    getCurrentIndex
  );
  const [hasUserSelection, setHasUserSelection] = React.useState(false);

  // Update pressed index when mode changes or data changes (only if user hasn't manually selected)
  React.useEffect(() => {
    if (!hasUserSelection) {
      const newIndex = getCurrentIndex;
      setPressedIndex(newIndex);
      if (newIndex !== null && onBarSelect) {
        onBarSelect(newIndex, data[newIndex]?.date || "");
      }
    }
  }, [getCurrentIndex, data, onBarSelect, hasUserSelection]);

  // Reset user selection flag when mode changes
  React.useEffect(() => {
    setHasUserSelection(false);
  }, [mode]);

  // Transform data for react-native-gifted-charts
  const chartData = useMemo(() => {
    const chartDataPoints = values.map((value: number, index: number) => ({
      value: value,
      label: labels[index],
      frontColor: pressedIndex === index ? "#FF6B35" : "#facec3ff", // Darker orange when pressed, light orange by default
      onPress: () => {
        // Always select the clicked bar (no deselection)
        const newIndex = index;
        setPressedIndex(newIndex);
        setHasUserSelection(true); // Mark that user has manually selected a bar
        if (onBarSelect) {
          onBarSelect(newIndex, data[newIndex]?.date || "");
        }
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
              {/* Triangle pointer/spike pointing down */}
              <View style={styles.trianglePointer} />
            </View>
          </View>
        ) : null,
    }));

    console.log(`🔧 Chart Data created:`, {
      dataLength: chartDataPoints.length,
      labels: chartDataPoints.map((d) => d.label),
      values: chartDataPoints.map((d) => d.value),
      pressedIndex,
    });

    return chartDataPoints;
  }, [values, labels, pressedIndex]);

  // Calculate max value for proper scaling
  const maxValue = Math.max(...values, 0);
  const yAxisMaxValue = Math.ceil((maxValue * 1.2) / 500) * 500; // Round up to nearest 500

  // Calculate chart dimensions to fit perfectly inside container
  const { barWidth, spacing, chartWidth } = useMemo(() => {
    const totalColumns = chartData.length;

    if (totalColumns === 0) {
      return { barWidth: 20, spacing: 10, chartWidth: containerWidth - 48 };
    }

    // Use the full container width minus padding and reduced chart container padding
    const actualPaddingValue = windowWidth < 375 ? 16 : 24; // Match the container padding
    const chartContainerPadding = actualPaddingValue * 2; // Both sides
    const chartInternalPadding = 4; // Reduced from 8 to 4 (2px on each side from paddingHorizontal: 2)
    const availableWidth =
      containerWidth - chartContainerPadding - chartInternalPadding;

    console.log(`🔧 Container sizing:`, {
      windowWidth,
      containerWidth,
      chartContainerPadding,
      availableWidth,
      totalColumns,
    });

    // Calculate optimal bar width and spacing based on available width - more conservative approach
    let barWidth: number;
    let spacing: number;
    let chartWidth: number;

    // Use more conservative ratios that work across all device sizes
    const baseBarRatio =
      windowWidth < 350 ? 0.65 : windowWidth < 400 ? 0.7 : 0.75;

    if (totalColumns === 7) {
      // Daily view: Conservative sizing for 7 bars
      const targetBarToSpacingRatio = baseBarRatio;
      const totalSpaces = totalColumns - 1;

      // Calculate total width needed
      const totalUnits =
        totalColumns +
        (totalSpaces * (1 - targetBarToSpacingRatio)) / targetBarToSpacingRatio;
      const unitWidth = availableWidth / totalUnits;

      barWidth = unitWidth * targetBarToSpacingRatio;
      spacing = unitWidth * (1 - targetBarToSpacingRatio);

      // Scale only if we exceed the available width
      const totalUsedWidth = barWidth * totalColumns + spacing * totalSpaces;
      if (totalUsedWidth > availableWidth) {
        // Scale to fit exactly within available width
        const scale = availableWidth / totalUsedWidth;
        barWidth = barWidth * scale;
        spacing = spacing * scale;
      }

      chartWidth = availableWidth; // Use full available width
    } else {
      // Weekly/Monthly view: Even more conservative for variable columns
      const targetBarToSpacingRatio =
        baseBarRatio + (totalColumns <= 4 ? 0.1 : 0.05);
      const totalSpaces = totalColumns - 1;

      const totalUnits =
        totalColumns +
        (totalSpaces * (1 - targetBarToSpacingRatio)) / targetBarToSpacingRatio;
      const unitWidth = availableWidth / totalUnits;

      barWidth = unitWidth * targetBarToSpacingRatio;
      spacing = unitWidth * (1 - targetBarToSpacingRatio);

      // Scale only if we exceed the available width
      const totalUsedWidth = barWidth * totalColumns + spacing * totalSpaces;
      if (totalUsedWidth > availableWidth) {
        // Scale to fit exactly within available width
        const scale = availableWidth / totalUsedWidth;
        barWidth = barWidth * scale;
        spacing = spacing * scale;
      }

      chartWidth = availableWidth; // Use full available width
    }

    // Ensure minimum sizes and maximum utilization
    const finalTotalWidth =
      barWidth * totalColumns + spacing * (totalColumns - 1);
    const utilization = (finalTotalWidth / availableWidth) * 100;

    console.log(`🔧 Final chart sizing:`, {
      totalColumns,
      barWidth: Math.round(barWidth * 10) / 10,
      spacing: Math.round(spacing * 10) / 10,
      chartWidth: Math.round(chartWidth),
      finalTotalWidth: Math.round(finalTotalWidth),
      utilization: Math.round(utilization) + "%",
      availableWidth,
    });

    return {
      barWidth: Math.round(barWidth),
      spacing: Math.round(spacing),
      chartWidth: Math.round(chartWidth),
    };
  }, [chartData.length, containerWidth, windowWidth]);

  // Responsive padding for the container
  const containerPadding = windowWidth < 375 ? "p-4" : "p-6";
  const paddingValue = windowWidth < 375 ? 16 : 24; // px-4 = 16px, px-6 = 24px

  return (
    <View
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
          <View
            style={{
              width: "100%",
              alignItems: "center",
              overflow: "hidden", // Changed from "visible" to "hidden" to contain chart
              paddingTop: 10,
              paddingHorizontal: 2, // Reduced from 4 to 2 to make chart wider
            }}
          >
            <BarChart
              data={chartData}
              width={chartWidth}
              height={210}
              barWidth={barWidth}
              spacing={spacing}
              roundedTop
              roundedBottom
              hideRules={true}
              xAxisColor="transparent"
              yAxisColor="transparent"
              hideYAxisText={false}
              yAxisTextStyle={{
                color: isDark ? "#9CA3AF" : "#9CA3AF", // same gray works both modes
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
              initialSpacing={4}
              endSpacing={0}
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
          </View>
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
    marginBottom: 8, // Increased spacing between triangle and bar
  },
  tooltipText: {
    color: "#ff5a16", // Dark orange text
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
    borderTopColor: "#ff5a16", // Match the text color
    marginTop: 1, // Reduced spacing between calorie number and triangle
  },
});

export default CalorieChart;
