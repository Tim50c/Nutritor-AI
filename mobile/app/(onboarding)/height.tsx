import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';
import HeightSelector from '../../components/HeightSelector';

export default function HeightScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Back button now points to 'gender', progress is updated */}
        <OnboardingHeader title="What's your height?" progress={0.65} backHref="/gender" />
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <HeightSelector
                value={data.height}
                unit={data.heightUnit}
                onValueChange={(val) => updateData({ height: val })}
                onUnitChange={(unit) => updateData({ heightUnit: unit })}
            />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <CustomButtonAuth 
            title="Continue" 
            onPress={() => router.push('./current_weight')} 
            containerStyles={{backgroundColor: '#ff5a16'}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}