import React, { useEffect } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNotificationContext } from "@/context/NotificationContext";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

function NotificationCard({
  message,
  onPress,
}: {
  message: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-orange-500 rounded-2xl px-4 py-3 mb-4 mx-4"
      style={{ backgroundColor: "#FF6B1A" }}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View className="mr-4">
        <Image
          source={icons.notifications}
          className="w-8 h-8"
          style={{ tintColor: "#fff", opacity: 0.8 }}
        />
      </View>
      <Text className="text-white text-base flex-1">{message}</Text>
    </TouchableOpacity>
  );
}

const NotificationsScreen = () => {
  const { notifications, markAllAsRead, removeNotification } =
    useNotificationContext();

  useEffect(() => {
    // Mark all notifications as read when screen opens
    markAllAsRead();
  }, [markAllAsRead]);

  const hasNotifications = notifications.length > 0;

  return (
    <View className="flex-1 bg-white pt-8">
      {/* Notifications List */}
      {hasNotifications ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              message={n.message}
              onPress={() => removeNotification(n.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Image
            source={images.emptyScreen}
            className="w-64 h-64 mb-6"
            resizeMode="contain"
          />
          <Text className="text-lg font-semibold mb-2 text-center">
            No notifications yet.
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Your healthy habits are on track—keep it up!
          </Text>
        </View>
      )}
    </View>
  );
};

export default NotificationsScreen;
