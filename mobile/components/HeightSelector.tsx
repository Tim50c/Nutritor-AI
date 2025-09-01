import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RulerPicker } from 'react-native-ruler-picker';
import ToggleSelector from './ToggleSelector';

interface HeightSelectorProps {
  value: number;
  unit: 'cm' | 'ft';
  onValueChange: (value: number) => void;
  onUnitChange: (unit: 'cm' | 'ft') => void;
}

const HeightSelector: React.FC<HeightSelectorProps> = ({ value, unit, onValueChange, onUnitChange }) => {
  
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
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      <RulerPicker
        min={unit === 'cm' ? 120 : 4}
        max={unit === 'cm' ? 220 : 8}
        step={unit === 'cm' ? 1 : 0.1}
        fraction={unit === 'cm' ? 0 : 1}
        initialValue={value}
        // Use the new handler function that performs the type conversion.
        onValueChange={handleRulerValueChange} 
        unitTextStyle={styles.rulerUnitText}
        valueTextStyle={styles.rulerValueText}
        indicatorColor="#FF5A16"
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
    color: '#1E1E1E',
  },
  unitText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8A8A8E',
    marginLeft: 8,
  },
  rulerUnitText: {
    color: '#8A8A8E',
  },
  rulerValueText: {
    color: '#1E1E1E',
  }
});

export default HeightSelector;