import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Text } from "./CustomText";

const ITEM_HEIGHT = 35;

interface TimeSelectorProps {
  selectedValue: number;
  onValueChange: (value: number) => void;
  type: "hour" | "minute";
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  selectedValue,
  onValueChange,
  type,
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const values =
    type === "hour"
      ? Array.from({ length: 24 }, (_, i) => i) // 0-23 for hours
      : Array.from({ length: 60 }, (_, i) => i); // 0-59 for minutes

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    if (index >= 0 && index < values.length) {
      const value = values[index];
      if (value !== selectedValue) {
        onValueChange(value);
        // Ensure exact snapping to center
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
      }
    }
  };

  const formatValue = (value: number) => {
    return value.toString().padStart(2, "0");
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectorContainer}>
        <View style={styles.indicator} />
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={styles.scrollContent}
          onLayout={() => {
            // Ensure exact initial positioning
            setTimeout(() => {
              const initialIndex = values.indexOf(selectedValue);
              if (initialIndex > -1) {
                scrollViewRef.current?.scrollTo({
                  y: initialIndex * ITEM_HEIGHT,
                  animated: false,
                });
              }
            }, 50);
          }}
        >
          {values.map((value) => {
            const isSelected = value === selectedValue;
            return (
              <View key={value} style={styles.item}>
                <Text
                  style={[styles.text, isSelected ? styles.selectedText : null]}
                >
                  {formatValue(value)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  selectorContainer: {
    height: ITEM_HEIGHT * 3,
    width: "100%",
    overflow: "hidden", // Hide items outside container
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  indicator: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: "5%",
    right: "5%",
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(255, 90, 22, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 22, 1)",
    zIndex: -1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "500",
    fontSize: 16,
    color: "#666",
  },
  selectedText: {
    fontWeight: "500",
    fontSize: 16,
    color: "#ff5a16",
  },
});

export default TimeSelector;
