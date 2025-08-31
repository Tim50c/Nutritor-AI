import React, { useState } from 'react';
import { View, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { auth } from '../../config/firebase';
import axios from 'axios';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';
import WeightSelector from '../../components/WeightSelector';

export default function GoalWeightScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { data, updateData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user found.");
        }
        const idToken = await user.getIdToken();

        // Calculate Date of Birth from age
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - data.age;
        const dob = `${birthYear}-01-01`; // YYYY-MM-DD format

        const payload = {
            dob,
            gender: data.gender,
            weightCurrent: data.weightCurrent,
            weightGoal: data.weightGoal,
            // You can add height here later if you add a height screen
        };

        await axios.patch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/profile`,
            payload,
            { headers: { Authorization: `Bearer ${idToken}` } }
        );

        // Navigate to email verification prompt
        router.replace({ pathname: '/prompt_verification', params: { email } });

    } catch (error: any) {
        console.error("Failed to update profile:", error);
        Alert.alert("Error", "Could not save your information. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <OnboardingHeader title="What's your target weight?" progress={1.0} backHref="/current_weight" />
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <WeightSelector
                value={data.weightGoal}
                unit={data.weightUnit}
                onValueChange={(val) => updateData({ weightGoal: val })}
                onUnitChange={(unit) => updateData({ weightUnit: unit })}
            />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <CustomButtonAuth 
            title="Finish" 
            onPress={handleFinish}
            isLoading={isSubmitting} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}