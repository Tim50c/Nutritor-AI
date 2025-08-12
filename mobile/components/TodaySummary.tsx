import { View, Text } from "react-native";
import { Svg, Path } from "react-native-svg";

interface MacroProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function MacroItem({ label, current, target, color }: MacroProps) {
  const viewClassName: string = `h-1 rounded-full ${color}`

  return (
    <View className="items-center">
      <Text className="text-sm font-medium mb-1">{label}</Text>
      <View className="w-12 h-1 bg-gray-200 rounded-full">
        <View
          className={viewClassName}
          style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
        />
      </View>
      <Text className="text-xs text-gray-500 mt-1">
        {current}/{target}g
      </Text>
    </View>
  );
}

interface CircularProgressProps {
  current: number;
  target: number;
}

function CircularProgress({ current, target }: CircularProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const strokeWidth = 8;
  const radius = 60;
  const centerX = 70;
  const centerY = 70;
  const width = 140;
  const height = 70;

  const semicircleCircumference = Math.PI * radius;
  const progressLength = (percentage / 100) * semicircleCircumference;

  // Helper to describe an SVG arc path for a semicircle
  const describeArc = (x: number, y: number, r: number) => {
    const startX = x - r;
    const startY = y;
    const endX = x + r;
    const endY = y;
    return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
  };

  return (
    <View className="items-center justify-center">
      <Svg width={width} height={height}>
        {/* Background semicircle */}
        <Path
          d={describeArc(centerX, centerY, radius)}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress semicircle */}
        <Path
          d={describeArc(centerX, centerY, radius)}
          stroke="#FF6B35"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={semicircleCircumference}
          strokeDashoffset={semicircleCircumference - progressLength}
          strokeLinecap="round"
        />
      </Svg>
      <View className="items-center -mt-6"> {/* Move up to center in semicircle */}
        <Text className="text-lg font-semibold mb-1">Calories</Text>
        <Text className="text-2xl font-bold text-gray-700">
          {current}/{target}
        </Text>
      </View>
    </View>
  );
}

export default function TodaySummary() {
  const calorieData = {
    current: 450,
    target: 1000,
  };

  const macroData = [
    { label: "Protein", current: 78, target: 90, color: "bg-green-500" },
    { label: "Fats", current: 45, target: 70, color: "bg-orange-500" },
    { label: "Carbs", current: 95, target: 110, color: "bg-yellow-500" },
  ];

  return (
    <View className="bg-white mx-4 rounded-2xl p-6 mb-6">
      <Text className="text-lg font-semibold mb-6">Today Summary</Text>

      {/* Circular Progress */}
      <View className="items-center mb-8">
        <CircularProgress
          current={calorieData.current}
          target={calorieData.target}
        />
      </View>

      {/* Macros */}
      <View className="flex-row justify-between">
        {macroData.map((macro, index) => (
          <MacroItem
            key={index}
            label={macro.label}
            current={macro.current}
            target={macro.target}
            color={macro.color}
          />
        ))}
      </View>
    </View>
  );
}