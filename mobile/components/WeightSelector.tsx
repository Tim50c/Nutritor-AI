import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface WeightSelectorProps {
  value: number;
  unit: 'Kg' | 'Lbs';
  onValueChange: (value: number) => void;
  onUnitChange: (unit: 'Kg' | 'Lbs') => void;
}

const KG_TO_LBS = 2.20462;

const WeightSelector: React.FC<WeightSelectorProps> = ({ value, unit, onValueChange, onUnitChange }) => {
  const isKg = unit === 'Kg';
  
  const handleUnitChange = (newUnit: 'Kg' | 'Lbs') => {
      if (unit !== newUnit) {
          onUnitChange(newUnit);
          const convertedValue = newUnit === 'Lbs' ? value * KG_TO_LBS : value / KG_TO_LBS;
          onValueChange(Math.round(convertedValue));
      }
  };

  const min = isKg ? 30 : Math.round(30 * KG_TO_LBS);
  const max = isKg ? 150 : Math.round(150 * KG_TO_LBS);
  const displayValue = Math.round(value);

  return (
    <View style={styles.container}>
      <View style={styles.unitToggle}>
        <TouchableOpacity
          style={[styles.unitButton, isKg && styles.activeUnit]}
          onPress={() => handleUnitChange('Kg')}
        >
          <Text style={[styles.unitText, isKg && styles.activeUnitText]}>Kg</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitButton, !isKg && styles.activeUnit]}
          onPress={() => handleUnitChange('Lbs')}
        >
          <Text style={[styles.unitText, !isKg && styles.activeUnitText]}>Lbs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.displayContainer}>
        <Text style={styles.valueText}>{displayValue}</Text>
        <Text style={styles.unitLabel}>{unit}</Text>
      </View>

      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#FF5A16"
        maximumTrackTintColor="#D1D5DB"
        thumbTintColor="#FF5A16"
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 4,
        marginBottom: 40,
    },
    unitButton: {
        paddingVertical: 8,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    activeUnit: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    unitText: {
        fontFamily: 'SpaceGrotesk-Bold',
        fontSize: 16,
        color: '#6B7280',
    },
    activeUnitText: {
        color: '#FF5A16',
    },
    displayContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    valueText: {
        fontFamily: 'SpaceGrotesk-Bold',
        fontSize: 64,
        color: '#1F2937',
    },
    unitLabel: {
        fontFamily: 'SpaceGrotesk-Bold',
        fontSize: 24,
        color: '#6B7280',
        marginLeft: 8,
        marginBottom: 8,
    },
});

export default WeightSelector;