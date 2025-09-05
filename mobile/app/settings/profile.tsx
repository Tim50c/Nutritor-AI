import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useUser } from "@/context/UserContext";
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
} from "react-native";
import ModalDateTimePicker from "react-native-modal-datetime-picker";
import { Text } from "../../components/CustomText";

const genders = ["Male", "Female", "Other"];

const Profile = () => {
  const { userProfile, setUserProfile } = useUser();

  // Avatar image state
  const [avatarUri, setAvatarUri] = useState<string | null>(
    userProfile?.avatar || null
  );
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const router = useRouter();

  // Helper to convert Firestore Timestamp to Date object
  const getDateFromDob = (dobValue: any): Date => {
    if (!dobValue) return new Date();

    // Firestore Timestamp object
    if (typeof dobValue === "object" && "_seconds" in dobValue) {
      return new Date(dobValue._seconds * 1000);
    }

    // String in DD-MM-YYYY format
    if (typeof dobValue === "string" && dobValue.includes("-")) {
      const [day, month, year] = dobValue.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Fallback to current date
    return new Date();
  };

  // Helper to convert Firestore Timestamp to display string
  const getDobString = (dobValue: any): string => {
    if (!dobValue) return "";

    // Firestore Timestamp object
    if (typeof dobValue === "object" && "_seconds" in dobValue) {
      const date = new Date(dobValue._seconds * 1000);
      return date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
    }

    // Already a string
    if (typeof dobValue === "string") {
      return dobValue;
    }

    return "";
  };

  // Initialize state with userProfile data or default values
  const [name, setName] = useState(
    userProfile
      ? `${userProfile.firstname || ""} ${userProfile.lastname || ""}`.trim()
      : ""
  );
  const [email, setEmail] = useState(userProfile?.email || "");
  const [dob, setDob] = useState(getDobString(userProfile?.dob));
  const [selectedDate, setSelectedDate] = useState(
    getDateFromDob(userProfile?.dob)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(
    userProfile?.gender || genders[0]
  );
  const [height, setHeight] = useState(userProfile?.height?.toString() || "");
  const [weight, setWeight] = useState(
    userProfile?.weightCurrent?.toString() || ""
  );
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
      setAvatarUri(result.assets[0].uri);
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
      setAvatarUri(result.assets[0].uri);
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

  const handleSave = () => {
    // Validate required fields
    if (!name.trim()) {
      // You might want to show an alert here
      return;
    }

    // Update userProfile context with new profile data
    if (userProfile) {
      const nameParts = name.trim().split(" ");
      const firstname = nameParts[0] || "";
      const lastname = nameParts.slice(1).join(" ") || "";

      // Convert height and weight to numbers if they're valid
      const heightValue = height ? parseFloat(height) : null;
      const weightValue = weight ? parseFloat(weight) : null;

      setUserProfile({
        ...userProfile,
        firstname,
        lastname,
        email: email.trim(),
        dob, // dob is already formatted as DD-MM-YYYY
        gender: gender as "Male" | "Female" | "Other",
        height: heightValue?.toString() || null,
        weightCurrent: weightValue?.toString() || null,
        avatar: avatarUri || userProfile.avatar || null,
      });
    }

    // Navigate back to the previous screen
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
                source={avatarUri ? { uri: avatarUri } : images.default_avatar}
                className="w-20 h-20 rounded-full"
              />
              <TouchableOpacity
                className="absolute right-2 bottom-2 bg-white rounded-2xl p-1 border border-gray-300"
                onPress={handleAvatarPress}
              >
                <Ionicons name="pencil" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {/* Avatar options modal */}
            {showAvatarOptions && (
              <View
                style={{
                  position: "absolute",
                  top: 110,
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 5,
                  padding: 16,
                  zIndex: 10,
                }}
              >
                <TouchableOpacity
                  style={{ paddingVertical: 12 }}
                  onPress={pickImage}
                >
                  <Text className="text-base text-black">
                    Pick from Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 12 }}
                  onPress={takePhoto}
                >
                  <Text className="text-base text-black">Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 12 }}
                  onPress={() => setShowAvatarOptions(false)}
                >
                  <Text className="text-base text-red-500">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
                <Text className="text-gray-700 text-sm mb-1">
                  Date of Birth
                </Text>
                <TouchableOpacity
                  onPress={showMode}
                  className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between min-h-[48px]"
                >
                  <Text
                    className={`text-base flex-1 ${
                      dob ? "text-gray-900" : "text-gray-400"
                    }`}
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
                    style={{
                      height: Platform.OS === "ios" ? 48 : 48,
                      width: "100%",
                    }}
                    itemStyle={{
                      fontSize: 16,
                      height: Platform.OS === "ios" ? 48 : undefined,
                    }}
                  >
                    {genders.map((g) => (
                      <Picker.Item key={g} label={g} value={g} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Row: Height & Weight */}
            <View className="flex-row gap-4 mb-8">
              {/* Height */}
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1">Height (m)</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g., 1.75"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                />
              </View>

              {/* Weight */}
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-1">Weight (kg)</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g., 65"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* Save button */}
          <View className="px-4 mb-6 mt-auto">
            <TouchableOpacity
              className="bg-orange-500 rounded-2xl py-4 items-center"
              onPress={handleSave}
            >
              <Text className="text-white text-lg font-bold">Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Profile;
