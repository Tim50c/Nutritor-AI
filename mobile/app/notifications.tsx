// mobile/app/notifications.tsx
import React from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
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
      className="flex-row items-center bg-gray-100 rounded-2xl p-4 mb-4"
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View className="w-12 h-12 rounded-full bg-[#FFEAE0] justify-center items-center mr-4">
        <icons.notifications width={24} height={24} color="#FF6F2D" />
      </View>
      <Text className="flex-1 text-base text-gray-800" numberOfLines={2}>
        {message}
      </Text>
    </TouchableOpacity>
  );
}

const NotificationsScreen = () => {
  const router = useRouter();
  const { notifications, markAsRead } = useNotificationContext();
  const hasNotifications = notifications.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          className="bg-black w-10 h-10 rounded-full justify-center items-center" 
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <icons.arrow width={20} height={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Notifications</Text>
        <TouchableOpacity 
          className="bg-black w-10 h-10 rounded-full justify-center items-center" 
          onPress={() => router.back()}
        >
          <icons.close width={20} height={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {hasNotifications ? (
        <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              message={n.message}
              onPress={() => markAsRead(n.id)}
            />
          ))}
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