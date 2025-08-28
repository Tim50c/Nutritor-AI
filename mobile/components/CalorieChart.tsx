// /app/components/CalorieChart.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  startOfMonth,
  eachWeekOfInterval,
  startOfYear,
  eachMonthOfInterval,
} from "date-fns";
import type { TabOption } from "./ToggleTabs";

type CalDatum = { date: string; value: number };

interface CalorieChartProps {
  data: CalDatum[];
  mode: TabOption;
}

/** Aggregate incoming date-based data to labels & values depending on mode */
function aggregateData(data: CalDatum[], mode: TabOption) {
  if (!data || data.length === 0) return { labels: [] as string[], values: [] as number[], rangeLabel: "" };

  const parsed = data.map((d) => ({ ...d, dateObj: new Date(d.date) }));
  const latest = parsed.reduce((a, b) => (a.dateObj > b.dateObj ? a : b)).dateObj;

  if (mode === "daily") {
    const weekStart = startOfWeek(latest, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const labels = days.map((d) => format(d, "EEE").toUpperCase());
    const values = days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      return parsed.filter((p) => format(p.dateObj, "yyyy-MM-dd") === key).reduce((s, r) => s + r.value, 0);
    });
    const rangeLabel = `${format(days[0], "MMM d")} - ${format(days[6], "MMM d")}`;
    return { labels, values, rangeLabel };
  }

  if (mode === "weekly") {
    const monthStart = startOfMonth(latest);
    const monthEnd = addDays(startOfMonth(addDays(monthStart, 31)), -1);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const labels = weeks.map((_, idx) => `W${idx + 1}`);
    const values = weeks.map((ws) => {
      const we = addDays(ws, 6);
      return parsed.filter((p) => p.dateObj >= ws && p.dateObj <= we).reduce((s, r) => s + r.value, 0);
    });
    const rangeLabel = `${format(weeks[0], "MMM d")} - ${format(addDays(weeks[weeks.length - 1], 6), "MMM d")}`;
    return { labels, values, rangeLabel };
  }

  // monthly
  const yearStart = startOfYear(latest);
  const months = eachMonthOfInterval({ start: yearStart, end: addDays(yearStart, 365) }).slice(0, 12);
  const labels = months.map((m) => format(m, "MMM"));
  const values = months.map((m) =>
    parsed.filter((p) => p.dateObj.getMonth() === m.getMonth() && p.dateObj.getFullYear() === m.getFullYear())
      .reduce((s, r) => s + r.value, 0)
  );
  const rangeLabel = `${format(months[0], "yyyy")} - ${format(months[months.length - 1], "yyyy")}`;
  return { labels, values, rangeLabel };
}

const CalorieChart: React.FC<CalorieChartProps> = ({ data, mode }) => {
  const { width: windowWidth } = useWindowDimensions();
  const contentPaddingHorizontal = 24;
  const containerWidth = Math.max(windowWidth - contentPaddingHorizontal, 300);

  const { labels, values, rangeLabel } = useMemo(() => aggregateData(data, mode), [data, mode]);

  // Transform data for react-native-gifted-charts
  const chartData = useMemo(() => {
    return values.map((value, index) => ({
      value: value,
      label: labels[index],
      frontColor: '#FF7A52', // Orange color matching the image
      topLabelComponent: () => (
        <Text style={{
          color: '#333',
          fontSize: 9,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {value}
        </Text>
      ),
    }));
  }, [values, labels]);

  // Calculate max value for proper scaling
  const maxValue = Math.max(...values, 0);
  const yAxisMaxValue = Math.ceil(maxValue * 1.2 / 500) * 500; // Round up to nearest 500

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
          <ScrollView
            horizontal={chartData.length > 5}
            showsHorizontalScrollIndicator={false}
          >
            <BarChart
              data={chartData}
              width={Math.max(containerWidth - 40, (chartData.length + 1) * 50)}
              height={220}
              barWidth={32}
              spacing={20}
              roundedTop
              roundedBottom
              hideRules={false}
              rulesType="solid"
              rulesColor="#F3F4F6"
              xAxisColor="#E5E7EB"
              yAxisColor="#E5E7EB"
              yAxisTextStyle={{
                color: '#9CA3AF',
                fontSize: 11,
              }}
              xAxisLabelTextStyle={{
                color: '#6B7280',
                fontSize: 11,
                fontWeight: '500',
              }}
              noOfSections={4}
              maxValue={yAxisMaxValue}
              isAnimated
              animationDuration={800}
              disableScroll
              backgroundColor="#FFFFFF"
              initialSpacing={10}
              endSpacing={15}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    margin: 8,
    shadowColor: '#000',
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
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 8,
  },
  noDataContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default CalorieChart;