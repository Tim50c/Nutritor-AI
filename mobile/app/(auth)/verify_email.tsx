import { useLocalSearchParams, useRouter } from "expo-router";
import { applyActionCode } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/CustomText";
import { auth } from "../../config/firebase";

import CustomButtonAuth from "../../components/CustomButtonAuth";

export default function VerifyEmailHandler() {
  const router = useRouter();
  const { oobCode } = useLocalSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleVerification = async () => {
      if (!oobCode || typeof oobCode !== "string") {
        setErrorMessage("Invalid verification link.");
        setStatus("error");
        return;
      }
      try {
        await applyActionCode(auth, oobCode);
        setStatus("success");
      } catch (error: any) {
        setErrorMessage(error.message);
        setStatus("error");
      }
    };

    handleVerification();
  }, [oobCode]);

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <>
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-lg font-semibold mt-5 text-center text-gray-800 dark:text-gray-100">
              Verifying your email...
            </Text>
          </>
        );

      case "success":
        return (
          <>
            <Text className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-gray-100">
              Email Verified!
            </Text>
            <Text className="text-lg mt-4 text-center leading-6 px-6 text-gray-500 dark:text-gray-400">
              Your account has been successfully verified.
            </Text>
            <View className="w-full mt-10">
              <CustomButtonAuth
                title="Proceed to Log In"
                onPress={() => router.replace("./sign_in")}
              />
            </View>
          </>
        );

      case "error":
        return (
          <>
            <Text className="text-3xl font-bold text-center mb-2 text-red-600 dark:text-red-400">
              Verification Failed
            </Text>
            <Text className="text-lg mt-4 text-center leading-6 px-6 text-gray-500 dark:text-gray-400">
              {errorMessage}
            </Text>
            <View className="w-full mt-10">
              <CustomButtonAuth
                title="Back to Sign In"
                onPress={() => router.replace("./sign_in")}
              />
            </View>
          </>
        );
    }
  };

  return (
    <SafeAreaView className="bg-white dark:bg-black flex-1 justify-center items-center p-6">
      {renderContent()}
    </SafeAreaView>
  );
}
