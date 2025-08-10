import {Text, View} from "react-native";
import {useRouter} from "expo-router";

const Settings = () => {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Settings Screen</Text>
      <Text className="mt-4 text-blue-500" onPress={() => router.push("/settings/profile")}>
        Go to Profile Settings
      </Text>
      <Text className="mt-2 text-blue-500" onPress={() => router.push("/settings/change-password")}>
        Go to Change Password
      </Text>
      <Text className="mt-2 text-blue-500" onPress={() => router.push("/settings/notification-settings")}>
        Go to Notification Settings
      </Text>
      <Text className="mt-2 text-blue-500" onPress={() => router.push("/settings/favorites")}>
        Go to Favorites Settings
      </Text>
      <Text className="mt-2 text-blue-500" onPress={() => router.push("/settings/more")}>
        Go to More Settings
      </Text>
    </View>
  )
}

export default Settings;
