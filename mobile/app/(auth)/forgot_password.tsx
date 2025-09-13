import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/CustomText";
import { auth } from "../../config/firebase";

import { useIsDark } from "@/theme/useIsDark";
import { Ionicons } from "@expo/vector-icons";
import CustomButtonAuth from "../../components/CustomButtonAuth";
import FormField from "../../components/FormField";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [activeField, setActiveField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = useIsDark();

  const handleSendResetLink = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Check Your Email",
        "A password reset link has been sent to your email address."
      );
      router.push("./sign_in");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-white dark:bg-black flex-1">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 60, left: 24, zIndex: 10 }}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={isDark ? "#FFFFFF" : "#7ca5de"}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 120 }}>
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Forgot Your Password?
          </Text>
          <Text className="text-base mt-2 leading-6 text-gray-500 dark:text-gray-300">
            No worries! Enter your email, and we’ll send you a reset link.
          </Text>

          <View style={{ marginTop: 32 }}>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Email"
              keyboardType="email-address"
              onFocus={() => setActiveField("email")}
              onBlur={() => setActiveField("")}
              isActive={activeField === "email"}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <CustomButtonAuth
            title="Send Reset Link"
            onPress={handleSendResetLink}
            isLoading={isSubmitting}
          />
          <TouchableOpacity
            onPress={() => router.push("./sign_in")}
            style={{ marginTop: 24, alignSelf: "center" }}
          >
            <Text className="text-sm font-bold text-orange-500 dark:text-orange-400">
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
