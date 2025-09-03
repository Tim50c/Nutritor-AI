import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Text } from '../../components/CustomText';
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  ActionCodeSettings,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import axios from "axios";
import Constants from "expo-constants"; // <-- Import Constants

import FormField from "../../components/FormField";
import CustomButtonAuth from "../../components/CustomButtonAuth";
import { icons } from "../../constants/icons";

const backArrowIcon = require('../../assets/images/back-arrow.png');

// We no longer need these for the Expo Go flow
// const IOS_BUNDLE_ID = "com.app.nutriai";
// const ANDROID_PACKAGE_NAME = "com.app.nutriai";

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [activeField, setActiveField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW: DYNAMIC URL FOR EXPO GO ---
  const getExpoGoVerificationUrl = () => {
    // Get owner and slug from your app config
    const owner = Constants.expoConfig?.owner || 'anonymous';
    const slug = Constants.expoConfig?.slug;
    
    // This is the special URL format that works with Expo Go
    return `https://auth.expo.io/@${owner}/${slug}/auth/verify_email`;
  };

  const actionCodeSettings: ActionCodeSettings = {
    url: getExpoGoVerificationUrl(),
    handleCodeInApp: true,
    // We remove the iOS and Android specific bundle/package IDs as they are not used by Expo Go
  };

  const handleSignUp = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Sending verification email with URL:", actionCodeSettings.url);
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // 2. Send verification email
      await sendEmailVerification(user, actionCodeSettings);

      // 3. Register user profile on your backend
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`,
        {
          email: form.email,
          firstname: form.firstName,
          lastname: form.lastName,
          dob: "1990-01-01",
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      // 4. Sign out the user to prevent automatic sign-in before verification
      await auth.signOut();

      // 5. Navigate to a screen telling the user to check their email
      router.replace({
        pathname: "./prompt_verification",
        params: { email: form.email },
      });
    } catch (error: any) {
      // --- MODIFICATION START ---
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (axios.isAxiosError(error)) {
        // This is an error from your backend server
        console.error(
          "Backend API Error:",
          error.response?.data || error.message
        );
        errorMessage =
          "We couldn't create your profile at this time. Please try again later.";
        // IMPORTANT: The Firebase user was created but backend registration failed.
        // You may want to add logic here to delete the newly created Firebase user to keep things clean.
      } else if (error.code) {
        // This is an error from Firebase Auth
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage =
              "This email address is already registered. Please use the Log In page.";
            break;
          case "auth/invalid-email":
            errorMessage =
              "The email address is not valid. Please check and try again.";
            break;
          case "auth/weak-password":
            errorMessage =
              "The password is too weak. It must be at least 6 characters long.";
            break;
          default:
            console.error("Unhandled Firebase Sign-Up Error:", error);
            break;
        }
      }

      Alert.alert("Sign Up Failed", errorMessage);
      // --- MODIFICATION END ---
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFFFF", flex: 1 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ 
          position: "absolute", 
          top: 50, 
          left: 24, 
          zIndex: 10,
          width: 40,
          height: 40,
          backgroundColor: '#000000',
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <View style={{ transform: [{ rotate: '0deg' }] }}>
          <icons.arrow width={20} height={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Text style={{ color: "#1F2937", fontSize: 28, fontWeight: "bold" }}>
            Create Your NutritorAI Account
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 16, marginTop: 8 }}>
            Start your journey to a healthier you.
          </Text>

          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="First Name"
                  value={form.firstName}
                  onChangeText={(text) => setForm({ ...form, firstName: text })}
                  placeholder="Example: John"
                  onFocus={() => setActiveField("firstName")}
                  onBlur={() => setActiveField("")}
                  isActive={activeField === "firstName"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Last Name"
                  value={form.lastName}
                  onChangeText={(text) => setForm({ ...form, lastName: text })}
                  placeholder="Example: Doe"
                  onFocus={() => setActiveField("lastName")}
                  onBlur={() => setActiveField("")}
                  isActive={activeField === "lastName"}
                />
              </View>
            </View>
            <FormField
              label="Email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter Email"
              keyboardType="email-address"
              onFocus={() => setActiveField("email")}
              onBlur={() => setActiveField("")}
              isActive={activeField === "email"}
            />
            <FormField
              label="Password"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              placeholder="Enter Password"
              secureTextEntry
              onFocus={() => setActiveField("password")}
              onBlur={() => setActiveField("")}
              isActive={activeField === "password"}
            />
          </View>

          <View style={{ marginTop: 40 }}>
            <CustomButtonAuth
              title="Sign Up"
              onPress={handleSignUp}
              isLoading={isSubmitting}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Text style={{ color: "#6B7280", fontSize: 14 }}>
              Already have an account?{" "}
            </Text>
            <Link href="./sign_in">
              <Text
                style={{ color: "#FF5A16", fontSize: 14, fontWeight: "bold" }}
              >
                Log In
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
