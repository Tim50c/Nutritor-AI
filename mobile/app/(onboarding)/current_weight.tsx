import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';
import WeightSelector from '../../components/WeightSelector';

export default function CurrentWeightScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <OnboardingHeader title="What's your current weight?" progress={0.75} backHref="/gender" />
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <WeightSelector
                value={data.weightCurrent}
                unit={data.weightUnit}
                onValueChange={(val) => updateData({ weightCurrent: val })}
                onUnitChange={(unit) => updateData({ weightUnit: unit })}
            />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <CustomButtonAuth 
            title="Continue" 
            onPress={() => router.push('./goal_weight')} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}