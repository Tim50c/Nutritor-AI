import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButtonAuth from "../../components/CustomButtonAuth";
import { Text } from "../../components/CustomText";

export default function PromptVerification() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <SafeAreaView className="bg-white dark:bg-black flex-1">
      <View className="flex-1 px-6 justify-center items-center">
        <View className="flex-1 justify-center items-center">
          <Text className="text-3xl font-bold text-center mb-2 mt-8 text-gray-800 dark:text-blue-300">
            Verify Your Email
          </Text>
          <Text className="text-base mt-4 text-center leading-6 px-6 text-gray-500 dark:text-gray-300">
            We&apos;ve sent a verification link to {"\n"}
            <Text className="font-bold text-gray-800 dark:text-gray-100">
              {email}
            </Text>
          </Text>
          <Text className="text-base mt-3 text-center leading-6 px-6 text-gray-500 dark:text-gray-300">
            Please check your inbox and click the link to continue.
          </Text>
        </View>

        <View className="w-full pb-10">
          <CustomButtonAuth
            title="Back to Sign In"
            onPress={() => router.replace("./sign_in")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
