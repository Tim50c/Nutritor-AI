import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, View } from "react-native";
import { useOnboarding } from "../../context/OnboardingContext";

import { useIsDark } from "@/theme/useIsDark";
import CustomButtonAuth from "../../components/CustomButtonAuth";
import OnboardingHeader from "../../components/OnboardingHeader";
import WeightSelector from "../../components/WeightSelector";

export default function CurrentWeightScreen() {
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
          title="What's your current weight?"
          progress={0.75}
          backHref="/(onboarding)/height"
        />

        <View style={{ flex: 1, justifyContent: "center" }}>
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
            onPress={() => router.push("/(onboarding)/goal_weight")}
            containerStyles={{ backgroundColor: colors.primary }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
