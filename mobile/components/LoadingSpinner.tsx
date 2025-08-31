import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
  isProcessing: boolean;
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isProcessing,
  size = 40,
  color = "#FF5A16",
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isProcessing, spinValue]);

  const spinInterpolation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!isProcessing) return null;

  const dotSize = size / 8;
  const radius = size / 2 - dotSize;

  const dots = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * 360) / 8; // evenly spaced around circle
    const angleRad = (angle * Math.PI) / 180;
    const x = radius * Math.cos(angleRad);
    const y = radius * Math.sin(angleRad);

    return (
      <View
        key={i}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            transform: [{ translateX: x }, { translateY: y }],
          },
        ]}
      />
    );
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            transform: [{ rotate: spinInterpolation }],
          },
        ]}
      >
        {dots}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    position: "absolute",
  },
});

export default LoadingSpinner;
