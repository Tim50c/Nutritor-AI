import { icons } from "@/constants/icons";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./CustomText";
import { useIsDark } from "@/theme/useIsDark";

interface OnboardingHeaderProps {
  title: string;
  progress: number; // e.g., 0.25 for 25%
  backHref?: string;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
                                                             title,
                                                             progress,
                                                             backHref,
                                                           }) => {
  const router = useRouter();
  const isDark = useIsDark();

  return (
    <View style={{ paddingTop: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", height: 40 }}>
        {backHref && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: isDark ? "#1F2937" : "#111214", // darker gray in dark mode
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ transform: [{ rotate: "0deg" }] }}>
              <icons.arrow
                width={20}
                height={20}
                color={isDark ? "#F9FAFB" : "#FFFFFF"}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={{
          fontFamily: "SpaceGrotesk-Bold",
          fontSize: 24,
          color: isDark ? "#F9FAFB" : "#111214",
          marginTop: 24,
          fontWeight: "bold",
        }}
      >
        {title}
      </Text>

      <View style={{ marginTop: 24 }}>
        <View
          style={{
            height: 6,
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
            borderRadius: 3,
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: 6,
              backgroundColor: isDark ? "#FB923C" : "#FF5A16",
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default OnboardingHeader;
