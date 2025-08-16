import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Platform, StyleSheet } from "react-native";
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
import { useUser } from "@/context/UserContext";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";

const genders = ["Male", "Female"]; // Gender options restricted to Male and Female

const Profile = () => {
  const { user, setUser } = useUser();
  const router = useRouter();

  // Initialize state with user data or default values if user is null/undefined
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  // For DOB, store as Date object internally for the picker, display as string
  const [dob, setDob] = useState(user?.dob || ""); // Still string for display
  const [selectedDate, setSelectedDate] = useState(new Date()); // Date object for DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false); // State to control date picker visibility

  const [gender, setGender] = useState(user?.gender || genders[0]);
  const [height, setHeight] = useState(user?.height || ""); // Changed to TextInput, so default empty
  const [weight, setWeight] = useState(user?.weight || ""); // Changed to TextInput, so default empty

  // Function to handle date selection from the calendar
  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios'); // Hide picker on Android immediately, on iOS it's part of the modal
    if (currentDate) {
      setSelectedDate(currentDate);
      // Format date for display and storage
      setDob(currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-')); // Format as DD-MM-YYYY
    }
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  const handleSave = () => {
    // Update user context with new profile data
    setUser({
      ...user,
      name,
      email,
      dob, // dob is already formatted as DD-MM-YYYY
      gender,
      height,
      weight,
    });
    // Navigate back to the previous screen
    router.back();
  };

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      {/* Profile avatar section */}
      <View className="items-center mb-6">
        {/* Use a placeholder image or a default avatar if user.avatar is not available */}
        <Image
          source={{ uri: user?.avatar || images.placeholder }}
          className="w-24 h-24 rounded-full mb-2"
        />
        {/* Avatar edit button placeholder */}
        <View className="absolute bottom-2 right-[calc(50%-12px)] translate-x-1/2 bg-gray-200 rounded-full p-2">
          <Text className="text-gray-600">🖉</Text>
        </View>
      </View>

      {/* Form fields section */}
      <View className="space-y-4 mb-6">
        {/* Name input */}
        <View>
          <Text className="text-gray-700 text-sm mb-1">Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-2 text-base"
            value={name}
            onChangeText={setName}
            placeholder="Name"
          />
        </View>

        {/* Email input */}
        <View>
          <Text className="text-gray-700 text-sm mb-1">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-2 text-base"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>

        {/* DOB and Gender row */}
        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-gray-700 text-sm mb-1">DOB</Text>
            {/* TouchableOpacity to trigger date picker */}
            <TouchableOpacity onPress={showMode} className="relative border border-gray-300 rounded-lg px-4 py-2">
              <Text className="text-base text-gray-800">{dob || "DD-MM-YYYY"}</Text>
              <Text className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500">
                ▾
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
                mode="date"
                display="default" // or 'spinner' or 'calendar'
                onChange={onChangeDate}
              />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 text-sm mb-1">Gender</Text>
            {/* Picker for Gender */}
            <View className="border border-gray-300 rounded-lg overflow-hidden">
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {genders.map((g) => (
                  <Picker.Item key={g} label={g} value={g} />
                ))}
              </Picker>
              {/* Custom dropdown arrow for Android */}
              {Platform.OS === 'android' && (
                <View className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Text className="text-lg text-gray-500">▾</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Height and Weight row (now TextInputs) */}
        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-gray-700 text-sm mb-1">Height</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 text-base"
              value={height}
              onChangeText={setHeight}
              placeholder="e.g., 1.75m"
              keyboardType="numeric" // Suggest numeric keyboard for height/weight
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 text-sm mb-1">Weight</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 text-base"
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 65kg"
              keyboardType="numeric" // Suggest numeric keyboard for height/weight
            />
          </View>
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        className="bg-orange-500 rounded-2xl py-4 items-center"
        onPress={handleSave}
      >
        <Text className="text-white text-lg font-semibold">Save</Text>
      </TouchableOpacity>
    </View>
  );
};

// Basic StyleSheet for Picker due to some className limitations or specific styling needs for Picker
const styles = StyleSheet.create({
  picker: {
    height: 40,
    width: '100%',
  },
  pickerItem: {
    // Optional: Add specific styles for picker items if needed
  },
});

export default Profile;