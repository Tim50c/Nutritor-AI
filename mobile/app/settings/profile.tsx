import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useUser } from "@/context/UserContext";
import { useOnboarding } from "@/context/OnboardingContext";
import AnalysisService from "@/services/analysis-service";
import ProfileService from "@/services/profile-service";
import GoalAchievedModal from "@/components/GoalAchievedModal";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ModalDateTimePicker from "react-native-modal-datetime-picker";
import { Text } from "../../components/CustomText";

// --- UNIT CONVERSION UTILS ---
const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;
const kgToLbs = (kg: number) => (kg * KG_TO_LBS).toFixed(1);
const lbsToKg = (lbs: number) => lbs / KG_TO_LBS;
const cmToFtIn = (cm: number) => {
  if (isNaN(cm) || cm === null) return { ft: "", in: "" };
  const inchesTotal = cm * CM_TO_INCHES;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return { ft: feet.toString(), in: inches.toString() };
};
const ftInToCm = (ft: string, inches: string) => {
  const feetNum = parseFloat(ft) || 0;
  const inchesNum = parseFloat(inches) || 0;
  return (feetNum * 12 + inchesNum) / CM_TO_INCHES;
};

const genders = ["Male", "Female", "Other"];

// Helper function to handle comma/dot conversion for decimal input
const handleDecimalInput = (value: string) => {
  return value.replace(',', '.');
};const Profile = () => {
  const { userProfile, setUserProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userProfile?.avatar || null
  );
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // Camera-related states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [pickerAction, setPickerAction] = useState<"gallery" | "camera" | null>(null);
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(genders[0]);

  // Unit conversion states
  const [heightValue, setHeightValue] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  // Goal achievement modal state
  const [goalAchievedModalVisible, setGoalAchievedModalVisible] = useState(false);
  const { initializeFromProfile } = useOnboarding();



  const handleSetNewGoal = async () => {
    try {
      // Set a flag to allow onboarding navigation
      await AsyncStorage.setItem('allowOnboardingAccess', 'true');
      console.log("✅ [Profile] Flag set successfully");
      
      // Initialize onboarding context with current user profile
      if (userProfile) {
        console.log("🔄 [Profile] Initializing with profile:", userProfile);
        initializeFromProfile(userProfile);
      } else {
        console.warn("❌ [Profile] No user profile available for initialization");
      }
      
      // Navigate to goal weight
      console.log("🧭 [Profile] Navigating to goal_weight");
      router.push("/(onboarding)/goal_weight");
      
    } catch (error) {
      console.error("❌ [Profile] Error setting flag:", error);
      // Still try to navigate even if flag setting fails
      router.push("/(onboarding)/goal_weight");
    }
  };

  const handleResetAll = async () => {
    Alert.alert(
      "Reset All Settings",
      "This will reset all your profile settings and guide you through the setup process again. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              // Reset profile to default values on the backend
              await ProfileService.updateProfile({
                name: userProfile?.firstname || "User",
                email: userProfile?.email || "",
                dob: "",
                gender: "Male",
                height: undefined,
                weight: undefined,
                image: undefined,
              });

              // Reset local user profile to default state but keep essential info
              const resetProfile: import("@/context/UserContext").User = {
                id: userProfile?.id || "",
                firstname: userProfile?.firstname || "User",
                lastname: "",
                email: userProfile?.email || "",
                avatar: null,
                dob: null,
                gender: null,
                height: null,
                weightCurrent: null,
                weightGoal: null,
                targetNutrition: undefined,
                onboardingComplete: false,
                unitPreferences: {
                  weight: 'kg',
                  height: 'cm',
                },
              };
              
              setUserProfile(resetProfile);
              
              // Set flag to allow onboarding access
              await AsyncStorage.setItem('allowOnboardingAccess', 'true');
              
              // Navigate to first onboarding screen
              router.push("/(onboarding)/age");
            } catch (error) {
              console.error("Error resetting profile:", error);
              Alert.alert("Error", "Failed to reset profile. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getDateFromDob = (dobValue: any): Date => {
    if (!dobValue) return new Date();
    if (typeof dobValue === "object" && "_seconds" in dobValue) {
      return new Date(dobValue._seconds * 1000);
    }
    if (typeof dobValue === "string" && dobValue.includes("-")) {
      const [day, month, year] = dobValue.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  };

  const getDobString = (dobValue: any): string => {
    if (!dobValue) return "";
    if (typeof dobValue === "object" && "_seconds" in dobValue) {
      const date = new Date(dobValue._seconds * 1000);
      return date
        .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
        .replace(/\//g, "-");
    }
    if (typeof dobValue === "string") return dobValue;
    return "";
  };

  useEffect(() => {
    if (userProfile) {
      setName(`${userProfile.firstname || ""} ${userProfile.lastname || ""}`.trim());
      setEmail(userProfile.email || "");
      setAvatarPreview(userProfile.avatar || null);
      setDob(getDobString(userProfile.dob));
      setSelectedDate(getDateFromDob(userProfile.dob));
      setGender(userProfile.gender || genders[0]);
      setWeightUnit(userProfile.unitPreferences?.weight || "kg");
      setHeightUnit(userProfile.unitPreferences?.height || "cm");
      if (userProfile.height) {
        if (userProfile.unitPreferences?.height === "ft") {
          const { ft, in: inches } = cmToFtIn(userProfile.height);
          setHeightFeet(ft);
          setHeightInches(inches);
        } else {
          setHeightValue(parseFloat(userProfile.height.toString()).toFixed(1));
        }
      }
      if (userProfile.weightCurrent) {
        if (userProfile.unitPreferences?.weight === "lbs") {
          setWeightValue(kgToLbs(userProfile.weightCurrent));
        } else {
          setWeightValue(parseFloat(userProfile.weightCurrent.toString()).toFixed(1));
        }
      }
    }
  }, [userProfile]);

  // This useEffect now uses setTimeout for the gallery action to prevent UI deadlock
  useEffect(() => {
    if (!pickerAction) return;

    const executeAction = async () => {
      if (pickerAction === "gallery") {
        await launchGallery();
      } else if (pickerAction === "camera") {
        await launchCamera();
      }
      setPickerAction(null); // Reset action after it's been handled
    };

    // The timeout ensures the modal is fully dismissed before launching the gallery
    setTimeout(executeAction, 750);

  }, [pickerAction]);

  const handleAvatarPress = () => {
    setShowAvatarOptions(true);
  };

  const handleGalleryPress = () => {
    console.log("🖼️ Queueing gallery launch...");
    setShowAvatarOptions(false);
    setPickerAction("gallery");
  };

  const takePhoto = () => {
    console.log("📷 Queueing camera launch...");
    setShowAvatarOptions(false);
    setPickerAction("camera");
  };

  const launchGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Permission to access the photo library is required!");
        return;
      }

      console.log("📷 Profile: Launching image library...");
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!pickerResult.canceled) {
        const asset = pickerResult.assets[0];
        console.log("📸 Profile: Image selected successfully:", asset.uri);
        setAvatarPreview(asset.uri);
        setNewAvatarUri(asset.uri);
      } else {
        console.log("📷 Profile: Image selection cancelled.");
      }
    } catch (error) {
      console.error("💥 Profile: Error picking image from library:", error);
      Alert.alert("Error", "Could not open the gallery. Please try again.");
    }
  };

  const launchCamera = async () => {
    const permission = await Camera.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Permission to access the camera is required!");
      return;
    }
    setCameraPermission(true);
    setShowCameraModal(true);
  };

  const handleCameraCapture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        setAvatarPreview(photo.uri);
        setNewAvatarUri(photo.uri);
        setShowCameraModal(false);
      } catch (error) {
        console.error("📷 handleCameraCapture: Error capturing photo:", error);
        Alert.alert("Error", "Failed to capture photo");
      }
    }
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
  };

  const onChangeDate = (selectedDateValue: Date) => {
    if (selectedDateValue) {
      setSelectedDate(selectedDateValue);
      const formattedDate = selectedDateValue
        .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
        .replace(/\//g, "-");
      setDob(formattedDate);
    }
    setShowDatePicker(false);
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nameParts = name.trim().split(" ");
      const firstname = nameParts[0] || "";
      const lastname = nameParts.slice(1).join(" ") || "";
      let heightInCm: number | null = null;
      let weightInKg: number | null = null;
      if (heightUnit === "cm" && heightValue) {
        heightInCm = parseFloat(heightValue);
      } else if (heightUnit === "ft" && heightFeet && heightInches) {
        heightInCm = ftInToCm(heightFeet, heightInches);
      }
      if (weightUnit === "kg" && weightValue) {
        weightInKg = parseFloat(weightValue);
      } else if (weightUnit === "lbs" && weightValue) {
        weightInKg = lbsToKg(parseFloat(weightValue));
      }

      let finalAvatarUrl = userProfile?.avatar;
      if (newAvatarUri) {
        try {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          if (!token) throw new Error("No authentication token");
          const formData = new FormData();
          formData.append("avatar", { uri: newAvatarUri, type: "image/jpeg", name: "avatar.jpg" } as any);
          const API_URL = process.env.EXPO_PUBLIC_API_URL;
          const response = await fetch(`${API_URL}/api/v1/profile/avatar`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (response.ok) {
            const result = await response.json();
            finalAvatarUrl = result.avatarUrl || result.data?.avatarUrl;
          } else {
            const errorText = await response.text();
            console.error("Avatar upload failed:", response.status, errorText);
          }
        } catch (avatarError) {
          console.error("Avatar upload error:", avatarError);
        }
      }

      const optimisticProfile: import("@/context/UserContext").User = {
        ...(userProfile ?? {}),
        id: userProfile?.id || "",
        firstname,
        lastname,
        email: email.trim(),
        avatar: finalAvatarUrl || null,
        dob,
        gender: gender as "Male" | "Female" | "Other" | null,
        height: heightInCm,
        weightCurrent: weightInKg,
        weightGoal: userProfile?.weightGoal || null,
        targetNutrition: userProfile?.targetNutrition,
        onboardingComplete: userProfile?.onboardingComplete ?? true,
        unitPreferences: { weight: weightUnit, height: heightUnit },
      };
      setUserProfile(optimisticProfile);

      await ProfileService.updateProfile({
        image: finalAvatarUrl || undefined,
        name: name.trim(),
        email: email.trim(),
        dob,
        gender,
        height: heightInCm || undefined,
        weight: weightInKg || undefined,
      });

      if (weightInKg !== null) {
        await AnalysisService.updateWeight({
          currentWeight: weightInKg,
          goalWeight: userProfile?.weightGoal || weightInKg,
        });

        // Check for goal achievement after successful weight update
        if (userProfile?.weightGoal && userProfile.weightGoal > 0) {
          if (Math.abs(weightInKg - userProfile.weightGoal) <= 0.1) {
            setTimeout(() => setGoalAchievedModalVisible(true), 500);
            return; // Don't navigate away if showing goal achievement modal
          }
        }
      }

      setNewAvatarUri(null);
      setAvatarPreview(finalAvatarUrl || null);
      Alert.alert("Success", "Profile updated successfully!");
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError("Failed to update profile: " + (err.message || "Unknown error"));
      if (userProfile) {
        setUserProfile(userProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            className="bg-black w-10 h-10 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <View style={{ transform: [{ rotate: "0deg" }] }}>
              <icons.arrow width={20} height={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">Profile</Text>
          <View className="w-10 h-10" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center mb-6 pt-4">
              <View className="w-24 h-24 rounded-full bg-white items-center justify-center relative">
                <Image
                  source={avatarPreview ? { uri: avatarPreview } : images.default_avatar}
                  className="w-20 h-20 rounded-full"
                />
                <TouchableOpacity
                  className="absolute right-2 bottom-2 bg-white rounded-2xl p-1 border border-gray-300"
                  onPress={handleAvatarPress}
                >
                  <Ionicons name="pencil" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <Modal
              visible={showAvatarOptions}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowAvatarOptions(false)}
            >
              <TouchableOpacity
                className="flex-1 bg-black/50 justify-center items-center"
                activeOpacity={1}
                onPress={() => setShowAvatarOptions(false)}
              >
                <View className="bg-white rounded-2xl mx-8 p-6 w-80">
                  <Text className="text-lg font-semibold text-center mb-4">Select Avatar</Text>
                  <TouchableOpacity className="py-4 border-b border-gray-200" onPress={handleGalleryPress}>
                    <Text className="text-center text-blue-600 text-lg">Choose from Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="py-4 border-b border-gray-200" onPress={takePhoto}>
                    <Text className="text-center text-blue-600 text-lg">Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="py-4" onPress={() => setShowAvatarOptions(false)}>
                    <Text className="text-center text-red-600 text-lg">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            <Modal
              visible={showCameraModal}
              transparent={false}
              animationType="slide"
              onRequestClose={closeCameraModal}
            >
              <SafeAreaView className="flex-1 bg-black">
                {cameraPermission ? (
                  <>
                    <CameraView ref={(ref) => setCameraRef(ref)} style={{ flex: 1 }} facing="back" />
                    <View className="absolute bottom-0 left-0 right-0 pb-8 pt-4">
                      <View className="flex-row justify-center items-center px-8">
                        <TouchableOpacity onPress={closeCameraModal} className="absolute left-8">
                          <Ionicons name="close" size={32} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleCameraCapture}
                          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 items-center justify-center"
                        >
                          <View className="w-16 h-16 bg-white rounded-full" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="flex-1 justify-center items-center">
                    <Text className="text-white text-lg">Loading camera...</Text>
                  </View>
                )}
              </SafeAreaView>
            </Modal>

            <Modal
              visible={showGenderPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowGenderPicker(false)}
            >
              <TouchableOpacity
                className="flex-1 bg-black/50 justify-center items-center"
                activeOpacity={1}
                onPress={() => setShowGenderPicker(false)}
              >
                <View className="bg-white rounded-2xl mx-8 p-6 w-80">
                  <Text className="text-lg font-semibold text-center mb-4">Select Gender</Text>
                  {genders.map((g) => (
                    <TouchableOpacity
                      key={g}
                      className={`py-4 border-b border-gray-200 ${gender === g ? "bg-blue-50" : ""}`}
                      onPress={() => { setGender(g); setShowGenderPicker(false); }}
                    >
                      <Text className={`text-center text-lg ${gender === g ? "text-blue-600 font-semibold" : "text-gray-900"}`}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity className="py-4" onPress={() => setShowGenderPicker(false)}>
                    <Text className="text-center text-red-600 text-lg">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            <View className="px-4 flex-1">
              <View className="mb-4">
                <Text className="text-gray-700 text-sm mb-1">Name</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 text-sm mb-1">Email</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-100"
                  value={email}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  editable={false}
                  selectTextOnFocus={false}
                  style={{ color: "#6B7280" }}
                />
              </View>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm mb-1">Date of Birth</Text>
                  <TouchableOpacity
                    onPress={showMode}
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between min-h-[48px]"
                  >
                    <Text className={`text-base flex-1 ${dob ? "text-gray-900" : "text-gray-400"}`}>
                      {dob || "DD-MM-YYYY"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                  <ModalDateTimePicker
                    isVisible={showDatePicker}
                    mode="date"
                    date={selectedDate}
                    onConfirm={onChangeDate}
                    onCancel={() => setShowDatePicker(false)}
                    display="spinner"
                    confirmTextIOS="Confirm"
                    cancelTextIOS="Cancel"
                    maximumDate={new Date()}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm mb-1">Gender</Text>
                  <TouchableOpacity
                    onPress={() => { setShowGenderPicker(true); }}
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between min-h-[48px]"
                  >
                    <Text className="text-base flex-1 text-gray-900">{gender}</Text>
                    <Ionicons name="chevron-down-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-4 mb-8">
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-700 text-sm">Height</Text>
                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg px-2 py-1"
                      onPress={() => setHeightUnit(heightUnit === "cm" ? "ft" : "cm")}
                    >
                      <Text className="text-xs text-gray-600">{heightUnit}</Text>
                    </TouchableOpacity>
                  </View>
                  {heightUnit === "cm" ? (
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                      value={heightValue}
                      onChangeText={(value) => setHeightValue(handleDecimalInput(value))}
                      placeholder="170"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                    />
                  ) : (
                    <View className="flex-row gap-2">
                      <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                        value={heightFeet}
                        onChangeText={setHeightFeet}
                        placeholder="5"
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                        returnKeyType="next"
                      />
                      <Text className="self-center text-gray-500">ft</Text>
                      <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                        value={heightInches}
                        onChangeText={setHeightInches}
                        placeholder="10"
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                        returnKeyType="next"
                      />
                      <Text className="self-center text-gray-500">in</Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-700 text-sm">Weight</Text>
                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg px-2 py-1"
                      onPress={() => setWeightUnit(weightUnit === "kg" ? "lbs" : "kg")}
                    >
                      <Text className="text-xs text-gray-600">{weightUnit}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                    value={weightValue}
                    onChangeText={(value) => {
                      const processedValue = handleDecimalInput(value);
                      setWeightValue(processedValue);
                    }}
                    placeholder={weightUnit === "kg" ? "65" : "143"}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Reset All Button */}
              <View className="mt-4">
                <TouchableOpacity
                  className={`bg-red-100 border border-red-200 rounded-xl py-3 items-center ${loading ? "opacity-50" : ""}`}
                  onPress={handleResetAll}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text className="text-red-600 text-base font-semibold">
                    {loading ? "Resetting..." : "Reset All Settings"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="px-4 mb-6 mt-auto">
              {error && <Text className="text-red-500 text-center mb-2">{error}</Text>}
              <TouchableOpacity
                className={`bg-orange-500 rounded-2xl py-4 items-center ${loading ? "opacity-50" : ""}`}
                onPress={handleSave}
                disabled={loading}
              >
                <Text className="text-white text-lg font-bold">{loading ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Goal Achievement Modal */}
      <GoalAchievedModal
        visible={goalAchievedModalVisible}
        onClose={() => setGoalAchievedModalVisible(false)}
        onSetNewGoal={handleSetNewGoal}
      />
    </SafeAreaView>
  );
};

export default Profile;