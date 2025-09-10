import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./CustomText";

export type TabOption = "daily" | "weekly" | "monthly";

type Props = {
  value: TabOption;
  onChange: (t: TabOption) => void;
};

const ToggleTabs: React.FC<Props> = ({ value, onChange }) => {
  const tabs: { key: TabOption; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  return (
    <View className="flex-row rounded-full bg-bg-surface dark:bg-bg-surface-dark p-1">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`flex-1 rounded-full items-center justify-center px-4 py-2 ${
              active ? "bg-accent dark:bg-accent-dark" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-base ${
                active
                  ? "text-white font-semibold"
                  : "text-default dark:text-default-dark"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ToggleTabs;
