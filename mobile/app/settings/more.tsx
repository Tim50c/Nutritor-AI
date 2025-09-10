import { icons } from "@/constants/icons";
import { useUser } from "@/context/UserContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../components/CustomText";
import { useTheme } from "@/theme/ThemeProvider";
import { getAuth } from "firebase/auth";

const More = () => {
  const router = useRouter();
  const { userProfile, refetchUserProfile } = useUser();

  // Local state to manage the UI, initialized from the user's profile
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");

  // Theme picker state
  const { scheme, setScheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    scheme
  );

  // When the user profile is loaded, set the initial state of the toggles
  useEffect(() => {
    if (userProfile?.unitPreferences) {
      setWeightUnit(userProfile.unitPreferences.weight);
      setHeightUnit(userProfile.unitPreferences.height);
    }
  }, [userProfile]);

  // Sync theme picker with context
  useEffect(() => {
    setThemeMode(scheme);
  }, [scheme]);

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return Alert.alert("Error", "You must be logged in to save settings.");
    }

    const token = await user.getIdToken();
    const payload = {
      unitPreferences: {
        weight: weightUnit,
        height: heightUnit,
      },
    };

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/v1/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Server error: ${response.status}`
          );
        } else {
          // Response is likely HTML (404 page or similar)
          const errorText = await response.text();
          console.error("Non-JSON response:", errorText);
          throw new Error(
            `Server error: ${response.status} - Invalid API endpoint`
          );
        }
      }

      const responseData = await response.json();

      if (responseData.success) {
        // Refetch profile to update context globally
        refetchUserProfile();
        Alert.alert("Success", "Preferences saved successfully!");
      } else {
        throw new Error(responseData.error || "Failed to save preferences.");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);

      // More specific error handling
      let errorMessage = "An error occurred. Please try again.";

      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error instanceof Error) {
        if (error.message.includes("Invalid API endpoint")) {
          errorMessage = "Server configuration error. Please contact support.";
        } else if (error.message.includes("JSON Parse error")) {
          errorMessage = "Server response error. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Save Failed", errorMessage);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          className="bg-black w-10 h-10 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <View>
            <icons.arrow width={20} height={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">More Settings</Text>
        <View className="w-10 h-10" />
      </View>

      <View className="flex-1 p-6">
        {/* Theme Mode Preference */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Theme Mode
          </Text>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setShowThemePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, { flex: 1, textAlign: "center" }]}>
              {" "}
              {themeMode === "system"
                ? "System Default"
                : themeMode === "light"
                  ? "Light"
                  : "Dark"}{" "}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight Unit Preference */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Weight Unit
          </Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              onPress={() => setWeightUnit("kg")}
              style={[
                styles.toggleButton,
                weightUnit === "kg" && styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  weightUnit === "kg" && styles.toggleTextActive,
                ]}
              >
                Kilograms (kg)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setWeightUnit("lbs")}
              style={[
                styles.toggleButton,
                weightUnit === "lbs" && styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  weightUnit === "lbs" && styles.toggleTextActive,
                ]}
              >
                Pounds (lbs)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Height Unit Preference */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Height Unit
          </Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              onPress={() => setHeightUnit("cm")}
              style={[
                styles.toggleButton,
                heightUnit === "cm" && styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  heightUnit === "cm" && styles.toggleTextActive,
                ]}
              >
                Centimeters (cm)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setHeightUnit("ft")}
              style={[
                styles.toggleButton,
                heightUnit === "ft" && styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  heightUnit === "ft" && styles.toggleTextActive,
                ]}
              >
                Feet & Inches (ft)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View className="mt-auto">
          <TouchableOpacity
            className="bg-orange-500 rounded-2xl py-4 items-center"
            onPress={handleSave}
          >
            <Text className="text-white text-lg font-bold">Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.2)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              minWidth: 280,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              Choose Theme Mode
            </Text>
            {["system", "light", "dark"].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.toggleButton,
                  themeMode === mode && styles.toggleButtonActive,
                  { marginBottom: 10 },
                ]}
                onPress={async () => {
                  setThemeMode(mode as "system" | "light" | "dark");
                  await setScheme(mode as "system" | "light" | "dark");
                  setShowThemePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    themeMode === mode && styles.toggleTextActive,
                  ]}
                >
                  {mode === "system"
                    ? "System Default"
                    : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={{ marginTop: 8, alignItems: "center" }}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={{ color: "#6B7280", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111827",
  },
});

export default More;
