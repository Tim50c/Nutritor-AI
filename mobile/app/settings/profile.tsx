import { images } from "@/constants/images";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ModalDateTimePicker from "react-native-modal-datetime-picker";

const genders = ["Male", "Female"]; // Gender options restricted to Male and Female

const Profile = () => {
  const { userProfile, setUserProfile } = useUser();
  const router = useRouter();

  // Helper to convert Firestore Timestamp to string
  const getDobString = (dobValue: any) => {
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
    return dobValue;
  };

  // Initialize state with userProfile data or default values if userProfile is null/undefined
  const [name, setName] = useState(
    userProfile ? `${userProfile.firstname} ${userProfile.lastname}` : ""
  );
  const [email, setEmail] = useState(userProfile?.email || "");
  // For DOB, store as Date object internally for the picker, display as string
  const [dob, setDob] = useState(getDobString(userProfile?.dob)); // Always string for display
  const [selectedDate, setSelectedDate] = useState(new Date()); // Date object for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false); // State to control date picker visibility

  const [gender, setGender] = useState(userProfile?.gender || genders[0]);
  const [height, setHeight] = useState(userProfile?.height || ""); // Changed to TextInput, so default empty
  const [weight, setWeight] = useState(userProfile?.weightCurrent || ""); // Changed to TextInput, so default empty

  // Function to handle date selection from the calendar
  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setDob(
        selectedDate
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-")
      );
    }
    setShowDatePicker(false);
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  const handleSave = () => {
    // Update userProfile context with new profile data
    if (userProfile) {
      const nameParts = name.split(" ");
      const firstname = nameParts[0] || "";
      const lastname = nameParts.slice(1).join(" ") || "";

      setUserProfile({
        ...userProfile,
        firstname,
        lastname,
        email,
        dob, // dob is already formatted as DD-MM-YYYY
        gender: gender as "Male" | "Female" | "Other" | null,
        height,
        weightCurrent: weight,
      });
    }
    // Navigate back to the previous screen
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Avatar section */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "white",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Image
            source={
              userProfile?.avatar
                ? { uri: userProfile.avatar }
                : images.default_avatar
            }
            style={{ width: 90, height: 90, borderRadius: 45 }}
          />
          <TouchableOpacity
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 4,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form fields */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#374151", fontSize: 14, marginBottom: 4 }}>
            Name
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: "#fff",
            }}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#374151", fontSize: 14, marginBottom: 4 }}>
            Email
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              backgroundColor: "#fff",
            }}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {/* Row: DOB & Gender */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#374151", fontSize: 14, marginBottom: 4 }}>
              DOB
            </Text>
            <TouchableOpacity
              onPress={showMode}
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{ fontSize: 16, color: dob ? "#111827" : "#9CA3AF" }}
              >
                {dob || "DD-MM-YYYY"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <ModalDateTimePicker
              isVisible={showDatePicker}
              mode="date"
              date={selectedDate}
              onConfirm={onChangeDate}
              onCancel={() => setShowDatePicker(false)}
              display="spinner"
              headerTextIOS="Select Date of Birth"
              confirmTextIOS="Confirm"
              cancelTextIOS="Cancel"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#374151", fontSize: 14, marginBottom: 4 }}>
              Gender
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
                style={{ height: 48, width: "100%" }}
              >
                {genders.map((g) => (
                  <Picker.Item key={g} label={g} value={g} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        {/* Row: Height & Weight */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#374151", fontSize: 14, marginBottom: 4 }}>
              Height
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={height}
              onChangeText={setHeight}
              placeholder="e.g., 1.75m"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#374151", fontSize: 14, marginBottom: 4 }}>
              Weight
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 65kg"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </View>

      {/* Save button */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#FF6F2D",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
          onPress={handleSave}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Basic StyleSheet for Picker due to some className limitations or specific styling needs for Picker
const styles = StyleSheet.create({
  picker: {
    height: 40,
    width: "100%",
  },
  pickerItem: {
    // Optional: Add specific styles for picker items if needed
  },
});

export default Profile;
