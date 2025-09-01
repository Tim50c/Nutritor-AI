import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import FormField from '../../components/FormField';

const backArrowIcon = require('../../assets/images/back-arrow.png');

export default function NutritionScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [calories, setCalories] = useState(data.targetNutrition.calories.toString());
  const [protein, setProtein] = useState(data.targetNutrition.protein.toString());
  const [carbs, setCarbs] = useState(data.targetNutrition.carbs.toString());
  const [fat, setFat] = useState(data.targetNutrition.fat.toString());
  const [fiber, setFiber] = useState(data.targetNutrition.fiber.toString());

  const handleNext = () => {
    const numericValues = {
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        fiber: Number(fiber),
    };

    // FIX IS HERE: We tell TypeScript that `key` is a valid key for `numericValues`
    for (const key in numericValues) {
        const typedKey = key as keyof typeof numericValues; // Assert the type of the key
        if (isNaN(numericValues[typedKey]) || numericValues[typedKey] < 0) {
            Alert.alert('Invalid Input', `Please enter a valid, non-negative number for ${typedKey}.`);
            return;
        }
    }

    updateData({ targetNutrition: numericValues });
    router.push('/(onboarding)/completion');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Image source={backArrowIcon} style={styles.backButtonIcon} resizeMode="contain" />
            </TouchableOpacity>
        </View>

        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Set your daily calorie target based on your health and fitness goals.
        </Text>

        <View>
          <FormField
            label="Maintenance calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
          />
          <FormField
            label="Protein goal"
            value={protein}
            onChangeText={setProtein}
            keyboardType="number-pad"
          />
          <FormField
            label="Carb goal"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="number-pad"
          />
          <FormField
            label="Fat goal"
            value={fat}
            onChangeText={setFat}
            keyboardType="number-pad"
          />
          <FormField
            label="Fiber goal"
            value={fiber}
            onChangeText={setFiber}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.buttonContainer}>
          <CustomButtonAuth
            title="Next"
            onPress={handleNext}
            containerStyles={{backgroundColor: '#ff5a16'}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8A8E',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    marginTop: 20,
  },
});