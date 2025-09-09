// mobile/app/notifications.tsx
import React from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Text } from "@/components/CustomText";
import { useRouter } from "expo-router";
import {
  useNotificationContext,
  type Notification,
} from "@/context/NotificationContext";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

function NotificationCard({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const { read, message, createdAt } = notification;

  // Format the timestamp if available
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return diffInMinutes <= 0 ? "Just now" : `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
      }
    } catch (error) {
      return "";
    }
  };

  return (
    <TouchableOpacity
      className={`flex-row items-center rounded-2xl p-4 mb-3 ${
        read
          ? "bg-gray-50 border border-gray-100"
          : "bg-orange-50 border border-orange-200"
      }`}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Notification Icon */}
      <View
        className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${
          read ? "bg-gray-200" : "bg-orange-100"
        }`}
      >
        <icons.notifications
          width={24}
          height={24}
          color={read ? "#9CA3AF" : "#FF6F2D"}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className={`text-base ${read ? "text-gray-600" : "text-gray-900 font-medium"}`}
          numberOfLines={2}
        >
          {message}
        </Text>
        {createdAt && (
          <Text
            className={`text-xs mt-1 ${read ? "text-gray-400" : "text-orange-600"}`}
          >
            {formatTimestamp(createdAt)}
          </Text>
        )}
      </View>

      {/* Unread indicator */}
      {!read && <View className="w-3 h-3 bg-orange-500 rounded-full ml-3" />}
    </TouchableOpacity>
  );
}

const NotificationsScreen = () => {
  const router = useRouter();
  const { notifications, markAsRead } = useNotificationContext();
  const hasNotifications = notifications.length > 0;

  // Separate read and unread notifications
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

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
        <Text className="text-xl font-bold text-black">Notifications</Text>
        <View className="w-10 h-10" />
      </View>

      {hasNotifications ? (
        <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
          {/* Unread notifications section */}
          {unreadNotifications.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                New ({unreadNotifications.length})
              </Text>
              {unreadNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => markAsRead(notification.id)}
                />
              ))}
            </View>
          )}

          {/* Read notifications section */}
          {readNotifications.length > 0 && (
            <View>
              <Text className="text-lg font-semibold text-gray-600 mb-3">
                Earlier
              </Text>
              {readNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => {
                    /* Already read, no action needed */
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Image
            source={images.emptyScreen}
            className="w-52 h-52 mb-6"
            resizeMode="contain"
          />
          <Text className="text-xl font-semibold mb-2 text-center text-black">
            No notifications yet.
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Your healthy habits are on track—keep it up!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
