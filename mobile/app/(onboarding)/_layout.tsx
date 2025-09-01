import React from 'react';
import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="age" />
        <Stack.Screen name="gender" />
        <Stack.Screen name="current_weight" />
        <Stack.Screen name="goal_weight" />
        <Stack.Screen name="height" />
        <Stack.Screen name="nutrition" />
        <Stack.Screen name="completion" />
      </Stack>
    </OnboardingProvider>
  );
}