// /app/components/CalorieChart.tsx
import React, { useMemo } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import { Text } from "./CustomText";
import { BarChart } from "react-native-gifted-charts";
import { format } from "date-fns";
import type { TabOption } from "./ToggleTabs";

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
      const dayLabel = format(date, "EEE").toUpperCase(); // MON, TUE, WED, etc.
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
    const todayString = today.toISOString().slice(0, 10);

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
              top: -15,
              left: -(50 - barWidth) / 2,
              width: 50,
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>{value.toLocaleString()}</Text>
              {/* Triangle pointer/spike - without top line */}
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
      return { barWidth: 20, spacing: 10, chartWidth: containerWidth - 40 };
    }

    // Start with container width minus minimal padding
    let availableWidth = containerWidth - 40; // Start with 40px padding
    let barWidth, spacing, chartWidth;

    // Try different padding levels until we find the perfect fit
    for (let padding = 40; padding <= 100; padding += 10) {
      availableWidth = containerWidth - padding;

      if (totalColumns === 7) {
        // For daily view, aim for good-looking proportions
        const idealBarWidth = 28;
        const idealSpacing = 12;
        const idealTotalWidth =
          (idealBarWidth + idealSpacing) * totalColumns - idealSpacing;

        if (idealTotalWidth <= availableWidth) {
          // Perfect! Use ideal sizes
          barWidth = idealBarWidth;
          spacing = idealSpacing;
          chartWidth = idealTotalWidth + 10; // Small buffer

          console.log(`🔧 Daily Chart (ideal fit):`, {
            containerWidth,
            padding,
            availableWidth,
            barWidth,
            spacing,
            chartWidth,
            idealTotalWidth,
          });
          break;
        } else {
          // Calculate proportional sizes that fit
          const scale = availableWidth / idealTotalWidth;
          barWidth = Math.max(idealBarWidth * scale, 18); // Minimum 18px bars
          spacing = Math.max(idealSpacing * scale, 6); // Minimum 6px spacing
          chartWidth = availableWidth - 5; // Leave small buffer
        }
      } else {
        // For weekly/monthly views
        const spacePerColumn = availableWidth / totalColumns;
        barWidth = Math.max(spacePerColumn * 0.7, 20);
        spacing = Math.max(spacePerColumn * 0.3, 8);
        chartWidth = availableWidth - 5;
      }

      // Check if this configuration looks good
      const totalUsedWidth = (barWidth + spacing) * totalColumns - spacing;
      if (totalUsedWidth <= availableWidth && barWidth >= 18) {
        console.log(`🔧 Chart perfect fit found:`, {
          containerWidth,
          padding,
          availableWidth,
          totalColumns,
          barWidth,
          spacing,
          chartWidth,
          totalUsedWidth,
          utilizationPercent:
            ((totalUsedWidth / availableWidth) * 100).toFixed(1) + "%",
        });
        break;
      }
    }

    // Fallback if no good fit found
    if (!barWidth) {
      availableWidth = containerWidth - 60;
      const spacePerColumn = availableWidth / totalColumns;
      barWidth = Math.max(spacePerColumn * 0.65, 15);
      spacing = Math.max(spacePerColumn * 0.35, 4);
      chartWidth = availableWidth;

      console.log(`🔧 Chart fallback sizing:`, {
        containerWidth,
        availableWidth,
        barWidth,
        spacing,
        chartWidth,
      });
    }

    return { barWidth, spacing, chartWidth };
  }, [chartData.length, containerWidth]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calorie Trends</Text>
      <Text style={styles.subtitle}>{rangeLabel || ""}</Text>

      <View style={styles.chartContainer}>
        {labels.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data</Text>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              alignItems: "center",
              overflow: "visible", // Changed from "hidden" to "visible"
              paddingHorizontal: 2,
              paddingTop: 15, // Reduced padding for smaller tooltip
            }}
          >
            <BarChart
              data={chartData}
              width={chartWidth}
              height={210} // Slightly reduced to accommodate small tooltip
              barWidth={barWidth}
              spacing={spacing}
              roundedTop
              roundedBottom
              hideRules={true} // Remove background grid lines
              xAxisColor="transparent" // Remove x-axis line
              yAxisColor="transparent" // Remove y-axis line
              hideYAxisText={false} // Keep y-axis labels
              yAxisTextStyle={{
                color: "#9CA3AF",
                fontSize: 11,
              }}
              xAxisLabelTextStyle={{
                color: "#6B7280",
                fontSize: 11,
                fontWeight: "500",
              }}
              noOfSections={4}
              maxValue={yAxisMaxValue}
              isAnimated
              animationDuration={800}
              disableScroll={true}
              backgroundColor="#FFFFFF"
              initialSpacing={0}
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
    marginBottom: 8,
  },
  tooltipText: {
    backgroundColor: "#fcd8cfff", // Light orange background to match the bars
    color: "#ff5a16", // Dark orange text
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "600",
    overflow: "visible",
  },
  trianglePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8, // Changed from borderBottomWidth
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fcd8cfff", // Match the tooltip background color
    marginTop: -1,
  },
});

export default CalorieChart;
