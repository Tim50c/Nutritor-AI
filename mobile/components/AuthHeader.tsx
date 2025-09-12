import { useIsDark } from "@/theme/useIsDark";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();


  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 24,
        height: 60,
        justifyContent: "center",
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
      }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="w-12 h-12 justify-center items-start -ml-2"
      >
        <Ionicons name="arrow-back" size={28} color={isDark ? "#FFFFFF" : "#111214"} />
      </TouchableOpacity>
    </View>
  );
}
