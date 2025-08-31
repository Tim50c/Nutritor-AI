import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';
import AgeSelector from '../../components/AgeSelector';

export default function AgeScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <OnboardingHeader title="What's your Age?" progress={0.25} />
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AgeSelector
            selectedValue={data.age}
            onValueChange={(age) => updateData({ age })}
          />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <CustomButtonAuth 
            title="Continue" 
            onPress={() => router.push('./gender')} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}