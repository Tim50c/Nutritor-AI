import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, View } from "react-native";
import { useOnboarding } from "../../context/OnboardingContext";

import AgeSelector from "../../components/AgeSelector";
import CustomButtonAuth from "../../components/CustomButtonAuth";
import OnboardingHeader from "../../components/OnboardingHeader";

export default function AgeScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 px-6">
        <OnboardingHeader title="What's your Age?" progress={0.25} />

        <View className="flex-1 justify-center items-center">
          <AgeSelector
            selectedValue={data.age}
            onValueChange={(age) => updateData({ age })}
          />
        </View>

        <View className="pb-10">
          <CustomButtonAuth
            title="Continue"
            onPress={() => router.push("./gender")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
