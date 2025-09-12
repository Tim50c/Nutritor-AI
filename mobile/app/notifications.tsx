// mobile/app/notifications.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/CustomText";
import {
  useNotificationContext,
  type Notification,
} from "@/context/NotificationContext";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import CustomHeaderWithBack from "@/components/CustomHeaderWithBack";
import { useIsDark } from "@/theme/useIsDark";

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
          ? "bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
          : "bg-orange-50 dark:bg-orange-600 border border-orange-200 dark:border-orange-400"
      }`}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Notification Icon */}
      <View
        className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${
          read ? "bg-gray-200 dark:bg-gray-700" : "bg-orange-100 dark:bg-gray-800"
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
          className={`text-base ${read ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-gray-200 font-medium"}`}
        >
          {message}
        </Text>
        {createdAt && (
          <Text
            className={`text-xs mt-1 ${read ? "text-gray-400 dark:text-gray-600" : "text-orange-600 dark:text-orange-400"}`}
          >
            {formatTimestamp(createdAt)}
          </Text>
        )}
      </View>

      {/* Unread indicator */}
      {!read && <View className="w-3 h-3 bg-orange-500 dark:bg-orange-400 rounded-full ml-3" />}
    </TouchableOpacity>
  );
}

const NotificationsScreen = () => {
  const { notifications, markAsRead, loading, error, refreshNotifications } =
    useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);
  const hasNotifications = notifications.length > 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  // Separate read and unread notifications
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  console.log(
    `📱 Notifications Screen - Total: ${notifications.length}, Unread: ${unreadNotifications.length}, Read: ${readNotifications.length}`
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <CustomHeaderWithBack title="Notifications" />

      {/* Loading State */}
      {loading && !refreshing && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6F2D" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">Loading notifications...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-orange-500 px-6 py-3 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {hasNotifications ? (
            <ScrollView
              className="px-6 pt-4"
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {/* Unread notifications section */}
              {unreadNotifications.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-3">
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
                  <Text className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3">
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
              <Text className="text-xl font-semibold mb-2 text-center text-black dark:text-white">
                No notifications yet.
              </Text>
              <Text className="text-base text-gray-500 text-center dark:text-gray-400">
                Your healthy habits are on track—keep it up!
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
