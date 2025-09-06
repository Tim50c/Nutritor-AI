import React from "react";
import { View, Animated } from "react-native";
import { Text } from "../CustomText";
import Toggle from "../Toggle";
import { icons } from "@/constants/icons";

interface SectionHeaderProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  rotationValue: Animated.Value;
}

const SectionHeader = ({
  title,
  description,
  enabled,
  onToggle,
  rotationValue,
}: SectionHeaderProps) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "90deg"],
                }),
              },
            ],
            marginRight: 14,
          }}
        >
          <icons.forwardArrow
            width={16}
            height={16}
          />
        </Animated.View>
        <View style={{ flex: 0.9 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            {description}
          </Text>
        </View>
      </View>
      <Toggle value={enabled} onValueChange={onToggle} />
    </View>
  );
};

export default SectionHeader;
