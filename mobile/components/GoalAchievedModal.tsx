import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Text } from "./CustomText";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient"; // You'll need: expo install expo-linear-gradient
import { icons } from "@/constants/icons";
import { useOnboarding } from "@/context/OnboardingContext";
import { useUser } from "@/context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface GoalAchievedModalProps {
  visible: boolean;
  onClose: () => void;
  onSetNewGoal: () => void;
}

const GoalAchievedModal: React.FC<GoalAchievedModalProps> = ({
  visible,
  onClose,
  onSetNewGoal,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const confettiAnim = useRef(new Animated.Value(-100)).current;
  const router = useRouter();
  const { initializeFromProfile } = useOnboarding();
  const { userProfile } = useUser();

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      bounceAnim.setValue(0);
      confettiAnim.setValue(-100);
      sparkleAnims.forEach((anim) => anim.setValue(0));

      // Main entrance animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Bounce effect for the trophy
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 300,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti fall animation
      Animated.timing(confettiAnim, {
        toValue: 100,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Staggered sparkle animations
      sparkleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }
  }, [visible]);

  const handleSetNewGoal = async () => {
    onClose();
    onSetNewGoal();

    try {
      // Set a flag to allow onboarding navigation with multiple attempts for reliability
      const setFlagWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            await AsyncStorage.setItem("allowOnboardingAccess", "true");
            const verification = await AsyncStorage.getItem(
              "allowOnboardingAccess"
            );
            if (verification === "true") {
              console.log(
                `✅ [GoalAchievedModal] Flag set successfully on attempt ${i + 1}`
              );
              return true;
            }
          } catch (error) {
            console.warn(
              `❌ [GoalAchievedModal] Attempt ${i + 1} failed:`,
              error
            );
          }
          if (i < retries - 1)
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return false;
      };

      const flagSet = await setFlagWithRetry();

      // Initialize onboarding context with current user profile
      if (userProfile) {
        console.log(
          "🔄 [GoalAchievedModal] Initializing with profile:",
          userProfile
        );
        initializeFromProfile(userProfile);
      } else {
        console.warn(
          "❌ [GoalAchievedModal] No user profile available for initialization"
        );
      }

      // Add a small delay to ensure flag is properly set before navigation
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Navigate - the layout should detect the flag
      console.log("🧭 [GoalAchievedModal] Navigating to goal_weight", {
        flagSet,
      });
      router.push("/(onboarding)/goal_weight");
    } catch (error) {
      console.error("❌ [GoalAchievedModal] Error setting flag:", error);
      // Still try to navigate even if flag setting fails
      router.push("/(onboarding)/goal_weight");
    }
  };

  const trophyScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const sparklePositions = [
    { top: -10, right: -5, rotation: "15deg" },
    { top: 20, left: -10, rotation: "-20deg" },
    { bottom: -5, right: 10, rotation: "45deg" },
    { top: 40, right: 30, rotation: "-10deg" },
    { bottom: 20, left: 20, rotation: "30deg" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        className="flex-1 justify-center items-center px-4"
        style={{
          opacity: fadeAnim,
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
      >
        <Animated.View
          className="bg-white rounded-3xl p-8 mx-4 relative overflow-hidden"
          style={{
            transform: [{ scale: scaleAnim }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 25,
            elevation: 20,
            maxWidth: width - 32,
          }}
        >
          {/* Gradient overlay */}
          <LinearGradient
            colors={["rgba(255,165,0,0.1)", "rgba(255,215,0,0.05)"]}
            className="absolute inset-0 rounded-3xl"
          />

          {/* Main content */}
          <View className="items-center mb-8">
            <Animated.View
              style={{
                transform: [{ scale: trophyScale }],
              }}
            >
              <View className="mb-4">
                <icons.championCup width={80} height={80} />
              </View>
            </Animated.View>

            <Text
              className="text-3xl font-bold text-center mb-3"
              style={{ color: "#1f2937" }}
            >
              Amazing Work!
            </Text>

            <Text
              className="text-xl font-semibold text-center mb-4"
              style={{ color: "#f59e0b" }}
            >
              Goal Achieved! 🎯
            </Text>

            <Text
              className="text-base text-center leading-6 mb-2"
              style={{ color: "#4b5563" }}
            >
              You've successfully reached your weight goal! This incredible
              achievement shows your dedication and commitment to your health
              journey.
            </Text>

            <Text className="text-sm text-center" style={{ color: "#6b7280" }}>
              Ready to set your next milestone?
            </Text>
          </View>

          {/* Enhanced buttons */}
          <View className="gap-4">
            <TouchableOpacity
              onPress={handleSetNewGoal}
              activeOpacity={0.8}
              className="w-full py-4 px-6 rounded-2xl"
              style={{ backgroundColor: "#f59e0b" }}
            >
              <Text className="text-center text-white font-bold text-lg">
                Set New Goal 🚀
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-full py-4 px-6 rounded-2xl border-2"
              style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
            >
              <Text
                className="text-center font-semibold text-lg"
                style={{ color: "#374151" }}
              >
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>

          {/* Decorative bottom accent */}
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-b-3xl" />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default GoalAchievedModal;
