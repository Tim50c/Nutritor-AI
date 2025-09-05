import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
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
} from "react-native";
import ModalDateTimePicker from "react-native-modal-datetime-picker";
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

  // Avatar image state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userProfile?.avatar || null
  );
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // State for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(genders[0]);

  // State specifically for the input values, which are always strings
  const [weightValue, setWeightValue] = useState('');
  const [heightValueCm, setHeightValueCm] = useState('');
  const [heightValueFt, setHeightValueFt] = useState('');
  const [heightValueIn, setHeightValueIn] = useState('');

  // Handle avatar change
  const handleAvatarPress = () => {
    setShowAvatarOptions(true);
  };

  const pickImage = async () => {
    setShowAvatarOptions(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarPreview(result.assets[0].uri);
      uploadAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    setShowAvatarOptions(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarPreview(result.assets[0].uri);
      uploadAvatar(result.assets[0].uri);
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
          setHeightValueCm('');
        } else {
          setHeightValueCm(userProfile.height.toString());
          setHeightValueFt('');
          setHeightValueIn('');
        }
      } else {
        setHeightValueCm('');
        setHeightValueFt('');
        setHeightValueIn('');
      }
    }
  }, [userProfile]);

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

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setDob(date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"));
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          className="bg-black w-10 h-10 rounded-full justify-center items-center" 
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: '0deg' }] }}>
            <icons.arrow width={20} height={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Profile</Text>
        <TouchableOpacity 
          className="bg-orange-500 w-16 h-10 rounded-full justify-center items-center" 
          onPress={handleSave}
        >
          <Text className="text-white font-semibold text-sm">Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View className="items-center mb-6 mt-4">
            <TouchableOpacity onPress={handleAvatarPress} className="relative">
              <Image
                source={avatarPreview ? { uri: avatarPreview } : images.default_avatar}
                className="w-24 h-24 rounded-full border-2 border-gray-300"
              />
              <View className="absolute bottom-0 right-0 bg-orange-500 w-8 h-8 rounded-full items-center justify-center">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Avatar Options Modal */}
          {showAvatarOptions && (
            <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center z-10">
              <View className="bg-white rounded-2xl p-6 mx-4">
                <Text className="text-lg font-bold text-center mb-4">Change Avatar</Text>
                <TouchableOpacity className="py-3 border-b border-gray-200" onPress={takePhoto}>
                  <Text className="text-center text-blue-600 text-lg">Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity className="py-3 border-b border-gray-200" onPress={pickImage}>
                  <Text className="text-center text-blue-600 text-lg">Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity className="py-3" onPress={() => setShowAvatarOptions(false)}>
                  <Text className="text-center text-red-600 text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Form Fields */}
          <View className="space-y-4">
            {/* Name */}
            <View>
              <Text className="text-base font-semibold text-gray-700 mb-2">Full Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
            </View>

            {/* Email */}
            <View>
              <Text className="text-base font-semibold text-gray-700 mb-2">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-100"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                editable={false}
              />
            </View>

            {/* Date of Birth */}
            <View>
              <Text className="text-base font-semibold text-gray-700 mb-2">Date of Birth</Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-base">{dob || "Select date"}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Gender */}
            <View>
              <Text className="text-base font-semibold text-gray-700 mb-2">Gender</Text>
              <View className="border border-gray-300 rounded-lg">
                <Picker
                  selectedValue={gender}
                  onValueChange={setGender}
                  style={{ height: 50 }}
                >
                  {genders.map((g) => (
                    <Picker.Item key={g} label={g} value={g} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Weight */}
            <View>
              <Text className="text-base font-semibold text-gray-700 mb-2">
                Weight ({userProfile?.unitPreferences?.weight || 'kg'})
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={weightValue}
                onChangeText={setWeightValue}
                placeholder={`Enter weight in ${userProfile?.unitPreferences?.weight || 'kg'}`}
                keyboardType="numeric"
              />
            </View>

            {/* Height */}
            <View>
              <Text className="text-base font-semibold text-gray-700 mb-2">
                Height ({userProfile?.unitPreferences?.height || 'cm'})
              </Text>
              {userProfile?.unitPreferences?.height === 'ft' ? (
                <View className="flex-row space-x-2">
                  <View className="flex-1">
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                      value={heightValueFt}
                      onChangeText={setHeightValueFt}
                      placeholder="Feet"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                      value={heightValueIn}
                      onChangeText={setHeightValueIn}
                      placeholder="Inches"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  value={heightValueCm}
                  onChangeText={setHeightValueCm}
                  placeholder="Enter height in cm"
                  keyboardType="numeric"
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <ModalDateTimePicker
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        maximumDate={new Date()}
      />
    </SafeAreaView>
  );
};

export default Profile;
