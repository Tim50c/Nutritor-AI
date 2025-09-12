import { useIsDark } from "@/theme/useIsDark";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, View } from "react-native";
import { useOnboarding } from "../../context/OnboardingContext";

import CustomButtonAuth from "../../components/CustomButtonAuth";
import OnboardingHeader from "../../components/OnboardingHeader";
import WeightSelector from "../../components/WeightSelector";

export default function GoalWeightScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const isDark = useIsDark();

  const colors = {
    background: isDark ? "#0B1220" : "#FFFFFF",
    primary: isDark ? "#ff7a3a" : "#ff5a16",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
        <OnboardingHeader
          title="What's your target weight?"
          progress={0.85}
          backHref="/(onboarding)/current_weight"
        />

        <View style={{ flex: 1, justifyContent: "center" }}>
          <WeightSelector
            value={data.weightGoal}
            unit={data.weightUnit}
            onValueChange={(val) => updateData({ weightGoal: val })}
            onUnitChange={(unit) => updateData({ weightUnit: unit })}
          />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <CustomButtonAuth
            title="Continue"
            onPress={() => router.push("/(onboarding)/nutrition")}
            containerStyles={{ backgroundColor: colors.primary }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
