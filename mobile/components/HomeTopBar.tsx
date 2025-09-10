import { icons } from "@/constants/icons";
import { useNotificationContext } from "@/context/NotificationContext";
import { useUser } from "@/context/UserContext"; // This is your upgraded context
import { useRouter } from "expo-router";
import React, { use } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Text } from './CustomText';
import IconButton from "./IconButton";
import { images } from "@/constants/images";
import { useIsDark } from "@/theme/useIsDark";

function NotificationIcon({ hasUnread }: { hasUnread: boolean }) {
  const isDark = useIsDark();

  return (
    <View>
      <View className="m-2">
        {isDark ? (
          <icons.notificationsDark width={24} height={24} />
        ) : (
          <icons.notifications width={24} height={24} />
        )}
      </View>
      {hasUnread && (
        <View
          style={{ position: "absolute", top: 2, right: 2 }}
          className="w-3 h-3 bg-yellow-400 rounded-full border border-white"
        />
      )}
    </View>
  );
}

export default function HomeTopBar() {
  const router = useRouter();
  const { hasUnread } = useNotificationContext();
  // --- FIX 1: Destructure 'userProfile' instead of 'user' ---
  const { userProfile } = useUser();

  const isDark = useIsDark();

  // --- FIX 2: Handle the case where the profile is still loading or null ---
  // This prevents the app from crashing before the user's data is available.
  if (!userProfile) {
    // You can return a loading indicator here, or simply nothing
    return null;
  }

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-bg-default-dark">
      {/* Left side: Avatar + Welcome */}
      <View className="flex-row items-center">
        <Image
          source={
            userProfile?.avatar && typeof userProfile.avatar === 'string' 
              ? { uri: userProfile.avatar } 
              : images.default_avatar
          }
          className="w-10 h-10 rounded-full mr-2"
        />
        <View>
          <Text className="text-sm text-gray-500 dark:text-gray-100">Welcome</Text>
          {/* --- FIX 3.2: Combine firstname and lastname for the full name --- */}
          <Text className="text-base font-bold dark:text-gray-100">{`${userProfile.firstname} ${userProfile.lastname}`}</Text>
        </View>
      </View>

      {/* Right side: Notification + Settings (remains the same) */}
      <View className="flex-row items-center space-x-4">
        <IconButton
          Icon={isDark ? icons.searchDark : icons.search}
          onPress={() => router.push("/search")}
        />
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <NotificationIcon hasUnread={hasUnread} />
        </TouchableOpacity>
        <IconButton
          Icon={isDark ? icons.settingsDark : icons.settings}
          onPress={() => router.push("/settings")}
        />
      </View>
    </View>
  );
}
