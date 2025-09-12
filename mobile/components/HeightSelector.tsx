import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './CustomText';
import { RulerPicker } from 'react-native-ruler-picker';
import ToggleSelector from './ToggleSelector';
import { useIsDark } from '@/theme/useIsDark';

interface HeightSelectorProps {
  value: number;
  unit: 'cm' | 'ft';
  onValueChange: (value: number) => void;
  onUnitChange: (unit: 'cm' | 'ft') => void;
}

const HeightSelector: React.FC<HeightSelectorProps> = ({
                                                         value,
                                                         unit,
                                                         onValueChange,
                                                         onUnitChange,
                                                       }) => {
  const isDark = useIsDark();

  const colors = {
    text: isDark ? '#F3F4F6' : '#1E1E1E',
    subText: isDark ? '#9CA3AF' : '#8A8A8E',
    indicator: isDark ? '#FF7A3A' : '#FF5A16',
  };

  const cmToFeet = (cm: number) => cm / 30.48;
  const feetToCm = (ft: number) => ft * 30.48;

  const handleUnitChange = (newUnit: 'cm' | 'ft') => {
    if (newUnit !== unit) {
      onUnitChange(newUnit);
      if (newUnit === 'ft') {
        const newValueInFeet = parseFloat(cmToFeet(value).toFixed(1));
        onValueChange(newValueInFeet);
      } else {
        const newValueInCm = Math.round(feetToCm(value));
        onValueChange(newValueInCm);
      }
    }
  };

  // --- FIX IS HERE ---
  // This handler function receives the string value from the RulerPicker.
  const handleRulerValueChange = (valueAsString: string) => {
    // Convert the string to a number.
    const numericValue = Number(valueAsString);
    
    // Check if the conversion is valid (not NaN) before calling the prop.
    if (!isNaN(numericValue)) {
      // Call the original onValueChange prop with the correctly typed number.
      onValueChange(numericValue);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.valueContainer}>
        <Text style={[styles.valueText, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.unitText, { color: colors.subText }]}>{unit}</Text>
      </View>

      <RulerPicker
        min={unit === 'cm' ? 120 : 4}
        max={unit === 'cm' ? 220 : 8}
        step={unit === 'cm' ? 1 : 0.1}
        fractionDigits={unit === 'cm' ? 0 : 1}
        initialValue={value}
        onValueChange={handleRulerValueChange}
        unitTextStyle={styles.rulerUnitText}
        valueTextStyle={styles.rulerValueText}
        indicatorColor={colors.indicator}
        height={150}
      />

      <ToggleSelector
        options={['cm', 'ft']}
        selectedOption={unit}
        onSelectOption={handleUnitChange}
        containerStyle={{ marginTop: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  valueText: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
  },
  rulerUnitText: {
    color: 'transparent',
  },
  rulerValueText: {
    color: 'transparent',
  },
});

export default HeightSelector;
