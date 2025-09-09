// mobile/app/(onboarding)/nutrition.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text } from "../../components/CustomText";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";
import { auth } from "../../config/firebase";
import apiClient from "../../utils/apiClients";

import CustomButtonAuth from "../../components/CustomButtonAuth";
import FormField from "../../components/FormField";
import { icons } from "../../constants/icons";

export default function NutritionScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [isLoading, setIsLoading] = useState(true);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  useEffect(() => {
    const fetchNutritionSuggestions = async () => {

      if (
        !data.age ||
        !data.gender ||
        !data.height ||
        !data.weightCurrent ||
        !data.weightGoal
      ) {
        console.log(
          "🍎 [Nutrition] Waiting for onboarding data to be initialized..."
        );
        console.log("🍎 [Nutrition] Current data:", data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication error.");

        const idToken = await user.getIdToken();

        const payload = {
          age: data.age,
          gender: data.gender,
          height: data.height,
          weightCurrent: data.weightCurrent,
          weightGoal: data.weightGoal,
        };

        const response = await apiClient.post(
          "/api/v1/nutrition/predict",
          payload,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        if (response.data.success) {
          const suggestions = response.data.data;
          setCalories(suggestions.calories.toString());
          setProtein(suggestions.protein.toString());
          setCarbs(suggestions.carbs.toString());
          setFat(suggestions.fat.toString());
          setFiber(suggestions.fiber.toString());
        } else {
          throw new Error(response.data.error || "Failed to get suggestions.");
        }
      } catch (error: any) {
        console.error(
          "Failed to fetch nutrition suggestions:",
          error.response?.data || error.message
        );
        setCalories(data.targetNutrition.calories.toString());
        setProtein(data.targetNutrition.protein.toString());
        setCarbs(data.targetNutrition.carbs.toString());
        setFat(data.targetNutrition.fat.toString());
        setFiber(data.targetNutrition.fiber.toString());
        Alert.alert(
          "Error",
          "Could not fetch AI suggestions. Please enter your targets manually."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutritionSuggestions();
  }, [data.age, data.gender, data.height, data.weightCurrent, data.weightGoal]); // Re-run when onboarding data changes

  const handleNext = () => {
    const numericValues = {
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      fiber: Number(fiber),
    };

    for (const key in numericValues) {
      const typedKey = key as keyof typeof numericValues;
      if (isNaN(numericValues[typedKey]) || numericValues[typedKey] < 0) {
        Alert.alert(
          "Invalid Input",
          `Please enter a valid, non-negative number for ${typedKey}.`
        );
        return;
      }
    }

    updateData({ targetNutrition: numericValues });
    router.push("/(onboarding)/completion");
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#ff5a16" />
        <Text style={styles.loadingText}>
          Calculating your nutrition goals...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <View style={{ transform: [{ rotate: "0deg" }] }}>
              <icons.arrow width={20} height={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Your Daily Nutrition Goals</Text>
        <Text style={styles.subtitle}>
          We&apos;ve calculated these targets based on your profile. Feel free
          to adjust them.
        </Text>

        <View>
          <FormField
            label="Daily Calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
          />
          <FormField
            label="Protein (grams)"
            value={protein}
            onChangeText={setProtein}
            keyboardType="number-pad"
          />
          <FormField
            label="Carbs (grams)"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="number-pad"
          />
          <FormField
            label="Fat (grams)"
            value={fat}
            onChangeText={setFat}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.buttonContainer}>
          <CustomButtonAuth
            title="Finish Setup"
            onPress={handleNext}
            containerStyles={{ backgroundColor: "#ff5a16" }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignSelf: "flex-start",
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A8A8E",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 40,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8A8A8E",
  },
});
