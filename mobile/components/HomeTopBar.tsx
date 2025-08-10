// components/HomeTopBar.tsx
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {images} from "@/constants/images";
import {icons} from "@/constants/icons";

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
        {/* Notification button with dot */}
        <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Image source={icons.notifications} className="size-8 mr-3"/>
        </TouchableOpacity>

        {/* Settings button */}
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Image source={icons.settings} className="size-8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
