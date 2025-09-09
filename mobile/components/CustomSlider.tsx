import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  runOnUI,
  withSpring,
} from 'react-native-reanimated';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
  style?: any;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
}

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  onSlidingComplete,
  style,
  trackColor = '#E5E7EB',
  activeTrackColor = '#ff5a16',
  thumbColor = '#ff5a16',
}) => {
  const translateX = useSharedValue(0);
  const sliderWidth = useSharedValue(350);
  const isDragging = useSharedValue(false);

  const snapToStep = (val: number) => {
    'worklet';
    if (step <= 0) return val;
    return Math.round(val / step) * step;
  };

  const positionFromValue = (val: number) => {
    'worklet';
    if (maximumValue <= minimumValue) return 0;
    
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, val));
    const percentage = (clampedValue - minimumValue) / (maximumValue - minimumValue);
    const trackWidth = Math.max(100, sliderWidth.value - THUMB_SIZE); // Increased minimum width
    
    // Ultra-high precision to push threshold to 6000
    const position = Math.round(percentage * trackWidth * 10000) / 10000;
    return Math.min(trackWidth, Math.max(0, position));
  };

  const calculateValue = (position: number) => {
    'worklet';
    const trackWidth = Math.max(100, sliderWidth.value - THUMB_SIZE); // Match positionFromValue
    const clampedPosition = Math.max(0, Math.min(trackWidth, position));
    
    // Ultra-high precision calculation
    const percentage = trackWidth > 0 ? clampedPosition / trackWidth : 0;
    const range = maximumValue - minimumValue;
    const rawValue = minimumValue + (percentage * range);
    const steppedValue = snapToStep(rawValue);
    
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  // Smooth animated reset function
  const resetToValue = (targetValue: number) => {
    'worklet';
    const newPosition = positionFromValue(targetValue);
    translateX.value = withSpring(newPosition, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  };

  useEffect(() => {
    if (!isDragging.value) {
      runOnUI(resetToValue)(value);
    }
  }, [value, minimumValue, maximumValue, sliderWidth.value]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { 
    startX: number; 
    lastValue: number;
    lastCallbackTime: number;
  }>({
    onStart: (_, context) => {
      isDragging.value = true;
      context.startX = translateX.value;
      context.lastValue = calculateValue(translateX.value);
      context.lastCallbackTime = 0;
    },
    onActive: (event, context) => {
      const trackWidth = Math.max(100, sliderWidth.value - THUMB_SIZE);
      const newPosition = Math.max(0, Math.min(trackWidth, context.startX + event.translationX));
      translateX.value = newPosition;
      
      const newValue = calculateValue(newPosition);
      const now = Date.now();
      
      // Throttle callbacks: minimum 16ms between calls (60fps) and value change > 0.5
      if (Math.abs(newValue - context.lastValue) > 0.5 && 
          (now - context.lastCallbackTime) > 16) {
        context.lastValue = newValue;
        context.lastCallbackTime = now;
        runOnJS(onValueChange)(newValue);
      }
    },
    onEnd: () => {
      isDragging.value = false;
      const finalValue = calculateValue(translateX.value);
      runOnJS(onSlidingComplete)(finalValue);
    },
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const scale = isDragging.value ? withSpring(1.2) : withSpring(1);
    return { transform: [{ translateX: translateX.value }, { scale }] };
  });

  const activeTrackAnimatedStyle = useAnimatedStyle(() => {
    return { width: translateX.value + THUMB_SIZE / 2 };
  });

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    sliderWidth.value = Math.max(100, width);
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={[styles.track, { backgroundColor: trackColor, height: TRACK_HEIGHT, marginLeft: THUMB_SIZE / 2 }]} />
      <Animated.View style={[styles.activeTrack, { backgroundColor: activeTrackColor, height: TRACK_HEIGHT, marginLeft: THUMB_SIZE / 2 }, activeTrackAnimatedStyle]} />
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.thumb, { backgroundColor: thumbColor, width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2 }, thumbAnimatedStyle]} />
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 40, justifyContent: 'center', position: 'relative' },
  track: { borderRadius: 2, position: 'absolute', flex: 1 },
  activeTrack: { borderRadius: 2, position: 'absolute' },
  thumb: { position: 'absolute', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 3, elevation: 5 },
});

export default CustomSlider;
