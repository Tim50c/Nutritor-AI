import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';

import CustomButtonAuth from "../../components/CustomButtonAuth";
import OnboardingHeader from "../../components/OnboardingHeader";
import WeightSelector from "../../components/WeightSelector";

export default function GoalWeightScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* The back link is correct, but progress is updated */}
        <OnboardingHeader title="What's your target weight?" progress={0.85} backHref="/current_weight" />
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <WeightSelector
                value={data.weightGoal}
                unit={data.weightUnit}
                onValueChange={(val) => updateData({ weightGoal: val })}
                onUnitChange={(unit) => updateData({ weightUnit: unit })}
            />
        </View>

        <View style={{ paddingBottom: 40 }}>
          {/* Button is now a simple "Continue" that navigates to the nutrition screen */}
          <CustomButtonAuth 
            title="Continue" 
            onPress={() => router.push('./nutrition')}
            containerStyles={{backgroundColor: '#ff5a16'}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
