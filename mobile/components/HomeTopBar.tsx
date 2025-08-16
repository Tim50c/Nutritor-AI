import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import IconButton from "./IconButton";
import { useNotificationContext } from "@/context/NotificationContext";
import { useUser } from "@/context/UserContext";

function NotificationIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <View>
      <Image source={icons.notifications} className="w-8 h-8" />
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
  const { user } = useUser();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      {/* Left side: Avatar + Welcome */}
      <View className="flex-row items-center">
        <Image
          source={user.avatar}
          className="w-10 h-10 rounded-full mr-2"
        />
        <View>
          <Text className="text-sm text-gray-500">Welcome</Text>
          <Text className="text-base font-semibold">{user.name}</Text>
        </View>
      </View>

      {/* Right side: Notification + Settings */}
      <View className="flex-row items-center space-x-4">
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          className="mr-3"
        >
          <NotificationIcon hasUnread={hasUnread} />
        </TouchableOpacity>
        <IconButton
          icon={icons.settings}
          onPress={() => router.push("/settings")}
        />
      </View>
    </View>
  );
}