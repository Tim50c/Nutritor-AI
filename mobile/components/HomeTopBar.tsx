import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import IconButton from "./IconButton";
import { useNotificationContext } from "@/context/NotificationContext";
import { useUser } from "@/context/UserContext";
import React from "react";

function NotificationIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <View>
      <View className="m-2">
        <icons.notifications width={24} height={24} />
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
  const { userProfile } = useUser();

  // If userProfile is not loaded yet, don't render
  if (!userProfile) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      {/* Left side: Avatar + Welcome */}
      <View className="flex-row items-center">
        <Image
          source={userProfile.avatar}
          className="w-10 h-10 rounded-full mr-2"
        />
        <View>
          <Text className="text-sm text-gray-500">Welcome</Text>
          <Text className="text-base font-semibold">{userProfile.firstname} {userProfile.lastname}</Text>
        </View>
      </View>

      {/* Right side: Notification + Settings */}
      <View className="flex-row items-center space-x-4">
        <IconButton
          Icon={icons.search}
          onPress={() => router.push("/search")}
        />
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
        >
          <NotificationIcon hasUnread={hasUnread} />
        </TouchableOpacity>
        <IconButton
          Icon={icons.settings}
          onPress={() => router.push("/settings")}
        />
      </View>
    </View>
  );
}