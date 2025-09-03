// mobile/app/settings/index.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import SettingsNavButton from '@/components/SettingsNavButton';
import CustomButtonAuth from '@/components/CustomButtonAuth';
import { icons } from '@/constants/icons';

const placeholderAvatar = require('../../assets/images/placeholder.png'); 

const Settings = () => {
  const router = useRouter();
  const { userProfile, logout } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF6F2D" />
      </SafeAreaView>
    );
  }
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Call the logout function from the context.
      // This will sign the user out of Firebase and clear the userProfile state.
      await logout();
      
      // 2. No need for router.replace here!
      // The navigation logic in `app/_layout.tsx` will detect that the user
      // is no longer authenticated and automatically redirect to the sign-in screen.
      // This keeps your navigation logic centralized and predictable.
      console.log("User logged out successfully. Redirecting...");

    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Failed", "An error occurred while trying to log out. Please try again.");
    } finally {
      // It's good practice to stop the loading indicator even if an error occurs.
      setIsLoggingOut(false);
    }
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
        <Text className="text-xl font-bold text-black">Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <TouchableOpacity
          className="bg-[#FF6F2D] rounded-2xl p-4 flex-row items-center mt-4 mb-6"
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.8}
        >
          <Image
            source={userProfile.avatar && typeof userProfile.avatar === 'string' ? { uri: userProfile.avatar } : placeholderAvatar}
            className="w-16 h-16 rounded-full mr-4 bg-white"
          />
          <View>
            <Text className="text-lg font-bold text-white">
              {userProfile.firstname} {userProfile.lastname}
            </Text>
            <Text className="text-sm text-white mt-1">{userProfile.email}</Text>
          </View>
        </TouchableOpacity>

        {/* Settings Group 1 */}
        <View className="bg-gray-100 rounded-2xl mb-6">
          <SettingsNavButton label="Profile" route="/settings/profile" variant="light" />
          <View className="h-px bg-gray-200 mx-5" />
          <SettingsNavButton label="Change Password" route="/settings/change-password" variant="light" />
          <View className="h-px bg-gray-200 mx-5" />
          <SettingsNavButton label="Notification" route="/notifications" variant="light" />
          <View className="h-px bg-gray-200 mx-5" />
          <SettingsNavButton label="Favorite" route="/settings/favorites" variant="light" />
        </View>

        {/* Settings Group 2 */}
        <View className="bg-gray-100 rounded-2xl mb-6">
          <SettingsNavButton label="More" route="/settings/more" variant="light" />
        </View>
      </ScrollView>
      
      {/* Logout Button */}
      <View className="px-6 pt-4 pb-6 bg-white">
        <CustomButtonAuth
          title="Logout"
          onPress={handleLogout}
          isLoading={isLoggingOut}
          containerStyles={{ backgroundColor: '#FF6F2D' }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Settings;