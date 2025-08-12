import { View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import IconButton from "./IconButton";

export default function HomeTopBar({ name }: { name: string }) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      {/* Left side: Avatar + Welcome */}
      <View className="flex-row items-center">
        <Image
          source={images.placeholder}
          className="w-10 h-10 rounded-full mr-2"
        />
        <View>
          <Text className="text-sm text-gray-500">Welcome</Text>
          <Text className="text-base font-semibold">{name}</Text>
        </View>
      </View>

      {/* Right side: Notification + Settings */}
      <View className="flex-row items-center space-x-4">
        <IconButton
          icon={icons.notifications}
          onPress={() => router.push("/notifications")}
          className="mr-3"
        />
        <IconButton
          icon={icons.settings}
          onPress={() => router.push("/settings")}
        />
      </View>
    </View>
  );
}