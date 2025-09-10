import React, { useState } from "react";
import { View, SafeAreaView, StyleSheet, Image, Alert } from "react-native";
import { Text } from "../../components/CustomText";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";
import { useUser } from "../../context/UserContext";
import { auth } from "../../config/firebase";
import apiClient from "../../utils/apiClients";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  
  console.log("🎯 [CompletionScreen] Rendering with isGoalUpdate:", data.isGoalUpdate);

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
    console.log("🔍 [CompletionScreen] Current data:", JSON.stringify(data, null, 2));

    // Set up a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("⏰ [CompletionScreen] Operation timed out, forcing navigation...");
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
      // Convert weight to KG if the user entered it in LBS.
      // The backend MUST always receive weight in KG.
      const weightInKg =
        data.weightUnit === "lbs"
          ? lbsToKg(data.weightCurrent)
          : data.weightCurrent;
      const goalWeightInKg =
        data.weightUnit === "lbs" ? lbsToKg(data.weightGoal) : data.weightGoal;

      // Convert height to CM if the user entered it in FT.
      // The backend MUST always receive height in CM.
      const heightInCm =
        data.heightUnit === "ft" ? data.height * 30.48 : data.height;

      let profilePayload;

      if (data.isGoalUpdate) {
        // For goal updates, only send weight goal and nutrition targets
        profilePayload = {
          weightGoal: goalWeightInKg, // Always send KG
          targetNutrition: data.targetNutrition,
        };
        console.log(
          "Sending PATCH request for GOAL UPDATE with payload:",
          JSON.stringify(profilePayload, null, 2)
        );
      } else {
        // For initial onboarding, send full profile
        profilePayload = {
          dob,
          gender: data.gender,
          height: heightInCm, // Always send CM
          weightCurrent: weightInKg, // Always send KG
          weightGoal: goalWeightInKg, // Always send KG
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
          timeout: 30000, // Add 30 second timeout
        }
      );

      console.log("✅ [CompletionScreen] PATCH response received:", response.data);

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
        timeout: 30000, // Add 30 second timeout
      });

      console.log("✅ [CompletionScreen] GET response received:", updatedProfileResponse.data);

      if (updatedProfileResponse.data.success) {
        console.log(
          "Updating UserContext with new profile. Navigation should happen now."
        );
        setUserProfile(updatedProfileResponse.data.data);

        // Clear the onboarding access flag since we're done
        await AsyncStorage.removeItem("allowOnboardingAccess");
        
        // Clear the full reset flag since onboarding is now complete
        await AsyncStorage.removeItem("isFullReset");
        
        // Clear the reset flag to allow future auto-initialization
        clearResetFlag();

        // Navigate to home screen
        console.log("🧭 [CompletionScreen] About to navigate to home...");
        console.log("🧭 [CompletionScreen] isGoalUpdate:", data.isGoalUpdate);
        
        if (data.isGoalUpdate) {
          console.log("🎯 [CompletionScreen] Goal update completed, navigating to home...");
        } else {
          console.log("🎉 [CompletionScreen] Original onboarding completed, navigating to home...");
        }
        
        // Clear the timeout since we're navigating successfully
        clearTimeout(timeoutId);
        
        // Always navigate to tabs regardless of goal update status
        navigateToHome();
        
        // Add a small delay to ensure navigation happens
        await new Promise(resolve => setTimeout(resolve, 100));
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={celebrationImage}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          {data.isGoalUpdate ? "New Goal Set!" : "Profile Setup Complete!"}
        </Text>
        <Text style={styles.subtitle}>
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
          containerStyles={{ backgroundColor: "#ff5a16" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#8A8A8E",
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
