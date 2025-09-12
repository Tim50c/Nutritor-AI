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
  Dimensions,
} from "react-native";
import { Text } from "../../components/CustomText";
import { useTheme } from "@/theme/ThemeProvider";
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get('window');

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

  const handleThemeSelect = async (mode: "system" | "light" | "dark") => {
    try {
      setThemeMode(mode);
      await setScheme(mode);
      setShowThemePicker(false);
    } catch (error) {
      console.error('Error setting theme:', error);
      setShowThemePicker(false);
    }
  };

  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '⚙️';
      default:
        return '☀️';
    }
  };

  const getThemeDescription = (mode: string) => {
    switch (mode) {
      case 'light':
        return 'Clean and bright interface';
      case 'dark':
        return 'Easy on your eyes';
      case 'system':
        return 'Matches your device setting';
      default:
        return '';
    }
  };

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
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Server error: ${response.status}`
          );
        } else {
          const errorText = await response.text();
          console.error("Non-JSON response:", errorText);
          throw new Error(
            `Server error: ${response.status} - Invalid API endpoint`
          );
        }
      }

      const responseData = await response.json();

      if (responseData.success) {
        refetchUserProfile();
        Alert.alert("Success", "Preferences saved successfully!");
      } else {
        throw new Error(responseData.error || "Failed to save preferences.");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);

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
            style={styles.themeSelector}
            onPress={() => setShowThemePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.themeSelectorContent}>
              <Text style={styles.themeIcon}>{getThemeIcon(themeMode)}</Text>
              <View style={styles.themeTextContainer}>
                <Text style={styles.themeTitle}>
                  {themeMode === "system"
                    ? "System Default"
                    : themeMode === "light"
                      ? "Light Mode"
                      : "Dark Mode"}
                </Text>
                <Text style={styles.themeDescription}>
                  {getThemeDescription(themeMode)}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
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

      {/* Enhanced Theme Picker Modal - Simplified */}
      <Modal
        visible={showThemePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={() => setShowThemePicker(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity activeOpacity={1}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Theme</Text>
                  <Text style={styles.modalSubtitle}>
                    Select your preferred appearance
                  </Text>
                </View>

                {/* Theme Options */}
                <View style={styles.themeOptions}>
                  {[
                    { key: 'system', label: 'System Default', sublabel: 'Follow device setting' },
                    { key: 'light', label: 'Light Mode', sublabel: 'Clean and bright' },
                    { key: 'dark', label: 'Dark Mode', sublabel: 'Easy on your eyes' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.themeOption,
                        themeMode === option.key && styles.themeOptionSelected
                      ]}
                      onPress={() => handleThemeSelect(option.key as "system" | "light" | "dark")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.themeOptionLeft}>
                        <View style={[
                          styles.themeIconContainer,
                          themeMode === option.key && styles.themeIconContainerSelected
                        ]}>
                          <Text style={styles.themeOptionIcon}>
                            {getThemeIcon(option.key)}
                          </Text>
                        </View>
                        <View>
                          <Text style={[
                            styles.themeOptionLabel,
                            themeMode === option.key && styles.themeOptionLabelSelected
                          ]}>
                            {option.label}
                          </Text>
                          <Text style={[
                            styles.themeOptionSublabel,
                            themeMode === option.key && styles.themeOptionSublabelSelected
                          ]}>
                            {option.sublabel}
                          </Text>
                        </View>
                      </View>
                      {themeMode === option.key && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowThemePicker(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  // Theme selector styles
  themeSelector: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  themeSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  chevron: {
    fontSize: 20,
    color: "#9CA3AF",
    fontWeight: "300",
  },
  // Modal styles - simplified
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayTouch: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  themeOptions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "transparent",
  },
  themeOptionSelected: {
    backgroundColor: "#FEF3E2",
    borderColor: "#FB923C",
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  themeIconContainerSelected: {
    backgroundColor: "#FB923C",
  },
  themeOptionIcon: {
    fontSize: 18,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  themeOptionLabelSelected: {
    color: "#C2410C",
  },
  themeOptionSublabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  themeOptionSublabelSelected: {
    color: "#EA580C",
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FB923C",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});

export default More;