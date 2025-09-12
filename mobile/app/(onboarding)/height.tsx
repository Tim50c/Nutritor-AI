import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';
import { useIsDark } from '@/theme/useIsDark';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';
import HeightSelector from '../../components/HeightSelector';

export default function HeightScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const isDark = useIsDark();

  const colors = {
    background: isDark ? '#0B1220' : '#FFFFFF',
    primary: isDark ? '#FF7A3A' : '#FF5A16',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <OnboardingHeader
          title="What's your height?"
          progress={0.65}
          backHref="/gender"
        />

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
            containerStyles={{ backgroundColor: colors.primary }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
