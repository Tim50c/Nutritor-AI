import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text } from "../../components/CustomText";
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
import { getAuth } from "firebase/auth";

// --- DATE FORMATTING UTILS ---
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const { userProfile, refetchUserProfile } = useUser();
  const router = useRouter();

  // State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [gender, setGender] = useState<string | null>(null);
  const [weightValue, setWeightValue] = useState("");
  const [heightValue, setHeightValue] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null); // Stores local URI of new avatar

  // Modals
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(`${userProfile.firstname || ""} ${userProfile.lastname || ""}`.trim());
      setEmail(userProfile.email || "");
      setAvatarPreview(userProfile.avatar || null);
      const userDob = userProfile.dob?._seconds ? new Date(userProfile.dob._seconds * 1000) : new Date();
      setSelectedDate(userDob);
      setDob(userDob.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"));
      setGender(userProfile.gender);
      setWeightValue(userProfile.weightCurrent?.toString() || "");
      setHeightValue(userProfile.height?.toString() || "");
    }
  }, [userProfile]);
  
  const handleChooseAvatar = async (type: 'camera' | 'gallery') => {
    console.log(`[AVATAR] === Starting ${type} process ===`);
    setShowAvatarOptions(false);
    
    if (type === 'gallery') {
      Alert.alert(
        "Select Avatar Image", 
        "Choose how you'd like to select your avatar:",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Use Placeholder",
            onPress: () => {
              const placeholderUri = "https://ik.imagekit.io/ltdsword/suss.jpg?updatedAt=1756314071583";
              console.log("📸 Avatar: Using placeholder:", placeholderUri);
              setNewAvatarUri(placeholderUri);
              setAvatarPreview(placeholderUri);
              console.log("✅ Avatar: Placeholder set");
            }
          },
          {
            text: "Select from Gallery",
            onPress: () => {
              // Navigate to camera screen with avatar mode
              console.log("🔄 Avatar: Navigating to camera screen for gallery selection");
              router.push({
                pathname: "/(tabs)/search",
                params: { 
                  mode: "avatar-gallery",
                  returnTo: "/settings/profile"
                }
              });
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Camera Avatar", 
        "Choose camera option:",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Use Camera Screen",
            onPress: () => {
              console.log("🔄 Avatar: Navigating to camera screen for photo capture");
              router.push({
                pathname: "/(tabs)/search", 
                params: { 
                  mode: "avatar-camera",
                  returnTo: "/settings/profile"
                }
              });
            }
          }
        ]
      );
    }
  };

  const uploadAvatar = async (uri: string, token: string) => {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "avatar.jpg";
    const type = `image/${filename.split(".").pop()}`;
    formData.append("avatar", { uri, name: filename, type } as any);

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/api/v1/profile/avatar`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: formData });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload avatar.");
    }
    return await response.json();
  };

  const handleSave = async () => {
    if (!userProfile) return;
    if (!name.trim()) return Alert.alert("Validation Error", "Name cannot be empty.");
    
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return Alert.alert("Error", "You must be logged in.");
    const token = await user.getIdToken();
    
    try {
        // Step 1: Upload new avatar if one was chosen
        if (newAvatarUri) {
            const uploadResult = await uploadAvatar(newAvatarUri, token);
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Avatar upload failed during save process.');
            }
        }

        // Step 2: Prepare and update the rest of the profile data
        const profileData = {
          firstname: name.trim().split(" ")[0] || "",
          lastname: name.trim().split(" ").slice(1).join(" ") || "",
          dob: formatDateForAPI(selectedDate),
          gender,
          // We assume values are already in kg/cm from onboarding/more screens
          height: heightValue ? parseFloat(heightValue) : null,
          weightCurrent: weightValue ? parseFloat(weightValue) : null,
        };
        
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/v1/profile`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(profileData) });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const responseData = await response.json();
        if (responseData.success) {
            Alert.alert("Success", "Profile saved successfully!");
            refetchUserProfile();
            router.replace("/(tabs)/index");
        } else {
            throw new Error(responseData.error);
        }
    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      Alert.alert("Save Failed", error.message || "An error occurred while saving.");
    }
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setDob(date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"));
    setShowDatePicker(false);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity className="bg-black w-10 h-10 rounded-full justify-center items-center" onPress={() => router.replace("/(tabs)/settings")}>
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Profile</Text>
        <TouchableOpacity className="bg-orange-500 rounded-full justify-center items-center h-10 px-6" onPress={handleSave}>
          <Text className="text-white font-semibold text-base">Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar Section */}
          <View className="items-center my-6">
            <TouchableOpacity onPress={() => setShowAvatarOptions(true)} className="relative">
              <View className="w-28 h-28 rounded-full border-4 border-gray-200 justify-center items-center">
                <Image source={avatarPreview ? { uri: avatarPreview } : images.default_avatar} className="w-full h-full rounded-full" />
              </View>
              <View className="absolute -bottom-1 -right-1 bg-orange-500 w-9 h-9 rounded-full items-center justify-center border-2 border-white">
                <Ionicons name="camera" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            <View>
              <Text className="text-gray-600 mb-2">Full Name</Text>
              <TextInput className="border border-gray-300 rounded-lg px-4 h-12 text-base" value={name} onChangeText={setName} />
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Email</Text>
              <TextInput className="border border-gray-300 rounded-lg px-4 h-12 text-base bg-gray-100 text-gray-500" value={email} editable={false} />
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Date of Birth</Text>
              <TouchableOpacity className="border border-gray-300 rounded-lg px-4 h-12 flex-row items-center justify-between" onPress={() => setShowDatePicker(true)}>
                <Text className="text-base">{dob || "Select date"}</Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Gender</Text>
              <TouchableOpacity className="border border-gray-300 rounded-lg px-4 h-12 justify-center" onPress={() => setShowGenderPicker(true)}>
                <Text className="text-base">{gender || "Select gender"}</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Weight (kg)</Text>
              <TextInput className="border border-gray-300 rounded-lg px-4 h-12 text-base" value={weightValue} onChangeText={setWeightValue} keyboardType="numeric" />
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Height (cm)</Text>
              <TextInput className="border border-gray-300 rounded-lg px-4 h-12 text-base" value={heightValue} onChangeText={setHeightValue} keyboardType="numeric" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <ModalDateTimePicker isVisible={showDatePicker} mode="date" onConfirm={handleDateConfirm} onCancel={() => setShowDatePicker(false)} maximumDate={new Date()} />
      <Modal transparent={true} visible={showGenderPicker} animationType="fade" onRequestClose={() => setShowGenderPicker(false)}>
        <TouchableOpacity activeOpacity={1} onPressOut={() => setShowGenderPicker(false)} className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl w-4/5">
                <Text className="text-lg font-bold text-center p-4 border-b border-gray-200">Select Gender</Text>
                {genders.map((g) => (
                    <TouchableOpacity key={g} className="py-3 border-t border-gray-200" onPress={() => { setGender(g); setShowGenderPicker(false); }}>
                        <Text className="text-center text-blue-600 text-lg">{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
      </Modal>
      <Modal transparent={true} visible={showAvatarOptions} animationType="fade" onRequestClose={() => setShowAvatarOptions(false)}>
        <TouchableOpacity activeOpacity={1} onPressOut={() => setShowAvatarOptions(false)} className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl w-4/5">
            <Text className="text-lg font-bold text-center p-4 border-b border-gray-200">Change Avatar</Text>
            <TouchableOpacity className="py-3 border-t border-gray-200" onPress={() => handleChooseAvatar('camera')}><Text className="text-center text-blue-600 text-lg">Take Photo</Text></TouchableOpacity>
            <TouchableOpacity className="py-3 border-t border-gray-200" onPress={() => handleChooseAvatar('gallery')}><Text className="text-center text-blue-600 text-lg">Choose from Gallery</Text></TouchableOpacity>
            <TouchableOpacity className="py-3 border-t-2 border-gray-200" onPress={() => setShowAvatarOptions(false)}><Text className="text-center text-lg font-semibold">Cancel</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;