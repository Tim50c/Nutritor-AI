import React from 'react';
import { View, ScrollView, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text } from './CustomText'; // Make sure this path is correct

const AGES = Array.from({ length: 83 }, (_, i) => i + 18); // Ages 18 to 100
const ITEM_HEIGHT = 60;

interface AgeSelectorProps {
  selectedValue: number;
  onValueChange: (value: number) => void;
}

const AgeSelector: React.FC<AgeSelectorProps> = ({ selectedValue, onValueChange }) => {
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Added correct type for the event
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    
    // Ensure index is within bounds to prevent errors
    if (index >= 0 && index < AGES.length) {
      const age = AGES[index];
      if (age !== selectedValue) {
          onValueChange(age);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
        onLayout={() => {
            const initialIndex = AGES.indexOf(selectedValue);
            if (initialIndex > -1) {
                scrollViewRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
            }
        }}
      >
        {AGES.map((age) => {
          const isSelected = age === selectedValue;
          return (
            <View key={age} style={styles.item}>
              {/* --- THIS IS THE FIXED LINE --- */}
              <Text style={[styles.text, isSelected ? styles.selectedText : null]}>
                {age}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 5, // Show 5 items at a time
    width: '100%',
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT * 2, // Center the list
  },
  indicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: '5%',
    right: '5%',
    height: ITEM_HEIGHT,
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    zIndex: -1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    // Using fontWeight lets CustomText handle the font file
    fontWeight: '500', // Medium
    fontSize: 32,
    color: '#9CA3AF', // Gray for non-selected
  },
  selectedText: {
    // Using fontWeight lets CustomText handle the font file
    fontWeight: '700', // Bold
    fontSize: 48,
    color: '#FF5A16', // Orange for selected
  },
});

export default AgeSelector;