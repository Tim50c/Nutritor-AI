import { Text, View, Image, TouchableOpacity } from "react-native";
import { useUser } from "@/context/UserContext";
import { useRouter } from "expo-router";
import SettingsNavButton from "@/components/SettingsNavButton";

const Settings = () => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      {/* User Info Card */}
      <TouchableOpacity
        className="bg-primary-200 rounded-2xl p-4 flex-row items-center mb-6 border border-black"
        onPress={() => router.push("/settings/profile")}
        activeOpacity={0.8}
      >
        <Image source={user.avatar} className="w-14 h-14 rounded-full mr-4" />
        <View>
          <Text className="text-lg font-semibold text-white">{user.name}</Text>
          <Text className="text-sm text-white mt-1">{user.email}</Text>
        </View>
      </TouchableOpacity>

      {/* Settings Navigation Buttons - Grouped as in the design */}
      <View className="space-y-4">
        <View className="bg-primary-200 rounded-2xl p-0 mb-4 border border-black">
          <SettingsNavButton
            label="Profile"
            route="/settings/profile"
            style="mb-0"
          />
          <SettingsNavButton
            label="Change Password"
            route="/settings/change-password"
            style="mb-0"
          />
          <SettingsNavButton
            label="Notification"
            route="/settings/notification-settings"
            style="mb-0"
          />
          <SettingsNavButton
            label="Favorite"
            route="/settings/favorites"
            style="mb-0"
          />
        </View>
        <View className="bg-primary-200 rounded-2xl p-0 mb-4 border border-black">
          <SettingsNavButton label="More" route="/settings/more" style="mb-0" />
        </View>
        <View className="bg-primary-200 rounded-2xl p-0 border border-black">
          <SettingsNavButton label="Log Out" route="/logout" style="mb-0" />
        </View>
      </View>
    </View>
  );
};

export default Settings;
