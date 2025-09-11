import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, SafeAreaView, StyleSheet, View } from "react-native";
import { Text } from "../../components/CustomText";
import { auth } from "../../config/firebase";
import { useOnboarding } from "../../context/OnboardingContext";
import { useUser } from "../../context/UserContext";
import apiClient from "../../utils/apiClients";

import { useIsDark } from "@/theme/useIsDark";
import CustomButtonAuth from "../../components/CustomButtonAuth";

const celebrationImage = require("../../assets/images/celebration.png");

// --- CONVERSION UTILITY ---
const KG_TO_LBS = 2.20462;
const lbsToKg = (lbs: number) => lbs / KG_TO_LBS;

export default function CompletionScreen() {
  const router = useRouter();
  const { data, clearResetFlag } = useOnboarding();
  const { setUserProfile } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = useIsDark();

  // Theme color tokens — reuse these across other files to keep colors consistent
  const colors = {
    background: isDark ? "#0B1220" : "#FFFFFF", // deep navy-ish for dark, white for light
    title: isDark ? "#E6EEF6" : "#1E1E1E", // light text on dark, near-black on light
    subtitle: isDark ? "#A9AFBD" : "#8A8A8E", // softer gray for dark mode
    // Keep the brand orange but a touch lighter in dark mode for contrast
    primary: isDark ? "#ff7a3a" : "#ff5a16",
  };

  console.log(
    "🎯 [CompletionScreen] Rendering with isGoalUpdate:",
    data.isGoalUpdate
  );

  const navigateToHome = () => {
    console.log("🏠 [CompletionScreen] Forcing navigation to home...");
    try {
      router.replace("/(tabs)");
    } catch (error) {
      console.error("❌ [CompletionScreen] Navigation failed:", error);
      // Try alternative navigation methods
      router.push("/(tabs)");
    }
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    console.log("--- Starting Onboarding Completion ---");
    console.log(
      "🔍 [CompletionScreen] Current data:",
      JSON.stringify(data, null, 2)
    );

    // Set up a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log(
        "⏰ [CompletionScreen] Operation timed out, forcing navigation..."
      );
      setIsSubmitting(false);
      navigateToHome();
    }, 15000); // 15 second timeout

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Authentication error: No user found.");
      }

      const idToken = await user.getIdToken();
      console.log("Successfully got user ID token.");

      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - data.age;
      // Use timezone-safe date formatting
      const dobDate = new Date(birthYear, 0, 1); // January 1st of birth year
      const dob = `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, "0")}-${String(dobDate.getDate()).padStart(2, "0")}`;

      // --- CONVERSION LOGIC ---
      const weightInKg =
        data.weightUnit === "lbs"
          ? lbsToKg(data.weightCurrent)
          : data.weightCurrent;
      const goalWeightInKg =
        data.weightUnit === "lbs" ? lbsToKg(data.weightGoal) : data.weightGoal;

      const heightInCm =
        data.heightUnit === "ft" ? data.height * 30.48 : data.height;

      let profilePayload;

      if (data.isGoalUpdate) {
        profilePayload = {
          weightGoal: goalWeightInKg,
          targetNutrition: data.targetNutrition,
        };
        console.log(
          "Sending PATCH request for GOAL UPDATE with payload:",
          JSON.stringify(profilePayload, null, 2)
        );
      } else {
        profilePayload = {
          dob,
          gender: data.gender,
          height: heightInCm,
          weightCurrent: weightInKg,
          weightGoal: goalWeightInKg,
          targetNutrition: data.targetNutrition,
          onboardingComplete: true,
          unitPreferences: {
            weight: data.weightUnit,
            height: data.heightUnit,
          },
        };
        console.log(
          "Sending PATCH request for INITIAL ONBOARDING with CONVERTED payload:",
          JSON.stringify(profilePayload, null, 2)
        );
      }

      // Make the first API call to UPDATE the profile
      console.log("🚀 [CompletionScreen] Sending PATCH request...");
      const response = await apiClient.patch(
        "/api/v1/profile",
        profilePayload,
        {
          headers: { Authorization: `Bearer ${idToken}` },
          timeout: 30000,
        }
      );

      console.log(
        "✅ [CompletionScreen] PATCH response received:",
        response.data
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Backend returned success: false."
        );
      }

      console.log(
        "Profile updated successfully. Now fetching the full updated profile..."
      );

      // Make the second API call to GET the updated profile
      console.log("🚀 [CompletionScreen] Fetching updated profile...");
      const updatedProfileResponse = await apiClient.get("/api/v1/profile", {
        headers: { Authorization: `Bearer ${idToken}` },
        timeout: 30000,
      });

      console.log(
        "✅ [CompletionScreen] GET response received:",
        updatedProfileResponse.data
      );

      if (updatedProfileResponse.data.success) {
        console.log(
          "Updating UserContext with new profile. Navigation should happen now."
        );
        setUserProfile(updatedProfileResponse.data.data);

        await AsyncStorage.removeItem("allowOnboardingAccess");
        await AsyncStorage.removeItem("isFullReset");
        clearResetFlag();

        console.log("🧭 [CompletionScreen] About to navigate to home...");
        console.log("🧭 [CompletionScreen] isGoalUpdate:", data.isGoalUpdate);

        if (data.isGoalUpdate) {
          console.log(
            "🎯 [CompletionScreen] Goal update completed, navigating to home..."
          );
        } else {
          console.log(
            "🎉 [CompletionScreen] Original onboarding completed, navigating to home..."
          );
        }

        clearTimeout(timeoutId);
        navigateToHome();
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        throw new Error("Failed to retrieve updated profile after setup.");
      }
    } catch (error: any) {
      console.error("--- ONBOARDING COMPLETION FAILED ---");
      if (error.response) {
        console.error(
          "Axios Error Details:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("Status Code:", error.response.status);
      } else {
        console.error("General Error:", error.message);
      }

      Alert.alert(
        "Setup Failed",
        error.response?.data?.error ||
          error.message ||
          "An unknown error occurred. Please try again."
      );
    } finally {
      console.log("--- Onboarding Completion Finished ---");
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Image
          source={celebrationImage}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.title }]}>
          {data.isGoalUpdate ? "New Goal Set!" : "Profile Setup Complete!"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtitle }]}>
          {data.isGoalUpdate
            ? "Your new weight goal and nutrition targets have been updated. Keep pushing towards your new milestone!"
            : "Great job — you are all set to start tracking your meals and reaching your goals."}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <CustomButtonAuth
          title={
            data.isGoalUpdate
              ? "Continue tracking"
              : "Start your tracking journey"
          }
          onPress={handleFinishOnboarding}
          isLoading={isSubmitting}
          containerStyles={{ backgroundColor: colors.primary }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor now set dynamically via inline style so we keep only layout here
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "95%",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    paddingBottom: 40,
    paddingLeft: 24,
    paddingRight: 24,
  },
});
