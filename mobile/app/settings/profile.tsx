import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { Text } from "../../components/CustomText";
import ModalDateTimePicker from "react-native-modal-datetime-picker";
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from "firebase/auth";

// --- UNIT CONVERSION UTILS ---
const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;

const kgToLbs = (kg: number) => (kg * KG_TO_LBS).toFixed(1);
const lbsToKg = (lbs: number) => (lbs / KG_TO_LBS);

const cmToFtIn = (cm: number) => {
  if (isNaN(cm) || cm === null) return { ft: '', in: '' };
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
  // Use refetchUserProfile to get the latest data after changes
  const { userProfile, refetchUserProfile } = useUser();
  const router = useRouter();

  // State for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(genders[0]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // State specifically for the input values, which are always strings
  const [weightValue, setWeightValue] = useState('');
  const [heightValueCm, setHeightValueCm] = useState('');
  const [heightValueFt, setHeightValueFt] = useState('');
  const [heightValueIn, setHeightValueIn] = useState('');

  // This effect populates the entire form when the userProfile from context is loaded or changed.
  useEffect(() => {
    if (userProfile) {
      setName(`${userProfile.firstname || ""} ${userProfile.lastname || ""}`.trim());
      setEmail(userProfile.email || "");
      setAvatarPreview(userProfile.avatar || null);
      
      const userDob = userProfile.dob?._seconds ? new Date(userProfile.dob._seconds * 1000) : new Date();
      setSelectedDate(userDob);
      setDob(userDob.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"));
      setGender(userProfile.gender || genders[0]);

      // Display WEIGHT based on the user's saved preference
      if (userProfile.weightCurrent) {
        if (userProfile.unitPreferences.weight === 'lbs') {
          setWeightValue(kgToLbs(userProfile.weightCurrent));
        } else {
          setWeightValue(userProfile.weightCurrent.toString());
        }
      } else {
        setWeightValue('');
      }

      // Display HEIGHT based on the user's saved preference
      if (userProfile.height) {
        if (userProfile.unitPreferences.height === 'ft') {
          const { ft, in: inches } = cmToFtIn(userProfile.height);
          setHeightValueFt(ft);
          setHeightValueIn(inches);
        } else {
          setHeightValueCm(userProfile.height.toString());
        }
      } else {
        setHeightValueCm('');
        setHeightValueFt('');
        setHeightValueIn('');
      }
    }
  }, [userProfile]);

  // Date picker handler
  const onChangeDate = (newSelectedDate: Date) => {
    if (newSelectedDate) {
      setSelectedDate(newSelectedDate);
      const formattedDate = newSelectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
      setDob(formattedDate);
    }
    setShowDatePicker(false);
  };
  const showMode = () => setShowDatePicker(true);

  // Avatar selection logic
  const handleChooseAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to update your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setAvatarPreview(imageUri); // Show preview
      uploadAvatar(imageUri); // Start upload
    }
  };

  // Avatar upload logic
  const uploadAvatar = async (uri: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const type = `image/${filename.split('.').pop()}`;
    formData.append('avatar', { uri, name: filename, type } as any);

    try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/profile/avatar`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        const responseData = await response.json();
        if (response.ok && responseData.success) {
            refetchUserProfile(); // Crucial: refetch to update avatar URL in context
            Alert.alert("Success", "Avatar updated!");
        } else {
            throw new Error(responseData.error || "Failed to upload avatar.");
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
        setAvatarPreview(userProfile?.avatar || null); // Revert on error
        Alert.alert("Upload Failed", "Could not update your avatar. Please try again.");
    }
  };

  // Save handler with backend integration
  const handleSave = async () => {
    if (!userProfile) return; // Should not happen if user is on this screen
    if (!name.trim()) return Alert.alert("Validation Error", "Name cannot be empty.");
    
    // --- CONVERT DATA TO STANDARD UNITS BEFORE SENDING ---
    let weightInKg: number | null = null;
    const weightNum = parseFloat(weightValue);
    if (!isNaN(weightNum)) {
      weightInKg = userProfile.unitPreferences.weight === 'lbs' ? lbsToKg(weightNum) : weightNum;
    }
    
    let heightInCm: number | null = null;
    if (userProfile.unitPreferences.height === 'ft') {
      const cm = ftInToCm(heightValueFt, heightValueIn);
      if (!isNaN(cm) && cm > 0) heightInCm = cm;
    } else {
      const cm = parseFloat(heightValueCm);
      if (!isNaN(cm)) heightInCm = cm;
    }
    // --- End Conversion ---

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return Alert.alert("Error", "You must be logged in to save.");
    
    const token = await user.getIdToken();
    const nameParts = name.trim().split(" ");
    const profileData = {
      firstname: nameParts[0] || "",
      lastname: nameParts.slice(1).join(" ") || "",
      email: email.trim(),
      dob: selectedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD for backend
      gender,
      height: heightInCm,
      weightCurrent: weightInKg,
    };

    try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
        });

        const responseData = await response.json();
        if (response.ok && responseData.success) {
            refetchUserProfile(); // Refetch all user data to ensure context is up-to-date
            Alert.alert("Success", "Profile saved successfully!");
            router.back();
        } else {
            throw new Error(responseData.error || "Failed to save profile.");
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        Alert.alert("Save Failed", "An error occurred while saving your profile.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity className="bg-black w-10 h-10 rounded-full justify-center items-center" onPress={() => router.back()}>
          <View><icons.arrow width={20} height={20} color="#FFFFFF" /></View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Profile</Text>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar section */}
          <View className="items-center mb-6 pt-4">
            <View className="w-24 h-24 rounded-full bg-white items-center justify-center relative">
              <Image
                source={avatarPreview ? { uri: avatarPreview } : images.default_avatar}
                className="w-20 h-20 rounded-full"
              />
              <TouchableOpacity onPress={handleChooseAvatar} className="absolute right-2 bottom-2 bg-white rounded-2xl p-1 border border-gray-300">
                <Ionicons name="pencil" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form fields */}
          <View className="px-4 flex-1">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm mb-1">Name</Text>
              <TextInput className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white" value={name} onChangeText={setName} placeholder="Enter your name" />
            </View>
            <View className="mb-4">
              <Text className="text-gray-700 text-sm mb-1">Email</Text>
              <TextInput className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1">Date of Birth</Text>
                <TouchableOpacity onPress={showMode} className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between min-h-[48px]">
                  <Text className={`text-base flex-1 ${dob ? "text-gray-900" : "text-gray-400"}`}>{dob || "DD-MM-YYYY"}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <ModalDateTimePicker isVisible={showDatePicker} mode="date" date={selectedDate} onConfirm={onChangeDate} onCancel={() => setShowDatePicker(false)} display="spinner" maximumDate={new Date()} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1">Gender</Text>
                <View className="border border-gray-300 rounded-xl bg-white min-h-[48px] justify-center overflow-hidden">
                  <Picker selectedValue={gender} onValueChange={(itemValue: string) => setGender(itemValue)} className="h-12 w-full" mode="dropdown" style={{ height: 48, width: "100%" }} itemStyle={{ fontSize: 16, height: 48 }}>
                    {genders.map((g) => <Picker.Item key={g} label={g} value={g} />)}
                  </Picker>
                </View>
              </View>
            </View>
            <View className="flex-row gap-4 mb-8">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1">Weight ({userProfile?.unitPreferences.weight})</Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                    value={weightValue}
                    onChangeText={setWeightValue}
                    placeholder={`in ${userProfile?.unitPreferences.weight}`}
                    keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1">Height ({userProfile?.unitPreferences.height})</Text>
                {userProfile?.unitPreferences.height === 'cm' ? (
                     <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                        value={heightValueCm}
                        onChangeText={setHeightValueCm}
                        placeholder="cm"
                        keyboardType="numeric"
                      />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                        value={heightValueFt}
                        onChangeText={setHeightValueFt}
                        placeholder="ft"
                        keyboardType="numeric"
                      />
                      <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                        value={heightValueIn}
                        onChangeText={setHeightValueIn}
                        placeholder="in"
                        keyboardType="numeric"
                      />
                    </View>
                  )}
              </View>
            </View>
          </View>

          {/* Save button */}
          <View className="px-4 mb-6 mt-auto">
            <TouchableOpacity className="bg-orange-500 rounded-2xl py-4 items-center" onPress={handleSave}>
              <Text className="text-white text-lg font-bold">Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Profile;