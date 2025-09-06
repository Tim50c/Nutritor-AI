import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useUser } from "@/context/UserContext";
import AnalysisService from "@/services/analysis-service";
import ProfileService from "@/services/profile-service";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from "react-native";
import ModalDateTimePicker from "react-native-modal-datetime-picker";
import { Text } from "../../components/CustomText";
import { getAuth } from "firebase/auth";

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

const Profile = () => {
  const { userProfile, setUserProfile, refetchUserProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar || null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null); // For new uploads
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const router = useRouter();

  // Form states with proper types
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(genders[0]);
  
  // Unit conversion states
  const [heightValue, setHeightValue] = useState(""); // Display value
  const [weightValue, setWeightValue] = useState(""); // Display value
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  // Helper to convert Firestore Timestamp to Date object
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

  // Helper to convert Firestore Timestamp to display string
  const getDobString = (dobValue: any): string => {
    if (!dobValue) return "";
    if (typeof dobValue === "object" && "_seconds" in dobValue) {
      const date = new Date(dobValue._seconds * 1000);
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    }
    if (typeof dobValue === "string") {
      return dobValue;
    }
    return "";
  };

  // Initialize form from UserContext
  useEffect(() => {
    if (userProfile) {
      setName(`${userProfile.firstname || ""} ${userProfile.lastname || ""}`.trim());
      setEmail(userProfile.email || "");
      setAvatarPreview(userProfile.avatar || null);
      setDob(getDobString(userProfile.dob));
      setSelectedDate(getDateFromDob(userProfile.dob));
      setGender(userProfile.gender || genders[0]);
      
      // Handle unit preferences
      setWeightUnit(userProfile.unitPreferences?.weight || 'kg');
      setHeightUnit(userProfile.unitPreferences?.height || 'cm');
      
      // Set height with unit conversion
      if (userProfile.height) {
        if (userProfile.unitPreferences?.height === 'ft') {
          const { ft, in: inches } = cmToFtIn(userProfile.height);
          setHeightFeet(ft);
          setHeightInches(inches);
        } else {
          setHeightValue(userProfile.height.toString());
        }
      }
      
      // Set weight with unit conversion
      if (userProfile.weightCurrent) {
        if (userProfile.unitPreferences?.weight === 'lbs') {
          setWeightValue(kgToLbs(userProfile.weightCurrent));
        } else {
          setWeightValue(userProfile.weightCurrent.toString());
        }
      }
    }
  }, [userProfile]);

  // Handle avatar change
  const handleAvatarPress = () => {
    setShowAvatarOptions(true);
  };

  const pickImage = async () => {
    setShowAvatarOptions(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Permission to access the photo library is required!");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setAvatarPreview(selectedUri);
      setNewAvatarUri(selectedUri);
    }
  };

  const takePhoto = async () => {
    setShowAvatarOptions(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Permission to access the camera is required!");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setAvatarPreview(selectedUri);
      setNewAvatarUri(selectedUri);
    }
  };

  // Update selectedDate when dob changes
  useEffect(() => {
    if (userProfile?.dob) {
      setSelectedDate(getDateFromDob(userProfile.dob));
    }
  }, [userProfile?.dob]);

  // Function to handle date selection from the calendar
  const onChangeDate = (selectedDate: Date) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
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
      // Prepare data with unit conversion
      const nameParts = name.trim().split(" ");
      const firstname = nameParts[0] || "";
      const lastname = nameParts.slice(1).join(" ") || "";
      
      // Convert units to backend format (kg, cm)
      let heightInCm: number | null = null;
      let weightInKg: number | null = null;
      
      if (heightUnit === 'cm' && heightValue) {
        heightInCm = parseFloat(heightValue);
      } else if (heightUnit === 'ft' && heightFeet && heightInches) {
        heightInCm = ftInToCm(heightFeet, heightInches);
      }
      
      if (weightUnit === 'kg' && weightValue) {
        weightInKg = parseFloat(weightValue);
      } else if (weightUnit === 'lbs' && weightValue) {
        weightInKg = lbsToKg(parseFloat(weightValue));
      }

      // Avatar upload if new avatar selected
      let finalAvatarUrl = userProfile?.avatar;
      if (newAvatarUri) {
        try {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          if (!token) throw new Error('No authentication token');

          const formData = new FormData();
          formData.append('avatar', {
            uri: newAvatarUri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          } as any);

          const API_URL = process.env.EXPO_PUBLIC_API_URL;
          const response = await fetch(`${API_URL}/api/v1/profile/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            finalAvatarUrl = result.avatarUrl || result.data?.avatarUrl;
            console.log('Avatar uploaded successfully:', finalAvatarUrl);
          } else {
            console.error('Avatar upload failed:', response.status);
          }
        } catch (avatarError) {
          console.error('Avatar upload error:', avatarError);
          // Continue with profile update even if avatar fails
        }
      }

      // Update UserContext with optimistic update
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
        unitPreferences: {
          weight: weightUnit,
          height: heightUnit,
        },
      };
      setUserProfile(optimisticProfile);

      // Update profile via backend
      await ProfileService.updateProfile({
        image: finalAvatarUrl || undefined,
        name: name.trim(),
        email: email.trim(),
        dob,
        gender,
        height: heightInCm || undefined,
        weight: weightInKg || undefined,
      });

      // Update weight in analysis if weight changed
      if (weightInKg !== null) {
        await AnalysisService.updateWeight({
          currentWeight: weightInKg,
          goalWeight: userProfile?.weightGoal || weightInKg,
        });
      }

      // Clear temporary states after successful save
      setNewAvatarUri(null);
      setAvatarPreview(finalAvatarUrl || null);
      
      Alert.alert("Success", "Profile updated successfully!");
      router.replace("/(tabs)/index");
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError("Failed to update profile: " + (error.message || "Unknown error"));
      // Rollback optimistic update if needed
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
        {/* Header */}
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar section */}
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

            {/* Avatar Options Modal */}
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
                  
                  <TouchableOpacity 
                    className="py-4 border-b border-gray-200"
                    onPress={pickImage}
                  >
                    <Text className="text-center text-blue-600 text-lg">Choose from Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="py-4 border-b border-gray-200"
                    onPress={takePhoto}
                  >
                    <Text className="text-center text-blue-600 text-lg">Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="py-4"
                    onPress={() => setShowAvatarOptions(false)}
                  >
                    <Text className="text-center text-red-600 text-lg">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Form fields */}
            <View className="px-4 flex-1">
              {/* Name */}
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

              {/* Email */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm mb-1">Email</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                />
              </View>

              {/* Row: DOB & Gender */}
              <View className="flex-row gap-4 mb-4">
                {/* DOB */}
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm mb-1">Date of Birth</Text>
                  <TouchableOpacity
                    onPress={showMode}
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between min-h-[48px]"
                  >
                    <Text
                      className={`text-base flex-1 ${dob ? "text-gray-900" : "text-gray-400"}`}
                    >
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
                    maximumDate={new Date()} // Prevent selecting future dates
                  />
                </View>

                {/* Gender */}
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm mb-1">Gender</Text>
                  <View className="border border-gray-300 rounded-xl bg-white min-h-[48px] justify-center overflow-hidden">
                    <Picker
                      selectedValue={gender}
                      onValueChange={(itemValue: string) => setGender(itemValue)}
                      className="h-12 w-full"
                      dropdownIconColor="#9CA3AF"
                      mode="dropdown"
                      style={{ height: Platform.OS === "ios" ? 48 : 48, width: "100%" }}
                      itemStyle={{ fontSize: 16, height: Platform.OS === "ios" ? 48 : undefined }}
                    >
                      {genders.map((g) => (
                        <Picker.Item key={g} label={g} value={g} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              {/* Row: Height & Weight with Unit Conversion */}
              <View className="flex-row gap-4 mb-8">
                {/* Height */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-700 text-sm">Height</Text>
                    <TouchableOpacity 
                      className="bg-gray-100 rounded-lg px-2 py-1"
                      onPress={() => setHeightUnit(heightUnit === 'cm' ? 'ft' : 'cm')}
                    >
                      <Text className="text-xs text-gray-600">{heightUnit}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {heightUnit === 'cm' ? (
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                      value={heightValue}
                      onChangeText={setHeightValue}
                      placeholder="170"
                      keyboardType="numeric"
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

                {/* Weight */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-700 text-sm">Weight</Text>
                    <TouchableOpacity 
                      className="bg-gray-100 rounded-lg px-2 py-1"
                      onPress={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
                    >
                      <Text className="text-xs text-gray-600">{weightUnit}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                    value={weightValue}
                    onChangeText={setWeightValue}
                    placeholder={weightUnit === 'kg' ? "65" : "143"}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            {/* Save button */}
            <View className="px-4 mb-6 mt-auto">
              {error && (
                <Text className="text-red-500 text-center mb-2">{error}</Text>
              )}
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
    </SafeAreaView>
  );
};

export default Profile;
