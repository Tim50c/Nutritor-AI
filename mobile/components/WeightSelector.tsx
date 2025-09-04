import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './CustomText';
import { RulerPicker } from 'react-native-ruler-picker';
import ToggleSelector from './ToggleSelector';

interface WeightSelectorProps {
  value: number;
  unit: 'kg' | 'lbs';
  onValueChange: (value: number) => void;
  onUnitChange: (unit: 'kg' | 'lbs') => void;
}

const KG_TO_LBS = 2.20462;

const WeightSelector: React.FC<WeightSelectorProps> = ({ value, unit, onValueChange, onUnitChange }) => {
  const kgToLbs = (kg: number) => parseFloat((kg * KG_TO_LBS).toFixed(1));
  const lbsToKg = (lbs: number) => parseFloat((lbs / KG_TO_LBS).toFixed(1));

  const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
    if (newUnit !== unit) {
      onUnitChange(newUnit);
      if (newUnit === 'lbs') {
        // convert kg -> lbs, integer for lbs
        const newValueInLbs = Math.round(kgToLbs(value));
        onValueChange(newValueInLbs);
      } else {
        // convert lbs -> kg, 1 decimal for kg
        const newValueInKg = parseFloat(lbsToKg(value).toFixed(1));
        onValueChange(newValueInKg);
      }
    }
  };

  // Keep the picker's value precision consistent with step/fractionDigits
  const formatForUnit = (raw: number) => (unit === 'kg' ? parseFloat(raw.toFixed(1)) : Math.round(raw));

  // Handler receives string from RulerPicker (same as HeightSelector)
  const handleRulerValueChange = (valueAsString: string) => {
    const numeric = Number(valueAsString);
    if (!isNaN(numeric)) {
      // Format to match the current unit's precision before sending up
      const formatted = formatForUnit(numeric);
      onValueChange(formatted);
    }
  };

  // RulerPicker props per unit (matches HeightSelector approach)
  const min = unit === 'kg' ? 30 : Math.round(30 * KG_TO_LBS);   // ~30 kg
  const max = unit === 'kg' ? 200 : Math.round(200 * KG_TO_LBS); // ~200 kg
  const step = unit === 'kg' ? 0.5 : 1;
  const fractionDigits = unit === 'kg' ? 1 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>
          {unit === 'kg' ? value.toFixed(1) : Math.round(value)}
        </Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      <RulerPicker
        min={min}
        max={max}
        step={step}
        fractionDigits={fractionDigits}
        initialValue={formatForUnit(value)}
        onValueChange={handleRulerValueChange}
        unitTextStyle={styles.rulerUnitText}
        valueTextStyle={styles.rulerValueText}
        indicatorColor="#FF5A16"
        height={150}
      />

      <ToggleSelector
        options={['kg', 'lbs']}
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
    fontSize: 60,
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
    color: 'transparent',
  },
  rulerValueText: {
    color: 'transparent',
  },
});

export default WeightSelector;
