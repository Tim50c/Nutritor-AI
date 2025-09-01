import React, { useState } from 'react'; // <-- FIX IS HERE: Added useState
import { View, Text, SafeAreaView, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useUser } from '../../context/UserContext';
import { auth } from '../../config/firebase';
import apiClient from '../../utils/apiClients';

import CustomButtonAuth from '../../components/CustomButtonAuth';

const celebrationImage = require('../../assets/images/celebration.png');

export default function CompletionScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { setUserProfile } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    console.log("--- Starting Onboarding Completion ---"); // <-- LOG 1

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Authentication error: No user found.");
      }
      
      const idToken = await user.getIdToken();
      console.log("Successfully got user ID token."); // <-- LOG 2

      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - data.age;
      const dob = new Date(birthYear, 0, 1).toISOString();

      const profilePayload = {
        dob,
        gender: data.gender,
        height: data.height,
        weightCurrent: data.weightCurrent,
        weightGoal: data.weightGoal,
        targetNutrition: data.targetNutrition,
        onboardingComplete: true,
      };

      console.log("Sending PATCH request to /api/v1/profile with payload:", JSON.stringify(profilePayload, null, 2)); // <-- LOG 3

      // Make the first API call to UPDATE the profile
      const response = await apiClient.patch('/api/v1/profile', profilePayload, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      console.log("PATCH response received:", response.data); // <-- LOG 4

      if (!response.data.success) {
        // If the backend says the operation failed, throw an error to be caught
        throw new Error(response.data.error || "Backend returned success: false.");
      }

      console.log("Profile updated successfully. Now fetching the full updated profile..."); // <-- LOG 5

      // Make the second API call to GET the updated profile
      const updatedProfileResponse = await apiClient.get('/api/v1/profile', {
          headers: { Authorization: `Bearer ${idToken}` },
      });

      console.log("GET response received:", updatedProfileResponse.data); // <-- LOG 6

      if (updatedProfileResponse.data.success) {
          console.log("Updating UserContext with new profile. Navigation should happen now."); // <-- LOG 7
          setUserProfile(updatedProfileResponse.data.data);
      } else {
           throw new Error('Failed to retrieve updated profile after setup.');
      }

    } catch (error: any) {
      // --- THIS IS THE MOST IMPORTANT PART ---
      console.error("--- ONBOARDING COMPLETION FAILED ---"); // <-- LOG 8

      // Axios errors have a 'response' object with more details
      if (error.response) {
        console.error("Axios Error Details:", JSON.stringify(error.response.data, null, 2));
        console.error("Status Code:", error.response.status);
      } else {
        // For non-Axios errors or network issues
        console.error("General Error:", error.message);
      }
      
      Alert.alert(
        "Setup Failed", 
        error.response?.data?.error || error.message || "An unknown error occurred. Please try again."
      );
    } finally {
      // This will run whether the try block succeeded or failed
      console.log("--- Onboarding Completion Finished ---"); // <-- LOG 9
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={celebrationImage} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>Profile Setup Complete!</Text>
        <Text style={styles.subtitle}>
          Great job — you are all set to start tracking your meals and reaching your goals.
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <CustomButtonAuth
          title="Start your tracking journey"
          onPress={handleFinishOnboarding}
          isLoading={isSubmitting}
          containerStyles={{backgroundColor: '#ff5a16'}}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    content: {
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 220,
        height: 220,
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E1E1E',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#8A8A8E',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '95%',
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        width: '100%',
        paddingBottom: 40,
        paddingLeft: 24,
        paddingRight: 24,
    },
});