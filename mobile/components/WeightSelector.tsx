import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 12; // Width of each tick + space
const RULER_WIDTH = SCREEN_WIDTH * 0.8; // Visible part of the ruler

interface WeightSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
}

const WeightSelector: React.FC<WeightSelectorProps> = ({ value, onValueChange }) => {
  const rulerRef = useRef<FlatList>(null);
  const MIN_WEIGHT = 30; // 30 kg
  const MAX_WEIGHT = 200; // 200 kg
  const STEP = 0.5;

  // Generate the data points for the ruler
  const rulerData = useMemo(() => {
    const data = [];
    const emptyItemsCount = Math.floor(RULER_WIDTH / 2 / ITEM_WIDTH);
    for (let i = 0; i < emptyItemsCount; i++) {
        data.push({ type: 'spacer', key: `spacer-start-${i}` });
    }
    for (let i = MIN_WEIGHT; i <= MAX_WEIGHT; i += STEP) {
      data.push({ type: 'tick', value: i, key: `tick-${i}` });
    }
    for (let i = 0; i < emptyItemsCount; i++) {
        data.push({ type: 'spacer', key: `spacer-end-${i}` });
    }
    return data;
  }, []);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const selectedValue = MIN_WEIGHT + (offsetX / ITEM_WIDTH) * STEP;
    const roundedValue = Math.round(selectedValue / STEP) * STEP;
    
    const finalValue = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, roundedValue));
    onValueChange(finalValue);

    const finalOffset = ((finalValue - MIN_WEIGHT) / STEP) * ITEM_WIDTH;
    if (rulerRef.current && Math.abs(finalOffset - offsetX) > 1) { // Prevent snapping if already close
        rulerRef.current.scrollToOffset({ offset: finalOffset, animated: true });
    }
  };

  const renderItem = ({ item }: { item: { type: string; value?: number; key: string }}) => {
    if (item.type === 'spacer') {
        return <View style={{ width: ITEM_WIDTH }} />;
    }

    const isMajorTick = item.value! % 5 === 0;
    const isHalfTick = !isMajorTick && item.value! % 1 === 0;

    return (
      <View style={styles.tickContainer}>
        <View 
          style={[
            styles.tick, 
            isMajorTick && styles.majorTick, 
            isHalfTick && styles.halfTick
          ]}
        />
        {isMajorTick && <Text style={styles.tickLabel}>{item.value}</Text>}
      </View>
    );
  };
  
  const initialOffset = useMemo(() => {
      // Clamp the initial value to be within the min/max range
      const clampedValue = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, value));
      return ((clampedValue - MIN_WEIGHT) / STEP) * ITEM_WIDTH;
  }, [value]);

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.valueText}>{value.toFixed(1)}</Text>
        <Text style={styles.unitText}>kg</Text>
      </View>
      <View style={styles.rulerArea}>
        <View style={styles.indicator} />
        <FlatList
          ref={rulerRef}
          data={rulerData}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          // --- FIX IS HERE ---
          // Use `contentOffset` instead of `initialScrollOffset`
          contentOffset={{ x: initialOffset, y: 0 }}
          style={{ width: RULER_WIDTH }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  valueText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  unitText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#8A8A8E',
    marginLeft: 8,
  },
  rulerArea: {
    width: RULER_WIDTH,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    width: 3,
    height: 60,
    backgroundColor: '#ff5a16',
    borderRadius: 2,
    zIndex: 1, // Ensure indicator is on top
  },
  tickContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    paddingTop: 10,
  },
  tick: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D1D6',
  },
  halfTick: {
    height: 30,
    backgroundColor: '#A0A0A0',
  },
  majorTick: {
    height: 40,
    backgroundColor: '#1E1E1E',
  },
  tickLabel: {
    position: 'absolute',
    top: 55, // Position label below the tick
    fontSize: 16,
    color: '#1E1E1E',
    textAlign: 'center'
  },
});

export default WeightSelector;