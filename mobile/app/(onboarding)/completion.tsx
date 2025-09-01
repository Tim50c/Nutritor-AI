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
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication error. Please sign in again.");
      
      const idToken = await user.getIdToken();

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
      
      const response = await apiClient.patch('/profile', profilePayload, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        const updatedProfileResponse = await apiClient.get('/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
        });

        if (updatedProfileResponse.data.success) {
            setUserProfile(updatedProfileResponse.data.data);
        } else {
             throw new Error('Failed to retrieve updated profile after setup.');
        }
      } else {
        throw new Error(response.data.error || "An unknown error occurred while saving your profile.");
      }

    } catch (error: any) {
      console.error("Onboarding completion failed:", error);
      Alert.alert(
        "Setup Failed", 
        error.message || "Could not complete your profile setup. Please try again."
      );
    } finally {
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
    },
});