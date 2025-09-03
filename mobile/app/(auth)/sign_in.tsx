import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  getAdditionalUserInfo,
  UserCredential, // --- Step 1: Import the UserCredential type ---
} from "firebase/auth";
import { auth } from "../../config/firebase";
import axios from "axios";

// --- Social Auth Imports ---
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";

import FormField from "../../components/FormField";
import CustomButtonAuth from "../../components/CustomButtonAuth";

const googleIcon = require("../../assets/icons/google-icon.png");
const appleIcon = require("../../assets/icons/apple-icon.png");

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [activeField, setActiveField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialAuthType, setSocialAuthType] = useState<
    "google" | "apple" | null
  >(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        try {
          const userCredential = await signInWithCredential(auth, credential);
          await checkAndRegisterSocialUser(userCredential);
          router.replace("/");
        } catch (error: any) {
          Alert.alert("Google Sign-In Failed", error.message);
        } finally {
          setIsSubmitting(false);
          setSocialAuthType(null);
        }
      } else if (response?.type === "error" || response?.type === "cancel") {
        setIsSubmitting(false);
        setSocialAuthType(null);
      }
    };
    handleGoogleResponse();
  }, [response]);

  // --- Step 2: Apply the type to the userCredential parameter ---
  const checkAndRegisterSocialUser = async (userCredential: UserCredential) => {
    const additionalUserInfo = getAdditionalUserInfo(userCredential);

    if (additionalUserInfo?.isNewUser) {
      console.log(
        "New social user detected, registering profile on backend..."
      );
      const { user } = userCredential;
      const idToken = await user.getIdToken();
      // Use user's display name, provide fallbacks
      const displayName = user.displayName || "New User";
      const [firstName, ...lastName] = displayName.split(" ");

      try {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`,
          {
            email: user.email,
            firstname: firstName,
            lastname: lastName.join(" ") || firstName, // Handle cases with no last name
            dob: "1990-01-01",
          },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        console.log("Backend registration successful.");
      } catch (error) {
        console.error("Failed to register new social user on backend:", error);
        Alert.alert(
          "Registration Error",
          "Your account was created but we couldn't set up your profile. Please contact support."
        );
        await auth.signOut();
        throw new Error("Backend registration failed.");
      }
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setSocialAuthType("apple");
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = appleCredential;
      if (!identityToken) {
        throw new Error("Apple Sign-In failed: No identity token received.");
      }

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({ idToken: identityToken });

      const userCredential = await signInWithCredential(auth, credential);
      await checkAndRegisterSocialUser(userCredential);

      router.replace("/");
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Sign-In Failed", e.message);
      }
    } finally {
      setIsSubmitting(false);
      setSocialAuthType(null);
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors = { email: "", password: "" };
    if (!form.email) {
      newErrors.email = "Please enter your email";
      valid = false;
    }
    if (!form.password) {
      newErrors.password = "Please enter your password";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // Reload user to get fresh verification status
      await userCredential.user.reload();

      if (!userCredential.user.emailVerified) {
        // Sign out the unverified user to maintain clean state
        await auth.signOut();

        Alert.alert(
          "Verify Your Email",
          "You need to verify your email before you can log in. If you've already verified, please wait a few minutes and try again. Would you like us to resend the verification link?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resend",
              onPress: async () => {
                try {
                  // Re-authenticate temporarily to send verification
                  const tempCredential = await signInWithEmailAndPassword(
                    auth,
                    form.email,
                    form.password
                  );
                  await sendEmailVerification(tempCredential.user);
                  await auth.signOut(); // Sign out again after sending
                  Alert.alert(
                    "Verification Sent",
                    "Please check your email and click the verification link. Then try logging in again.",
                    [{ text: "OK" }]
                  );
                } catch (error) {
                  Alert.alert(
                    "Error",
                    "Failed to send verification email. Please try again."
                  );
                }
              },
            },
            {
              text: "I've Verified",
              onPress: async () => {
                try {
                  // Try to sign in again after user claims they've verified
                  const retryCredential = await signInWithEmailAndPassword(
                    auth,
                    form.email,
                    form.password
                  );
                  await retryCredential.user.reload(); // Force refresh

                  if (retryCredential.user.emailVerified) {
                    router.replace("/");
                  } else {
                    await auth.signOut();
                    Alert.alert(
                      "Still Not Verified",
                      "Your email is still not verified. Please check your email and click the verification link."
                    );
                  }
                } catch (error) {
                  Alert.alert("Error", "Failed to verify. Please try again.");
                }
              },
            },
          ]
        );
        setIsSubmitting(false);
        return;
      }

      router.replace("/");
    } catch (error: any) {
      // --- MODIFICATION START ---
      let errorMessage = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential": // This new code covers both wrong email and password
          errorMessage =
            "Invalid email or password. Please check your credentials and try again.";
          break;
        case "auth/invalid-email":
          errorMessage =
            "The email address is badly formatted. Please enter a valid email.";
          break;
        case "auth/user-disabled":
          errorMessage =
            "This account has been disabled. Please contact support.";
          break;
        default:
          // Log the original error for debugging purposes
          console.error("Unhandled Sign-In Error:", error);
          break;
      }
      Alert.alert("Sign In Failed", errorMessage);
      // --- MODIFICATION END ---
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFFFF", flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Text style={{ color: "#1F2937", fontSize: 28, fontWeight: "bold" }}>
            Welcome Back to NutritorAI
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 16, marginTop: 8 }}>
            Eat better. Get back on track.
          </Text>

          <View style={{ marginTop: 32 }}>
            <FormField
              label="Email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter Email"
              keyboardType="email-address"
              onFocus={() => setActiveField("email")}
              onBlur={() => setActiveField("")}
              isActive={activeField === "email"}
              error={errors.email}
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
              error={errors.password}
            />
            <Link
              href="./forgot_password"
              style={{ alignSelf: "flex-end", marginTop: -8 }}
            >
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                Forgot Password?
              </Text>
            </Link>
          </View>

          <View style={{ marginTop: 40 }}>
            <CustomButtonAuth
              title="Log In"
              onPress={handleSignIn}
              isLoading={isSubmitting && !socialAuthType}
            />
          </View>

          {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
            <Text style={{ color: '#6B7280', marginHorizontal: 10 }}>Or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          </View>

          <View style={{ gap: 16 }}>
             <CustomButtonAuth 
                title="Continue with Google" 
                onPress={() => {
                  setSocialAuthType('google');
                  promptAsync();
                }} 
                variant="social" 
                icon={googleIcon}
                isLoading={isSubmitting && socialAuthType === 'google'}
             />
             {Platform.OS === 'ios' && (
                <CustomButtonAuth 
                    title="Continue with Apple" 
                    onPress={handleAppleSignIn} 
                    variant="social" 
                    icon={appleIcon} 
                    isLoading={isSubmitting && socialAuthType === 'apple'}
                />
             )}
          </View> */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 32,
            }}
          >
            <Text style={{ color: "#6B7280", fontSize: 14 }}>
              Don&apos;t have an account?{" "}
            </Text>
            <Link href="./sign_up">
              <Text
                style={{ color: "#F97316", fontSize: 14, fontWeight: "bold" }}
              >
                Sign Up
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
